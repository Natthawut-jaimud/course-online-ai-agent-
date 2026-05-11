"use client";

import { useState } from "react";
import { submitReview } from "@/actions/review";
import { useRouter } from "next/navigation";

interface ReviewSectionProps {
  courseId: string;
  existingReview?: any;
  allReviews: any[];
  isEnrolled: boolean;
}

export default function ReviewSection({ courseId, existingReview, allReviews, isEnrolled }: ReviewSectionProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnrolled) return;

    try {
      setIsUploading(true);
      await submitReview(courseId, rating, comment);
      alert("ขอบคุณสำหรับการรีวิวของคุณ!");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 py-10">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        รีวิวจากผู้เรียน ({allReviews.length})
      </h2>

      {/* Form สำหรับคนเรียนแล้วเท่านั้น */}
      {isEnrolled && (
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner">
          <h3 className="font-bold text-lg mb-6">{existingReview ? "แก้ไขรีวิวของคุณ" : "เขียนรีวิวของคุณ"}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-transform active:scale-125 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="คอร์สนี้เป็นอย่างไรบ้าง? ช่วยแชร์ประสบการณ์ของคุณ..."
              rows={4}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 transition-all text-gray-700"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "กำลังบันทึก..." : "ส่งรีวิว"}
            </button>
          </form>
        </div>
      )}

      {/* รายการรีวิวทั้งหมด */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allReviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                {review.user.name?.[0] || "U"}
              </div>
              <div>
                <p className="font-bold text-gray-900">{review.user.name}</p>
                <div className="flex text-yellow-400 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed italic">"{review.comment}"</p>
            <p className="text-[10px] text-gray-400 font-medium">{new Date(review.createdAt).toLocaleDateString('th-TH')}</p>
          </div>
        ))}
        {allReviews.length === 0 && (
          <p className="text-gray-400 italic text-center col-span-2 py-10">ยังไม่มีการรีวิวสำหรับคอร์สนี้</p>
        )}
      </div>
    </div>
  );
}
