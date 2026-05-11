"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteUserButtonProps {
  userId: string;
}

export default function DeleteUserButton({ userId }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    try {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?')) return;

      setIsLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      router.refresh();
    } catch (error) {
      alert("ไม่สามารถลบผู้ใช้งานได้ (อาจมีข้อมูลประวัติการเรียนผูกติดอยู่)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={onDelete} 
      disabled={isLoading}
      type="button"
      className="text-red-500 hover:text-red-700 ml-4 font-medium text-sm transition-colors disabled:opacity-50"
    >
      {isLoading ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
