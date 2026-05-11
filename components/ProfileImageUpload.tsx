"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ProfileImageUploadProps {
  currentImage: string | null;
  userName?: string | null;
}

export default function ProfileImageUpload({ currentImage, userName }: ProfileImageUploadProps) {
  const router = useRouter();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload file to server
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // 2. Update user profile image in Database
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });

      if (!profileRes.ok) throw new Error("Profile update failed");

      // 3. Update Client Session (สิ่งนี้สำคัญที่สุด!)
      await update();
      
      router.refresh();
      alert("อัปเดตรูปโปรไฟล์สำเร็จ!");
    } catch (error: any) {
      console.error(error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasImage = currentImage && currentImage.trim() !== "";

  return (
    <div className="relative group w-32 h-32">
      <div className="w-full h-full rounded-3xl bg-indigo-100 flex items-center justify-center text-4xl font-black text-indigo-600 overflow-hidden border-4 border-slate-800 shadow-2xl relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : null}
        
        {hasImage ? (
          <img src={currentImage!} className="w-full h-full object-cover" alt="Profile"/>
        ) : (
          <span>{userName?.[0] || "?"}</span>
        )}

        {/* Edit Overlay */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Small Edit Button Badge */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-slate-900 hover:bg-blue-700 transition-colors z-20"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}
