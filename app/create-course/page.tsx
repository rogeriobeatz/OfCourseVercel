"use client"

import { useAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import CourseBuilder from "@/course-builder"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CreateCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <CourseBuilder />
      </main>
    </div>
  )
}
