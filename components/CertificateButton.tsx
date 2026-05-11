"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { issueCertificate } from "@/actions/certificate";

interface CertificateButtonProps {
  courseId: string;
  certificateId?: string | null;
}

export default function CertificateButton({ courseId, certificateId }: CertificateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      const cert = await issueCertificate(courseId);
      router.push(`/certificates/${cert.certificateId}`);
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (certificateId) {
    return (
      <button 
        onClick={() => router.push(`/certificates/${certificateId}`)}
        className="px-4 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        ดูใบประกาศ
      </button>
    );
  }

  return (
    <button 
      onClick={handleClaim}
      disabled={isLoading}
      className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-600/20"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      )}
      {isLoading ? "กำลังออกใบประกาศ..." : "รับใบประกาศนียบัตร"}
    </button>
  );
}
