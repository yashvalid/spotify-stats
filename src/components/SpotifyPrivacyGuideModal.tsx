import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Mail,
  FileArchive,
  Clock,
  CheckCircle2,
  KeyRound,
  Download,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotifyPrivacyGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '01',
      title: 'Open Privacy Settings',
      icon: KeyRound,
      desc: 'Log in to Spotify Account and open Privacy Settings.',
      detail: 'spotify.com/account/privacy',
      actionUrl: 'https://www.spotify.com/account/privacy',
      actionLabel: 'OPEN SPOTIFY ↗',
      headerBg: 'bg-[#FFFF00]',
      textColor: 'text-[#111111]',
    },
    {
      step: '02',
      title: 'Request "Download Your Data"',
      icon: Download,
      desc: 'Scroll down to "Download your data" section.',
      detail:
        '• Account Data: Last 1 year (ready in 2–5 days)\n• Extended History: Lifetime history since day 1 (~10–30 days)',
      badge: 'RECOMMENDED',
      headerBg: 'bg-[#0000FF]',
      textColor: 'text-[#FFFFFF]',
    },
    {
      step: '03',
      title: 'Confirm Verification Email',
      icon: Mail,
      desc: 'Spotify sends a verification email to your address.',
      detail: 'Crucial: Click "Confirm" in the email within 3 days or Spotify cancels it.',
      badge: 'CRITICAL STEP',
      headerBg: 'bg-[#FF0000]',
      textColor: 'text-[#FFFFFF]',
    },
    {
      step: '04',
      title: 'Download & Drop .ZIP Here',
      icon: FileArchive,
      desc: 'When ready, download the .zip file from Spotify.',
      detail: 'No unzipping needed! Drop the whole .zip directly into Statify.',
      badge: '100% PRIVATE',
      headerBg: 'bg-[#111111]',
      textColor: 'text-[#FFFFFF]',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center bg-[#111111]/80 p-3 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border-4 border-[#111111] bg-[#FFFFFF] shadow-2xl overflow-hidden animate-destijl-enter">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between border-b-4 border-[#111111] bg-[#FFFF00] px-4 sm:px-6 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#FF0000] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-[#111111] uppercase tracking-tight">
              How to Get Spotify Privacy Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] p-1.5 text-[#111111] hover:bg-[#FF0000] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer shrink-0"
            aria-label="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Intro Notice Banner */}
          <div className="border-2 border-[#111111] bg-[#F7F7F7] p-3 text-xs font-mono text-[#111111] flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#FF0000] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Spotify lets you export your official raw stream history. Importing it unlocks
              <strong> 100% exact minutes</strong>, accurate song play counts, and full calendar heatmaps.
            </p>
          </div>

          {/* 4 Steps in Compact De Stijl Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {steps.map((s) => (
              <div
                key={s.step}
                className="border-2 border-[#111111] bg-[#FFFFFF] flex flex-col justify-between"
              >
                {/* Step header bar */}
                <div className={`p-2.5 border-b-2 border-[#111111] flex items-center justify-between ${s.headerBg} ${s.textColor}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 border border-[#111111] bg-[#111111] text-[#FFFFFF]">
                      {s.step}
                    </span>
                    <span className="text-xs font-bold truncate">{s.title}</span>
                  </div>
                  {s.badge && (
                    <span className="font-mono text-[9px] font-bold px-1 py-0.5 bg-[#FFFFFF] text-[#111111] border border-[#111111] shrink-0">
                      {s.badge}
                    </span>
                  )}
                </div>

                {/* Step Content */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                  <p className="text-xs text-[#111111] font-medium leading-snug">
                    {s.desc}
                  </p>

                  {s.detail && (
                    <div className="p-2 bg-[#F7F7F7] border border-[#111111] text-[11px] font-mono text-[#555555] whitespace-pre-line leading-relaxed">
                      {s.detail}
                    </div>
                  )}

                  {s.actionUrl && (
                    <a
                      href={s.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded border-2 border-[#111111] bg-[#FFFF00] text-[#111111] font-mono text-xs font-bold hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors"
                    >
                      <span>{s.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t-4 border-[#111111] bg-[#FFFFFF] px-4 sm:px-6 py-3 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-[#808080]">
            <CheckCircle2 className="w-4 h-4 text-[#0000FF] shrink-0" />
            <span className="text-[11px]">Parsed 100% locally in your browser • Zero server uploads</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg border-2 border-[#111111] bg-[#111111] text-[#FFFFFF] font-bold text-xs hover:bg-[#FF0000] transition-colors cursor-pointer shrink-0"
          >
            GOT IT, CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
