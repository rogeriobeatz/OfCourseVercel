"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  BookOpen,
  Clock,
  Download,
  Play,
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight,
  Brain,
  FileText,
  Target,
  Award,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { getCourse } from "@/lib/database"
import { generateLessonContentAction } from "@/actions/generate-lesson-content"
import type { Course } from "@/types/course"

interface LessonPageProps {
  params: {
    id: string
    lessonId: string
  }
}

export default function LessonPage({ params }: LessonPageProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  useEffect(() => {
    loadCourseAndLesson()
  }, [params.id, params.lessonId])

  const loadCourseAndLesson = async () => {
    try {
      setLoading(true)
      const courseData = await getCourse(params.id)
      setCourse(courseData)

      const lesson = courseData.lessons.find((l) => l.id === params.lessonId)
      if (!lesson) {
        throw new Error("Aula não encontrada")
      }

      setCurrentLesson(lesson)

      // Se a aula não tem conteúdo, gerar automaticamente
      if (!lesson.content) {
        await generateLessonContent()
      }
    } catch (error) {
      console.error("Erro ao carregar curso/aula:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar aula",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateLessonContent = async () => {
    try {
      setGeneratingContent(true)
      const result = await generateLessonContentAction(params.id, params.lessonId)

      if (result.success) {
        setCurrentLesson(result.content)
        toast({
          title: "Sucesso",
          description: "Conteúdo da aula gerado com sucesso!",
        })
      } else {
        toast({
          title: "Erro",
          description: result.error || "Falha ao gerar conteúdo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao gerar conteúdo",
        variant: "destructive",
      })
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleQuizSubmit = () => {
    if (!currentLesson?.quiz) return

    let correct = 0
    const questions = currentLesson.quiz.questions

    questions.forEach((question: any, index: number) => {
      if (quizAnswers[question.id] === question.correct) {
        correct++
      }
    })

    const score = Math.round((correct / questions.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)

    toast({
      title: score >= 70 ? "Parabéns!" : "Continue tentando!",
      description: `Você acertou ${correct} de ${questions.length} questões (${score}%)`,
      variant: score >= 70 ? "default" : "destructive",
    })
  }

  const resetQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(0)
  }

  const getCurrentLessonIndex = () => {
    if (!course) return -1
    return course.lessons.findIndex((l) => l.id === params.lessonId)
  }

  const getNextLesson = () => {
    if (!course) return null
    const currentIndex = getCurrentLessonIndex()
    return currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null
  }

  const getPreviousLesson = () => {
    if (!course) return null
    const currentIndex = getCurrentLessonIndex()
    return currentIndex > 0 ? course.lessons[currentIndex - 1] : null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando aula...</p>
        </div>
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aula não encontrada</p>
          <Link href="/dashboard">
            <Button className="mt-4">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/course/${params.id}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Curso
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
              <p className="text-gray-600">{course.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {!currentLesson.content && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Brain className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              )}
              <Badge variant="outline">
                Aula {getCurrentLessonIndex() + 1} de {course.lessons.length}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Course Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Progresso do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso</span>
                    <span>{Math.round(((getCurrentLessonIndex() + 1) / course.lessons.length) * 100)}%</span>
                  </div>
                  <Progress value={((getCurrentLessonIndex() + 1) / course.lessons.length) * 100} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Aulas</h4>
                  {course.lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={`/course/${params.id}/lesson/${lesson.id}`}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                        lesson.id === params.lessonId ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                      }`}
                    >
                      {lesson.id === params.lessonId ? (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="flex-1 truncate">{lesson.title}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Lesson Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Conteúdo da Aula
                    </CardTitle>
                    <CardDescription>{currentLesson.objective}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {currentLesson.duration || 45} min
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {generatingContent ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-semibold mb-2">Gerando conteúdo com IA...</h3>
                    <p className="text-gray-600">Isso pode levar alguns segundos</p>
                  </div>
                ) : currentLesson.content ? (
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: currentLesson.content.replace(/\n/g, "<br>"),
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Conteúdo será gerado com IA</h3>
                    <p className="text-gray-600 mb-6">
                      O conteúdo desta aula será criado automaticamente quando você acessá-la
                    </p>
                    <Button onClick={generateLessonContent} disabled={generatingContent}>
                      <Brain className="w-4 h-4 mr-2" />
                      Gerar Conteúdo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Materials */}
            {currentLesson.materials && currentLesson.materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Materiais de Apoio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentLesson.materials.map((material: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Download className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium">{material.title}</p>
                          <p className="text-sm text-gray-600">{material.type.toUpperCase()}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Practice */}
            {currentLesson.practice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Exercício Prático
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2">{currentLesson.practice.title}</h4>
                  <p className="text-gray-600 mb-4">{currentLesson.practice.description}</p>

                  {currentLesson.practice.steps && (
                    <div>
                      <h5 className="font-medium mb-2">Passos:</h5>
                      <ol className="list-decimal list-inside space-y-1">
                        {currentLesson.practice.steps.map((step: string, index: number) => (
                          <li key={index} className="text-gray-700">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quiz */}
            {currentLesson.quiz && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Quiz da Aula
                  </CardTitle>
                  <CardDescription>Teste seus conhecimentos sobre o conteúdo apresentado</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Quiz
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{currentLesson.quiz.title}</DialogTitle>
                        <DialogDescription>Responda todas as questões e clique em "Finalizar Quiz"</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {currentLesson.quiz.questions.map((question: any, index: number) => (
                          <div key={question.id} className="space-y-3">
                            <h4 className="font-medium">
                              {index + 1}. {question.question}
                            </h4>
                            <RadioGroup
                              value={quizAnswers[question.id]?.toString()}
                              onValueChange={(value) =>
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: Number.parseInt(value),
                                }))
                              }
                              disabled={quizSubmitted}
                            >
                              {question.options.map((option: string, optionIndex: number) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem value={optionIndex.toString()} id={`${question.id}-${optionIndex}`} />
                                  <Label
                                    htmlFor={`${question.id}-${optionIndex}`}
                                    className={`flex-1 ${
                                      quizSubmitted
                                        ? optionIndex === question.correct
                                          ? "text-green-600 font-medium"
                                          : quizAnswers[question.id] === optionIndex
                                            ? "text-red-600"
                                            : ""
                                        : ""
                                    }`}
                                  >
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}

                        {quizSubmitted && (
                          <div
                            className={`p-4 rounded-lg ${
                              quizScore >= 70
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <h4 className={`font-semibold ${quizScore >= 70 ? "text-green-800" : "text-red-800"}`}>
                              {quizScore >= 70 ? "Parabéns! Você passou!" : "Você pode tentar novamente"}
                            </h4>
                            <p className={`${quizScore >= 70 ? "text-green-700" : "text-red-700"}`}>
                              Sua pontuação: {quizScore}%{quizScore >= 70 ? " (Aprovado)" : " (Reprovado - mínimo 70%)"}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!quizSubmitted ? (
                            <Button
                              onClick={handleQuizSubmit}
                              disabled={Object.keys(quizAnswers).length !== currentLesson.quiz.questions.length}
                              className="flex-1"
                            >
                              Finalizar Quiz
                            </Button>
                          ) : (
                            <Button onClick={resetQuiz} variant="outline" className="flex-1 bg-transparent">
                              Tentar Novamente
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              {getPreviousLesson() ? (
                <Link href={`/course/${params.id}/lesson/${getPreviousLesson()!.id}`}>
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Aula Anterior
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {getNextLesson() ? (
                <Link href={`/course/${params.id}/lesson/${getNextLesson()!.id}`}>
                  <Button>
                    Próxima Aula
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/course/${params.id}`}>
                  <Button>
                    Finalizar Curso
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
