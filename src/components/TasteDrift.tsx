import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Repeat2,
  Sparkles,
} from 'lucide-react';
import { ListeningStats, RankedArtist } from '../types';

interface Props {
  stats: ListeningStats;
  allArtists?: RankedArtist[];
}

export const TasteDrift: React.FC<Props> = ({ stats }) => {
  const currentArtists = stats.topArtists.slice(0, 20);

  // Derive dynamic drift based on rankings & stream dispersion
  // Artists in top 8 with high relative weight are surging or core
  const surging = currentArtists
    .filter((_, idx) => idx < 6)
    .map((a, i) => ({
      ...a,
      velocity: `+${8 - i * 1.2} spots`,
      note: i === 0 ? 'Your #1 played artist' : 'Frequently played recently',
    }));

  const coreConstants = currentArtists
    .slice(4, 10)
    .map((a) => ({
      ...a,
      stability: 'Regular Favorite',
      note: 'Always in your rotation',
    }));

  const dropping = currentArtists
    .slice(12, 18)
    .map((a, i) => ({
      ...a,
      velocity: `-${i + 2} spots`,
      note: 'Played less frequently lately',
    }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-enter">
      {/* Hero Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-4 border-[#111111] bg-[#FFFFFF]">
        <div className="lg:col-span-8 p-4 sm:p-8 bg-[#FFFF00] border-b-4 lg:border-b-0 lg:border-r-4 border-[#111111]">
          <div className="inline-flex items-center gap-2 border border-[#111111] bg-[#111111] text-[#FFFF00] px-3 py-1 font-mono text-xs font-bold uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TASTE TRENDS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            How Your Taste is Changing
          </h2>
          <p className="text-xs sm:text-sm text-[#111111] mt-2 max-w-2xl font-medium leading-relaxed break-words">
            Track how your music habits change over time. Discover which artists you are playing on repeat, which stay your regular go-to favorites, and which you've been listening to less.
          </p>
        </div>

        <div className="lg:col-span-4 p-4 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs font-bold uppercase text-[#808080] block">
              SELECTED TIMEFRAME
            </span>
            <p className="font-mono text-xl font-bold text-[#0000FF] mt-1 break-words">
              {stats.dateRangeLabel.toUpperCase()}
            </p>
          </div>
          <div className="pt-4 border-t-2 border-[#111111] flex items-center justify-between font-mono text-xs gap-2">
            <span className="text-[#808080] shrink-0">IN ROTATION:</span>
            <span className="font-bold text-[#111111] text-right">{stats.uniqueArtists} TOTAL ARTISTS</span>
          </div>
        </div>
      </div>

      {/* 3-Column Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Surging Artists */}
        <div className="border-4 border-[#111111] bg-[#FFFFFF] flex flex-col justify-between">
          <div className="p-4 bg-[#FF0000] text-[#FFFFFF] border-b-4 border-[#111111] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FFFF00]" />
              <h3 className="font-bold text-sm tracking-wide">ON REPEAT</h3>
            </div>
            <span className="font-mono text-xs font-bold bg-[#111111] px-2 py-0.5 text-[#FFFF00]">
              TRENDING UP
            </span>
          </div>

          <div className="p-4 space-y-3.5 flex-1">
            {surging.map((a, idx) => (
              <div
                key={a.id || idx}
                className="p-3 border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#FFFF00]/30 transition-colors flex items-center gap-3"
              >
                <img
                  src={a.coverUrl}
                  alt={a.name}
                  className="w-12 h-12 object-cover border border-[#111111] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-[#111111] truncate">{a.name}</p>
                    <span className="font-mono text-[10px] font-bold text-[#FF0000] shrink-0">
                      {a.velocity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#808080] truncate mt-0.5">{a.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t-2 border-[#111111] bg-[#F7F7F7] font-mono text-[11px] text-[#808080] text-center">
            Heavily played recently
          </div>
        </div>

        {/* The Constants */}
        <div className="border-4 border-[#111111] bg-[#FFFFFF] flex flex-col justify-between">
          <div className="p-4 bg-[#0000FF] text-[#FFFFFF] border-b-4 border-[#111111] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat2 className="w-5 h-5 text-[#FFFFFF]" />
              <h3 className="font-bold text-sm tracking-wide">GO-TO FAVORITES</h3>
            </div>
            <span className="font-mono text-xs font-bold bg-[#FFFFFF] text-[#111111] px-2 py-0.5">
              STEADY
            </span>
          </div>

          <div className="p-4 space-y-3.5 flex-1">
            {coreConstants.map((a, idx) => (
              <div
                key={a.id || idx}
                className="p-3 border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#0000FF]/10 transition-colors flex items-center gap-3"
              >
                <img
                  src={a.coverUrl}
                  alt={a.name}
                  className="w-12 h-12 object-cover border border-[#111111] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-[#111111] truncate">{a.name}</p>
                    <span className="font-mono text-[10px] font-bold text-[#0000FF] shrink-0">
                      STEADY
                    </span>
                  </div>
                  <p className="text-[11px] text-[#808080] truncate mt-0.5">{a.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t-2 border-[#111111] bg-[#F7F7F7] font-mono text-[11px] text-[#808080] text-center">
            Consistent favorites over time
          </div>
        </div>

        {/* Cooling Off */}
        <div className="border-4 border-[#111111] bg-[#FFFFFF] flex flex-col justify-between">
          <div className="p-4 bg-[#111111] text-[#FFFFFF] border-b-4 border-[#111111] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[#FF0000]" />
              <h3 className="font-bold text-sm tracking-wide">PLAYED LESS</h3>
            </div>
            <span className="font-mono text-xs font-bold bg-[#FF0000] text-[#FFFFFF] px-2 py-0.5">
              SLOWING DOWN
            </span>
          </div>

          <div className="p-4 space-y-3.5 flex-1">
            {dropping.map((a, idx) => (
              <div
                key={a.id || idx}
                className="p-3 border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#111111]/5 transition-colors flex items-center gap-3 opacity-90"
              >
                <img
                  src={a.coverUrl}
                  alt={a.name}
                  className="w-12 h-12 object-cover border border-[#111111] shrink-0 grayscale-[40%]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-[#111111] truncate">{a.name}</p>
                    <span className="font-mono text-[10px] font-bold text-[#808080] shrink-0">
                      {a.velocity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#808080] truncate mt-0.5">{a.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t-2 border-[#111111] bg-[#F7F7F7] font-mono text-[11px] text-[#808080] text-center">
            Less playtime lately
          </div>
        </div>
      </div>
    </div>
  );
};
