"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface QuizPlayerProps {
  courseId: string;
  lessonId: string;
}

export default function QuizPlayer({ courseId, lessonId }: QuizPlayerProps) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const [quizRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${courseId}/lessons/${lessonId}/quiz`),
          fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`)
        ]);

        if (quizRes.ok) {
          const data = await quizRes.json();
          
          // Implement Shuffle Logic (STRICT)
          const shuffledQuestions = [...data.questions].sort(() => Math.random() - 0.5);
          shuffledQuestions.forEach(q => {
            q.options = [...q.options].sort(() => Math.random() - 0.5);
          });
          
          setQuiz({ ...data, questions: shuffledQuestions });
        }

        if (progressRes.ok) {
          const progress = await progressRes.json();
          if (progress && progress.completed && progress.quizScore !== null) {
            setScoreResult({ score: progress.quizScore, total: progress.quizTotal });
          }
        }
      } catch (error) {
        console.error("Failed to load quiz data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, lessonId]);

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // CRITICAL: Ensure you use BACKTICKS (`) here, NOT single quotes (')
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: selectedAnswers }),
      });

      if (!response.ok) {
        // Extract the real error message from the server for debugging
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error(errorText || "Failed to submit");
      }

      const data = await response.json();
      setScoreResult({ score: data.score, total: data.total });
      
    } catch (error) {
      console.error("Submit Exception:", error);
      alert("เกิดข้อผิดพลาดในการส่งคำตอบ โปรดเช็คคอนโซลหรือลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500 text-sm font-medium animate-pulse">กำลังโหลดข้อสอบ...</div>;
  if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Result Screen */}
      {scoreResult ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">ทำแบบทดสอบเสร็จสิ้น!</h3>
          <p className="text-slate-500 font-medium mb-8 text-lg">
            คะแนนของคุณคือ: <span className="text-blue-600 font-black">{scoreResult.score} / {scoreResult.total}</span>
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={() => { setScoreResult(null); setSelectedAnswers({}); }}
              className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
            >
              ลองอีกครั้ง (Try Again)
            </button>
            <button 
              onClick={() => router.refresh()}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              เรียนต่อบทถัดไป
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Quiz Header */}
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-bold text-slate-900">แบบทดสอบท้ายบทเรียน</h2>
            <p className="text-slate-500 text-sm mt-1">จำนวนคำถามทั้งหมด {quiz.questions.length} ข้อ</p>
          </div>

          {/* Questions List */}
          <div className="space-y-12">
            {quiz.questions.map((question: any, index: number) => (
              <div key={question.id} className="space-y-6">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <h3 className="text-slate-900 text-lg font-medium leading-tight pt-1">
                    {question.prompt}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 pl-0 sm:pl-12">
                  {question.options.map((option: any) => {
                    const isSelected = selectedAnswers[question.id] === option.id;
                    return (
                      <label 
                        key={option.id}
                        className={`p-4 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="radio"
                          name={`question-${question.id}`}
                          checked={isSelected}
                          onChange={() => handleOptionChange(question.id, option.id)}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        <span className={`font-medium transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                          {option.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="pt-10 border-t border-slate-100 flex justify-end">
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isSubmitting ? "กำลังส่งคำตอบ..." : "ส่งคำตอบ (Submit)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
