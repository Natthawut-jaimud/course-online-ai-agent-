"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GradeAssignmentModalProps {
  submission: any;
}

export default function GradeAssignmentModal({ submission }: GradeAssignmentModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(submission.score ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");

  const onSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save grade");
      }

      alert("บันทึกคะแนนสำเร็จ!");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 border ${
          submission.isGraded 
            ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" 
            : "bg-slate-900 border-slate-900 text-white hover:bg-indigo-600 hover:border-indigo-600"
        }`}
      >
        {submission.isGraded ? "แก้ไขคะแนน (Edit Grade)" : "ให้คะแนน (Grade)"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">ตรวจการบ้าน (Grade Assignment)</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Student: {submission.user?.name || submission.user?.email}
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                  คะแนนที่ได้ (Score / 100)
                </label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="0 - 100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                  ความคิดเห็น / คำแนะนำ (Feedback)
                </label>
                <textarea 
                  rows={5}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder="พิมพ์คำแนะนำสำหรับนักเรียนที่นี่..."
                />
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="px-6 py-3 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest"
              >
                ยกเลิก
              </button>
              <button 
                onClick={onSave}
                disabled={isLoading}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isLoading ? "Saving..." : "บันทึกคะแนน (Save Grade)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
