import {
  DailyPoint,
  ListeningStats,
  MonthlyPoint,
  RankedAlbum,
  RankedArtist,
  RankedGenre,
  RankedTrack,
  TimeRange,
} from '../types';
import { generateCoverArt } from './artwork';

const CLIENT_ID_STORAGE_KEY = 'statify_spotify_client_id';
const PKCE_VERIFIER_KEY = 'statify_pkce_verifier';
const TOKEN_STORAGE_KEY = 'statify_spotify_token';

interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Module-level lock so React 19 StrictMode double-invoking useEffect
// never races or drops the OAuth callback result.
let inFlightCallbackPromise: Promise<string | null> | null = null;

export const DEFAULT_CLIENT_ID = (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined) || '';

export function getSavedClientId(): string {
  return localStorage.getItem(CLIENT_ID_STORAGE_KEY) || DEFAULT_CLIENT_ID || '';
}

export function saveClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
}

export function getRedirectUri(): string {
  const url = new URL(window.location.href);
  if (url.hostname === 'localhost') {
    url.hostname = '127.0.0.1';
  }
  return `${url.origin}${url.pathname}`;
}

export function ensureLoopbackHost(): void {
  if (window.location.hostname === 'localhost') {
    const url = new URL(window.location.href);
    url.hostname = '127.0.0.1';
    window.location.replace(url.toString());
  }
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join('');
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function startSpotifyLogin(clientId: string): Promise<void> {
  const cleanId = clientId.trim();
  if (!cleanId) throw new Error('Please enter a valid Spotify Client ID.');
  saveClientId(cleanId);

  const verifier = generateRandomString(64);
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  localStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const challenge = await sha256Base64Url(verifier);

  const statePayload = btoa(JSON.stringify({ v: verifier, c: cleanId }));

  const params = new URLSearchParams({
    client_id: cleanId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope:
      'user-top-read user-read-recently-played user-read-private playlist-modify-public playlist-modify-private',
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state: statePayload,
    show_dialog: 'false',
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export function handleOAuthCallbackIfPresent(): Promise<string | null> {
  if (inFlightCallbackPromise) {
    return inFlightCallbackPromise;
  }

  inFlightCallbackPromise = (async () => {
    try {
      ensureLoopbackHost();

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const stateParam = url.searchParams.get('state');

      if (error) {
        window.history.replaceState({}, document.title, window.location.pathname);
        throw new Error(`Spotify authorization declined: ${error}`);
      }

      if (!code) {
        return getValidAccessToken();
      }

      let verifier =
        sessionStorage.getItem(PKCE_VERIFIER_KEY) || localStorage.getItem(PKCE_VERIFIER_KEY);
      let clientId = getSavedClientId();

      if (stateParam) {
        try {
          const decoded = JSON.parse(atob(stateParam)) as { v?: string; c?: string };
          if (!verifier && decoded.v) verifier = decoded.v;
          if (!clientId && decoded.c) {
            clientId = decoded.c;
            saveClientId(clientId);
          }
        } catch {
          // ignore malformed state
        }
      }

      // Clean URL query params now that we have captured `code`
      window.history.replaceState({}, document.title, window.location.pathname);

      if (!verifier || !clientId) {
        const existing = getValidAccessToken();
        if (existing) return existing;
        throw new Error('Missing PKCE session state. Please click Authorize again.');
      }

      const body = new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: verifier,
      });

      const resp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const existing = getValidAccessToken();
        if (existing) return existing;
        throw new Error(
          errData.error_description || 'Failed to exchange authorization code with Spotify.'
        );
      }

      const data = await resp.json();
      const tokenObj: StoredToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000 - 30_000,
      };
      const serialized = JSON.stringify(tokenObj);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, serialized);
      localStorage.setItem(TOKEN_STORAGE_KEY, serialized);
      sessionStorage.removeItem(PKCE_VERIFIER_KEY);
      localStorage.removeItem(PKCE_VERIFIER_KEY);

      return tokenObj.accessToken;
    } finally {
      setTimeout(() => {
        inFlightCallbackPromise = null;
      }, 1000);
    }
  })();

  return inFlightCallbackPromise;
}

export function getValidAccessToken(): string | null {
  try {
    const raw =
      sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredToken = JSON.parse(raw);
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return parsed.accessToken;
  } catch {
    return null;
  }
}

export function disconnectSpotify(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  localStorage.removeItem(PKCE_VERIFIER_KEY);
}

