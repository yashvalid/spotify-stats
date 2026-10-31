import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Disc3,
  Flame,
  Layers,
  Mic2,
  Music2,
  Search,
  Share2,
  Upload,
  BarChart3,
  History,
  LogOut,
  AlertCircle,
  Home,
  FileJson,
  Settings2,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  ListPlus,
  Users,
  Play,
} from 'lucide-react';
import { DataSourceMode, ListeningStats, StreamRecord, TimeRange } from './types';
import { computeListeningStats } from './utils/analyticsEngine';
import {
  clearHistoryFromIndexedDB,
  loadHistoryFromIndexedDB,
  parseUploadedFiles,
  saveHistoryToIndexedDB,
} from './utils/historyParser';
import {
  disconnectSpotify,
  fetchLiveSpotifyStats,
  getSavedClientId,
  getValidAccessToken,
  handleOAuthCallbackIfPresent,
  startSpotifyLogin,
} from './utils/spotifyAuth';
import { WrappedCardModal } from './components/WrappedCardModal';
import { DataSourceModal } from './components/DataSourceModal';
import { ActivityCharts } from './components/ActivityCharts';
import { SpotifyRoast } from './components/SpotifyRoast';
import { SpotifyPrivacyGuideModal } from './components/SpotifyPrivacyGuideModal';
import { PlaylistCreatorModal } from './components/PlaylistCreatorModal';
import { TasteDrift } from './components/TasteDrift';
import { ObscurityIndex } from './components/ObscurityIndex';
import { FriendBlendModal } from './components/FriendBlendModal';

type DashboardTab =
  | 'overview'
  | 'albums'
  | 'artists'
  | 'tracks'
  | 'genres'
  | 'drift'
  | 'activity'
  | 'roast';
type RankSortMetric = 'minutes' | 'plays';

const TIME_RANGES: { id: TimeRange; label: string; shortLabel: string }[] = [
  { id: 'short_term', label: 'Last 4 Weeks', shortLabel: '4W' },
  { id: 'medium_term', label: 'Last 6 Months', shortLabel: '6M' },
  { id: 'long_term', label: 'Last 12 Months', shortLabel: '1Y' },
  { id: 'all_time', label: 'All Time', shortLabel: 'ALL' },
];

function StatifyLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
      <rect x="2" y="2" width="16" height="16" fill="#FF0000" />
      <rect x="18" y="2" width="12" height="9" fill="#FFFF00" />
      <rect x="2" y="18" width="9" height="12" fill="#0000FF" />
      <line x1="18" y1="1" x2="18" y2="31" stroke="#111111" strokeWidth="2.5" />
      <line x1="1" y1="18" x2="31" y2="18" stroke="#111111" strokeWidth="2.5" />
      <line x1="18" y1="11" x2="31" y2="11" stroke="#111111" strokeWidth="2" />
      <line x1="11" y1="18" x2="11" y2="31" stroke="#111111" strokeWidth="2" />
    </svg>
  );
}

