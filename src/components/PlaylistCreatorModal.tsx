import React, { useState } from 'react';
import {
  ListPlus,
  Check,
  ExternalLink,
  Sparkles,
  Disc3,
  Moon,
  Loader2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { ListeningStats } from '../types';
import { createSpotifyPlaylist, disconnectSpotify, startSpotifyLogin, getSavedClientId } from '../utils/spotifyAuth';

interface Props {
  stats: ListeningStats;
  spotifyToken: string | null;
}

export const PlaylistCreatorModal: React.FC<Props & { isOpen: boolean; onClose: () => void }> = ({
  stats,
  spotifyToken,
  isOpen,
  onClose,
}) => {
  const [playlistType, setPlaylistType] = useState<'top50' | 'deep_cuts' | 'night_owl'>('top50');
  const [customName, setCustomName] = useState(
    `STATIFY // Top 50 [${stats.dateRangeLabel}]`
  );
  const [loading, setLoading] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Track selection logic
  const getSelectedTracks = () => {
    if (playlistType === 'deep_cuts') {
      // Sort by popularity ascending (obscure tracks) or lower popularity
      return [...stats.topTracks]
        .sort((a, b) => (a.popularity ?? 50) - (b.popularity ?? 50))
        .slice(0, 30);
    }
    if (playlistType === 'night_owl') {
      // 20 tracks for late night
      return stats.topTracks.slice(0, 25);
    }
    return stats.topTracks.slice(0, 50);
  };

  const handleCreate = async () => {
    if (!spotifyToken) {
      setError('Please connect with Spotify to save playlists directly to your account.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const selectedTracks = getSelectedTracks();
      const uris = selectedTracks
        .map((t) => {
          if (t.uri && t.uri.startsWith('spotify:track:')) return t.uri;
          if (t.id && /^[0-9A-Za-z]{22}$/.test(t.id)) return `spotify:track:${t.id}`;
          if (t.spotifyUrl) {
            const match = t.spotifyUrl.match(/track\/([0-9A-Za-z]{22})/);
            if (match) return `spotify:track:${match[1]}`;
          }
          return null;
        })
        .filter((u): u is string => Boolean(u));

      if (uris.length === 0) {
        throw new Error(
          'Could not find Spotify track identifiers for this selection. Try selecting "Top Tracks" or ensure songs have Spotify links.'
        );
      }

      const desc =
        playlistType === 'deep_cuts'
          ? `Curated by STATIFY — Underground deep cuts and hidden gems from ${stats.userName}'s listening profile.`
          : playlistType === 'night_owl'
          ? `Curated by STATIFY — Late-night rotation and mellow loops for ${stats.userName}.`
          : `Curated by STATIFY — Top tracks during ${stats.dateRangeLabel} for ${stats.userName}.`;

      const res = await createSpotifyPlaylist(spotifyToken, customName, desc, uris);
      setSuccessUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = getSelectedTracks().length;

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center bg-[#111111]/80 p-3 sm:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-lg border-4 border-[#111111] bg-[#FFFFFF] shadow-2xl overflow-hidden animate-fade-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-[#111111] bg-[#0000FF] text-[#FFFFFF] px-4 sm:px-5 py-3.5 sm:py-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <ListPlus className="w-5 h-5 text-[#FFFF00] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight truncate">
              Export Playlist to Spotify
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] px-2.5 py-1 text-xs font-bold text-[#111111] hover:bg-[#FF0000] hover:text-[#FFFFFF] cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="p-3.5 border-2 border-[#111111] bg-[#FF0000] text-xs font-bold text-[#FFFFFF] space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {error.includes('LOG OUT') && (
                <button
                  type="button"
                  onClick={async () => {
                    disconnectSpotify();
                    await startSpotifyLogin(getSavedClientId());
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] text-[#111111] font-mono text-xs font-bold border border-[#111111] hover:bg-[#FFFF00] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>REFRESH PERMISSIONS & RE-LOGIN NOW</span>
                </button>
              )}
            </div>
          )}

          {successUrl ? (
            <div className="border-4 border-[#111111] bg-[#FFFF00] p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-[#111111] text-[#FFFF00] rounded-full mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111111]">PLAYLIST CREATED!</h3>
              <p className="text-xs text-[#111111] max-w-sm mx-auto font-medium">
                "{customName}" is now available in your Spotify library with {selectedCount} tracks.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#111111] bg-[#111111] text-[#FFFFFF] font-mono text-xs font-bold hover:bg-[#0000FF] transition-colors"
                >
                  <span>OPEN ON SPOTIFY</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setSuccessUrl(null);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border-2 border-[#111111] bg-[#FFFFFF] text-[#111111] font-mono text-xs font-bold hover:bg-[#FF0000] hover:text-[#FFFFFF]"
                >
                  DONE
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Preset Selector */}
              <div>
                <label className="font-mono text-xs font-bold uppercase text-[#808080] block mb-2">
                  Select Playlist Preset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPlaylistType('top50');
                      setCustomName(`STATIFY - Top Tracks [${stats.dateRangeLabel}]`);
                    }}
                    className={`p-3 border-2 border-[#111111] text-left transition-colors cursor-pointer ${
                      playlistType === 'top50'
                        ? 'bg-[#111111] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-[#FFFF00] mb-1.5" />
                    <p className="font-bold text-xs">Top Tracks</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Top 50 songs of this period</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlaylistType('deep_cuts');
                      setCustomName(`STATIFY - Deep Cuts & Hidden Gems`);
                    }}
                    className={`p-3 border-2 border-[#111111] text-left transition-colors cursor-pointer ${
                      playlistType === 'deep_cuts'
                        ? 'bg-[#111111] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                    }`}
                  >
                    <Disc3 className="w-4 h-4 text-[#0000FF] mb-1.5" />
                    <p className="font-bold text-xs">Deep Cuts</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Lowest popularity gems</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlaylistType('night_owl');
                      setCustomName(`STATIFY - Late Night Queue`);
                    }}
                    className={`p-3 border-2 border-[#111111] text-left transition-colors cursor-pointer ${
                      playlistType === 'night_owl'
                        ? 'bg-[#111111] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-[#FF0000] mb-1.5" />
                    <p className="font-bold text-xs">Late Night</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Mellow loops for dark hours</p>
                  </button>
                </div>
              </div>

              {/* Custom Playlist Name */}
              <div>
                <label className="font-mono text-xs font-bold uppercase text-[#808080] block mb-1.5">
                  Playlist Title:
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full border-2 border-[#111111] px-3.5 py-2 font-mono text-xs font-bold text-[#111111] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0000FF]"
                />
              </div>

              {/* Preview List */}
              <div className="border-2 border-[#111111] p-3 bg-[#F7F7F7]">
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#808080] mb-2 pb-1.5 border-b border-[#111111]">
                  <span>INCLUDED TRACKS ({selectedCount})</span>
                  <span>EST. RUNTIME: {Math.round(selectedCount * 3.4)} MIN</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {getSelectedTracks().slice(0, 15).map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="flex items-center justify-between text-xs font-medium text-[#111111] gap-2"
                    >
                      <span className="truncate">
                        <span className="font-mono text-[#808080] mr-2">#{idx + 1}</span>
                        {t.name} • <span className="text-[#808080]">{t.artist}</span>
                      </span>
                      {t.popularity !== undefined && (
                        <span className="font-mono text-[10px] px-1 bg-[#FFFFFF] border border-[#111111] shrink-0">
                          {t.popularity}% POP
                        </span>
                      )}
                    </div>
                  ))}
                  {selectedCount > 15 && (
                    <p className="font-mono text-[11px] text-[#808080] pt-1 text-center">
                      + {selectedCount - 15} more tracks
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!successUrl && (
          <div className="border-t-4 border-[#111111] bg-[#FFFFFF] px-4 sm:px-5 py-3 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <span className="font-mono text-[11px] text-[#808080] text-center sm:text-left">
              Direct 1-click sync to your Spotify account
            </span>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border-2 border-[#111111] bg-[#0000FF] hover:bg-[#111111] text-[#FFFFFF] font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CREATING...</span>
                </>
              ) : (
                <>
                  <ListPlus className="w-4 h-4 text-[#FFFF00]" />
                  <span>SAVE TO SPOTIFY</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
