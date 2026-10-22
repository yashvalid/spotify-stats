import React, { useState } from 'react';
import { Download, Sparkles, X, Disc3, Flame, Clock } from 'lucide-react';
import { ListeningStats } from '../types';

interface Props {
  stats: ListeningStats;
  onClose: () => void;
}

type CardTheme = 'mondrian' | 'red_ochre' | 'cobalt' | 'monolith';

const THEMES: Record<
  CardTheme,
  {
    label: string;
    headerBg: string;
    headerText: string;
    accentHex: string;
    secondaryHex: string;
  }
> = {
  mondrian: {
    label: 'Utrecht 1917 (Triad)',
    headerBg: 'bg-[#FF0000]',
    headerText: 'text-[#FFFFFF]',
    accentHex: '#FF0000',
    secondaryHex: '#0000FF',
  },
  red_ochre: {
    label: 'Primary Red',
    headerBg: 'bg-[#FF0000]',
    headerText: 'text-[#FFFFFF]',
    accentHex: '#FF0000',
    secondaryHex: '#FFFF00',
  },
  cobalt: {
    label: 'Primary Blue',
    headerBg: 'bg-[#0000FF]',
    headerText: 'text-[#FFFFFF]',
    accentHex: '#0000FF',
    secondaryHex: '#FFFF00',
  },
  monolith: {
    label: 'Neoplastic Yellow',
    headerBg: 'bg-[#FFFF00]',
    headerText: 'text-[#111111]',
    accentHex: '#FFFF00',
    secondaryHex: '#FF0000',
  },
};

