"use client";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CertificateViewer({ studentName, courseTitle }: { studentName: string, courseTitle: string }) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      // Capture the certificate div as an image
      const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      
      // Create a Landscape A4 PDF
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add image and save
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${courseTitle.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto my-10">
      <button 
        onClick={downloadPDF} 
        disabled={isDownloading}
        className="mb-8 px-8 py-3 bg-[#2563eb] text-white rounded-lg font-bold text-lg hover:bg-[#1d4ed8] disabled:opacity-50 shadow-lg transition-all flex items-center gap-2"
      >
        {isDownloading ? "⏳ กำลังสร้างไฟล์ PDF..." : "⬇️ ดาวน์โหลดใบประกาศนียบัตร (PDF)"}
      </button>

      {/* Safe Certificate UI (No gradients, explicit HEX colors only) */}
      <div className="w-full overflow-x-auto flex justify-center pb-10">
        <div 
          ref={certificateRef} 
          className="min-w-[900px] w-full aspect-[1.414/1] bg-[#ffffff] border-[16px] border-[#1e293b] outline outline-4 outline-offset-4 outline-[#1e293b] p-2 shadow-2xl relative flex flex-col"
        >
          <div className="border-[8px] border-double border-[#e2e8f0] w-full h-full flex flex-col justify-center items-center p-12 text-center bg-[#ffffff]">
             <h1 className="text-5xl font-serif text-[#1e293b] font-bold mb-2 tracking-[0.2em]">CERTIFICATE</h1>
             <h2 className="text-2xl font-serif text-[#2563eb] tracking-[0.3em] mb-12">OF COMPLETION</h2>
             
             <p className="text-xl text-[#64748b] italic mb-4">This is to certify that</p>
             <h3 className="text-5xl font-bold text-[#0f172a] border-b-2 border-[#cbd5e1] pb-4 mb-8 min-w-[60%]">{studentName}</h3>
             
             <p className="text-xl text-[#64748b] mb-6">has successfully completed the online course:</p>
             <h4 className="text-4xl font-bold text-[#1e293b] mb-16">{courseTitle}</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
