import React from 'react';
import {
  Gem,
  Flame,
} from 'lucide-react';
import { ListeningStats } from '../types';

interface Props {
  stats: ListeningStats;
}

export const ObscurityIndex: React.FC<Props> = ({ stats }) => {
  // Compute obscurity metric from track popularity
  // Spotify popularity ranges from 0 (very underground) to 100 (global smash hit)
  const tracksWithPop = stats.topTracks.filter((t) => t.popularity !== undefined);

  const avgPop =
    tracksWithPop.length > 0
      ? Math.round(
          tracksWithPop.reduce((acc, t) => acc + (t.popularity || 0), 0) /
            tracksWithPop.length
        )
      : 58;

  // Obscurity score is invert of popularity: 0 = hyper mainstream, 100 = deep underground
  const obscurityScore = Math.max(5, Math.min(95, 100 - avgPop));

  // Find most underground hidden gem (lowest popularity)
  const hiddenGems = [...stats.topTracks]
    .filter((t) => t.popularity !== undefined)
    .sort((a, b) => (a.popularity || 0) - (b.popularity || 0));

  const mostUndergroundTrack = hiddenGems[0] || stats.topTracks[stats.topTracks.length - 1];

  // Find most mainstream hit (highest popularity)
  const mainstreamHits = [...stats.topTracks]
    .filter((t) => t.popularity !== undefined)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const guiltiestHit = mainstreamHits[0] || stats.topTracks[0];

  const getTier = (score: number) => {
    if (score >= 75) {
      return {
        title: 'Indie & Underground Fan',
        desc: 'You mostly listen to indie and lesser-known tracks rather than mainstream chart hits.',
        badgeBg: 'bg-[#0000FF] text-[#FFFFFF]',
      };
    }
    if (score >= 45) {
      return {
        title: 'Balanced Taste',
        desc: 'A healthy mix of popular hits and lesser-known tracks.',
        badgeBg: 'bg-[#FFFF00] text-[#111111]',
      };
    }
    return {
      title: 'Top 40 & Hit Lover',
      desc: 'You love worldwide chart-toppers, radio hits, and trending songs.',
      badgeBg: 'bg-[#FF0000] text-[#FFFFFF]',
    };
  };

  const tier = getTier(obscurityScore);

  return (
    <div className="border-4 border-[#111111] bg-[#FFFFFF] animate-fade-enter">
      {/* Header bar */}
      <div className="p-4 sm:p-6 bg-[#FFFF00] border-b-4 border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#111111]">
            <Gem className="w-4 h-4 text-[#FF0000] shrink-0" />
            <span>UNDERGROUND METER</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#111111] mt-1 break-words">
            How Underground Is Your Taste?
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 border-2 border-[#111111] text-center max-w-full break-words ${tier.badgeBg}`}>
            {tier.title.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y-4 md:divide-y-0 md:divide-x-4 divide-[#111111]">
        {/* Score gauge (4 cols) */}
        <div className="md:col-span-4 p-4 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs font-bold uppercase text-[#808080] block">
              UNDERGROUND SCORE
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-bold font-mono text-[#111111]">
                {obscurityScore}
              </span>
              <span className="font-mono text-base sm:text-lg text-[#808080]">/ 100</span>
            </div>
          </div>

          <div className="my-5 sm:my-6">
            <div className="h-5 w-full border-2 border-[#111111] bg-[#FFFFFF] relative">
              <div
                style={{ width: `${obscurityScore}%` }}
                className="h-full bg-[#0000FF]"
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[#808080] mt-1.5 font-bold">
              <span>0% MAINSTREAM</span>
              <span>100% UNDERGROUND</span>
            </div>
          </div>

          <p className="text-xs text-[#111111] font-medium leading-relaxed border-t-2 border-[#111111] pt-3 break-words">
            {tier.desc}
          </p>
        </div>

        {/* Most Underground Track (4 cols) */}
        <div className="md:col-span-4 p-4 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111]">
              <span className="font-mono text-xs font-bold uppercase text-[#0000FF] flex items-center gap-1.5 truncate pr-2">
                <Gem className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">#1 DEEP CUT</span>
              </span>
              {mostUndergroundTrack?.popularity !== undefined && (
                <span className="font-mono text-xs font-bold px-1.5 bg-[#111111] text-[#FFFF00] shrink-0">
                  {mostUndergroundTrack.popularity}% POP
                </span>
              )}
            </div>

            {mostUndergroundTrack && (
              <div className="my-3 sm:my-4 flex items-center gap-3 sm:gap-3.5">
                <img
                  src={mostUndergroundTrack.coverUrl}
                  alt={mostUndergroundTrack.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover border-2 border-[#111111] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[#111111] truncate">
                    {mostUndergroundTrack.name}
                  </h4>
                  <p className="text-xs text-[#808080] truncate mt-0.5">
                    {mostUndergroundTrack.artist}
                  </p>
                  <p className="font-mono text-[11px] text-[#0000FF] font-bold mt-1 truncate">
                    {stats.sourceMode === 'history'
                      ? `${mostUndergroundTrack.minutes.toLocaleString()} MIN PLAYED`
                      : `${mostUndergroundTrack.popularity ?? 0}% POPULARITY`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-[#808080] font-mono border-t border-[#111111] pt-3">
            Your most-played song that has the lowest worldwide popularity score.
          </p>
        </div>

        {/* Guiltiest Pleasure / Global Hit (4 cols) */}
        <div className="md:col-span-4 p-4 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111]">
              <span className="font-mono text-xs font-bold uppercase text-[#FF0000] flex items-center gap-1.5 truncate pr-2">
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">#1 CHART HIT</span>
              </span>
              {guiltiestHit?.popularity !== undefined && (
                <span className="font-mono text-xs font-bold px-1.5 bg-[#FF0000] text-[#FFFFFF] shrink-0">
                  {guiltiestHit.popularity}% POP
                </span>
              )}
            </div>

            {guiltiestHit && (
              <div className="my-3 sm:my-4 flex items-center gap-3 sm:gap-3.5">
                <img
                  src={guiltiestHit.coverUrl}
                  alt={guiltiestHit.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover border-2 border-[#111111] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[#111111] truncate">
                    {guiltiestHit.name}
                  </h4>
                  <p className="text-xs text-[#808080] truncate mt-0.5">
                    {guiltiestHit.artist}
                  </p>
                  <p className="font-mono text-[11px] text-[#FF0000] font-bold mt-1 truncate">
                    {stats.sourceMode === 'history'
                      ? `${guiltiestHit.minutes.toLocaleString()} MIN PLAYED`
                      : `${guiltiestHit.popularity ?? 0}% POPULARITY`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-[#808080] font-mono border-t border-[#111111] pt-3">
            Your most-played song that is also a global chart hit with millions of streams.
          </p>
        </div>
      </div>
    </div>
  );
};