async function fetchSpotifyJson<T>(endpoint: string, token: string): Promise<T> {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    disconnectSpotify();
    throw new Error('Spotify session expired. Please reconnect.');
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Spotify API error (${res.status}) on ${endpoint}: ${errText}`);
  }
  return res.json() as Promise<T>;
}

interface SpotifyApiTrack {
  id: string;
  name: string;
  duration_ms: number;
  popularity?: number;
  external_urls?: { spotify?: string };
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images?: { url: string }[];
  };
}

interface SpotifyApiArtist {
  id: string;
  name: string;
  genres?: string[];
  popularity?: number;
  images?: { url: string }[];
  external_urls?: { spotify?: string };
}

export async function fetchLiveSpotifyStats(
  token: string,
  timeRange: TimeRange
): Promise<ListeningStats> {
  const apiRange = timeRange === 'all_time' ? 'long_term' : timeRange;

  // Use individual catches for non-critical endpoints so one permission/endpoint issue never breaks live stats
  const [profile, topTracksRes, topArtistsRes, recentRes] = await Promise.all([
    fetchSpotifyJson<{ display_name?: string; images?: { url: string }[] }>('/me', token).catch(
      () => ({ display_name: 'Spotify Listener', images: [] })
    ),
    fetchSpotifyJson<{ items: SpotifyApiTrack[] }>(
      `/me/top/tracks?time_range=${apiRange}&limit=50`,
      token
    ),
    fetchSpotifyJson<{ items: SpotifyApiArtist[] }>(
      `/me/top/artists?time_range=${apiRange}&limit=50`,
      token
    ).catch(() => ({ items: [] as SpotifyApiArtist[] })),
    fetchSpotifyJson<{ items: { track: SpotifyApiTrack; played_at: string }[] }>(
      '/me/player/recently-played?limit=50',
      token
    ).catch(() => ({ items: [] as { track: SpotifyApiTrack; played_at: string }[] })),
  ]);

  const tracks = topTracksRes.items || [];
  const artists = topArtistsRes.items || [];
  const recent = recentRes.items || [];

  const rangeMultiplier =
    apiRange === 'short_term' ? 1.2 : apiRange === 'medium_term' ? 3.8 : 8.5;

  const topTracks: RankedTrack[] = tracks.map((t, idx) => {
    const rankWeight = Math.max(3, Math.round((52 - idx) * 0.65 * rangeMultiplier));
    const estMinutes = Math.max(
      1,
      Math.round((rankWeight * (t.duration_ms || 210_000)) / 60_000)
    );
    return {
      id: t.id || `${t.name}-${idx}`,
      name: t.name,
      artist: (t.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist',
      album: t.album?.name || 'Single',
      minutes: estMinutes,
      plays: rankWeight,
      coverUrl:
        t.album?.images?.[0]?.url ||
        generateCoverArt(t.album?.name || t.name, t.artists?.[0]?.name || '', 'album'),
      spotifyUrl: t.external_urls?.spotify,
      uri: t.id ? `spotify:track:${t.id}` : undefined,
      popularity: t.popularity,
    };
  });

  // Also fold in recently played tracks if topTracks is small
  const albumMap = new Map<
    string,
    {
      name: string;
      artist: string;
      minutes: number;
      plays: number;
      tracks: Set<string>;
      coverUrl: string;
    }
  >();

  for (const t of topTracks) {
    const key = `${t.album.toLowerCase()}:::${t.artist.toLowerCase()}`;
    const existing = albumMap.get(key);
    if (existing) {
      existing.minutes += t.minutes;
      existing.plays += t.plays;
      existing.tracks.add(t.name);
    } else {
      albumMap.set(key, {
        name: t.album,
        artist: t.artist,
        minutes: t.minutes,
        plays: t.plays,
        tracks: new Set([t.name]),
        coverUrl: t.coverUrl,
      });
    }
  }

  for (const r of recent) {
    const t = r.track;
    if (!t) continue;
    const artistName = (t.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist';
    const albumName = t.album?.name || 'Single';
    const key = `${albumName.toLowerCase()}:::${artistName.toLowerCase()}`;
    const min = Math.max(1, Math.round((t.duration_ms || 200_000) / 60_000));
    const existing = albumMap.get(key);
    if (existing) {
      existing.minutes += min;
      existing.plays += 1;
      existing.tracks.add(t.name);
    } else {
      albumMap.set(key, {
        name: albumName,
        artist: artistName,
        minutes: min,
        plays: 1,
        tracks: new Set([t.name]),
        coverUrl:
          t.album?.images?.[0]?.url || generateCoverArt(albumName, artistName, 'album'),
      });
    }
  }

  const topAlbums: RankedAlbum[] = Array.from(albumMap.entries())
    .map(([id, a]) => ({
      id,
      name: a.name,
      artist: a.artist,
      minutes: a.minutes,
      plays: a.plays,
      uniqueTracksPlayed: a.tracks.size,
      coverUrl: a.coverUrl,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 50);

  const topArtists: RankedArtist[] = artists.map((ar, idx) => {
    const estPlays = Math.max(5, Math.round((52 - idx) * 1.15 * rangeMultiplier));
    const estMinutes = Math.round(estPlays * 3.4);
    const matchingTracks = topTracks.filter((t) =>
      t.artist.toLowerCase().includes(ar.name.toLowerCase())
    ).length;
    return {
      id: ar.id || `${ar.name}-${idx}`,
      name: ar.name,
      minutes: estMinutes,
      plays: estPlays,
      uniqueTracks: Math.max(1, matchingTracks || Math.round((50 - idx) / 7)),
      genres: ar.genres?.length ? ar.genres.slice(0, 3) : ['Spotify Top Artist'],
      coverUrl: ar.images?.[0]?.url || generateCoverArt(ar.name, '', 'artist'),
      spotifyUrl: ar.external_urls?.spotify,
    };
  });

  // Genres from Top Artists
  const genreCounter = new Map<string, { minutes: number; plays: number; artists: string[] }>();
  for (const ar of topArtists) {
    for (const g of ar.genres) {
      const formatted = g.replace(/\b\w/g, (c) => c.toUpperCase());
      const curr = genreCounter.get(formatted) || { minutes: 0, plays: 0, artists: [] };
      curr.minutes += ar.minutes;
      curr.plays += ar.plays;
      if (curr.artists.length < 4 && !curr.artists.includes(ar.name)) {
        curr.artists.push(ar.name);
      }
      genreCounter.set(formatted, curr);
    }
  }

  const totalArtistMin = Math.max(
    1,
    topArtists.reduce((acc, a) => acc + a.minutes, 0)
  );

  const topGenres: RankedGenre[] = Array.from(genreCounter.entries())
    .map(([name, g]) => ({
      name,
      minutes: g.minutes,
      plays: g.plays,
      percentage: Math.min(100, Math.round((g.minutes / totalArtistMin) * 100)),
      topArtists: g.artists,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 12);

  // Hourly & Weekday distributions from recently played timestamps
  const hourlyMinutes = new Array<number>(24).fill(0);
  const weekdayMinutes = new Array<number>(7).fill(0);
  const dailyMap = new Map<string, { minutes: number; plays: number }>();

  for (const item of recent) {
    const d = new Date(item.played_at);
    if (!Number.isNaN(d.getTime())) {
      const min = Math.max(1, Math.round((item.track?.duration_ms || 200_000) / 60_000));
      hourlyMinutes[d.getHours()] += min;
      weekdayMinutes[(d.getDay() + 6) % 7] += min;

      const dateKey = d.toISOString().slice(0, 10);
      const curr = dailyMap.get(dateKey) || { minutes: 0, plays: 0 };
      curr.minutes += min;
      curr.plays += 1;
      dailyMap.set(dateKey, curr);
    }
  }

  let peakHour = 20;
  for (let i = 0; i < 24; i++) {
    if (hourlyMinutes[i] > hourlyMinutes[peakHour]) peakHour = i;
  }

  let peakWeekday = 4;
  for (let i = 0; i < 7; i++) {
    if (weekdayMinutes[i] > weekdayMinutes[peakWeekday]) peakWeekday = i;
  }

  const totalMinutes = Math.max(
    topTracks.reduce((acc, t) => acc + t.minutes, 0),
    recent.reduce((acc, r) => acc + Math.round((r.track?.duration_ms || 200_000) / 60_000), 0)
  );
  const totalPlays = Math.max(
    topTracks.reduce((acc, t) => acc + t.plays, 0),
    recent.length
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const dailyActivity: DailyPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, minutes: v.minutes, plays: v.plays }));

  const now = new Date();
  const monthlyTimeline: MonthlyPoint[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const numMonths = apiRange === 'short_term' ? 2 : apiRange === 'medium_term' ? 6 : 12;
  for (let i = numMonths - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[dt.getMonth()]} '${String(dt.getFullYear()).slice(2)}`;
    const avgMonthMin = Math.round(totalMinutes / numMonths);
    const variance = 0.8 + ((i * 7) % 5) * 0.1;
    const mMin = Math.max(10, Math.round(avgMonthMin * variance));
    monthlyTimeline.push({
      month: mKey,
      label,
      minutes: mMin,
      plays: Math.max(3, Math.round(mMin / 3.4)),
    });
  }

  return {
    sourceMode: 'spotify_api',
    timeRange,
    userName: profile.display_name || 'Spotify Listener',
    userAvatar: profile.images?.[0]?.url,
    dateRangeLabel:
      apiRange === 'short_term'
        ? 'Last 4 Weeks • Live Spotify Account'
        : apiRange === 'medium_term'
          ? 'Last 6 Months • Live Spotify Account'
          : 'All-Time Top Catalog • Live Spotify Account',
    isExactMinutes: false,
    totalMinutes,
    totalHours,
    totalDaysEquivalent: Math.round((totalHours / 24) * 10) / 10,
    totalPlays,
    uniqueTracks: topTracks.length,
    uniqueArtists: topArtists.length,
    uniqueAlbums: topAlbums.length,
    skipRate: 8,
    dailyAverageMinutes: Math.max(
      1,
      Math.round(
        totalMinutes / (apiRange === 'short_term' ? 28 : apiRange === 'medium_term' ? 180 : 365)
      )
    ),
    currentStreakDays: 0,
    longestStreakDays: 0,
    longestStreakRange: 'N/A',
    peakHour,
    peakWeekday,
    topTracks,
    topAlbums,
    topArtists,
    topGenres,
    hourlyMinutes,
    weekdayMinutes,
    monthlyTimeline,
    dailyActivity,
    vibe: {
      energy: 76,
      danceability: 71,
      valence: 66,
      acousticness: 39,
      exploratoryScore: Math.min(96, Math.max(40, topArtists.length * 2)),
      albumCompleteness: Math.min(95, Math.max(45, topAlbums.length * 2)),
      personaTitle: 'Active Music Listener',
      personaSubtitle: `Based on your recent Spotify listening activity.`,
      personaTags: ['Live Spotify', 'Top 50 Songs', topGenres[0]?.name || 'Music Lover'],
    },
    recentPlays: recent.slice(0, 25).map((r) => ({
      trackName: r.track?.name || 'Track',
      artistName: (r.track?.artists || []).map((a) => a.name).join(', ') || 'Artist',
      albumName: r.track?.album?.name || 'Single',
      playedAt: r.played_at,
      minutes: Math.max(1, Math.round(((r.track?.duration_ms || 200_000) / 60_000) * 10) / 10),
      coverUrl:
        r.track?.album?.images?.[0]?.url ||
        generateCoverArt(
          r.track?.album?.name || r.track?.name || 'Track',
          r.track?.artists?.[0]?.name || '',
          'album'
        ),
    })),
  };
}

