import React from 'react';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DeleteUserButton from "@/components/DeleteUserButton";

export const dynamic = 'force-dynamic'; // สั่งไม่ให้จำค่าเก่า (Real-time)

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  // ดึงข้อมูลจากฐานข้อมูลจริง
  const totalUsers = await prisma.user.count();
  const totalCourses = await prisma.course.count();
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
              🛡️ ระบบจัดการหลังบ้าน <span className="text-sm font-medium bg-purple-100 text-purple-700 px-3 py-1 rounded-full uppercase tracking-widest mt-1">Admin Dashboard</span>
            </h1>
            <p className="text-slate-500 mt-2">ยินดีต้อนรับกลับมา, จัดการและตรวจสอบภาพรวมของระบบได้ที่นี่</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50">กลับหน้าหลัก</button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 shadow-md">ดาวน์โหลดรายงาน</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-lg"><span className="text-xl">👥</span></div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Real-time</span>
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">ผู้ใช้งานทั้งหมด</p>
            <p className="text-4xl font-black text-slate-800">{totalUsers.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-50 p-3 rounded-lg"><span className="text-xl">📚</span></div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Real-time</span>
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">คอร์สเรียนในระบบ</p>
            <p className="text-4xl font-black text-slate-800">{totalCourses.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-amber-50 p-3 rounded-lg"><span className="text-xl">💰</span></div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Real-time</span>
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">ยอดขายรวม</p>
            <p className="text-4xl font-black text-slate-800">฿0</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">ผู้ใช้งานที่สมัครล่าสุด</h2>
            <button className="text-sm font-bold text-purple-600 hover:text-purple-800">ดูทั้งหมด</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="pb-4 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="pb-4 font-semibold">อีเมล</th>
                  <th className="pb-4 font-semibold">วันที่สมัคร</th>
                  <th className="pb-4 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{user.name || 'ไม่มีชื่อ'}</span>
                    </td>
                    <td className="py-4 text-sm text-slate-500">{user.email}</td>
                    <td className="py-4 text-sm text-slate-500">{user.createdAt.toLocaleDateString('th-TH')}</td>
                    <td className="py-4 text-right flex items-center justify-end">
                      <button className="text-xs font-medium text-slate-400 hover:text-purple-600">แก้ไข</button>
                      {user.id !== currentUserId && (
                        <DeleteUserButton userId={user.id} />
                      )}
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">ยังไม่มีข้อมูลผู้ใช้งาน</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}