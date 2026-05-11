"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image?: string | null;
}

interface AdminUserTableProps {
  users: User[];
}

export default function AdminUserTable({ users }: AdminUserTableProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUserId = (session?.user as any)?.id;

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์");
      }

      setSuccess("เปลี่ยนสถานะสำเร็จ");
      router.refresh();
      
      // ล้างข้อความ success หลังจาก 3 วินาที
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?')) return;

    setLoadingId(userId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถลบผู้ใช้งานได้ (อาจมีข้อมูลประวัติการเรียนผูกติดอยู่)");
      }

      setSuccess("ลบผู้ใช้งานสำเร็จ");
      router.refresh();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full">
      {(error || success) && (
        <div className={`mb-4 p-4 rounded-lg text-sm font-medium border ${error ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
          {error || success}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                ผู้ใช้งาน
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                อีเมล
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                สิทธิ์การใช้งาน (Role)
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-gray-200">
                      {user.image ? (
                        <img src={user.image} alt={user.name || ""} className="h-full w-full object-cover" />
                      ) : (
                        user.name?.[0] || user.email?.[0]?.toUpperCase() || "U"
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{user.name || "ไม่มีชื่อ"}</div>
                      {user.id === currentUserId && (
                        <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          คุณ (You)
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.id === currentUserId ? (
                    <span className="text-sm font-bold text-gray-500 px-3 py-2 bg-gray-100 rounded-md inline-block">
                      {user.role} (แก้ไขตัวเองไม่ได้)
                    </span>
                  ) : (
                    <div className="relative inline-block w-40">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={loadingId === user.id}
                        className={`block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none cursor-pointer border ${
                          user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 font-semibold border-purple-200' :
                          user.role === 'INSTRUCTOR' ? 'bg-green-50 text-green-700 font-semibold border-green-200' :
                          'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="INSTRUCTOR">INSTRUCTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {loadingId === user.id ? (
                    <span className="inline-flex items-center text-blue-600">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังดำเนินการ...
                    </span>
                  ) : (
                    <div className="flex justify-end items-center gap-3">
                      <button className="text-xs font-medium text-slate-400 hover:text-purple-600">แก้ไข</button>
                      {user.id !== currentUserId && (
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:text-red-700 font-medium text-xs transition-colors"
                        >
                          ลบ
                        </button>
                      )}
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-400">อัปเดตแล้ว</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            ไม่พบข้อมูลผู้ใช้งานในระบบ
          </div>
        )}
      </div>
    </div>
  );
}
