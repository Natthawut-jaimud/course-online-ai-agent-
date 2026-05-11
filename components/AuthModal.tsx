"use client"

import { useState, type FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter()
  const [view, setView] = useState<"login" | "register">("login")
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    setLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    onClose()
    router.refresh()
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการลงทะเบียน")
      }

      // Automatically sign in after successful registration
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const toggleView = () => {
    setView(view === "login" ? "register" : "login")
    setError("")
    setName("")
    setEmail("")
    setPassword("")
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-200 rounded-full p-2 transition-colors z-10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {view === "login" ? "ยินดีต้อนรับกลับมา" : "สร้างบัญชีใหม่"}
            </h2>
            <p className="text-gray-500 text-sm">
              {view === "login" 
                ? "เข้าสู่ระบบเพื่อดำเนินการต่อในการเรียนรู้ของคุณ" 
                : "เข้าร่วมกับเราเพื่อเข้าถึงหลักสูตรคุณภาพนับพัน"}
            </p>
          </div>

          <form onSubmit={view === "login" ? handleLogin : handleRegister} className="space-y-5">
            {view === "register" && (
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1.5">
                  ชื่อ-นามสกุล
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="เช่น สมชาย ใจดี"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1.5">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1.5">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                autoComplete={view === "login" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-4 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
            >
              {loading 
                ? "กำลังดำเนินการ..." 
                : view === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button 
              type="button" 
              onClick={toggleView}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {view === "login" 
                ? "ยังไม่มีบัญชี? สมัครสมาชิกที่นี่" 
                : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่"}
            </button>
          </div>

          <div className="mt-8 mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-medium">
                หรือดำเนินการด้วย
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            
            <button
              type="button"
              onClick={() => signIn("facebook")}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-transparent bg-[#1877F2] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#166FE5] transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>

            <button
              type="button"
              onClick={() => signIn("apple")}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-black px-4 py-3.5 text-sm font-bold text-white hover:bg-gray-900 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M16.365 14.908c-.023-1.84 1.503-2.73 1.573-2.777-1.077-1.57-2.748-1.787-3.344-1.815-1.41-.143-2.766.83-3.485.83-.72 0-1.838-.813-3.02-.79-1.536.023-2.955.892-3.748 2.274-1.606 2.783-.41 6.892 1.157 9.15 .764 1.107 1.666 2.348 2.855 2.302 1.144-.047 1.58-.74 2.966-.74 1.383 0 1.794.74 2.988.718 1.217-.024 2.006-1.134 2.765-2.247 1.057-1.545 1.492-3.04 1.51-3.116-.032-.016-2.195-.842-2.217-3.79zm-2.05-5.696c.616-.745 1.03-1.78 1.03-2.825-.006-.026-.01-.052-.016-.078-.962.038-2.1.64-2.738 1.41-.51.615-.98 1.678-.98 2.746.006.027.013.054.02.08 1.02-.04 2.064-.594 2.684-1.333z" />
              </svg>
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
