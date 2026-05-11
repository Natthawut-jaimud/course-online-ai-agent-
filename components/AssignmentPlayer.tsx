"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssignmentPlayerProps {
  courseId: string;
  lessonId: string;
  description: string;
  existingSubmission: any;
}

export default function AssignmentPlayer({
  courseId,
  lessonId,
  description,
  existingSubmission,
}: AssignmentPlayerProps) {
  const router = useRouter();
  const [content, setContent] = useState(existingSubmission?.content || "");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/assignment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            fileUrl: null, // Placeholder for future file upload support
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit assignment");
      }

      alert("ส่งงานสำเร็จ!");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">📝</span>
          Assignment Details
        </h2>
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
          {description || "Please submit your work below."}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Your Submission
          </label>
          {existingSubmission && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              SUBMITTED
            </span>
          )}
        </div>
        <textarea
          disabled={isLoading}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full min-h-[300px] p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700 font-medium"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSubmit}
          disabled={isLoading || !content.trim()}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {existingSubmission ? "Update Submission" : "Submit Assignment"}
        </button>
      </div>
      
      {existingSubmission?.isGraded && (
        <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
          <h4 className="font-bold text-indigo-900 mb-2">Instructor Feedback:</h4>
          <div className="flex items-center gap-4 mb-3">
             <div className="px-3 py-1 bg-white border border-indigo-200 rounded-lg">
                <span className="text-xs font-bold text-slate-500 uppercase">Score:</span>
                <span className="ml-2 font-black text-indigo-600">{existingSubmission.score || 0} / 100</span>
             </div>
          </div>
          <p className="text-slate-600 italic">"{existingSubmission.feedback || "No feedback provided yet."}"</p>
        </div>
      )}
    </div>
  );
}
