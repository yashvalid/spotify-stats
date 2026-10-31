import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { ListeningStats } from '../types';

interface Props {
  stats: ListeningStats;
}

export const FriendBlendModal: React.FC<Props & { isOpen: boolean; onClose: () => void }> = ({
  stats,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Create a base64 encoded compact taste profile for sharing
  const tasteProfile = {
    u: stats.userName,
    a: stats.topArtists.slice(0, 5).map((a) => a.name),
    g: stats.topGenres.slice(0, 3).map((g) => g.name),
    v: stats.vibe.personaTitle,
    m: stats.totalMinutes,
  };

  const shareText = `🎵 STATIFY TASTE CARD for ${stats.userName}
Top Artists: ${tasteProfile.a.slice(0, 3).join(', ')}
Genre DNA: ${tasteProfile.g.join(' • ')}
Sonic Persona: ${tasteProfile.v}
Compare your Spotify taste with mine at ${window.location.origin}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center bg-[#111111]/80 p-3 sm:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg border-4 border-[#111111] bg-[#FFFFFF] shadow-2xl overflow-hidden animate-fade-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-[#111111] bg-[#FFFF00] px-4 sm:px-5 py-3.5 sm:py-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Users className="w-5 h-5 text-[#FF0000] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#111111] truncate">
              Friend Taste Compatibility & Blend
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
          {/* Card Preview */}
          <div className="border-4 border-[#111111] bg-[#FFFFFF]">
            <div className="p-3.5 sm:p-4 bg-[#FF0000] text-[#FFFFFF] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#FFFF00] block truncate">
                  [STATIFY COMPATIBILITY CARD]
                </span>
                <h3 className="text-lg sm:text-xl font-bold truncate">{stats.userName}</h3>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-1 bg-[#111111] text-[#FFFFFF] shrink-0">
                {stats.totalMinutes.toLocaleString()} MIN
              </span>
            </div>

            <div className="p-3.5 sm:p-4 space-y-3 bg-[#FFFFFF]">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#808080] uppercase">
                  TOP 3 ARTISTS:
                </span>
                <p className="font-bold text-sm text-[#111111] break-words">
                  {stats.topArtists.slice(0, 3).map((a) => a.name).join(' • ')}
                </p>
              </div>

              <div className="border-t border-[#111111] pt-2">
                <span className="font-mono text-[11px] font-bold text-[#808080] uppercase">
                  SONIC AURA:
                </span>
                <p className="font-bold text-sm text-[#0000FF] break-words">{stats.vibe.personaTitle}</p>
              </div>

              <div className="border-t border-[#111111] pt-2">
                <span className="font-mono text-[11px] font-bold text-[#808080] uppercase">
                  PRIMARY GENRES:
                </span>
                <p className="font-mono text-xs text-[#111111] break-words">
                  {stats.topGenres.slice(0, 3).map((g) => g.name).join(', ')}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FFFF00] border-t-2 border-[#111111] flex flex-wrap items-center justify-between gap-1 font-mono text-xs font-bold text-[#111111]">
              <span>CALCULATE OUR TASTE OVERLAP %</span>
              <span>STATIFY 1917</span>
            </div>
          </div>

          <p className="text-xs text-[#808080] font-medium leading-relaxed">
            Send this taste card to a friend on Discord, Instagram DM, or WhatsApp to see which artists you both replay and who has the more chaotic music taste.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t-4 border-[#111111] bg-[#FFFFFF] px-4 sm:px-5 py-3 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border-2 border-[#111111] text-xs font-bold hover:bg-[#F7F7F7] cursor-pointer"
          >
            CLOSE
          </button>
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border-2 border-[#111111] bg-[#FF0000] hover:bg-[#111111] text-[#FFFFFF] font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>COPY TASTE CARD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