export default function App() {
  const initialToken = getValidAccessToken();
  const [spotifyToken, setSpotifyToken] = useState<string | null>(initialToken);
  const [sourceMode, setSourceMode] = useState<DataSourceMode | null>(
    initialToken ? 'spotify_api' : null
  );
  const [initializing, setInitializing] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all_time');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const rankBy: RankSortMetric = 'minutes';
  const [searchQuery, setSearchQuery] = useState('');

  const [uploadedRecords, setUploadedRecords] = useState<StreamRecord[] | null>(null);
  const [liveApiStats, setLiveApiStats] = useState<ListeningStats | null>(null);
  const [loadingLive, setLoadingLive] = useState(Boolean(initialToken));
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showPrivacyGuide, setShowPrivacyGuide] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [dismissApiNotice, setDismissApiNotice] = useState(false);

  // If in Web API mode, redirect away from tabs that require full historical stream files
  useEffect(() => {
    if (sourceMode === 'spotify_api' && (activeTab === 'drift' || activeTab === 'activity')) {
      setActiveTab('overview');
    }
  }, [sourceMode, activeTab]);

  // Landing page file upload state
  const [, setUploadingLanding] = useState(false);
  const [isDraggingLanding, setIsDraggingLanding] = useState(false);
  const landingFileInputRef = useRef<HTMLInputElement>(null);

  // Initial load: check OAuth callback or saved IndexedDB history
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await handleOAuthCallbackIfPresent();
        if (token && active) {
          setSpotifyToken(token);
          setSourceMode('spotify_api');
          setLoadingLive(true);
        }
      } catch (err) {
        if (active) {
          setBannerError(err instanceof Error ? err.message : 'Spotify login failed.');
        }
      }

      try {
        const savedHistory = await loadHistoryFromIndexedDB();
        if (savedHistory && savedHistory.length > 0 && active) {
          setUploadedRecords(savedHistory);
          if (!getValidAccessToken()) {
            setSourceMode('history');
          }
        }
      } catch {
        // Ignore IndexedDB read errors
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch live Spotify API data when in spotify_api mode
  useEffect(() => {
    if (sourceMode !== 'spotify_api' || !spotifyToken) return;
    let cancelled = false;
    setLoadingLive(true);
    setBannerError(null);
    fetchLiveSpotifyStats(spotifyToken, timeRange)
      .then((res) => {
        if (!cancelled) {
          setLiveApiStats(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setBannerError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch live Spotify stats. Please ensure your account has access and reconnect.'
          );
          disconnectSpotify();
          setSpotifyToken(null);
          setLiveApiStats(null);
          setSourceMode(uploadedRecords?.length ? 'history' : null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceMode, spotifyToken, timeRange, uploadedRecords]);

  // Compute stats strictly from real connected source (no dummy fallback)
  const stats: ListeningStats | null = useMemo(() => {
    if (sourceMode === 'spotify_api') {
      return liveApiStats;
    }
    if (sourceMode === 'history' && uploadedRecords && uploadedRecords.length > 0) {
      return computeListeningStats(
        uploadedRecords,
        timeRange,
        'history',
        'Your Spotify Archive',
        undefined,
        true
      );
    }
    return null;
  }, [sourceMode, timeRange, uploadedRecords, liveApiStats]);

  const sortedAlbums = useMemo(() => {
    if (!stats) return [];
    const q = searchQuery.trim().toLowerCase();
    return [...stats.topAlbums]
      .filter((a) => !q || a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q))
      .sort((a, b) => (rankBy === 'minutes' ? b.minutes - a.minutes : b.plays - a.plays));
  }, [stats, rankBy, searchQuery]);

  const sortedArtists = useMemo(() => {
    if (!stats) return [];
    const q = searchQuery.trim().toLowerCase();
    return [...stats.topArtists]
      .filter(
        (a) =>
          !q ||
          a.name.toLowerCase().includes(q) ||
          a.genres.some((g) => g.toLowerCase().includes(q))
      )
      .sort((a, b) => (rankBy === 'minutes' ? b.minutes - a.minutes : b.plays - a.plays));
  }, [stats, rankBy, searchQuery]);

  const sortedTracks = useMemo(() => {
    if (!stats) return [];
    const q = searchQuery.trim().toLowerCase();
    return [...stats.topTracks]
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      )
      .sort((a, b) => (rankBy === 'minutes' ? b.minutes - a.minutes : b.plays - a.plays));
  }, [stats, rankBy, searchQuery]);

  const handleUploadHistoryFiles = async (files: FileList | File[]) => {
    const parsed = await parseUploadedFiles(files);
    await saveHistoryToIndexedDB(parsed);
    setUploadedRecords(parsed);
    setSourceMode('history');
  };

  const handleClearHistory = async () => {
    await clearHistoryFromIndexedDB();
    setUploadedRecords(null);
    if (sourceMode === 'history') {
      setSourceMode(spotifyToken ? 'spotify_api' : null);
    }
  };

  const handleDisconnectAll = () => {
    disconnectSpotify();
    setSpotifyToken(null);
    setLiveApiStats(null);
    setSourceMode(uploadedRecords?.length ? 'history' : null);
  };

  // 1-Click Spotify Login
  const handleDirectSpotifyLogin = async () => {
    setBannerError(null);
    try {
      await startSpotifyLogin(getSavedClientId());
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Could not start Spotify login.');
    }
  };

  const handleLandingFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setBannerError(null);
    setUploadingLanding(true);
    try {
      await handleUploadHistoryFiles(files);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to parse streaming history files.');
    } finally {
      setUploadingLanding(false);
    }
  };

  // Loading Screen (Shimmer)
  if (initializing || (sourceMode === 'spotify_api' && loadingLive && !stats)) {
    return (
      <div className="min-h-[100dvh] bg-[#FFFFFF] text-[#111111] flex flex-col justify-center">
        <div className="mx-auto w-full max-w-[1280px] px-3.5 sm:px-6 py-8 sm:py-12">
          <div className="border-4 border-[#111111] bg-[#FFFFFF]">
            <div className="grid grid-cols-1 md:grid-cols-12 border-b-4 border-[#111111]">
              <div className="md:col-span-8 p-5 sm:p-8 bg-[#FF0000] text-[#FFFFFF] border-b-4 md:border-b-0 md:border-r-4 border-[#111111] animate-shimmer">
                <span className="font-mono text-xs font-bold uppercase tracking-widest block">
                  [CONNECTING TELEMETRY]
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold mt-2 break-words">
                  Syncing your Spotify listening data...
                </h2>
              </div>
              <div className="md:col-span-4 p-5 sm:p-8 bg-[#FFFF00] animate-shimmer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 h-44 sm:h-56 bg-[#0000FF] border-b-4 md:border-b-0 md:border-r-4 border-[#111111] animate-shimmer" />
              <div className="md:col-span-7 p-5 sm:p-8 space-y-4">
                <div className="h-6 w-2/3 bg-[#111111] animate-shimmer" />
                <div className="h-4 w-1/2 bg-[#808080] animate-shimmer" />
                <div className="h-24 w-full border-2 border-[#111111] bg-[#FFFF00] animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1-Click Clean Landing Page
  if (!sourceMode || !stats) {
    return (
      <div className="min-h-[100dvh] bg-[#FFFFFF] text-[#111111] flex flex-col justify-between">
        {/* Navigation Bar */}
        <header className="border-b-4 border-[#111111] bg-[#FFFFFF]">
          <div className="mx-auto max-w-[1280px] px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <StatifyLogo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#111111]">
                STATIFY
              </span>
            </div>

            <button
              onClick={() => landingFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00] px-3 sm:px-3.5 py-1.5 font-mono text-xs font-bold text-[#111111] transition-colors duration-200 cursor-pointer shrink-0"
            >
              <FileJson className="w-3.5 h-3.5 text-[#0000FF]" />
              <span className="hidden sm:inline">IMPORT ARCHIVE (.ZIP)</span>
              <span className="sm:hidden">IMPORT .ZIP</span>
            </button>
            <input
              ref={landingFileInputRef}
              type="file"
              multiple
              accept=".json,.zip"
              className="hidden"
              onChange={(e) => handleLandingFiles(e.target.files)}
            />
          </div>
        </header>

        {/* Hero Section */}
        <main className="mx-auto w-full max-w-[1280px] px-3.5 sm:px-6 py-6 sm:py-16 animate-fade-enter">
          {bannerError && (
            <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border-2 border-[#111111] bg-[#FF0000] p-3.5 sm:p-4 text-xs font-bold text-[#FFFFFF]">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bannerError}</span>
              </div>
              <button
                onClick={() => setBannerError(null)}
                className="underline font-mono uppercase shrink-0 cursor-pointer"
              >
                [DISMISS]
              </button>
            </div>
          )}

          {/* Landing Hero: 7 cols Action / 5 cols Features */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border-4 border-[#111111] bg-[#FFFFFF]">
            {/* Left 7 Columns: Direct 1-Click Sign In */}
            <div className="lg:col-span-7 p-5 sm:p-8 md:p-12 flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-[#111111]">
              <div>
                <span className="inline-block border-2 border-[#111111] bg-[#FFFF00] px-3 py-1 font-mono text-xs font-bold uppercase text-[#111111] mb-5 sm:mb-6">
                  Spotify Stats
                </span>

                <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-bold tracking-tight text-[#111111] leading-[1.05]">
                  Your listening history, simplified.
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-[#808080] mt-4 sm:mt-5 max-w-[56ch] leading-relaxed">
                  Sign in to explore your top songs, artists, genres, and roast your music taste.
                </p>
              </div>

              {/* 1-Click Action Area */}
              <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t-4 border-[#111111]">
                <button
                  onClick={handleDirectSpotifyLogin}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-lg border-2 border-[#111111] bg-[#FF0000] hover:bg-[#d90000] active:-translate-y-0.5 py-3.5 sm:py-4 px-6 sm:px-8 text-sm sm:text-base font-bold text-[#FFFFFF] transition-all duration-200 cursor-pointer shadow-md"
                >
                  <span>SIGN IN WITH SPOTIFY</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 font-mono text-xs text-[#808080]">
                  <span>• Real-time Top 50 sync</span>
                  <span>• No credentials stored</span>
                  <span>• 100% private</span>
                </div>
                <p className="mt-3 text-[11px] font-mono text-[#808080] leading-relaxed">
                  * Web API syncs your live Top 50 and recent plays. Drop a Spotify .zip for lifetime stats.
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Feature Highlights */}
            <div className="lg:col-span-5 flex flex-col divide-y-4 divide-[#111111] bg-[#FFFFFF]">
              <div className="p-5 sm:p-8 bg-[#0000FF] text-[#FFFFFF] flex-1 flex flex-col justify-between">
                <span className="font-mono text-xs font-bold uppercase opacity-80">
                  TOP MUSIC
                </span>
                <div className="my-4 sm:my-6">
                  <h3 className="text-xl sm:text-2xl font-bold">Top Songs & Albums</h3>
                  <p className="text-xs sm:text-sm opacity-90 mt-2">
                    Ranked across 4 weeks, 6 months, and all time with direct links and album groupings.
                  </p>
                </div>
                <div className="h-2 w-16 bg-[#FFFF00]" />
              </div>

              <div className="p-5 sm:p-8 bg-[#FFFF00] text-[#111111] flex-1 flex flex-col justify-between">
                <span className="font-mono text-xs font-bold uppercase text-[#FF0000]">
                  TASTE ROAST
                </span>
                <div className="my-4 sm:my-6">
                  <h3 className="text-xl sm:text-2xl font-bold">Roast My Taste</h3>
                  <p className="text-xs sm:text-sm mt-2 text-[#111111]">
                    A fun, honest critique of your top artists, repeated tracks, and late-night listening habits.
                  </p>
                </div>
                <div className="h-2 w-16 bg-[#FF0000]" />
              </div>

              {/* Drag-and-drop alternative box + Guide button */}
              <div className="bg-[#FFFFFF] divide-y-2 divide-[#111111]">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLanding(true);
                  }}
                  onDragLeave={() => setIsDraggingLanding(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingLanding(false);
                    handleLandingFiles(e.dataTransfer.files);
                  }}
                  onClick={() => landingFileInputRef.current?.click()}
                  className={`p-4 sm:p-5 text-center cursor-pointer transition-colors duration-200 ${isDraggingLanding ? 'bg-[#FF0000] text-[#FFFFFF]' : 'bg-[#FFFFFF] hover:bg-[#FFFF00]'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 font-mono text-xs font-bold text-[#111111]">
                    <Upload className="w-4 h-4 text-[#FF0000] shrink-0" />
                    <span className="text-center break-words">HAVE A SPOTIFY .ZIP EXPORT? DROP IT HERE</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7F7F7] text-center">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyGuide(true)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#0000FF] hover:text-[#FF0000] underline cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>How to get your Spotify privacy data? (Guide)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t-4 border-[#111111] bg-[#FFFFFF]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#808080]">
            <span className="text-[#111111] font-bold">STATIFY</span>
            <span className="text-[#111111]">
              Made with <span className="text-[#FF0000]">♥</span> by Yash
            </span>
            <span>CONNECTED VIA SPOTIFY</span>
          </div>
        </footer>

        <SpotifyPrivacyGuideModal
          isOpen={showPrivacyGuide}
          onClose={() => setShowPrivacyGuide(false)}
        />
      </div>
    );
  }

  // Connected Dashboard
  const heroAvatar =
    stats.userAvatar ||
    stats.topArtists[0]?.coverUrl ||
    stats.topAlbums[0]?.coverUrl;

  const navItems: { id: DashboardTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'roast', label: 'Taste Roast', icon: Flame },
    ...(sourceMode === 'history' ? [{ id: 'drift' as DashboardTab, label: 'Taste Trends', icon: TrendingUp }] : []),
    { id: 'albums', label: 'Top Albums', icon: Disc3, count: stats.topAlbums.length },
    { id: 'artists', label: 'Top Artists', icon: Mic2, count: stats.topArtists.length },
    { id: 'tracks', label: 'Top Tracks', icon: Music2, count: stats.topTracks.length },
    { id: 'genres', label: 'Top Genres', icon: BarChart3 },
    ...(sourceMode === 'history' ? [{ id: 'activity' as DashboardTab, label: 'Listening Clock', icon: History }] : []),
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FFFFFF] text-[#111111] flex flex-col justify-between">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-[100] border-b-4 border-[#111111] bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1280px] px-3 sm:px-6 py-2 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Top Row on Mobile: Brand + Mobile Action Buttons */}
          <div className="flex items-center justify-between gap-2 w-full md:w-auto">
            {/* Brand + Status */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <StatifyLogo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#111111]">STATIFY</span>
                <span
                  className={`border border-[#111111] px-1.5 sm:px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold ${sourceMode === 'history'
                    ? 'bg-[#0000FF] text-[#FFFFFF]'
                    : ''
                    }`}
                >
                  {sourceMode === 'history' ? 'ARCHIVE' : 'LIVE'}
                </span>
              </div>
            </div>

            {/* Mobile Action Controls (compact icons + roast button) */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:hidden">
              <button
                onClick={() => setShowPlaylistModal(true)}
                title="Save as Spotify Playlist"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#111111] bg-[#0000FF] hover:bg-[#111111] p-1.5 text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5 text-[#FFFF00]" />
              </button>

              <button
                onClick={() => setShowFriendModal(true)}
                title="Friend Taste Blend Card"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#111111] bg-[#FFFF00] hover:bg-[#111111] hover:text-[#FFFFFF] p-1.5 text-[#111111] transition-colors duration-200 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#FF0000]" />
              </button>

              <button
                onClick={() => setActiveTab('roast')}
                title="Taste Roast"
                className={`inline-flex items-center gap-1 rounded-lg border-2 border-[#111111] px-2 py-1 font-mono text-xs font-bold transition-colors duration-200 cursor-pointer ${activeTab === 'roast'
                  ? 'bg-[#111111] text-[#FFFF00]'
                  : 'bg-[#FF0000] text-[#FFFFFF] hover:bg-[#111111]'
                  }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">ROAST</span>
              </button>

              <button
                onClick={() => setShowWrappedModal(true)}
                title="Poster"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF] p-1.5 text-[#111111] transition-colors duration-200 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowSourceModal(true)}
                title="Data Source Settings"
                className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00] p-1.5 text-[#111111] transition-colors duration-200 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDisconnectAll}
                title="Log out"
                className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#FF0000] hover:text-[#FFFFFF] p-1.5 text-[#111111] transition-colors duration-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Time Range Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto shrink-0 justify-start md:justify-center">
            {TIME_RANGES.map((tr) => {
              const active = timeRange === tr.id;
              return (
                <button
                  key={tr.id}
                  onClick={() => setTimeRange(tr.id)}
                  className={`flex-1 sm:flex-initial rounded-lg border-2 border-[#111111] px-2.5 sm:px-3 py-1 sm:py-1.5 font-mono text-xs font-bold transition-colors duration-200 cursor-pointer whitespace-nowrap text-center ${active
                    ? 'bg-[#FF0000] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                    }`}
                >
                  <span className="hidden sm:inline">{tr.label}</span>
                  <span className="sm:hidden">{tr.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Controls for desktop */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowPlaylistModal(true)}
              title="Save as Spotify Playlist"
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#111111] bg-[#0000FF] hover:bg-[#111111] px-2.5 sm:px-3 py-1 sm:py-1.5 font-mono text-xs font-bold text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5 text-[#FFFF00]" />
              <span>PLAYLIST</span>
            </button>

            <button
              onClick={() => setShowFriendModal(true)}
              title="Friend Taste Blend Card"
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#111111] bg-[#FFFF00] hover:bg-[#111111] hover:text-[#FFFFFF] px-2.5 sm:px-3 py-1 sm:py-1.5 font-mono text-xs font-bold text-[#111111] transition-colors duration-200 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#FF0000]" />
              <span>BLEND</span>
            </button>

            <button
              onClick={() => setActiveTab('roast')}
              className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-[#111111] px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-mono text-xs font-bold transition-colors duration-200 cursor-pointer ${activeTab === 'roast'
                ? 'bg-[#111111] text-[#FFFF00]'
                : 'bg-[#FF0000] text-[#FFFFFF] hover:bg-[#111111]'
                }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>ROAST</span>
            </button>

            <button
              onClick={() => setShowWrappedModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF] px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-mono text-xs font-bold text-[#111111] transition-colors duration-200 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>POSTER</span>
            </button>

            <button
              onClick={() => setShowSourceModal(true)}
              title="Data Source Settings"
              className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00] p-1.5 text-[#111111] transition-colors duration-200 cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDisconnectAll}
              title="Log out"
              className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#FF0000] hover:text-[#FFFFFF] p-1.5 text-[#111111] transition-colors duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Bar */}
        <div className="border-t-2 border-[#111111] bg-[#FFFFFF]">
          <div className="mx-auto max-w-[1280px] px-3 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full min-w-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#111111] px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 ${active
                      ? 'bg-[#111111] text-[#FFFFFF] font-bold'
                      : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className="font-mono text-[10px] opacity-75">[{item.count}]</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Filter Search */}
            {(activeTab === 'albums' || activeTab === 'artists' || activeTab === 'tracks') && (
              <div className="relative w-full sm:w-auto shrink-0">
                <Search className="w-3.5 h-3.5 text-[#808080] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter catalog..."
                  className="rounded-lg border border-[#111111] bg-[#FFFFFF] pl-8 pr-3 py-1 font-mono text-xs text-[#111111] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#FF0000] w-full sm:w-56"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1280px] px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-10 flex-1">
        {bannerError && (
          <div className="rounded-lg border-2 border-[#111111] bg-[#FF0000] px-4 py-3 text-xs font-bold text-[#FFFFFF] flex items-center justify-between">
            <span>{bannerError}</span>
            <button
              onClick={() => setBannerError(null)}
              className="underline font-mono ml-4 cursor-pointer"
            >
              [DISMISS]
            </button>
          </div>
        )}

        {loadingLive && (
          <div className="rounded-lg border-2 border-[#111111] bg-[#FFFF00] px-4 py-2.5 font-mono text-xs font-bold text-[#111111] animate-shimmer">
            Syncing recent Spotify data...
          </div>
        )}

        {/* Hero & Top Highlights - shown only on Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {stats.sourceMode === 'spotify_api' && !dismissApiNotice && (
              <div className="rounded-lg border-2 border-[#111111] bg-[#FFFF00]/30 border-l-8 border-l-[#0000FF] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertCircle className="w-4 h-4 text-[#0000FF] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono font-bold uppercase text-[#0000FF] block sm:inline sm:mr-2">
                      NOTE: SPOTIFY WEB API
                    </span>
                    <span className="text-[#111111] leading-relaxed">
                      Showing live Top 50 rankings and recent plays. Drop your Spotify <code className="font-mono font-bold">.zip</code> archive anytime for complete historical stats.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setShowSourceModal(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#111111] bg-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF] font-mono text-[11px] font-bold text-[#111111] transition-colors cursor-pointer"
                  >
                    IMPORT ARCHIVE
                  </button>
                  <button
                    onClick={() => setDismissApiNotice(true)}
                    className="px-2 py-1 font-mono text-[11px] text-[#808080] hover:text-[#111111] underline cursor-pointer"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-12 border-4 border-[#111111] bg-[#FFFFFF] animate-fade-enter">
              {/* Left: User Profile & Minutes */}
              <div className="lg:col-span-5 flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-[#111111]">
                <div className="p-4 sm:p-6 bg-[#FFFFFF] border-b-4 border-[#111111] flex items-center gap-3 sm:gap-4">
                  {heroAvatar && (
                    <img
                      src={heroAvatar}
                      alt={stats.userName}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover border-2 border-[#111111] shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold uppercase text-[#0000FF] block truncate">
                      {stats.dateRangeLabel}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#111111] truncate mt-0.5">
                      {stats.userName}
                    </h1>
                    <span className="font-mono text-[11px] sm:text-xs text-[#808080] block mt-0.5 truncate">
                      {stats.sourceMode === 'history' ? '100% Exact Stream History' : 'Live Spotify Account'}
                    </span>
                  </div>
                </div>

                {stats.sourceMode === 'history' ? (
                  <div className="p-5 sm:p-8 bg-[#FF0000] text-[#FFFFFF] flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-widest">
                      <span>MINUTES LISTENED</span>
                    </div>
                    <div className="my-3 sm:my-4">
                      <p className="text-4xl sm:text-6xl font-bold tracking-tight break-words">
                        {stats.totalMinutes.toLocaleString()}
                      </p>
                      <p className="font-mono text-xs sm:text-sm font-bold text-[#FFFF00] mt-2 break-words">
                        {stats.totalHours.toLocaleString()} HOURS • {stats.totalDaysEquivalent} FULL DAYS
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#FFFFFF]/40 flex flex-wrap items-center justify-between gap-1.5 font-mono text-xs">
                      <span>DAILY AVG: {stats.dailyAverageMinutes}M</span>
                      <span>{stats.totalPlays.toLocaleString()} STREAMS</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-8 bg-[#FF0000] text-[#FFFFFF] flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-widest">
                      <span>CATALOG SNAPSHOT</span>
                    </div>
                    <div className="my-3 sm:my-4">
                      <p className="text-4xl sm:text-6xl font-bold tracking-tight break-words">
                        TOP 50
                      </p>
                      <p className="font-mono text-xs sm:text-sm font-bold text-[#FFFF00] mt-2 break-words">
                        OFFICIAL SPOTIFY RANKINGS
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#FFFFFF]/40 flex flex-wrap items-center justify-between gap-1.5 font-mono text-xs">
                      <span>{stats.topTracks.length} SONGS</span>
                      <span>{stats.topArtists.length} ARTISTS</span>
                      <span>{stats.topGenres.length} GENRES</span>
                    </div>
                  </div>
                )}
              </div>

            {/* Right: Highlights Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12">
              <div
                onClick={() => setActiveTab('albums')}
                className="sm:col-span-7 p-4 sm:p-6 border-b-4 sm:border-r-4 border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00] transition-colors duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold text-[#111111]">
                  <span>TOP ALBUM</span>
                  <Disc3 className="w-4 h-4 text-[#FF0000]" />
                </div>
                {stats.topAlbums[0] ? (
                  <div className="my-3 sm:my-4 flex items-center gap-3 sm:gap-4">
                    <img
                      src={stats.topAlbums[0].coverUrl}
                      alt={stats.topAlbums[0].name}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover border-2 border-[#111111] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-bold text-[#111111] truncate">
                        {stats.topAlbums[0].name}
                      </p>
                      <p className="text-xs text-[#808080] truncate">{stats.topAlbums[0].artist}</p>
                      <p className="font-mono text-xs font-bold text-[#0000FF] mt-1">
                        {stats.sourceMode === 'history'
                          ? `${stats.topAlbums[0].minutes.toLocaleString()} MIN`
                          : `${stats.topAlbums[0].uniqueTracksPlayed} SONGS IN TOP 50`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-[#808080] my-4">NO ALBUM DATA</p>
                )}
                <div className="font-mono text-xs text-[#111111] font-bold flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-[#111111]">
                  <span>{stats.uniqueAlbums} UNIQUE ALBUMS</span>
                  <span>VIEW ALL →</span>
                </div>
              </div>

              {stats.sourceMode === 'history' ? (
                <div
                  onClick={() => setActiveTab('activity')}
                  className="sm:col-span-5 p-4 sm:p-6 border-b-4 border-[#111111] bg-[#FFFF00] text-[#111111] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between font-mono text-xs font-bold">
                    <span>STREAK</span>
                    <Flame className="w-4 h-4 text-[#FF0000]" />
                  </div>
                  <div className="my-3 sm:my-4">
                    <p className="text-2xl sm:text-3xl font-bold">
                      {stats.longestStreakDays} DAYS
                    </p>
                    <p className="font-mono text-xs font-bold mt-1">
                      CURRENT: {stats.currentStreakDays} DAYS
                    </p>
                  </div>
                  <p className="font-mono text-[11px] truncate border-t border-[#111111] pt-2">
                    {stats.longestStreakRange}
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => setActiveTab('genres')}
                  className="sm:col-span-5 p-4 sm:p-6 border-b-4 border-[#111111] bg-[#FFFF00] text-[#111111] hover:bg-[#ffed4a] transition-colors duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between font-mono text-xs font-bold">
                    <span>TOP GENRE</span>
                    <BarChart3 className="w-4 h-4 text-[#0000FF]" />
                  </div>
                  <div className="my-3 sm:my-4">
                    <p className="text-xl sm:text-2xl font-bold uppercase truncate">
                      {stats.topGenres[0]?.name || 'ECLECTIC'}
                    </p>
                    <p className="font-mono text-xs font-bold mt-1 text-[#111111]">
                      {stats.topGenres[0] ? `${stats.topGenres[0].percentage}% OF ROTATION` : 'VARIED TASTE'}
                    </p>
                  </div>
                  <div className="font-mono text-xs font-bold flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-[#111111]">
                    <span>{stats.topGenres.length} GENRES</span>
                    <span>VIEW ALL →</span>
                  </div>
                </div>
              )}

              <div
                onClick={() => setActiveTab('artists')}
                className="sm:col-span-5 p-4 sm:p-6 border-b-4 sm:border-b-0 sm:border-r-4 border-[#111111] bg-[#0000FF] text-[#FFFFFF] cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold">
                  <span>TOP ARTIST</span>
                  <Mic2 className="w-4 h-4 text-[#FFFF00]" />
                </div>
                {stats.topArtists[0] ? (
                  <div className="my-3 sm:my-4 flex items-center gap-3">
                    <img
                      src={stats.topArtists[0].coverUrl}
                      alt={stats.topArtists[0].name}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover border-2 border-[#FFFFFF] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-bold truncate">{stats.topArtists[0].name}</p>
                      <p className="font-mono text-xs text-[#FFFF00] mt-0.5">
                        {stats.sourceMode === 'history'
                          ? `${stats.topArtists[0].minutes.toLocaleString()} MIN`
                          : '#1 TOP ARTIST'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="font-mono text-xs my-4">NO ARTIST DATA</p>
                )}
                <div className="font-mono text-xs font-bold flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-[#FFFFFF]/40">
                  <span>{stats.uniqueArtists} ARTISTS</span>
                  <span>VIEW ALL →</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('tracks')}
                className="sm:col-span-7 p-4 sm:p-6 bg-[#FFFFFF] hover:bg-[#FFFF00] transition-colors duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold text-[#111111]">
                  <span>#1 TRACK</span>
                  <Layers className="w-4 h-4 text-[#0000FF]" />
                </div>
                {stats.topTracks[0] ? (
                  <div className="my-3 sm:my-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-bold text-[#111111] truncate">
                        {stats.topTracks[0].name}
                      </p>
                      <p className="text-xs text-[#808080] truncate">{stats.topTracks[0].artist}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-base sm:text-lg font-bold text-[#FF0000] block">
                        {stats.sourceMode === 'history'
                          ? `${stats.topTracks[0].minutes.toLocaleString()}M`
                          : stats.topTracks[0].popularity !== undefined
                          ? `${stats.topTracks[0].popularity}% POP`
                          : '#1 TRACK'}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="font-mono text-xs text-[#111111] font-bold flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-[#111111]">
                  <span>CATALOG: {stats.uniqueTracks.toLocaleString()} SONGS</span>
                  <span>TOP 50 TRACKS →</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 sm:space-y-12">
            {/* Top Albums & Top Artists */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
              <div className="lg:col-span-7 p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-[#111111] mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#111111]">Top Albums</h2>
                  <button
                    onClick={() => setActiveTab('albums')}
                    className="rounded-lg border border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00] px-3 py-1 font-mono text-xs font-bold text-[#111111] cursor-pointer"
                  >
                    SEE ALL ({stats.topAlbums.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {sortedAlbums.slice(0, 6).map((album, idx) => (
                    <div
                      key={album.id}
                      onClick={() => setActiveTab('albums')}
                      className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:-translate-y-0.5 transition-transform duration-200 p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 cursor-pointer"
                    >
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 border border-[#111111]">
                        <img
                          src={album.coverUrl}
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-0 left-0 font-mono text-[10px] font-bold px-1 bg-[#111111] text-[#FFFFFF]">
                          0{idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[#111111] truncate">{album.name}</h3>
                        <p className="text-xs text-[#808080] truncate">{album.artist}</p>
                        <p className="font-mono text-xs font-bold text-[#111111] mt-0.5">
                          {stats.sourceMode === 'history'
                            ? `${album.minutes.toLocaleString()} MIN`
                            : `${album.uniqueTracksPlayed} songs in Top 50`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 p-4 sm:p-6 bg-[#FFFFFF]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-[#111111] mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#111111]">Top Artists</h2>
                  <button
                    onClick={() => setActiveTab('artists')}
                    className="rounded-lg border border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00] px-3 py-1 font-mono text-xs font-bold text-[#111111] cursor-pointer"
                  >
                    SEE ALL ({stats.topArtists.length}) →
                  </button>
                </div>

                <div className="divide-y border-2 border-[#111111] divide-[#111111]">
                  {sortedArtists.slice(0, 6).map((artist, idx) => (
                    <div
                      key={artist.id}
                      onClick={() => setActiveTab('artists')}
                      className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3 bg-[#FFFFFF] hover:bg-[#FFFF00] transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-[#111111] w-5 shrink-0">
                          0{idx + 1}
                        </span>
                        <img
                          src={artist.coverUrl}
                          alt={artist.name}
                          className="w-10 h-10 object-cover border border-[#111111] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-[#111111] truncate">
                            {artist.name}
                          </h3>
                          <p className="font-mono text-[11px] text-[#808080] truncate">
                            {artist.genres[0] || 'Artist'}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#FF0000] shrink-0">
                        {stats.sourceMode === 'history'
                          ? `${artist.minutes.toLocaleString()}M`
                          : `#${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Tracks & Top Genres */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
              <div className="lg:col-span-8 p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-[#111111] mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#111111]">
                    {stats.sourceMode === 'history' ? 'Most Streamed Songs' : 'Top Tracks'}
                  </h2>
                  <button
                    onClick={() => setActiveTab('tracks')}
                    className="rounded-lg border border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00] px-3 py-1 font-mono text-xs font-bold text-[#111111] cursor-pointer"
                  >
                    FULL TOP 50 →
                  </button>
                </div>

                <div className="divide-y border-2 border-[#111111] divide-[#111111]">
                  {sortedTracks.slice(0, 8).map((track, idx) => (
                    <div
                      key={track.id}
                      className="p-2.5 sm:p-3 bg-[#FFFFFF] hover:bg-[#FFFF00]/40 transition-colors flex items-center gap-2.5 sm:gap-3"
                    >
                      <span className="font-mono text-xs font-bold text-[#111111] w-5 sm:w-6 text-center shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <img
                        src={track.coverUrl}
                        alt={track.name}
                        className="w-10 h-10 object-cover border border-[#111111] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#111111] truncate">{track.name}</p>
                          <span className="font-mono text-xs font-bold text-[#111111] shrink-0">
                            {stats.sourceMode === 'history'
                              ? `${track.minutes.toLocaleString()} MIN`
                              : track.popularity !== undefined
                              ? `${track.popularity}% POP`
                              : `#${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-xs text-[#808080] truncate">
                          {track.artist} — {track.album}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 p-4 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b-2 border-[#111111] mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#111111]">Top Genres</h2>
                    <button
                      onClick={() => setActiveTab('genres')}
                      className="font-mono text-xs font-bold text-[#0000FF] underline cursor-pointer"
                    >
                      DETAILS →
                    </button>
                  </div>

                  <div className="space-y-4">
                    {stats.topGenres.slice(0, 6).map((genre, idx) => (
                      <div key={genre.name}>
                        <div className="flex items-center justify-between font-mono text-xs mb-1">
                          <span className="font-bold text-[#111111] truncate pr-2">
                            0{idx + 1} {genre.name}
                          </span>
                          <span className="text-[#808080] shrink-0">
                            {stats.sourceMode === 'history'
                              ? `${genre.minutes.toLocaleString()}M`
                              : `${genre.percentage}%`}
                          </span>
                        </div>
                        <div className="h-2.5 w-full border border-[#111111] bg-[#FFFFFF]">
                          <div
                            style={{
                              width: `${Math.max(10, Math.round((genre.minutes / (stats.topGenres[0]?.minutes || 1)) * 100))}%`,
                            }}
                            className="h-full bg-[#FF0000]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-2 border-[#111111] bg-[#FFFF00] p-4">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#111111] block">
                    MUSIC VIBE
                  </span>
                  <p className="text-base font-bold text-[#111111] mt-0.5 break-words">
                    {stats.vibe.personaTitle}
                  </p>
                  <p className="text-xs text-[#111111] mt-1 break-words">{stats.vibe.personaSubtitle}</p>
                </div>
              </div>
            </div>

            {/* Obscurity & Hipster Index Feature */}
            <ObscurityIndex stats={stats} />

            {/* Charts: History mode has full activity matrix; Web API mode shows real recent stream log */}
            {stats.sourceMode === 'history' ? (
              <ActivityCharts stats={stats} />
            ) : stats.recentPlays && stats.recentPlays.length > 0 ? (
              <div className="border-2 border-[#111111] bg-[#FFFFFF] p-4 sm:p-6">
                <div className="flex items-center justify-between pb-4 border-b-2 border-[#111111] mb-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#0000FF]">
                      <History className="w-4 h-4" />
                      <span>RECENT ACTIVITY</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#111111] mt-1">Recently Played Songs</h3>
                  </div>
                  <span className="font-mono text-xs bg-[#0000FF] text-[#FFFFFF] px-2.5 py-1 font-bold">
                    {stats.recentPlays.length} TRACKS
                  </span>
                </div>
                <div className="divide-y border-2 border-[#111111] divide-[#111111]">
                  {stats.recentPlays.slice(0, 10).map((r, i) => (
                    <div
                      key={`${r.trackName}-${r.playedAt}-${i}`}
                      className="p-2.5 sm:p-3 flex items-center justify-between gap-3 bg-[#FFFFFF] hover:bg-[#FFFF00]/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-[#808080] w-5 shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <img
                          src={r.coverUrl}
                          alt={r.trackName}
                          className="w-10 h-10 object-cover border border-[#111111] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#111111] truncate">{r.trackName}</p>
                          <p className="text-xs text-[#808080] truncate">
                            {r.artistName} — {r.albumName}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[#808080] shrink-0">
                        {new Date(r.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: TOP ALBUMS */}
        {activeTab === 'albums' && (
          <div className="border-2 border-[#111111] bg-[#FFFFFF] p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] pb-4 border-b-2 border-[#111111] mb-6">
              Top Albums ({sortedAlbums.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {sortedAlbums.map((album, idx) => (
                <div
                  key={album.id}
                  className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                >
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#111111] w-6 sm:w-7 text-center shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover border border-[#111111] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#111111] truncate">{album.name}</h3>
                    <p className="text-xs text-[#808080] truncate">{album.artist}</p>
                    <span className="text-xs font-bold text-[#FF0000] font-mono mt-1 block">
                      {stats.sourceMode === 'history'
                        ? `${album.minutes.toLocaleString()} MIN`
                        : `${album.uniqueTracksPlayed} songs in Top 50`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TOP ARTISTS */}
        {activeTab === 'artists' && (
          <div className="border-2 border-[#111111] bg-[#FFFFFF] p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] pb-4 border-b-2 border-[#111111] mb-6">
              Top Artists ({sortedArtists.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {sortedArtists.map((artist, idx) => (
                <div
                  key={artist.id}
                  className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                >
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#111111] w-6 sm:w-7 text-center shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <img
                    src={artist.coverUrl}
                    alt={artist.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover border border-[#111111] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#111111] truncate">{artist.name}</h3>
                    <p className="text-xs text-[#808080] truncate">
                      {artist.genres.join(' • ') || 'Artist'}
                    </p>
                    <span className="text-xs font-bold text-[#0000FF] font-mono mt-1 block">
                      {stats.sourceMode === 'history'
                        ? `${artist.minutes.toLocaleString()} MIN`
                        : `#${idx + 1} Top Artist`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TOP TRACKS */}
        {activeTab === 'tracks' && (
          <div className="border-2 border-[#111111] bg-[#FFFFFF] p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] pb-4 border-b-2 border-[#111111] mb-6">
              Top Tracks ({sortedTracks.length})
            </h2>

            <div className="divide-y-2 border-2 border-[#111111] divide-[#111111]">
              {sortedTracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="p-3 sm:p-3.5 bg-[#FFFFFF] hover:bg-[#FFFF00]/35 transition-colors flex items-center gap-3 sm:gap-4"
                >
                  <span className="font-mono text-xs font-bold text-[#111111] w-6 sm:w-8 text-center shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <img
                    src={track.coverUrl}
                    alt={track.name}
                    className="w-11 h-11 sm:w-12 sm:h-12 object-cover border border-[#111111] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[#111111] truncate">{track.name}</h3>
                        <p className="text-xs text-[#808080] truncate">
                          {track.artist} — {track.album}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start sm:self-auto">
                        <span className="font-mono text-xs font-bold text-[#111111]">
                          {stats.sourceMode === 'history'
                            ? `${track.minutes.toLocaleString()} MIN`
                            : track.popularity !== undefined
                            ? `${track.popularity}% POPULARITY`
                            : `#${idx + 1}`}
                        </span>
                        {track.spotifyUrl && (
                          <a
                            href={track.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded border border-[#111111] bg-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF] text-[#111111] transition-colors"
                            title="Open on Spotify"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: GENRES & RATIO */}
        {activeTab === 'genres' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
            <div className="lg:col-span-7 p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111]">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111111] pb-4 border-b-2 border-[#111111] mb-6">
                Genre Distribution
              </h2>
              <div className="space-y-4">
                {stats.topGenres.map((g, idx) => (
                  <div key={g.name} className="border-2 border-[#111111] p-3.5 sm:p-4 bg-[#FFFFFF]">
                    <div className="flex items-center justify-between font-mono text-xs mb-2">
                      <span className="font-bold text-[#111111] truncate pr-2">
                        0{idx + 1} - {g.name.toUpperCase()}
                      </span>
                      <span className="font-bold text-[#0000FF] shrink-0">
                        {stats.sourceMode === 'history'
                          ? `${g.minutes.toLocaleString()}M`
                          : `${g.percentage}% OF ROTATION`}
                      </span>
                    </div>
                    <div className="h-3 w-full border border-[#111111] bg-[#FFFFFF] mb-2">
                      <div
                        style={{
                          width: `${Math.max(8, Math.round((g.minutes / (stats.topGenres[0]?.minutes || 1)) * 100))}%`,
                        }}
                        className="h-full bg-[#FF0000]"
                      />
                    </div>
                    <p className="font-mono text-xs text-[#808080] break-words">
                      KEY ARTISTS: <span className="text-[#111111]">{g.topArtists.join(', ')}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 p-4 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between">
              <div>
                <div className="border-2 border-[#111111] bg-[#FFFF00] p-4 sm:p-5 mb-6">
                  <span className="font-mono text-xs font-bold uppercase text-[#111111]">
                    MUSIC VIBE
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#111111] mt-1 break-words">
                    {stats.vibe.personaTitle}
                  </h3>
                  <p className="text-sm text-[#111111] mt-2 leading-relaxed break-words">
                    {stats.vibe.personaSubtitle}
                  </p>
                </div>

                {stats.sourceMode === 'history' ? (
                  <div className="space-y-4">
                    {[
                      { label: 'ENERGY', val: stats.vibe.energy, bg: 'bg-[#FF0000]' },
                      { label: 'DANCEABILITY', val: stats.vibe.danceability, bg: 'bg-[#0000FF]' },
                      { label: 'MOOD (HAPPINESS)', val: stats.vibe.valence, bg: 'bg-[#FFFF00]' },
                      { label: 'ACOUSTIC SOUNDS', val: stats.vibe.acousticness, bg: 'bg-[#111111]' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between font-mono text-xs mb-1">
                          <span className="font-bold text-[#111111] truncate pr-2">{item.label}</span>
                          <span className="font-bold text-[#111111] shrink-0">{item.val}%</span>
                        </div>
                        <div className="h-3 w-full border border-[#111111] bg-[#FFFFFF]">
                          <div
                            style={{ width: `${item.val}%` }}
                            className={`h-full ${item.bg}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-[#111111] bg-[#F7F7F7] p-3.5 text-xs text-[#808080] font-mono leading-relaxed">
                    Genre distribution computed directly from your {stats.topArtists.length} top artists on Spotify.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: TASTE DRIFT (Only for History mode where full timeline data exists) */}
        {activeTab === 'drift' && stats.sourceMode === 'history' && <TasteDrift stats={stats} />}

        {/* TAB 6: CIRCADIAN GRID (Only for History mode where full timeline data exists) */}
        {activeTab === 'activity' && stats.sourceMode === 'history' && (
          <div className="space-y-6 sm:space-y-8">
            <ActivityCharts stats={stats} />

            <div className="border-2 border-[#111111] bg-[#FFFFFF] p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] pb-4 border-b-2 border-[#111111] mb-4">
                Recent Listening Stream
              </h3>

              <div className="divide-y border-2 border-[#111111] divide-[#111111]">
                {stats.recentPlays.map((rp, i) => (
                  <div
                    key={`${rp.playedAt}-${i}`}
                    className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3 bg-[#FFFFFF] hover:bg-[#FFFF00]/30"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <img
                        src={rp.coverUrl}
                        alt={rp.trackName}
                        className="w-10 h-10 object-cover border border-[#111111] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#111111] truncate">{rp.trackName}</p>
                        <p className="text-xs text-[#808080] truncate">
                          {rp.artistName} • {rp.albumName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] sm:text-xs font-bold text-[#FF0000] shrink-0 text-right">
                      {new Date(rp.playedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SPOTIFY ROAST */}
        {activeTab === 'roast' && <SpotifyRoast stats={stats} />}
      </main>

      {/* Dashboard Footer */}
      <footer className="border-t-4 border-[#111111] bg-[#FFFFFF] mt-auto">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#808080]">
          <span className="text-[#111111] font-bold">STATIFY</span>
          <span className="text-[#111111]">
            Made with <span className="text-[#FF0000]">♥</span> by Yash
          </span>

        </div>
      </footer>

      {/* Modals */}
      {showWrappedModal && (
        <WrappedCardModal stats={stats} onClose={() => setShowWrappedModal(false)} />
      )}

      {showSourceModal && (
        <DataSourceModal
          activeMode={sourceMode}
          hasUploadedHistory={Boolean(uploadedRecords && uploadedRecords.length > 0)}
          uploadedRecordCount={uploadedRecords?.length || 0}
          isSpotifyConnected={Boolean(spotifyToken)}
          onUploadFiles={handleUploadHistoryFiles}
          onClearHistory={handleClearHistory}
          onSwitchToHistory={() => setSourceMode('history')}
          onSwitchToSpotifyApi={() => setSourceMode('spotify_api')}
          onDisconnectSpotify={handleDisconnectAll}
          onClose={() => setShowSourceModal(false)}
        />
      )}

      <SpotifyPrivacyGuideModal
        isOpen={showPrivacyGuide}
        onClose={() => setShowPrivacyGuide(false)}
      />

      <PlaylistCreatorModal
        stats={stats}
        spotifyToken={spotifyToken}
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
      />

      <FriendBlendModal
        stats={stats}
        isOpen={showFriendModal}
        onClose={() => setShowFriendModal(false)}
      />
    </div>
  );
}
