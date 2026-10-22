import {
  AudioVibeProfile,
  DailyPoint,
  DataSourceMode,
  ListeningStats,
  MonthlyPoint,
  RankedAlbum,
  RankedArtist,
  RankedGenre,
  RankedTrack,
  StreamRecord,
  TimeRange,
} from '../types';
import { generateCoverArt, inferGenresForArtist } from './artwork';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShortDate(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeListeningStats(
  allRecords: StreamRecord[],
  timeRange: TimeRange,
  sourceMode: DataSourceMode,
  userName = 'Music Explorer',
  userAvatar?: string,
  isExactMinutes = true
): ListeningStats {
  const validRecords = allRecords
    .filter((r) => r.trackName && r.artistName && r.msPlayed > 0)
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  if (validRecords.length === 0) {
    return createEmptyStats(sourceMode, timeRange, userName, userAvatar);
  }

  const latestTs = new Date(validRecords[validRecords.length - 1].ts).getTime();
  const dayMs = 86_400_000;

  let cutoffTs = 0;
  if (timeRange === 'short_term') {
    cutoffTs = latestTs - 28 * dayMs;
  } else if (timeRange === 'medium_term') {
    cutoffTs = latestTs - 180 * dayMs;
  } else if (timeRange === 'long_term') {
    cutoffTs = latestTs - 365 * dayMs;
  }

  const filtered = cutoffTs > 0
    ? validRecords.filter((r) => new Date(r.ts).getTime() >= cutoffTs)
    : validRecords;

  const records = filtered.length > 0 ? filtered : validRecords;

  const firstDate = records[0].ts;
  const lastDate = records[records.length - 1].ts;
  const dateRangeLabel = `${formatShortDate(firstDate)} – ${formatShortDate(lastDate)}`;

  let totalMs = 0;
  let totalMeaningfulPlays = 0;
  let skippedCount = 0;

  const trackMap = new Map<
    string,
    {
      name: string;
      artist: string;
      album: string;
      ms: number;
      plays: number;
      coverUrl?: string;
      uri?: string;
    }
  >();

  const albumMap = new Map<
    string,
    {
      name: string;
      artist: string;
      ms: number;
      plays: number;
      tracks: Set<string>;
      coverUrl?: string;
    }
  >();

  const artistMap = new Map<
    string,
    {
      name: string;
      ms: number;
      plays: number;
      tracks: Set<string>;
      genres: string[];
      coverUrl?: string;
    }
  >();

  const hourlyMs = new Array<number>(24).fill(0);
  const weekdayMs = new Array<number>(7).fill(0); // Mon=0 .. Sun=6
  const monthlyMap = new Map<string, { ms: number; plays: number }>();
  const dailyMap = new Map<string, { ms: number; plays: number }>();

  for (const rec of records) {
    totalMs += rec.msPlayed;
    const isMeaningfulPlay = rec.msPlayed >= 30_000;
    if (isMeaningfulPlay) {
      totalMeaningfulPlays += 1;
    }
    if (rec.skipped || rec.msPlayed < 25_000) {
      skippedCount += 1;
    }

    const d = new Date(rec.ts);
    if (!Number.isNaN(d.getTime())) {
      const hr = d.getHours();
      hourlyMs[hr] += rec.msPlayed;

      const jsDay = d.getDay(); // 0=Sun..6=Sat
      const monIdx = (jsDay + 6) % 7;
      weekdayMs[monIdx] += rec.msPlayed;

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mEntry = monthlyMap.get(monthKey) || { ms: 0, plays: 0 };
      mEntry.ms += rec.msPlayed;
      if (isMeaningfulPlay) mEntry.plays += 1;
      monthlyMap.set(monthKey, mEntry);

      const dateKey = toLocalDateKey(d);
      const dEntry = dailyMap.get(dateKey) || { ms: 0, plays: 0 };
      dEntry.ms += rec.msPlayed;
      if (isMeaningfulPlay) dEntry.plays += 1;
      dailyMap.set(dateKey, dEntry);
    }

    // Track aggregation
    const trackKey = `${rec.trackName.toLowerCase()}:::${rec.artistName.toLowerCase()}`;
    const existingTrack = trackMap.get(trackKey);
    if (existingTrack) {
      existingTrack.ms += rec.msPlayed;
      if (isMeaningfulPlay) existingTrack.plays += 1;
      if (!existingTrack.coverUrl && rec.coverUrl) existingTrack.coverUrl = rec.coverUrl;
      if (!existingTrack.uri && rec.trackUri) existingTrack.uri = rec.trackUri;
    } else {
      trackMap.set(trackKey, {
        name: rec.trackName,
        artist: rec.artistName,
        album: rec.albumName || 'Single',
        ms: rec.msPlayed,
        plays: isMeaningfulPlay ? 1 : 0,
        coverUrl: rec.coverUrl,
        uri: rec.trackUri,
      });
    }

    // Album aggregation
    const albumName = rec.albumName?.trim() || `${rec.trackName} (Single)`;
    const albumKey = `${albumName.toLowerCase()}:::${rec.artistName.toLowerCase()}`;
    const existingAlbum = albumMap.get(albumKey);
    if (existingAlbum) {
      existingAlbum.ms += rec.msPlayed;
      if (isMeaningfulPlay) existingAlbum.plays += 1;
      existingAlbum.tracks.add(rec.trackName.toLowerCase());
      if (!existingAlbum.coverUrl && rec.coverUrl) existingAlbum.coverUrl = rec.coverUrl;
    } else {
      albumMap.set(albumKey, {
        name: albumName,
        artist: rec.artistName,
        ms: rec.msPlayed,
        plays: isMeaningfulPlay ? 1 : 0,
        tracks: new Set([rec.trackName.toLowerCase()]),
        coverUrl: rec.coverUrl,
      });
    }

    // Artist aggregation
    const artistKey = rec.artistName.toLowerCase();
    const existingArtist = artistMap.get(artistKey);
    if (existingArtist) {
      existingArtist.ms += rec.msPlayed;
      if (isMeaningfulPlay) existingArtist.plays += 1;
      existingArtist.tracks.add(rec.trackName.toLowerCase());
      if (!existingArtist.coverUrl && rec.coverUrl) existingArtist.coverUrl = rec.coverUrl;
    } else {
      artistMap.set(artistKey, {
        name: rec.artistName,
        ms: rec.msPlayed,
        plays: isMeaningfulPlay ? 1 : 0,
        tracks: new Set([rec.trackName.toLowerCase()]),
        genres: inferGenresForArtist(rec.artistName, rec.genres),
        coverUrl: rec.coverUrl,
      });
    }
  }

  const totalMinutes = Math.round(totalMs / 60_000);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalDaysEquivalent = Math.round((totalHours / 24) * 10) / 10;
  const totalPlays = Math.max(totalMeaningfulPlays, records.length);

  // Top Tracks
  const topTracks: RankedTrack[] = Array.from(trackMap.entries())
    .map(([id, t]) => ({
      id,
      name: t.name,
      artist: t.artist,
      album: t.album,
      minutes: Math.max(1, Math.round(t.ms / 60_000)),
      plays: Math.max(1, t.plays),
      coverUrl: t.coverUrl || generateCoverArt(t.album || t.name, t.artist, 'album'),
      uri: t.uri,
    }))
    .sort((a, b) => b.minutes - a.minutes || b.plays - a.plays)
    .slice(0, 50);

  // Top Albums
  const topAlbums: RankedAlbum[] = Array.from(albumMap.entries())
    .map(([id, a]) => ({
      id,
      name: a.name,
      artist: a.artist,
      minutes: Math.max(1, Math.round(a.ms / 60_000)),
      plays: Math.max(1, a.plays),
      uniqueTracksPlayed: a.tracks.size,
      coverUrl: a.coverUrl || generateCoverArt(a.name, a.artist, 'album'),
    }))
    .sort((a, b) => b.minutes - a.minutes || b.plays - a.plays)
    .slice(0, 50);

  // Top Artists
  const topArtists: RankedArtist[] = Array.from(artistMap.entries())
    .map(([id, ar]) => ({
      id,
      name: ar.name,
      minutes: Math.max(1, Math.round(ar.ms / 60_000)),
      plays: Math.max(1, ar.plays),
      uniqueTracks: ar.tracks.size,
      genres: ar.genres,
      coverUrl: ar.coverUrl || generateCoverArt(ar.name, ar.genres[0] || '', 'artist'),
    }))
    .sort((a, b) => b.minutes - a.minutes || b.plays - a.plays)
    .slice(0, 50);

  // Genre aggregation from artists
  const genreMap = new Map<string, { ms: number; plays: number; artists: Set<string> }>();
  for (const ar of artistMap.values()) {
    for (const g of ar.genres) {
      const entry = genreMap.get(g) || { ms: 0, plays: 0, artists: new Set<string>() };
      entry.ms += ar.ms;
      entry.plays += ar.plays;
      if (entry.artists.size < 4) entry.artists.add(ar.name);
      genreMap.set(g, entry);
    }
  }

  const maxGenreMs = Math.max(1, ...Array.from(genreMap.values()).map((g) => g.ms));
  const topGenres: RankedGenre[] = Array.from(genreMap.entries())
    .map(([name, g]) => ({
      name,
      minutes: Math.max(1, Math.round(g.ms / 60_000)),
      plays: Math.max(1, g.plays),
      percentage: Math.min(100, Math.round((g.ms / Math.max(1, totalMs)) * 100)),
      topArtists: Array.from(g.artists),
      _ratio: g.ms / maxGenreMs,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 12);

  // Streaks & Daily Activity
  const activeDates = Array.from(dailyMap.entries())
    .filter(([, v]) => v.ms >= 60_000) // at least 1 minute listened that day
    .map(([k]) => k)
    .sort();

  const { currentStreakDays, longestStreakDays, longestStreakRange } = calculateStreaks(activeDates);

  const spanDays = Math.max(
    1,
    Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / dayMs) + 1
  );
  const dailyAverageMinutes = Math.round(totalMinutes / Math.max(1, Math.min(spanDays, activeDates.length || 1)));

  const hourlyMinutes = hourlyMs.map((ms) => Math.round(ms / 60_000));
  const weekdayMinutes = weekdayMs.map((ms) => Math.round(ms / 60_000));

  let peakHour = 0;
  for (let i = 1; i < 24; i++) {
    if (hourlyMinutes[i] > hourlyMinutes[peakHour]) peakHour = i;
  }

  let peakWeekday = 0;
  for (let i = 1; i < 7; i++) {
    if (weekdayMinutes[i] > weekdayMinutes[peakWeekday]) peakWeekday = i;
  }

  const monthlyTimeline: MonthlyPoint[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [y, m] = month.split('-');
      const monthIdx = Number(m) - 1;
      return {
        month,
        label: `${MONTH_NAMES[monthIdx] || m} '${y.slice(2)}`,
        minutes: Math.round(data.ms / 60_000),
        plays: data.plays,
      };
    });

  const dailyActivity: DailyPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      minutes: Math.round(data.ms / 60_000),
      plays: data.plays,
    }));

  const skipRate = Math.min(100, Math.round((skippedCount / Math.max(1, records.length)) * 100));

  const vibe = computeVibeProfile({
    hourlyMinutes,
    topGenres,
    topAlbums,
    uniqueTracks: trackMap.size,
    totalPlays,
    skipRate,
  });

  const recentPlays = records
    .slice(-25)
    .reverse()
    .map((r) => ({
      trackName: r.trackName,
      artistName: r.artistName,
      albumName: r.albumName || 'Single',
      playedAt: r.ts,
      minutes: Math.max(1, Math.round((r.msPlayed / 60_000) * 10) / 10),
      coverUrl: r.coverUrl || generateCoverArt(r.albumName || r.trackName, r.artistName, 'album'),
    }));

  return {
    sourceMode,
    timeRange,
    userName,
    userAvatar,
    dateRangeLabel,
    isExactMinutes,
    totalMinutes,
    totalHours,
    totalDaysEquivalent,
    totalPlays,
    uniqueTracks: trackMap.size,
    uniqueArtists: artistMap.size,
    uniqueAlbums: albumMap.size,
    skipRate,
    dailyAverageMinutes,
    currentStreakDays,
    longestStreakDays,
    longestStreakRange,
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
    vibe,
    recentPlays,
  };
}

