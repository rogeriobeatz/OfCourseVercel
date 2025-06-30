"use client"

import { useAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, BookOpen, Clock, CheckCircle, Play } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { Course, Lesson, UserProgress } from "@/types/course"
import {
  getCourseById,
  getUserProgress as getDbUserProgress,
  saveUserProgress as saveDbUserProgress,
  dbCourseToAppCourse,
  dbProgressToAppProgress,
} from "@/lib/database"

export default function LessonPage({ params }: { params: { id: string; lessonId: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user && params.id && params.lessonId) {
      loadLessonData()
    }
  }, [user, loading, params.id, params.lessonId])

  const loadLessonData = async () => {
    try {
      setIsLoading(true)

      const [dbCourse, dbProgress] = await Promise.all([
        getCourseById(params.id),
        getDbUserProgress(user.id, params.id),
      ])

      if (dbCourse) {
        const appCourse = dbCourseToAppCourse(dbCourse)
        setCourse(appCourse)

        // Find lesson by ID
        let foundLesson = appCourse.lessons.find((l: any) => l.id === params.lessonId)

        // If not found, try to find by index (fallback for old URLs)
        if (!foundLesson) {
          const lessonIndex = params.lessonId.match(/lesson-(\d+)/)
          if (lessonIndex) {
            const index = Number.parseInt(lessonIndex[1]) - 1
            if (index >= 0 && index < appCourse.lessons.length) {
              foundLesson = appCourse.lessons[index]
              // Redirect to correct URL
              router.replace(`/course/${params.id}/lesson/${foundLesson.id}`)
            }
          }
        }

        // If still not found, redirect to first lesson
        if (!foundLesson && appCourse.lessons.length > 0) {
          router.replace(`/course/${params.id}/lesson/${appCourse.lessons[0].id}`)
          return
        }

        setLesson(foundLesson)

        if (dbProgress) {
          const appProgress = dbProgressToAppProgress(dbProgress)
          setProgress(appProgress)
        }
      }
    } catch (error) {
      console.error("Error loading lesson data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markLessonComplete = async () => {
    if (!user || !course || !lesson) return

    try {
      const currentProgress = progress || {
        userId: user.id,
        courseId: course.id,
        completedLessons: [],
        quizScores: {},
        startedAt: new Date(),
        certificateIssued: false,
      }

      if (!currentProgress.completedLessons.includes(lesson.id)) {
        const updatedProgress = {
          ...currentProgress,
          completedLessons: [...currentProgress.completedLessons, lesson.id],
        }

        // Check if course is completed
        if (updatedProgress.completedLessons.length === course.lessons.length) {
          updatedProgress.completedAt = new Date()
        }

        // Save to database
        await saveDbUserProgress({
          user_id: user.id,
          course_id: course.id,
          completed_lessons: updatedProgress.completedLessons,
          quiz_scores: updatedProgress.quizScores,
          started_at: updatedProgress.startedAt.toISOString(),
          completed_at: updatedProgress.completedAt?.toISOString(),
          certificate_issued: updatedProgress.certificateIssued,
          current_lesson_id: lesson.id,
        })

        setProgress(updatedProgress)
      }
    } catch (error) {
      console.error("Error marking lesson complete:", error)
    }
  }

  const goToNextLesson = () => {
    if (!course || !lesson) return

    const currentIndex = course.lessons.findIndex((l) => l.id === lesson.id)
    const nextLesson = course.lessons[currentIndex + 1]

    if (nextLesson) {
      router.push(`/course/${course.id}/lesson/${nextLesson.id}`)
    } else {
      router.push(`/course/${course.id}`)
    }
  }

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user || !course || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-800 mb-2">Aula não encontrada</h2>
              <p className="text-red-700 mb-4">A aula que você está procurando não existe.</p>
              <Button asChild>
                <Link href={`/course/${params.id}`}>Voltar ao Curso</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const currentLessonIndex = course.lessons.findIndex((l) => l.id === lesson.id)
  const isCompleted = progress?.completedLessons.includes(lesson.id) || false
  const progressPercentage =
    course.lessons.length > 0 ? ((progress?.completedLessons.length || 0) / course.lessons.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/course/${course.id}`} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Curso
            </Link>
          </Button>

          <div className="text-sm text-gray-600">
            Aula {currentLessonIndex + 1} de {course.lessons.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do Curso</span>
            <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{lesson.title}</CardTitle>
                    <p className="text-gray-600 mb-4">{lesson.objective}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lesson.duration} minutos
                      </span>
                      {isCompleted && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Concluída
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Lesson Content */}
                <div className="prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: lesson.content
                        .replace(/\n/g, "<br>")
                        .replace(
                          /```(\w+)?\n([\s\S]*?)```/g,
                          '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto"><code>$2</code></pre>',
                        ),
                    }}
                  />
                </div>

                {/* Materials */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Material Complementar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-800">{lesson.materials}</p>
                  </CardContent>
                </Card>

                {/* Practice */}
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Desafio Prático
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-800">{lesson.practice}</p>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <div>
                    {!isCompleted && (
                      <Button onClick={markLessonComplete} className="mr-4">
                        Marcar como Concluída
                      </Button>
                    )}

                    {lesson.quiz && (
                      <Button variant="outline" onClick={() => setShowQuiz(true)} disabled={!isCompleted}>
                        {isCompleted ? "Fazer Quiz" : "Complete a aula para fazer o quiz"}
                      </Button>
                    )}
                  </div>

                  <Button onClick={goToNextLesson} className="flex items-center gap-2">
                    {currentLessonIndex === course.lessons.length - 1 ? "Finalizar Curso" : "Próxima Aula"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navegação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.lessons.map((courseLesson, index) => {
                  const isCurrentLesson = courseLesson.id === lesson.id
                  const isLessonCompleted = progress?.completedLessons.includes(courseLesson.id) || false

                  return (
                    <Link
                      key={courseLesson.id}
                      href={`/course/${course.id}/lesson/${courseLesson.id}`}
                      className={`block p-3 rounded-lg transition-colors ${
                        isCurrentLesson ? "bg-blue-100 border-2 border-blue-300" : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {isLessonCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full border-2 ${
                                isCurrentLesson ? "border-blue-600 bg-blue-600" : "border-gray-300"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isCurrentLesson ? "text-blue-900" : "text-gray-900"
                            }`}
                          >
                            {index + 1}. {courseLesson.title.replace(/^🚀|📊|🔄|⚡|🏗️|🌐|🔄|🎯/, "").trim()}
                          </p>
                          <p className="text-xs text-gray-500">{courseLesson.duration} min</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Quiz Modal - Simplified for now */}
      {showQuiz && lesson.quiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Quiz da Aula</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Quiz interativo será implementado na próxima versão!</p>
              <div className="space-y-4">
                {lesson.quiz.questions.map((question, index) => (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">
                      {index + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input type="radio" name={`question-${question.id}`} />
                          <label>{option}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" onClick={() => setShowQuiz(false)}>
                  Fechar
                </Button>
                <Button>Enviar Respostas</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
