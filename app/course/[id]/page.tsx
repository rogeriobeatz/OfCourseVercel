"use client"

import { useAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Play, CheckCircle, Lock, Trophy, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { Course, UserProgress } from "@/types/course"
import {
  getCourseById,
  getUserProgress as getDbUserProgress,
  dbCourseToAppCourse,
  dbProgressToAppProgress,
} from "@/lib/database"

export default function CoursePage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user && params.id) {
      loadCourseData()
    }
  }, [user, loading, params.id])

  const loadCourseData = async () => {
    try {
      setIsLoading(true)

      const [dbCourse, dbProgress] = await Promise.all([
        getCourseById(params.id),
        getDbUserProgress(user.id, params.id),
      ])

      if (dbCourse) {
        const appCourse = dbCourseToAppCourse(dbCourse)
        setCourse(appCourse)

        if (dbProgress) {
          const appProgress = dbProgressToAppProgress(dbProgress)
          setProgress(appProgress)
        }
      }
    } catch (error) {
      console.error("Error loading course data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return null
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">Curso não encontrado</h2>
              <p className="text-red-700 mb-4">O curso que você está procurando não existe ou foi removido.</p>
              <Button asChild>
                <Link href="/dashboard">Voltar ao Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const completedLessons = progress?.completedLessons || []
  const progressPercentage = course.lessons.length > 0 ? (completedLessons.length / course.lessons.length) * 100 : 0
  const isCompleted = progressPercentage === 100

  const getLessonStatus = (lessonId: string, index: number) => {
    if (completedLessons.includes(lessonId)) {
      return "completed"
    }
    if (index === 0 || completedLessons.includes(course.lessons[index - 1].id)) {
      return "available"
    }
    return "locked"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-600 text-lg mb-4">{course.description}</p>

              <div className="flex items-center gap-4 mb-6">
                <Badge variant="secondary" className="capitalize">
                  {course.level}
                </Badge>
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  {course.lessons.length} aulas
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Seu Progresso</span>
                  <span className="text-sm text-gray-600">
                    {completedLessons.length}/{course.lessons.length} aulas concluídas
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                {isCompleted && (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Trophy className="w-5 h-5" />
                    Curso Concluído! Parabéns! 🎉
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6">Aulas do Curso</h2>

            {course.lessons.length === 0 ? (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-orange-800 mb-2">Nenhuma aula encontrada</h3>
                  <p className="text-orange-700">Este curso não possui aulas configuradas.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {course.lessons.map((lesson, index) => {
                  const status = getLessonStatus(lesson.id, index)
                  const isLocked = status === "locked"
                  const isCompleted = status === "completed"

                  return (
                    <Card key={lesson.id} className={`transition-all ${isLocked ? "opacity-60" : "hover:shadow-lg"}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : isLocked ? (
                              <Lock className="w-6 h-6 text-gray-400" />
                            ) : (
                              <Play className="w-6 h-6 text-blue-600" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
                            <p className="text-gray-600 mb-3">{lesson.objective}</p>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {lesson.duration} min
                              </span>
                              {lesson.quiz && <span>Quiz incluído</span>}
                            </div>

                            <div className="flex items-center gap-3">
                              {!isLocked ? (
                                <Button asChild size="sm">
                                  <Link href={`/course/${course.id}/lesson/${lesson.id}`}>
                                    {isCompleted ? "Revisar" : "Estudar"}
                                  </Link>
                                </Button>
                              ) : (
                                <Button size="sm" disabled>
                                  Bloqueado
                                </Button>
                              )}

                              {isCompleted && progress?.quizScores?.[lesson.id] && (
                                <Badge variant="outline" className="text-green-600">
                                  Quiz: {progress.quizScores[lesson.id]}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Resumo do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de Aulas:</span>
                  <span className="font-medium">{course.lessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concluídas:</span>
                  <span className="font-medium">{completedLessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Restantes:</span>
                  <span className="font-medium">{course.lessons.length - completedLessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duração Total:</span>
                  <span className="font-medium">
                    {Math.round(course.lessons.reduce((acc, lesson) => acc + lesson.duration, 0) / 60)}h
                  </span>
                </div>
              </CardContent>
            </Card>

            {isCompleted && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Certificado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 mb-4">Parabéns! Você concluiu este curso com sucesso.</p>
                  <Button asChild className="w-full">
                    <Link href={`/certificate/${course.id}`}>Ver Certificado</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
