"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MarkCompleteButtonProps {
  lessonId: string;
  courseId: string;
  initialCompleted: boolean;
}

export default function MarkCompleteButton({ 
  lessonId, 
  courseId, 
  initialCompleted 
}: MarkCompleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);

  // อัปเดตสถานะปุ่มตามค่าที่มาจากเซิร์ฟเวอร์
  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  const toggleComplete = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const nextState = !completed;
      
      // อัปเดต UI ทันที (Optimistic)
      setCompleted(nextState);

      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextState }),
      });

      if (response.ok) {
        // บังคับให้หน้าเว็บโหลดข้อมูลใหม่ทันที
        router.refresh();
      } else {
        // หากพลาด ให้คืนสถานะเดิมเงียบๆ
        setCompleted(!nextState);
      }
    } catch (error) {
      // ไม่มีการ throw error หรือ alert เพื่อป้องกันหน้าจอแดง
      setCompleted(completed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleComplete}
      disabled={isLoading}
      className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 active:scale-95 ${
        completed 
          ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
      }`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : completed ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
      
      {completed ? "เรียนจบแล้ว" : "ทำเครื่องหมายว่าเรียนจบแล้ว"}
    </button>
  );
}
