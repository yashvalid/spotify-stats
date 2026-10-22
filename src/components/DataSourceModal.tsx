import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  CheckCircle2,
  Trash2,
  FileJson,
  Radio,
  HelpCircle,
} from 'lucide-react';
import { DataSourceMode } from '../types';
import {
  startSpotifyLogin,
  disconnectSpotify,
  getSavedClientId,
} from '../utils/spotifyAuth';
import { SpotifyPrivacyGuideModal } from './SpotifyPrivacyGuideModal';

interface Props {
  activeMode: DataSourceMode | null;
  hasUploadedHistory: boolean;
  uploadedRecordCount: number;
  isSpotifyConnected: boolean;
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  onClearHistory: () => Promise<void>;
  onSwitchToHistory: () => void;
  onSwitchToSpotifyApi: () => void;
  onDisconnectSpotify: () => void;
  onClose: () => void;
}

export const DataSourceModal: React.FC<Props> = ({
  activeMode,
  hasUploadedHistory,
  uploadedRecordCount,
  isSpotifyConnected,
  onUploadFiles,
  onClearHistory,
  onSwitchToHistory,
  onSwitchToSpotifyApi,
  onDisconnectSpotify,
  onClose,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      await onUploadFiles(files);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse streaming history files.');
    } finally {
      setUploading(false);
    }
  };

  const handleReconnect = async () => {
    try {
      await startSpotifyLogin(getSavedClientId());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Spotify login.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#111111]/80 p-3 sm:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg border-4 border-[#111111] bg-[#FFFFFF] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-[#111111] bg-[#FFFF00] px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-[#111111]">
            Data Source Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-[#111111] bg-[#FFFFFF] p-2 text-[#111111] hover:bg-[#FF0000] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="border-2 border-[#111111] bg-[#FF0000] p-4 text-xs font-bold text-[#FFFFFF]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Spotify Account Card */}
            <div
              className={`p-6 border-2 border-[#111111] flex flex-col justify-between ${
                activeMode === 'spotify_api' ? 'bg-[#FFFF00]/20 border-t-8 border-t-[#0000FF]' : 'bg-[#FFFFFF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold uppercase text-[#0000FF] flex items-center gap-1.5">
                    <Radio className="w-4 h-4" />
                    [LIVE SPOTIFY ACCOUNT]
                  </span>
                  {activeMode === 'spotify_api' && (
                    <span className="font-mono text-xs font-bold text-[#0000FF] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#111111]">Direct Spotify Sign-In</h3>
                <p className="text-xs text-[#808080] mt-1 leading-relaxed">
                  Real-time sync of your Top 50 Songs, Artists, and Albums across 4 weeks, 6 months, and all time.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#111111] flex items-center justify-between">
                {isSpotifyConnected ? (
                  <div className="flex items-center gap-2">
                    {activeMode !== 'spotify_api' && (
                      <button
                        onClick={() => {
                          onSwitchToSpotifyApi();
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#111111] bg-[#0000FF] text-[#FFFFFF] font-mono text-xs font-bold cursor-pointer"
                      >
                        SWITCH TO LIVE
                      </button>
                    )}
                    <button
                      onClick={() => {
                        disconnectSpotify();
                        onDisconnectSpotify();
                      }}
                      className="font-mono text-xs font-bold text-[#FF0000] underline cursor-pointer"
                    >
                      LOG OUT
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleReconnect}
                    className="w-full py-2.5 rounded-lg border-2 border-[#111111] bg-[#FF0000] text-[#FFFFFF] font-bold text-xs cursor-pointer"
                  >
                    SIGN IN WITH SPOTIFY
                  </button>
                )}
              </div>
            </div>

            {/* Extended Streaming History Archive Card */}
            <div
              className={`p-6 border-2 border-[#111111] flex flex-col justify-between ${
                activeMode === 'history' ? 'bg-[#FFFF00]/20 border-t-8 border-t-[#FF0000]' : 'bg-[#FFFFFF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold uppercase text-[#FF0000] flex items-center gap-1.5">
                    <FileJson className="w-4 h-4" />
                    [ARCHIVE FILE]
                  </span>
                  {activeMode === 'history' && (
                    <span className="font-mono text-xs font-bold text-[#FF0000] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#111111]">Streaming History</h3>
                <p className="text-xs text-[#808080] mt-1 leading-relaxed">
                  Upload your Spotify privacy export (<code className="font-mono font-bold">.zip</code> or <code className="font-mono font-bold">.json</code>) for exact historical minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#0000FF] hover:text-[#FF0000] underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How to request your Spotify privacy data?</span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-[#111111]">
                {hasUploadedHistory ? (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#111111]">
                      {uploadedRecordCount.toLocaleString()} STREAMS
                    </span>
                    <div className="flex items-center gap-2">
                      {activeMode !== 'history' && (
                        <button
                          onClick={() => {
                            onSwitchToHistory();
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#111111] bg-[#FFFF00] text-[#111111] font-mono text-xs font-bold cursor-pointer"
                        >
                          USE ARCHIVE
                        </button>
                      )}
                      <button
                        onClick={onClearHistory}
                        title="Delete saved history"
                        className="p-1.5 rounded-lg border border-[#111111] text-[#111111] hover:bg-[#FF0000] hover:text-[#FFFFFF] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-lg border-2 border-dashed border-[#111111] p-4 text-center transition-colors ${
                      isDragging ? 'bg-[#FFFF00]' : 'hover:bg-[#FFFF00]/30'
                    }`}
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1 text-[#FF0000]" />
                    <span className="font-mono text-xs font-bold text-[#111111]">
                      {uploading ? 'PARSING...' : 'DROP .ZIP OR .JSON'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".json,.zip"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpotifyPrivacyGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
};
