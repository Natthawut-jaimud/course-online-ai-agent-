import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { certificateId: id },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, instructor: { select: { name: true } } } }
    }
  });

  if (!certificate) {
    notFound();
  }

  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-4 flex flex-col items-center">
      {/* Back Button - Hidden during print */}
      <div className="max-w-[1000px] w-full mb-8 flex justify-between items-center print:hidden">
        <Link href="/profile" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" />
          </svg>
          กลับหน้าโปรไฟล์
        </Link>
        <button 
          onClick={() => window.print()} 
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          ดาวน์โหลด / พิมพ์ PDF
        </button>
      </div>

      {/* Certificate Content */}
      <div className="bg-white w-full max-w-[1000px] aspect-[1.414/1] shadow-2xl rounded-sm border-[16px] border-double border-slate-200 p-12 relative overflow-hidden flex flex-col items-center justify-center text-center">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-50 rounded-full translate-x-1/3 translate-y-1/3 opacity-50" />

        <div className="relative z-10 space-y-8 w-full max-w-3xl border border-slate-100 p-12 rounded-lg bg-white/80 backdrop-blur-sm">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif font-black text-slate-900 tracking-tight">CERTIFICATE</h1>
            <p className="text-xl font-bold text-blue-600 tracking-[0.3em] uppercase">Of Completion</p>
          </div>

          <div className="w-32 h-1 bg-blue-600 mx-auto" />

          <p className="text-xl text-slate-500 font-medium italic">ประกาศนียบัตรฉบับนี้ขอมอบให้ไว้เพื่อแสดงว่า</p>

          <h2 className="text-6xl font-black text-slate-800 underline decoration-blue-500/30 underline-offset-8">
            {certificate.user.name || "ผู้เรียนผู้ทรงเกียรติ"}
          </h2>

          <p className="text-xl text-slate-600 font-medium px-8 leading-relaxed">
            ได้สำเร็จการศึกษาหลักสูตรออนไลน์ในหัวข้อ
          </p>

          <h3 className="text-4xl font-extrabold text-slate-900 bg-slate-50 py-4 px-6 rounded-2xl inline-block border border-slate-200">
            {certificate.course.title}
          </h3>

          <div className="grid grid-cols-2 gap-12 mt-16 pt-12 border-t border-slate-100">
            <div className="text-left space-y-1">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Instructor</p>
              <p className="text-xl font-bold text-slate-800">{certificate.course.instructor.name}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
              <p className="text-xl font-bold text-slate-800">{issuedDate}</p>
            </div>
          </div>

          {/* Verification Section */}
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center opacity-40">
             <p className="text-[10px] font-mono text-slate-400">Verify authenticity at: {process.env.NEXT_PUBLIC_APP_URL}/certificates/{certificate.certificateId}</p>
             <p className="text-[10px] font-mono text-slate-400">Certificate ID: {certificate.certificateId}</p>
          </div>
        </div>

        {/* Seal/Logo Placeholder */}
        <div className="absolute bottom-16 right-16 w-24 h-24 border-4 border-blue-600/20 rounded-full flex items-center justify-center opacity-20 rotate-12">
            <div className="text-blue-600 font-black text-center text-[10px]">VERIFIED<br/>SUCCESS</div>
        </div>
      </div>
    </main>
  );
}
