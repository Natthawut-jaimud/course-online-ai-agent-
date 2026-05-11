"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSection, createLesson, deleteSection, updateCourse, deleteCourse, updateLesson, togglePublishCourse } from "@/actions/course";
import ImageUpload from "./ImageUpload";
import QuizEditor from "./QuizEditor";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface CourseBuilderProps {
  initialCourse: any;
}

export default function CourseBuilder({ initialCourse }: CourseBuilderProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [course, setCourse] = useState(initialCourse);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fix for Hydration errors with DnD
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // States for Curriculum
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState<"VIDEO" | "PDF" | "QUIZ" | "ASSIGNMENT">("VIDEO");

  // State for Editing Lesson Content
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    videoUrl: "",
    subtitleUrl: "",
    pdfUrl: "",
    description: "",
  });

  // States for Course Info
  const [editTitle, setEditTitle] = useState(course.title);
  const [editDesc, setEditDesc] = useState(course.description || "");
  const [editPrice, setEditPrice] = useState(course.price || 0);

  const handleImageUpload = async (url: string) => {
    try {
      await updateCourse(course.id, {
        imageUrl: url || null
      });
      alert("อัปโหลดรูปหน้าปกสำเร็จ!");
      setCourse({ ...course, imageUrl: url || null });
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleTogglePublish = async () => {
    try {
      await togglePublishCourse(course.id);
      setCourse({ ...course, isPublished: !course.isPublished });
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/courses/${course.id}/lessons/reorder`, {
        method: "PUT",
        body: JSON.stringify({
          list: updateData
        })
      });

      if (!response.ok) throw new Error("Reorder failed");

      alert("จัดลำดับสำเร็จ!");
      window.location.reload();
    } catch {
      alert("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onDragEnd = (result: DropResult, sectionId: string) => {
    if (!result.destination) return;

    const section = course.sections.find((s: any) => s.id === sectionId);
    const items = Array.from(section.lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const bulkUpdateData = items.map((lesson: any, index: number) => ({
      id: lesson.id,
      position: index
    }));

    onReorder(bulkUpdateData);
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      const position = course.sections.length;
      await createSection(course.id, newSectionTitle, position);
      setIsAddingSection(false);
      setNewSectionTitle("");
      window.location.reload(); 
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAddLesson = async (sectionId: string) => {
    if (!newLessonTitle.trim()) return;
    try {
      const section = course.sections.find((s: any) => s.id === sectionId);
      const position = section.lessons.length;
      await createLesson(sectionId, course.id, newLessonTitle, newLessonType, position);
      setAddingLessonTo(null);
      setNewLessonTitle("");
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้และบทเรียนทั้งหมดข้างใน?")) {
      try {
        await deleteSection(sectionId, course.id);
        window.location.reload();
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบทเรียนนี้?")) {
      try {
        const response = await fetch(`/api/courses/${course.id}/lessons/${lessonId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Delete failed");

        window.location.reload();
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  const openLessonEditor = (lesson: any) => {
    setEditingLesson(lesson);
    setSelectedVideoFile(null);
    setSelectedPdfFile(null);
    setLessonFormData({
      videoUrl: lesson.videoUrl || "",
      subtitleUrl: lesson.subtitleUrl || "",
      pdfUrl: lesson.pdfUrl || "",
      description: lesson.description || "",
    });
  };

  const handleSaveLessonContent = async () => {
    if (!editingLesson) return;
    try {
      setIsUploading(true);
      let finalData = { ...lessonFormData };

      if (selectedVideoFile) {
        const formData = new FormData();
        formData.append("file", selectedVideoFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Video upload failed");
        const uploadData = await uploadRes.json();
        finalData.videoUrl = uploadData.url;
      }

      if (selectedPdfFile) {
        const formData = new FormData();
        formData.append("file", selectedPdfFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("PDF upload failed");
        const uploadData = await uploadRes.json();
        finalData.pdfUrl = uploadData.url;
      }

      await updateLesson(editingLesson.id, course.id, finalData);
      alert("บันทึกเนื้อหาบทเรียนสำเร็จ!");
      setEditingLesson(null);
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateCourseInfo = async () => {
    try {
      await updateCourse(course.id, {
        title: editTitle,
        description: editDesc,
        price: Number(editPrice)
      });
      alert("อัปเดตข้อมูลคอร์สสำเร็จ!");
      setCourse({ ...course, title: editTitle, description: editDesc, price: Number(editPrice) });
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteCourse = async () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคอร์สนี้อย่างถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      try {
        await deleteCourse(course.id);
        router.push("/instructor");
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return "🎥";
      case "PDF": return "📄";
      case "QUIZ": return "❓";
      case "ASSIGNMENT": return "📝";
      default: return "📄";
    }
  };

  const getLessonTypeName = (type: string) => {
    switch (type) {
      case "VIDEO": return "วิดีโอ";
      case "PDF": return "เอกสาร PDF";
      case "QUIZ": return "แบบทดสอบ";
      case "ASSIGNMENT": return "การบ้าน";
      default: return type;
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Modal จัดการเนื้อหาบทเรียน */}
      {editingLesson && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl">
                  {getLessonIcon(editingLesson.type)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">จัดการเนื้อหา</h3>
                  <p className="text-sm text-slate-500 font-medium">{editingLesson.title}</p>
                </div>
              </div>
              <button onClick={() => setEditingLesson(null)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
              {editingLesson.type === "VIDEO" && (
                <div className="space-y-6">
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center text-center group hover:border-purple-300 transition-colors cursor-pointer relative">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-700">อัปโหลดวิดีโอบทเรียน</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">MP4, WEBM (ไม่เกิน 500MB)</p>
                    <input 
                      type="file" 
                      accept="video/mp4,video/webm"
                      onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {selectedVideoFile && (
                      <p className="mt-4 text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                        {selectedVideoFile.name}
                      </p>
                    )}
                    {lessonFormData.videoUrl && !selectedVideoFile && (
                      <p className="mt-4 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        วิดีโอปัจจุบันพร้อมใช้งาน
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ลิงก์คำบรรยาย (VTT)</label>
                    <input 
                      type="url" 
                      value={lessonFormData.subtitleUrl}
                      onChange={(e) => setLessonFormData({...lessonFormData, subtitleUrl: e.target.value})}
                      className="w-full px-5 py-3 text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-medium"
                      placeholder="https://example.com/subtitles.vtt"
                    />
                  </div>
                </div>
              )}

              {editingLesson.type === "PDF" && (
                <div className="space-y-6">
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center text-center group hover:border-purple-300 transition-colors cursor-pointer relative">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-700">อัปโหลดไฟล์เอกสาร</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">ไฟล์ PDF เท่านั้น</p>
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {selectedPdfFile && (
                      <p className="mt-4 text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                        {selectedPdfFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {editingLesson.type === "QUIZ" && (
                <QuizEditor 
                  courseId={course.id} 
                  lessonId={editingLesson.id} 
                />
              )}
              {editingLesson.type === "ASSIGNMENT" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">คำสั่งการบ้าน</label>
                    <textarea 
                      rows={6}
                      value={lessonFormData.description}
                      onChange={(e) => setLessonFormData({...lessonFormData, description: e.target.value})}
                      className="w-full px-5 py-4 text-slate-800 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-medium leading-relaxed"
                      placeholder="พิมพ์โจทย์ที่ต้องการให้นักเรียนส่งที่นี่..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ลิงก์อ้างอิงเสริม</label>
                    <input 
                      type="url" 
                      value={lessonFormData.videoUrl}
                      onChange={(e) => setLessonFormData({...lessonFormData, videoUrl: e.target.value})}
                      className="w-full px-5 py-3 text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-medium"
                      placeholder="https://example.com/files"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-4 flex-shrink-0">
              <button 
                onClick={() => setEditingLesson(null)}
                disabled={isUploading}
                className="px-6 py-3 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSaveLessonContent}
                disabled={isUploading}
                className="px-8 py-3 text-sm font-black text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all disabled:bg-purple-300 flex items-center gap-3 active:scale-95"
              >
                {isUploading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isUploading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ซ้าย: โครงสร้างหลักสูตร (Curriculum) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">โครงสร้างหลักสูตร</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">จัดเรียงเนื้อหาบทเรียนและหมวดหมู่</p>
              </div>
              <button 
                onClick={() => setIsAddingSection(true)}
                className="bg-purple-50 text-purple-600 font-bold px-6 py-2.5 rounded-xl hover:bg-purple-100 transition-all flex items-center gap-2 border border-purple-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                เพิ่มหมวดหมู่ใหม่
              </button>
            </div>
            
            <div className="p-8">
              {isAddingSection && (
                <div className="mb-8 p-6 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <input 
                    type="text" 
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="ชื่อหมวดหมู่ (เช่น บทที่ 1: บทนำ)"
                    className="flex-1 px-5 py-3 text-slate-800 placeholder-slate-400 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-medium"
                    autoFocus
                  />
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleAddSection} className="flex-1 sm:flex-none bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-md shadow-purple-100 transition-all">บันทึก</button>
                    <button onClick={() => setIsAddingSection(false)} className="flex-1 sm:flex-none bg-white text-slate-500 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">ยกเลิก</button>
                  </div>
                </div>
              )}

              {course.sections.length === 0 && !isAddingSection ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-3xl">🗂️</span>
                  </div>
                  <p className="text-slate-500 font-bold">ยังไม่มีเนื้อหาในคอร์สนี้</p>
                  <p className="text-sm text-slate-400 mt-1">กรุณาคลิก "เพิ่มหมวดหมู่ใหม่" เพื่อเริ่มสร้างเนื้อหา</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {course.sections.map((section: any, index: number) => (
                    <div key={section.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="bg-slate-50/50 px-6 py-5 flex justify-between items-center group border-l-4 border-purple-500">
                        <div>
                          <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-0.5">ส่วนที่ {index + 1}</p>
                          <h3 className="font-extrabold text-slate-800 text-lg">
                            {section.title}
                          </h3>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setAddingLessonTo(section.id)} 
                            className="text-xs font-bold bg-white border border-purple-100 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-all flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            เพิ่มบทเรียน
                          </button>
                          <button onClick={() => handleDeleteSection(section.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 space-y-2">
                        <DragDropContext onDragEnd={(result) => onDragEnd(result, section.id)}>
                          <Droppable droppableId={section.id}>
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                                {section.lessons.map((lesson: any, lIndex: number) => (
                                  <Draggable key={lesson.id} draggableId={lesson.id} index={lIndex}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="flex justify-between items-center px-5 py-4 hover:bg-slate-50 rounded-xl group border border-transparent transition-all bg-white hover:border-slate-100"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab text-slate-300 hover:text-purple-400 transition-colors"
                                          >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8h16M4 16h16" />
                                            </svg>
                                          </div>
                                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-white transition-colors border border-slate-100">
                                            {getLessonIcon(lesson.type)}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-slate-700 line-clamp-1">{lIndex + 1}. {lesson.title}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{getLessonTypeName(lesson.type)}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                          <button onClick={() => openLessonEditor(lesson)} className="text-[11px] font-black text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider">
                                            จัดการเนื้อหา
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteLesson(lesson.id)} 
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                          >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>

                        {section.lessons.length === 0 && addingLessonTo !== section.id && (
                          <div className="text-xs text-slate-400 font-medium italic px-6 py-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                            ยังไม่มีบทเรียนในหมวดหมู่นี้
                          </div>
                        )}

                        {addingLessonTo === section.id && (
                          <div className="m-3 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in zoom-in-95 duration-200">
                            <div className="flex flex-col gap-5">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <select 
                                  value={newLessonType} 
                                  onChange={(e) => setNewLessonType(e.target.value as any)}
                                  className="px-4 py-3 text-slate-700 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-bold text-sm shadow-sm"
                                >
                                  <option value="VIDEO">🎥 วิดีโอ</option>
                                  <option value="PDF">📄 ไฟล์ PDF</option>
                                  <option value="QUIZ">❓ แบบทดสอบ</option>
                                  <option value="ASSIGNMENT">📝 การบ้าน</option>
                                </select>
                                <input 
                                  type="text" 
                                  value={newLessonTitle}
                                  onChange={(e) => setNewLessonTitle(e.target.value)}
                                  placeholder="ตั้งชื่อบทเรียน (เช่น บทนำสู่เนื้อหา)"
                                  className="flex-1 px-5 py-3 text-slate-800 placeholder-emerald-300 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-medium"
                                  autoFocus
                                />
                              </div>
                              <div className="flex justify-end gap-3">
                                <button onClick={() => setAddingLessonTo(null)} className="px-6 py-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm">ยกเลิก</button>
                                <button onClick={() => handleAddLesson(section.id)} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all text-sm">สร้างบทเรียน</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ขวา: ข้อมูลทั่วไปของคอร์ส (Course Info) */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 sticky top-10">
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-lg">⚙️</span>
              ข้อมูลคอร์สเรียน
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">รูปหน้าปกคอร์ส</label>
                <div className="rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 p-2 hover:border-purple-300 transition-colors bg-slate-50/50">
                  <ImageUpload 
                    value={course.imageUrl} 
                    onChange={handleImageUpload} 
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium italic text-center">แนะนำขนาด 16:9 สำหรับการแสดงผลที่สวยที่สุด</p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ชื่อคอร์สเรียน</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-5 py-3 text-slate-800 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50/30" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">รายละเอียดคอร์ส</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4} 
                  className="w-full px-5 py-3 text-slate-800 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50/30 leading-relaxed" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ราคาเรียน (บาท)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">฿</span>
                  <input 
                    type="number" 
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full pl-10 pr-5 py-3 text-slate-800 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50/30" 
                  />
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                  {editPrice === 0 ? "ตั้งค่าเป็นคอร์สเรียนฟรี" : `ราคาจะถูกหักค่าธรรมเนียมตามเงื่อนไข`}
                </p>
              </div>
              
              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleUpdateCourseInfo}
                  className="w-full bg-white text-purple-600 border border-purple-200 font-extrabold py-3 rounded-2xl hover:bg-purple-50 transition-all shadow-sm active:scale-95 text-sm"
                >
                  บันทึกข้อมูลทั่วไป
                </button>
                
                <button 
                  onClick={handleTogglePublish}
                  className={`w-full font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wider ${
                    course.isPublished 
                      ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 shadow-slate-100" 
                      : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200"
                  }`}
                >
                  {course.isPublished ? "ยกเลิกการเผยแพร่" : "เผยแพร่คอร์สเรียนนี้"}
                </button>

                <div className="pt-6">
                  <button 
                    onClick={handleDeleteCourse}
                    className="w-full text-slate-300 hover:text-red-500 font-bold text-[11px] transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    ลบคอร์สเรียนถาวร
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