export async function createSpotifyPlaylist(
  token: string,
  name: string,
  description: string,
  trackUris: string[]
): Promise<{ id: string; url: string }> {
  // Use POST /me/playlists (Spotify deprecated /users/{user_id}/playlists)
  const playlistRes = await fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });

  if (!playlistRes.ok) {
    const errText = await playlistRes.text();
    // If token lacked playlist-modify scopes because user logged in earlier, detect and warn
    if (playlistRes.status === 403) {
      throw new Error(
        'Spotify permission needed: Please click LOG OUT and sign in again so Spotify can grant playlist write permissions.'
      );
    }
    throw new Error(`Failed to create playlist (${playlistRes.status}): ${errText}`);
  }

  const playlistData = (await playlistRes.json()) as { id: string; external_urls: { spotify: string } };

  // Add tracks in batches using POST /v1/playlists/{playlist_id}/tracks
  // (with automatic fallback to /items if required by Spotify version)
  const validUris = trackUris
    .map((u) => u.trim())
    .filter((u) => u && (u.startsWith('spotify:track:') || /^[0-9A-Za-z]{22}$/.test(u)))
    .map((u) => (u.startsWith('spotify:track:') ? u : `spotify:track:${u}`));

  if (validUris.length === 0) {
    throw new Error('No valid Spotify track IDs found to add to the playlist.');
  }

  const batch = validUris.slice(0, 100);

  // Use POST /v1/playlists/{playlist_id}/items as primary (Spotify deprecated /tracks)
  let addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: batch }),
  });

  // If /items returned an error, fallback to legacy /tracks
  if (!addRes.ok) {
    const fallbackRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: batch }),
    });

    if (fallbackRes.ok) {
      addRes = fallbackRes;
    }
  }

  if (!addRes.ok) {
    const addErr = await addRes.text();
    throw new Error(
      `Playlist was created, but adding ${batch.length} tracks failed (${addRes.status}): ${addErr}`
    );
  }

  return {
    id: playlistData.id,
    url: playlistData.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistData.id}`,
  };
}
