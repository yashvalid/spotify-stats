import { StreamRecord } from '../types';

interface RawExtendedEntry {
  ts?: string;
  ms_played?: number;
  master_metadata_track_name?: string | null;
  master_metadata_album_artist_name?: string | null;
  master_metadata_album_album_name?: string | null;
  spotify_track_uri?: string | null;
  skipped?: boolean | null;
  shuffle?: boolean | null;
  // Standard account export format
  endTime?: string;
  artistName?: string;
  trackName?: string;
  albumName?: string;
  msPlayed?: number;
}

export function parseSpotifyJsonText(jsonText: string): StreamRecord[] {
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array of streaming history records.');
  }

  const results: StreamRecord[] = [];
  for (const item of parsed as RawExtendedEntry[]) {
    if (!item || typeof item !== 'object') continue;

    // Extended Streaming History format
    if (typeof item.ts === 'string' && typeof item.ms_played === 'number') {
      const trackName = item.master_metadata_track_name;
      const artistName = item.master_metadata_album_artist_name;
      if (!trackName || !artistName || item.ms_played <= 0) continue;

      results.push({
        ts: item.ts,
        msPlayed: item.ms_played,
        trackName,
        artistName,
        albumName: item.master_metadata_album_album_name || 'Single',
        trackUri: item.spotify_track_uri || undefined,
        skipped: Boolean(item.skipped),
        shuffle: Boolean(item.shuffle),
      });
      continue;
    }

    // Standard Spotify Account Data format (StreamingHistory_music_0.json)
    if (typeof item.endTime === 'string' && typeof item.msPlayed === 'number') {
      const trackName = item.trackName;
      const artistName = item.artistName;
      if (!trackName || !artistName || item.msPlayed <= 0) continue;

      // Convert "2026-05-14 19:22" to ISO
      const isoTs = item.endTime.includes('T')
        ? item.endTime
        : `${item.endTime.replace(' ', 'T')}:00Z`;

      results.push({
        ts: isoTs,
        msPlayed: item.msPlayed,
        trackName,
        artistName,
        albumName: item.albumName || `${trackName} (Single)`,
        skipped: item.msPlayed < 25000,
      });
    }
  }

  return results;
}

// Native browser ZIP extractor using Web Streams DecompressionStream('deflate-raw')
async function extractJsonFilesFromZip(buffer: ArrayBuffer): Promise<string[]> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('utf-8');
  const jsonContents: string[] = [];

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minEocdSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP archive.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  let ptr = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (ptr + 46 > bytes.length || view.getUint32(ptr, true) !== 0x02014b50) break;

    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const fileName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + fileNameLen));
    ptr += 46 + fileNameLen + extraLen + commentLen;

    const lowerName = fileName.toLowerCase();
    const isHistoryJson =
      lowerName.endsWith('.json') &&
      (lowerName.includes('streaming_history_audio') ||
        lowerName.includes('streaminghistory') ||
        lowerName.includes('endsong'));

    if (!isHistoryJson && !lowerName.endsWith('.json')) continue;

    // Read local file header
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) continue;
    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const compressedSlice = bytes.subarray(dataStart, dataStart + compressedSize);

    if (compressionMethod === 0) {
      jsonContents.push(decoder.decode(compressedSlice));
    } else if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compressedSlice);
      writer.close();
      const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
      jsonContents.push(decoder.decode(decompressedBuffer));
    }
  }

  return jsonContents;
}

export async function parseUploadedFiles(files: FileList | File[]): Promise<StreamRecord[]> {
  const fileArray = Array.from(files);
  const allRecords: StreamRecord[] = [];

  for (const file of fileArray) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const buf = await file.arrayBuffer();
      const jsonStrings = await extractJsonFilesFromZip(buf);
      for (const txt of jsonStrings) {
        try {
          const recs = parseSpotifyJsonText(txt);
          allRecords.push(...recs);
        } catch {
          // Ignore non-streaming JSON files in the zip (e.g., Userdata.json)
        }
      }
    } else if (file.name.toLowerCase().endsWith('.json')) {
      const txt = await file.text();
      const recs = parseSpotifyJsonText(txt);
      allRecords.push(...recs);
    }
  }

  // Deduplicate by timestamp + trackName + artistName
  const seen = new Set<string>();
  const deduped: StreamRecord[] = [];
  for (const r of allRecords) {
    const key = `${r.ts}|${r.trackName}|${r.artistName}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  if (deduped.length === 0) {
    throw new Error(
      'No valid Spotify streaming records found. Upload Streaming_History_Audio_*.json, StreamingHistory_*.json, or your my_spotify_data.zip archive.'
    );
  }

  return deduped.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

// IndexedDB persistence for uploaded streaming history
const DB_NAME = 'statify_storage_v1';
const STORE_NAME = 'history';
const KEY_NAME = 'uploaded_records';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHistoryToIndexedDB(records: StreamRecord[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(records, KEY_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not persist history to IndexedDB:', err);
  }
}

export async function loadHistoryFromIndexedDB(): Promise<StreamRecord[] | null> {
  try {
    const db = await openDb();
    return await new Promise<StreamRecord[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(KEY_NAME);
      req.onsuccess = () => resolve((req.result as StreamRecord[]) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearHistoryFromIndexedDB(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(KEY_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}