export const WrappedCardModal: React.FC<Props> = ({ stats, onClose }) => {
  const [theme, setTheme] = useState<CardTheme>('mondrian');
  const [downloading, setDownloading] = useState(false);

  const currentTheme = THEMES[theme];

  const handleDownloadPng = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Flat White Base
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1080, 1350);

      // Top Left Primary Block
      ctx.fillStyle = currentTheme.accentHex;
      ctx.fillRect(36, 36, 700, 210);

      // Top Right Yellow Block
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(736, 36, 308, 210);

      // Middle Minutes Block (Asymmetric 620 / 388)
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(36, 246, 620, 220);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(656, 246, 388, 220);

      // Bottom Footer Block
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(36, 1180, 700, 134);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(736, 1180, 308, 134);

      // Structural Grid Lines
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 10;
      ctx.strokeRect(36, 36, 1008, 1278);

      ctx.beginPath();
      ctx.moveTo(36, 246);
      ctx.lineTo(1044, 246);
      ctx.moveTo(736, 36);
      ctx.lineTo(736, 246);
      ctx.moveTo(36, 466);
      ctx.lineTo(1044, 466);
      ctx.moveTo(656, 246);
      ctx.lineTo(656, 466);
      ctx.moveTo(540, 466);
      ctx.lineTo(540, 960);
      ctx.moveTo(36, 960);
      ctx.lineTo(1044, 960);
      ctx.moveTo(36, 1180);
      ctx.lineTo(1044, 1180);
      ctx.moveTo(736, 1180);
      ctx.lineTo(736, 1314);
      ctx.stroke();

      // Header Text
      ctx.fillStyle = currentTheme.accentHex === '#FFFF00' ? '#111111' : '#FFFFFF';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText('[STATIFY - DE STIJL EDITION]', 72, 92);

      ctx.font = 'bold 54px Helvetica, Arial, sans-serif';
      ctx.fillText(stats.userName.slice(0, 20), 72, 162);

      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(stats.dateRangeLabel.toUpperCase(), 72, 208);

      // Top Right Persona
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText('[SONIC RATIO]', 768, 92);
      ctx.font = 'bold 28px Helvetica, Arial, sans-serif';
      ctx.fillText(stats.vibe.personaTitle.slice(0, 16), 768, 148);
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(`${stats.totalPlays.toLocaleString()} STREAMS`, 768, 198);

      // Minutes Box (Blue)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText('[01] MINUTES LISTENED', 72, 298);
      ctx.font = 'bold 78px Helvetica, Arial, sans-serif';
      ctx.fillText(`${stats.totalMinutes.toLocaleString()}`, 72, 390);
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(`${stats.totalHours.toLocaleString()} HRS • ${stats.totalDaysEquivalent} DAYS`, 72, 434);

      // Streak Box (White)
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText('[02] PEAK STREAK', 690, 298);
      ctx.font = 'bold 68px Helvetica, Arial, sans-serif';
      ctx.fillText(`${stats.longestStreakDays}D`, 690, 385);
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText(`ACTIVE: ${stats.currentStreakDays} DAYS`, 690, 434);

      // Top Artists & Top Albums Columns
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('[03] TOP ARTISTS', 72, 520);
      ctx.fillStyle = '#0000FF';
      ctx.fillText('[04] TOP ALBUMS', 576, 520);

      stats.topArtists.slice(0, 5).forEach((ar, i) => {
        const y = 580 + i * 74;
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillText(`0${i + 1}`, 72, y);
        ctx.font = 'bold 26px Helvetica, Arial, sans-serif';
        ctx.fillText(ar.name.slice(0, 20), 124, y);
        ctx.fillStyle = '#808080';
        ctx.font = '500 19px "JetBrains Mono", monospace';
        ctx.fillText(`${ar.minutes.toLocaleString()} MIN`, 124, y + 26);
      });

      stats.topAlbums.slice(0, 5).forEach((al, i) => {
        const y = 580 + i * 74;
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillText(`0${i + 1}`, 576, y);
        ctx.font = 'bold 26px Helvetica, Arial, sans-serif';
        ctx.fillText(al.name.slice(0, 20), 628, y);
        ctx.fillStyle = '#808080';
        ctx.font = '500 19px "JetBrains Mono", monospace';
        ctx.fillText(`${al.artist.slice(0, 16)} • ${al.minutes}M`, 628, y + 26);
      });

      // Top Tracks Row
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText('[05] TOP TRACKS', 72, 1008);

      stats.topTracks.slice(0, 3).forEach((tr, i) => {
        const y = 1052 + i * 40;
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 23px Helvetica, Arial, sans-serif';
        ctx.fillText(`0${i + 1}  ${tr.name.slice(0, 32)} — ${tr.artist.slice(0, 20)}`, 72, y);
        ctx.font = 'bold 21px "JetBrains Mono", monospace';
        ctx.fillText(`${tr.minutes}M (${tr.plays}X)`, 830, y);
      });

      // Footer
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText(`GENRE: ${(stats.topGenres[0]?.name || 'ECLECTIC').toUpperCase()}`, 72, 1258);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('UTRECHT 1917', 772, 1258);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `statify-destijl-${stats.timeRange}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#111111]/80 p-3 sm:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border-2 border-[#111111] bg-[#FFFFFF] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-[#111111] px-6 py-4 shrink-0 bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#FF0000]" />
            <h2 className="text-lg font-bold text-[#111111]">
              De Stijl Listening Composition Poster
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#111111] p-1.5 text-[#111111] hover:bg-[#FF0000] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">

        {/* Theme Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="font-mono text-xs font-bold uppercase text-[#808080] mr-2">
            COMPOSITION:
          </span>
          {(Object.keys(THEMES) as CardTheme[]).map((tKey) => (
            <button
              key={tKey}
              onClick={() => setTheme(tKey)}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors duration-200 border-2 border-[#111111] cursor-pointer ${
                theme === tKey
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
              }`}
            >
              {THEMES[tKey].label}
            </button>
          ))}
        </div>

        {/* Live De Stijl Poster Preview */}
        <div className="border-4 border-[#111111] bg-[#FFFFFF]">
          {/* Header Split */}
          <div className="grid grid-cols-1 sm:grid-cols-12 border-b-4 border-[#111111]">
            <div className={`sm:col-span-8 p-5 ${currentTheme.headerBg} ${currentTheme.headerText} border-b-4 sm:border-b-0 sm:border-r-4 border-[#111111]`}>
              <p className="font-mono text-xs font-bold uppercase tracking-widest">
                [STATIFY - DE STIJL EDITION]
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1">{stats.userName}</h3>
              <p className="font-mono text-xs mt-1 opacity-90">{stats.dateRangeLabel}</p>
            </div>
            <div className="sm:col-span-4 p-5 bg-[#FFFF00] text-[#111111] flex flex-col justify-between">
              <span className="font-mono text-[11px] font-bold uppercase">[SONIC RATIO]</span>
              <p className="text-base font-bold leading-snug mt-1">{stats.vibe.personaTitle}</p>
              <span className="font-mono text-xs font-bold mt-2">
                {stats.totalPlays.toLocaleString()} STREAMS
              </span>
            </div>
          </div>

          {/* Asymmetric KPI Split (7 cols / 5 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 border-b-4 border-[#111111]">
            <div className="sm:col-span-7 p-5 bg-[#0000FF] text-[#FFFFFF] border-b-4 sm:border-b-0 sm:border-r-4 border-[#111111]">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>[01] MINUTES LISTENED</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold mt-1">
                {stats.totalMinutes.toLocaleString()}
              </p>
              <p className="font-mono text-xs mt-1">
                {stats.totalHours.toLocaleString()} HRS • {stats.totalDaysEquivalent} DAYS
              </p>
            </div>

            <div className="sm:col-span-5 p-5 bg-[#FFFFFF] text-[#111111]">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#FF0000]">
                <Flame className="w-3.5 h-3.5" />
                <span>[02] PEAK STREAK</span>
              </div>
              <p className="text-3xl font-bold mt-1">{stats.longestStreakDays} DAYS</p>
              <p className="font-mono text-xs text-[#808080] mt-1">
                ACTIVE: {stats.currentStreakDays} DAYS
              </p>
            </div>
          </div>

          {/* Top 5 Artists & Top 5 Albums */}
          <div className="grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-6 p-5 border-b-4 sm:border-b-0 sm:border-r-4 border-[#111111]">
              <h4 className="font-mono text-xs font-bold uppercase text-[#FF0000] mb-3">
                [03] TOP ARTISTS
              </h4>
              <div className="space-y-2">
                {stats.topArtists.slice(0, 5).map((ar, idx) => (
                  <div key={ar.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-[#111111] w-5">0{idx + 1}</span>
                      <span className="font-bold text-[#111111] truncate">{ar.name}</span>
                    </div>
                    <span className="font-mono text-[#808080] shrink-0">
                      {ar.minutes.toLocaleString()}m
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-6 p-5">
              <h4 className="font-mono text-xs font-bold uppercase text-[#0000FF] mb-3 flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5" />
                <span>[04] TOP ALBUMS</span>
              </h4>
              <div className="space-y-2">
                {stats.topAlbums.slice(0, 5).map((al, idx) => (
                  <div key={al.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-[#111111] w-5">0{idx + 1}</span>
                      <span className="font-bold text-[#111111] truncate">{al.name}</span>
                    </div>
                    <span className="font-mono text-[#808080] shrink-0">
                      {al.minutes.toLocaleString()}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="border-t-2 border-[#111111] px-6 py-4 flex items-center justify-end gap-3 shrink-0 bg-[#FFFFFF]">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-[#808080] px-4 py-2.5 text-xs font-bold text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
          >
            CLOSE
          </button>
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-[#111111] bg-[#FF0000] hover:bg-[#111111] px-5 py-2.5 text-xs font-bold text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'RENDERING...' : 'DOWNLOAD 1080x1350 POSTER'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