function calculateStreaks(sortedDates: string[]): {
  currentStreakDays: number;
  longestStreakDays: number;
  longestStreakRange: string;
} {
  if (sortedDates.length === 0) {
    return { currentStreakDays: 0, longestStreakDays: 0, longestStreakRange: 'N/A' };
  }

  let longest = 1;
  let longestStart = sortedDates[0];
  let longestEnd = sortedDates[0];

  let current = 1;
  let currentStart = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(`${sortedDates[i - 1]}T00:00:00Z`).getTime();
    const curr = new Date(`${sortedDates[i]}T00:00:00Z`).getTime();
    const diffDays = Math.round((curr - prev) / 86_400_000);

    if (diffDays === 1) {
      current += 1;
      if (current > longest) {
        longest = current;
        longestStart = currentStart;
        longestEnd = sortedDates[i];
      }
    } else if (diffDays > 1) {
      current = 1;
      currentStart = sortedDates[i];
    }
  }

  return {
    currentStreakDays: current,
    longestStreakDays: longest,
    longestStreakRange: `${formatShortDate(longestStart)} – ${formatShortDate(longestEnd)}`,
  };
}

function computeVibeProfile(params: {
  hourlyMinutes: number[];
  topGenres: RankedGenre[];
  topAlbums: RankedAlbum[];
  uniqueTracks: number;
  totalPlays: number;
  skipRate: number;
}): AudioVibeProfile {
  const { hourlyMinutes, topGenres, topAlbums, uniqueTracks, totalPlays, skipRate } = params;
  const totalMin = Math.max(1, hourlyMinutes.reduce((a, b) => a + b, 0));
  const nightMinutes =
    hourlyMinutes[22] +
    hourlyMinutes[23] +
    hourlyMinutes[0] +
    hourlyMinutes[1] +
    hourlyMinutes[2] +
    hourlyMinutes[3] +
    hourlyMinutes[4];
  const nightRatio = nightMinutes / totalMin;

  const genreNames = topGenres.map((g) => g.name.toLowerCase()).join(' ');
  const isElectronicOrDance = /electronic|house|club|hyperpop|disco|garage|synth/.test(genreNames);
  const isChillOrAcoustic = /dream|folk|chamber|ambient|chill|soul/.test(genreNames);

  const energy = Math.min(96, Math.max(38, Math.round(62 + (isElectronicOrDance ? 18 : 0) - (isChillOrAcoustic ? 10 : 0))));
  const danceability = Math.min(95, Math.max(35, Math.round(58 + (isElectronicOrDance ? 22 : 0))));
  const valence = Math.min(92, Math.max(30, Math.round(56 + (isElectronicOrDance ? 10 : -6) - nightRatio * 15)));
  const acousticness = Math.min(90, Math.max(18, Math.round(34 + (isChillOrAcoustic ? 32 : 0))));

  const exploratoryScore = Math.min(98, Math.max(25, Math.round((uniqueTracks / Math.max(1, totalPlays)) * 185)));
  const avgTracksPerTopAlbum =
    topAlbums.slice(0, 10).reduce((acc, a) => acc + a.uniqueTracksPlayed, 0) /
    Math.max(1, Math.min(10, topAlbums.length));
  const albumCompleteness = Math.min(98, Math.max(30, Math.round(avgTracksPerTopAlbum * 14)));

  let personaTitle = 'Sonic Architect';
  let personaSubtitle = 'Balanced between deep album cuts and high-replay anthems.';
  const personaTags: string[] = [];

  if (nightRatio > 0.28 && albumCompleteness >= 65) {
    personaTitle = 'Nocturnal Album Purist';
    personaSubtitle = 'You spin full-length records deep into the late-night hours with low skip rates.';
  } else if (exploratoryScore >= 65) {
    personaTitle = 'Crate-Digging Maverick';
    personaSubtitle = 'Constantly hunting fresh catalog cuts and jumping across genres.';
  } else if (energy >= 74) {
    personaTitle = 'High-Voltage Catalyst';
    personaSubtitle = 'Driven by propulsive beats, synth textures, and peak-hour momentum.';
  } else {
    personaTitle = 'Velvet Grooves Curator';
    personaSubtitle = 'Loyal to rich melodies, cohesive albums, and immersive replay sessions.';
  }

  personaTags.push(nightRatio > 0.25 ? 'Night Owl Listener' : 'Daylight Listener');
  personaTags.push(albumCompleteness >= 60 ? 'Full-Album Devotee' : 'Playlist Curator');
  personaTags.push(skipRate < 15 ? 'Patient Listener' : 'Selective Skipper');

  return {
    energy,
    danceability,
    valence,
    acousticness,
    exploratoryScore,
    albumCompleteness,
    personaTitle,
    personaSubtitle,
    personaTags,
  };
}

