import React, { useState } from 'react';
import { Download, Sparkles, X, Smartphone, Square, Receipt } from 'lucide-react';
import { ListeningStats } from '../types';

interface Props {
  stats: ListeningStats;
  onClose: () => void;
}

type CardTheme = 'mondrian' | 'red_ochre' | 'cobalt' | 'monolith';
type CardFormat = 'story' | 'square' | 'receipt';

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
  const [format, setFormat] = useState<CardFormat>('story');
  const [downloading, setDownloading] = useState(false);

  const currentTheme = THEMES[theme];

  const handleDownloadPng = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (format === 'story') {
        // 9:16 Instagram Story (1080 x 1920)
        canvas.width = 1080;
        canvas.height = 1920;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1080, 1920);

        // Header block
        ctx.fillStyle = currentTheme.accentHex;
        ctx.fillRect(40, 40, 1000, 240);

        // Grid lines
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 10;
        ctx.strokeRect(40, 40, 1000, 1840);

        // Header text
        ctx.fillStyle = currentTheme.accentHex === '#FFFF00' ? '#111111' : '#FFFFFF';
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText('[STATIFY - INSTAGRAM STORY EDITION]', 80, 100);

        ctx.font = 'bold 64px Helvetica, Arial, sans-serif';
        ctx.fillText(stats.userName.slice(0, 22), 80, 180);

        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillText(stats.dateRangeLabel.toUpperCase(), 80, 240);

        // Blue Minutes Section
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(40, 280, 1000, 260);
        ctx.strokeRect(40, 280, 1000, 260);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText('[01] MINUTES LISTENED', 80, 340);
        ctx.font = 'bold 96px Helvetica, Arial, sans-serif';
        ctx.fillText(stats.totalMinutes.toLocaleString(), 80, 445);
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText(`${stats.totalHours.toLocaleString()} HOURS  •  ${stats.totalPlays.toLocaleString()} STREAMS`, 80, 500);

        // Yellow Persona Section
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(40, 540, 1000, 200);
        ctx.strokeRect(40, 540, 1000, 200);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('[02] SONIC RATIO & AURA', 80, 600);
        ctx.font = 'bold 50px Helvetica, Arial, sans-serif';
        ctx.fillText(stats.vibe.personaTitle, 80, 670);

        // Top 5 Tracks Section
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(40, 740, 1000, 500);
        ctx.strokeRect(40, 740, 1000, 500);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText('[TOP TRACKS]', 80, 800);

        let trackY = 860;
        stats.topTracks.slice(0, 5).forEach((t, i) => {
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 28px Helvetica, Arial, sans-serif';
          ctx.fillText(`0${i + 1}. ${t.name.slice(0, 32)}`, 80, trackY);
          ctx.font = '400 22px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#808080';
          ctx.fillText(t.artist.slice(0, 36), 130, trackY + 30);
          trackY += 75;
        });

        // Top 5 Artists Section
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(40, 1240, 1000, 480);
        ctx.strokeRect(40, 1240, 1000, 480);

        ctx.fillStyle = '#0000FF';
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText('[TOP ARTISTS]', 80, 1300);

        let artistY = 1360;
        stats.topArtists.slice(0, 5).forEach((a, i) => {
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 28px Helvetica, Arial, sans-serif';
          ctx.fillText(`0${i + 1}. ${a.name.slice(0, 32)}`, 80, artistY);
          ctx.font = 'bold 22px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FF0000';
          ctx.fillText(`${a.minutes.toLocaleString()} MIN`, 800, artistY);
          artistY += 70;
        });

        // Footer Bar
        ctx.fillStyle = '#111111';
        ctx.fillRect(40, 1720, 1000, 160);
        ctx.strokeRect(40, 1720, 1000, 160);

        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 28px "JetBrains Mono", monospace';
        ctx.fillText('STATIFY // ARCHITECTURE', 80, 1810);
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`MADE WITH ♥ BY YASH`, 740, 1810);
      } else if (format === 'receipt') {
        // Receipt Format (800 x 1400)
        canvas.width = 800;
        canvas.height = 1400;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 800, 1400);

        // Dashed receipt border
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, 740, 1340);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 36px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STATIFY RECEIPT', 400, 100);
        ctx.font = '400 18px "JetBrains Mono", monospace';
        ctx.fillText(`ORDER #${Math.floor(100000 + Math.random() * 900000)} FOR ${stats.userName.toUpperCase()}`, 400, 140);
        ctx.fillText(`PERIOD: ${stats.dateRangeLabel.toUpperCase()}`, 400, 170);

        ctx.beginPath();
        ctx.setLineDash([8, 6]);
        ctx.moveTo(60, 200);
        ctx.lineTo(740, 200);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textAlign = 'left';
        ctx.font = 'bold 18px "JetBrains Mono", monospace';
        ctx.fillText('QTY   ITEM', 60, 240);
        ctx.textAlign = 'right';
        ctx.fillText('AMT', 740, 240);

        let itemY = 280;
        stats.topTracks.slice(0, 10).forEach((t, i) => {
          ctx.textAlign = 'left';
          ctx.font = 'bold 16px "JetBrains Mono", monospace';
          ctx.fillText(`0${i + 1}    ${t.name.slice(0, 24)}`, 60, itemY);
          ctx.font = '400 14px "JetBrains Mono", monospace';
          ctx.fillText(`      ${t.artist.slice(0, 24)}`, 60, itemY + 22);

          ctx.textAlign = 'right';
          ctx.font = 'bold 16px "JetBrains Mono", monospace';
          ctx.fillText(`${t.minutes}M`, 740, itemY);
          itemY += 56;
        });

        ctx.beginPath();
        ctx.setLineDash([8, 6]);
        ctx.moveTo(60, itemY + 10);
        ctx.lineTo(740, itemY + 10);
        ctx.stroke();
        ctx.setLineDash([]);

        itemY += 50;
        ctx.textAlign = 'left';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillText('TOTAL MINUTES LISTENED:', 60, itemY);
        ctx.textAlign = 'right';
        ctx.fillText(`${stats.totalMinutes.toLocaleString()} MIN`, 740, itemY);

        itemY += 36;
        ctx.textAlign = 'left';
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillText('TOTAL STREAMS COUNTED:', 60, itemY);
        ctx.textAlign = 'right';
        ctx.fillText(`${stats.totalPlays.toLocaleString()}`, 740, itemY);

        itemY += 36;
        ctx.textAlign = 'left';
        ctx.fillText('SONIC AURA RATING:', 60, itemY);
        ctx.textAlign = 'right';
        ctx.fillText(stats.vibe.personaTitle.slice(0, 18), 740, itemY);

        // Barcode at bottom
        itemY += 70;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "JetBrains Mono", monospace';
        ctx.fillText('||| | ||||| || |||| ||||| |||', 400, itemY);
        itemY += 40;
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillText('THANK YOU FOR LISTENING WITH STATIFY', 400, itemY);
      } else {
        // Standard 1080 x 1080 Square
        canvas.width = 1080;
        canvas.height = 1080;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1080, 1080);

        ctx.fillStyle = currentTheme.accentHex;
        ctx.fillRect(36, 36, 680, 180);

        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(716, 36, 328, 180);

        ctx.fillStyle = '#0000FF';
        ctx.fillRect(36, 216, 500, 200);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(536, 216, 508, 200);

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 10;
        ctx.strokeRect(36, 36, 1008, 1008);

        ctx.beginPath();
        ctx.moveTo(36, 216);
        ctx.lineTo(1044, 216);
        ctx.moveTo(716, 36);
        ctx.lineTo(716, 216);
        ctx.moveTo(36, 416);
        ctx.lineTo(1044, 416);
        ctx.moveTo(536, 216);
        ctx.lineTo(536, 416);
        ctx.moveTo(536, 416);
        ctx.lineTo(536, 920);
        ctx.moveTo(36, 920);
        ctx.lineTo(1044, 920);
        ctx.stroke();

        ctx.fillStyle = currentTheme.accentHex === '#FFFF00' ? '#111111' : '#FFFFFF';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('[STATIFY - FEED 1:1]', 72, 85);
        ctx.font = 'bold 54px Helvetica, Arial, sans-serif';
        ctx.fillText(stats.userName.slice(0, 18), 72, 155);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('[MINUTES]', 72, 270);
        ctx.font = 'bold 74px Helvetica, Arial, sans-serif';
        ctx.fillText(stats.totalMinutes.toLocaleString(), 72, 360);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('[TOP SONGS]', 72, 465);

        let tY = 520;
        stats.topTracks.slice(0, 4).forEach((t, i) => {
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
          ctx.fillText(`0${i + 1}. ${t.name.slice(0, 22)}`, 72, tY);
          tY += 56;
        });

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('[TOP ARTISTS]', 572, 465);

        let aY = 520;
        stats.topArtists.slice(0, 4).forEach((a, i) => {
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
          ctx.fillText(`0${i + 1}. ${a.name.slice(0, 20)}`, 572, aY);
          aY += 56;
        });

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillText(`STATIFY  •  MADE WITH ♥ BY YASH`, 72, 975);
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `statify-${format}-${stats.timeRange}.png`;
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
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border-4 border-[#111111] bg-[#FFFFFF] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-[#111111] px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-[#FFFF00]">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <Sparkles className="w-5 h-5 text-[#FF0000] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-[#111111] uppercase tracking-tight truncate">
              Export Social Card & Story
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] p-1.5 text-[#111111] hover:bg-[#FF0000] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-5">
          {/* Format Selector */}
          <div>
            <span className="font-mono text-xs font-bold uppercase text-[#808080] block mb-2">
              FORMAT PRESET:
            </span>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('story')}
                className={`p-2.5 sm:p-3 border-2 border-[#111111] text-center font-mono text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  format === 'story'
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#FF0000]" />
                <span>STORY 9:16</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('square')}
                className={`p-2.5 sm:p-3 border-2 border-[#111111] text-center font-mono text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  format === 'square'
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                }`}
              >
                <Square className="w-4 h-4 text-[#0000FF]" />
                <span>FEED 1:1</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('receipt')}
                className={`p-2.5 sm:p-3 border-2 border-[#111111] text-center font-mono text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  format === 'receipt'
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                }`}
              >
                <Receipt className="w-4 h-4 text-[#FFFF00]" />
                <span>RECEIPT</span>
              </button>
            </div>
          </div>

          {/* Theme Selector (for story & square) */}
          {format !== 'receipt' && (
            <div>
              <span className="font-mono text-xs font-bold uppercase text-[#808080] block mb-2">
                COLOR PALETTE:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(THEMES) as CardTheme[]).map((tKey) => (
                  <button
                    key={tKey}
                    onClick={() => setTheme(tKey)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors border-2 border-[#111111] cursor-pointer ${
                      theme === tKey
                        ? 'bg-[#111111] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
                    }`}
                  >
                    {THEMES[tKey].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="border-4 border-[#111111] bg-[#FFFFFF] p-3.5 sm:p-4 text-center">
            <span className="font-mono text-xs font-bold text-[#808080] block mb-2">
              PREVIEW READY FOR {format.toUpperCase()} EXPORT
            </span>
            <div className="border-2 border-[#111111] p-3.5 sm:p-4 max-w-sm mx-auto bg-[#F7F7F7] space-y-2 font-mono text-xs text-left">
              <div className="flex justify-between font-bold text-[#111111]">
                <span className="truncate pr-2">{stats.userName}</span>
                <span className="text-[#FF0000] shrink-0">{stats.totalMinutes.toLocaleString()} MIN</span>
              </div>
              <div className="text-[11px] text-[#808080] break-words">
                Top Artist: {stats.topArtists[0]?.name || 'Artist'} • Aura: {stats.vibe.personaTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-4 border-[#111111] px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 bg-[#FFFFFF]">
          <span className="font-mono text-xs text-[#808080] text-center sm:text-left">
            Exported as lossless PNG
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-lg border-2 border-[#808080] px-3 sm:px-4 py-2 text-xs font-bold text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] cursor-pointer"
            >
              CLOSE
            </button>
            <button
              onClick={handleDownloadPng}
              disabled={downloading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#111111] bg-[#FF0000] hover:bg-[#111111] px-4 sm:px-5 py-2 text-xs font-bold text-[#FFFFFF] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">{downloading ? 'RENDERING...' : `DOWNLOAD ${format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
