"use client";

import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  videoUrl?: string | null;
  subtitleUrl?: string | null;
  youtubeId?: string | null;
  initialWatchTime?: number;
  courseId?: string;
  lessonId?: string;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({ 
  videoUrl, 
  subtitleUrl, 
  youtubeId,
  initialWatchTime = 0,
  courseId,
  lessonId,
  onTimeUpdate
}: VideoPlayerProps) {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isReadyToSave, setIsReadyToSave] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSetTime = useRef(false);
  const lastSavedTime = useRef(0);

  const isYouTube = !!youtubeId;

  // จัดการการเปลี่ยนความเร็ว
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // ฟังก์ชัน Resume เวลา (ทำงานเมื่อวิดีโอพร้อมข้ามเวลาจริงๆ - กระโดดแค่ครั้งเดียว)
  const handleCanPlay = () => {
    if (videoRef.current && !hasSetTime.current) {
      if (initialWatchTime > 0) {
        console.log('Restoring Time once to:', initialWatchTime);
        videoRef.current.currentTime = initialWatchTime;
        lastSavedTime.current = initialWatchTime;
      }
      hasSetTime.current = true; // ล็อคทันที ห้ามทำซ้ำ
      setIsReadyToSave(true); // ปลดล็อคระบบเซฟ
      
      // พยายามเล่นต่อ
      videoRef.current.play().catch(() => {});
    }
  };

  // บันทึกความคืบหน้าทุก 5 วินาที (Throttled & Optimized)
  const handleTimeUpdate = () => {
    if (!videoRef.current || !isReadyToSave) return;
    
    const currentTime = videoRef.current.currentTime;
    
    // เรียกใช้ Prop callback หากมี
    if (onTimeUpdate) {
      onTimeUpdate(currentTime);
    }

    // ยิง API ก็ต่อเมื่อเวลาผ่านไป 5 วินาทีแล้วเท่านั้น เพื่อความลื่นไหลของหน้าเว็บ
    if (Math.abs(currentTime - lastSavedTime.current) >= 5) {
      if (courseId && lessonId && currentTime > 0) {
        fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchTime: Math.round(currentTime) }),
        }).catch(() => {});
        
        lastSavedTime.current = currentTime; // อัปเดตเวลาที่เซฟล่าสุดใน Ref (ไม่ทำให้เกิด Re-render)
      }
    }
  };

  if (isYouTube) {
    return (
      <div className="w-full h-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?controls=1&rel=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full group">
      <div className="w-full aspect-video bg-black shadow-2xl rounded-xl overflow-hidden mb-6 relative">
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 px-4 text-center">
            <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">ไม่สามารถโหลดวิดีโอได้ กรุณาตรวจสอบลิงก์</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            key={videoUrl || ""}
            src={videoUrl || ""}
            controls
            className="w-full h-full"
            controlsList="nodownload"
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onError={() => setHasError(true)}
            onPlay={() => {
              if (videoRef.current) videoRef.current.playbackRate = playbackRate;
            }}
          >
            {showSubtitles && <track src="/subtitles/ตัวอย่างนำเสนอ.vtt" kind="subtitles" srcLang="th" label="Thai" default />}
            {subtitleUrl && (
              <track
                kind="subtitles"
                src={subtitleUrl}
                srcLang="th"
                label="Thai"
                default
              />
            )}
            <track src="/subtitles/subtitle-th.vtt" kind="subtitles" srcLang="th" label="ภาษาไทย" default />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {!hasError && (
        <div className="flex justify-end py-2 px-1 gap-2">
          <button 
            onClick={() => setShowSubtitles(!showSubtitles)} 
            type="button"
            className={`flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium transition-colors ${showSubtitles ? 'bg-purple-600 text-white' : 'text-slate-200 hover:text-white hover:bg-white/20'}`}
          >
            CC
          </button>
          <div className="relative">
            <button
              onClick={() => setIsSpeedOpen(!isSpeedOpen)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-md border border-white/10"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {playbackRate === 1 ? '1x' : `${playbackRate}x`}
            </button>

            {isSpeedOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSpeedOpen(false)} />
                <div className="absolute bottom-full right-0 mb-2 w-36 bg-slate-800 border border-white/10 rounded-md shadow-lg overflow-hidden z-20">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-slate-900/50">
                    Playback Speed
                  </div>
                  {[0.5, 1, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
                        setIsSpeedOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex justify-between items-center ${
                        playbackRate === rate ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                      {playbackRate === rate && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