function createEmptyStats(
  sourceMode: DataSourceMode,
  timeRange: TimeRange,
  userName: string,
  userAvatar?: string
): ListeningStats {
  return {
    sourceMode,
    timeRange,
    userName,
    userAvatar,
    dateRangeLabel: 'No data',
    isExactMinutes: true,
    totalMinutes: 0,
    totalHours: 0,
    totalDaysEquivalent: 0,
    totalPlays: 0,
    uniqueTracks: 0,
    uniqueArtists: 0,
    uniqueAlbums: 0,
    skipRate: 0,
    dailyAverageMinutes: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    longestStreakRange: 'N/A',
    peakHour: 20,
    peakWeekday: 4,
    topTracks: [],
    topAlbums: [],
    topArtists: [],
    topGenres: [],
    hourlyMinutes: new Array(24).fill(0),
    weekdayMinutes: new Array(7).fill(0),
    monthlyTimeline: [],
    dailyActivity: [],
    vibe: {
      energy: 50,
      danceability: 50,
      valence: 50,
      acousticness: 50,
      exploratoryScore: 50,
      albumCompleteness: 50,
      personaTitle: 'Ready to Spin',
      personaSubtitle: 'Connect Spotify or drop your streaming history to unlock your profile.',
      personaTags: [],
    },
    recentPlays: [],
  };
}
