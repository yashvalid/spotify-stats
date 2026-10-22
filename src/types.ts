export type TimeRange = 'short_term' | 'medium_term' | 'long_term' | 'all_time';

export type DataSourceMode = 'spotify_api' | 'history';

export interface StreamRecord {
  ts: string; // ISO timestamp
  msPlayed: number;
  trackName: string;
  artistName: string;
  albumName: string;
  trackUri?: string;
  skipped?: boolean;
  shuffle?: boolean;
  coverUrl?: string;
  genres?: string[];
}

export interface RankedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  minutes: number;
  plays: number;
  coverUrl: string;
  spotifyUrl?: string;
  uri?: string;
  popularity?: number;
}

export interface RankedAlbum {
  id: string;
  name: string;
  artist: string;
  minutes: number;
  plays: number;
  uniqueTracksPlayed: number;
  coverUrl: string;
}

export interface RankedArtist {
  id: string;
  name: string;
  minutes: number;
  plays: number;
  uniqueTracks: number;
  genres: string[];
  coverUrl: string;
  spotifyUrl?: string;
}

export interface RankedGenre {
  name: string;
  minutes: number;
  plays: number;
  percentage: number;
  topArtists: string[];
}

export interface MonthlyPoint {
  month: string; // YYYY-MM
  label: string; // e.g. "Oct '26"
  minutes: number;
  plays: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  minutes: number;
  plays: number;
}

export interface AudioVibeProfile {
  energy: number; // 0-100
  danceability: number; // 0-100
  valence: number; // 0-100 (mood/positivity)
  acousticness: number; // 0-100
  exploratoryScore: number; // 0-100 (variety vs repeat)
  albumCompleteness: number; // 0-100 (full album listener vs singles)
  personaTitle: string;
  personaSubtitle: string;
  personaTags: string[];
}

export interface ListeningStats {
  sourceMode: DataSourceMode;
  timeRange: TimeRange;
  userName: string;
  userAvatar?: string;
  dateRangeLabel: string;
  isExactMinutes: boolean;
  totalMinutes: number;
  totalHours: number;
  totalDaysEquivalent: number;
  totalPlays: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  skipRate: number; // 0-100
  dailyAverageMinutes: number;
  currentStreakDays: number;
  longestStreakDays: number;
  longestStreakRange: string;
  peakHour: number; // 0-23
  peakWeekday: number; // 0-6 (Mon=0, Sun=6)
  topTracks: RankedTrack[];
  topAlbums: RankedAlbum[];
  topArtists: RankedArtist[];
  topGenres: RankedGenre[];
  hourlyMinutes: number[]; // length 24
  weekdayMinutes: number[]; // length 7 (Mon-Sun)
  monthlyTimeline: MonthlyPoint[];
  dailyActivity: DailyPoint[];
  vibe: AudioVibeProfile;
  recentPlays: {
    trackName: string;
    artistName: string;
    albumName: string;
    playedAt: string;
    minutes: number;
    coverUrl: string;
  }[];
}
