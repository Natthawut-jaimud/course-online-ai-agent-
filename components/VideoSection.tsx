"use client";

import { useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";

interface VideoSectionProps {
  videoUrl?: string | null;
  subtitleUrl?: string | null;
  youtubeId?: string | null;
}

const RATES = [0.5, 1, 1.5, 2] as const;

export default function VideoSection({ videoUrl, subtitleUrl, youtubeId }: VideoSectionProps) {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-end gap-2">
      {/* ─── Video container ─── */}
      <div className="w-full aspect-video max-h-[80vh] bg-black shadow-2xl rounded-xl overflow-hidden">
        <VideoPlayer
          videoUrl={videoUrl}
          subtitleUrl={subtitleUrl}
          youtubeId={youtubeId}
          playbackRate={playbackRate}
        />
      </div>

      {/* ─── Speed Control — below video, aligned right ─── */}
      {!youtubeId && (
        <div className="relative">
          {/* Trigger Button — แสดงแค่ความเร็วปัจจุบัน เช่น 1x */}
          <button
            id="speed-control-btn"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-400 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-lg transition-colors duration-150 select-none"
          >
            {playbackRate}x
            <svg
              className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <>
              {/* Invisible backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setOpen(false)}
              />

              <div
                role="listbox"
                aria-label="Playback speed"
                className="absolute bottom-full right-0 mb-2 z-20 bg-slate-800 border border-slate-600 rounded-md shadow-lg overflow-hidden animate-[fadeSlideUp_0.15s_ease-out]"
              >
                {RATES.map((rate) => (
                  <button
                    key={rate}
                    role="option"
                    aria-selected={playbackRate === rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-100 ${
                      playbackRate === rate
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
