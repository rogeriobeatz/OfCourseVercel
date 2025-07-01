"use client"

import { useAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  FileText,
  Target,
  Lightbulb,
  Code,
  Video,
  Download,
  Share2,
  Bookmark,
  Loader2,
  Sparkles,
} from "lucide-react"
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
import { generateLessonContentAction } from "@/actions/generate-lesson-content"

export default function LessonPage({ params }: { params: { id: string; lessonId: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)

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

        // Check if lesson content needs to be generated
        if (foundLesson && (!foundLesson.content || foundLesson.content === null)) {
          await generateLessonContent(foundLesson.id)
        }

        if (dbProgress) {
          const appProgress = dbProgressToAppProgress(dbProgress)
          setProgress(appProgress)

          // Check if quiz was already completed
          if (foundLesson?.quiz && appProgress.quizScores[foundLesson.id]) {
            setQuizSubmitted(true)
            setQuizScore(appProgress.quizScores[foundLesson.id])
          }
        }
      }
    } catch (error) {
      console.error("Error loading lesson data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateLessonContent = async (lessonId: string) => {
    try {
      setIsGeneratingContent(true)
      console.log(`Generating content for lesson: ${lessonId}`)

      const result = await generateLessonContentAction(params.id, lessonId)

      if (result.success && result.lessonContent) {
        // Update the lesson with generated content
        setLesson(result.lessonContent)

        // Also update the course to reflect the changes
        if (course) {
          const updatedLessons = course.lessons.map((l) => {
            if (l.id === lessonId) {
              return result.lessonContent
            }
            return l
          })
          setCourse({ ...course, lessons: updatedLessons })
        }

        console.log("Lesson content generated successfully")
      } else {
        console.error("Failed to generate lesson content:", result.error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error("Error generating lesson content:", error)
    } finally {
      setIsGeneratingContent(false)
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

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }

  const submitQuiz = async () => {
    if (!lesson?.quiz || !user || !course) return

    let correctAnswers = 0
    const totalQuestions = lesson.quiz.questions.length

    lesson.quiz.questions.forEach((question) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / totalQuestions) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)

    // Update progress with quiz score
    const currentProgress = progress || {
      userId: user.id,
      courseId: course.id,
      completedLessons: [],
      quizScores: {},
      startedAt: new Date(),
      certificateIssued: false,
    }

    const updatedProgress = {
      ...currentProgress,
      quizScores: {
        ...currentProgress.quizScores,
        [lesson.id]: score,
      },
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
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

  // Show content generation loading state
  if (isGeneratingContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin absolute -top-2 -right-2" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Gerando Conteúdo da Aula</h2>
                    <p className="text-gray-600 max-w-md">
                      Nossa IA está criando um conteúdo personalizado e detalhado para esta aula. Isso pode levar alguns
                      segundos...
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    ✨ Criando conteúdo exclusivo para: <strong>{lesson.title}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild className="hover:bg-blue-50">
            <Link href={`/course/${course.id}`} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Curso
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Aula {currentLessonIndex + 1} de {course.lessons.length}
            </Badge>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Progresso do Curso</span>
              <span className="text-sm opacity-90">{Math.round(progressPercentage)}% concluído</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-white/20" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Lesson Header */}
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-3">{lesson.title}</CardTitle>
                    <p className="text-blue-100 text-lg mb-4">{lesson.objective}</p>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.duration || 45} minutos</span>
                      </div>
                      {lesson.quiz && (
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          <span>Quiz incluído</span>
                        </div>
                      )}
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Concluída
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {/* Lesson Content */}
                {lesson.content ? (
                  <>
                    <div className="prose prose-lg max-w-none mb-8">
                      <div
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: lesson.content
                            .replace(/\n/g, "<br>")
                            .replace(
                              /```(\w+)?\n([\s\S]*?)```/g,
                              '<div class="bg-gray-900 text-green-400 p-6 rounded-lg my-6 overflow-x-auto"><pre><code>$2</code></pre></div>',
                            )
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600 font-semibold">$1</strong>'),
                        }}
                      />
                    </div>

                    <Separator className="my-8" />

                    {/* Materials Section */}
                    {lesson.materials && (
                      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                            <BookOpen className="w-5 h-5" />
                            Material Complementar
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white p-4 rounded-lg">
                            <p className="text-blue-900 leading-relaxed">{lesson.materials}</p>
                            <div className="flex gap-2 mt-4">
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Baixar PDF
                              </Button>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2" />
                                Recursos
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Practice Section */}
                    {lesson.practice && (
                      <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                            <Lightbulb className="w-5 h-5" />
                            Desafio Prático
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white p-4 rounded-lg">
                            <p className="text-green-900 leading-relaxed mb-4">{lesson.practice}</p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Code className="w-4 h-4 mr-2" />
                                Abrir Editor
                              </Button>
                              <Button variant="outline" size="sm">
                                <Video className="w-4 h-4 mr-2" />
                                Ver Solução
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <Sparkles className="w-12 h-12 text-blue-500" />
                      <h3 className="text-xl font-semibold text-gray-900">Conteúdo será gerado automaticamente</h3>
                      <p className="text-gray-600 max-w-md">
                        O conteúdo desta aula será criado pela nossa IA quando você iniciar a aula pela primeira vez.
                      </p>
                      <Button onClick={() => generateLessonContent(lesson.id)} className="mt-4">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Conteúdo Agora
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex gap-3">
                    {!isCompleted && lesson.content && (
                      <Button
                        onClick={markLessonComplete}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Concluída
                      </Button>
                    )}

                    {lesson.quiz && lesson.content && (
                      <Button
                        variant="outline"
                        onClick={() => setShowQuiz(true)}
                        disabled={!isCompleted}
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {isCompleted ? "Fazer Quiz" : "Complete a aula para fazer o quiz"}
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={goToNextLesson}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {currentLessonIndex === course.lessons.length - 1 ? "Finalizar Curso" : "Próxima Aula"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Navegação do Curso</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {course.lessons.map((courseLesson, index) => {
                    const isCurrentLesson = courseLesson.id === lesson.id
                    const isLessonCompleted = progress?.completedLessons.includes(courseLesson.id) || false
                    const hasContent = courseLesson.content && courseLesson.content !== null

                    return (
                      <Link
                        key={courseLesson.id}
                        href={`/course/${course.id}/lesson/${courseLesson.id}`}
                        className={`block p-4 transition-all hover:bg-gray-50 ${
                          isCurrentLesson ? "bg-blue-50 border-r-4 border-blue-500" : ""
                        } ${index !== course.lessons.length - 1 ? "border-b" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {isLessonCompleted ? (
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                            ) : isCurrentLesson ? (
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <Play className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isCurrentLesson ? "text-blue-900" : "text-gray-900"
                              }`}
                            >
                              {courseLesson.title.replace(/^🚀|📊|🔄|⚡|🏗️|🌐|🔄|🎯/, "").trim()}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{courseLesson.duration || 45} min</span>
                              {courseLesson.quiz && hasContent && (
                                <Badge variant="outline" className="text-xs">
                                  Quiz
                                </Badge>
                              )}
                              {!hasContent && (
                                <Badge variant="outline" className="text-xs text-blue-600">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Quiz Modal */}
      {showQuiz && lesson.quiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quiz da Aula: {lesson.title}
              </CardTitle>
              <p className="text-purple-100">
                {lesson.quiz.questions.length} pergunta(s) • {quizSubmitted ? "Concluído" : "Em andamento"}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {!quizSubmitted ? (
                <>
                  <div className="space-y-6">
                    {lesson.quiz.questions.map((question, index) => (
                      <Card key={question.id} className="border-2 border-gray-100">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {index + 1}. {question.question}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={optionIndex}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  quizAnswers[question.id] === optionIndex
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  checked={quizAnswers[question.id] === optionIndex}
                                  onChange={() => handleQuizAnswer(question.id, optionIndex)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="flex-1">{option}</span>
                              </label>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-8 pt-6 border-t">
                    <Button variant="outline" onClick={() => setShowQuiz(false)}>
                      Fechar
                    </Button>
                    <Button
                      onClick={submitQuiz}
                      disabled={Object.keys(quizAnswers).length !== lesson.quiz.questions.length}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Enviar Respostas
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      quizScore >= 70 ? "bg-green-100" : "bg-orange-100"
                    }`}
                  >
                    <span className={`text-3xl font-bold ${quizScore >= 70 ? "text-green-600" : "text-orange-600"}`}>
                      {quizScore}%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{quizScore >= 70 ? "Parabéns!" : "Continue tentando!"}</h3>
                  <p className="text-gray-600 mb-6">
                    {quizScore >= 70
                      ? "Você passou no quiz com sucesso!"
                      : "Você pode tentar novamente para melhorar sua pontuação."}
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setShowQuiz(false)}>
                      Fechar
                    </Button>
                    {quizScore < 70 && (
                      <Button
                        onClick={() => {
                          setQuizSubmitted(false)
                          setQuizAnswers({})
                          setQuizScore(null)
                        }}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
