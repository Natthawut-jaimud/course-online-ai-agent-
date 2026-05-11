"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id?: string;
  prompt: string;
  options: Option[];
}

interface QuizEditorProps {
  courseId: string;
  lessonId: string;
}

export default function QuizEditor({ courseId, lessonId }: QuizEditorProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch data using strict props
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!courseId || !lessonId) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/quiz`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.questions) {
            setQuestions(data.questions);
          }
        }
      } catch (error) {
        console.error("Failed to fetch quiz:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, lessonId]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        prompt: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestionPrompt = (index: number, prompt: string) => {
    const newQuestions = [...questions];
    newQuestions[index].prompt = prompt;
    setQuestions(newQuestions);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex].text = text;
    setQuestions(newQuestions);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.forEach((opt, i) => {
      opt.isCorrect = i === oIndex;
    });
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!courseId || !lessonId) {
      alert("Error: Missing Course or Lesson ID");
      return;
    }

    if (questions.length === 0) {
      alert("กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/quiz`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert("บันทึกข้อสอบสำเร็จ!");
        router.refresh(); // รีเฟรชหน้าจอเพื่อดึงข้อมูลล่าสุด
      } else {
        throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Quiz Tools...</div>;
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header - Sleek & Compact */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Quiz Content</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{questions.length} Questions added</p>
        </div>
        <button 
          onClick={addQuestion}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 active:scale-95"
        >
          + ADD QUESTION
        </button>
      </div>

      <div className="p-6 space-y-8 pb-12">
        {questions.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <p className="text-slate-400 text-sm font-medium">ยังไม่มีคำถามในบทเรียนนี้</p>
          </div>
        ) : (
          questions.map((q, qIndex) => (
            <div key={qIndex} className="relative group space-y-4 pb-8 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Question {qIndex + 1}</span>
                <button 
                  onClick={() => removeQuestion(qIndex)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              <textarea 
                value={q.prompt}
                onChange={(e) => updateQuestionPrompt(qIndex, e.target.value)}
                placeholder="ระบุโจทย์คำถามของคุณ..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, oIndex) => (
                  <div 
                    key={oIndex} 
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <input 
                      type="radio" 
                      name={`correct-${qIndex}`} 
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(qIndex, oIndex)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <input 
                      type="text" 
                      value={opt.text}
                      onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                      placeholder={`ตัวเลือกที่ ${oIndex + 1}`}
                      className="flex-1 bg-transparent border-none font-medium text-slate-700 text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {questions.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            disabled={isSaving}
            onClick={handleSave}
            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
