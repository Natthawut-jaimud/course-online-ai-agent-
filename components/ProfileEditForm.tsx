"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ProfileEditFormProps {
  initialName: string | null;
}

export default function ProfileEditForm({ initialName }: ProfileEditFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }

    if (name.trim() === initialName) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }

      // Update the NextAuth session client-side
      await update({ name: data.user.name });

      setIsEditing(false);
      // Refresh to ensure any server components get the latest data
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-hidden">
        <label htmlFor="name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          แก้ไขชื่อของคุณ
        </label>
        <div className="flex flex-col gap-3">
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            placeholder="ชื่อ-นามสกุล"
            disabled={loading}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setName(initialName || "");
                setError("");
              }}
              disabled={loading}
              className="w-full py-2.5 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
        {error && <p className="text-[10px] font-bold text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group">
      <button
        onClick={() => setIsEditing(true)}
        className="w-full py-2.5 bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        แก้ไขข้อมูลโปรไฟล์
      </button>
    </div>
  );
}
