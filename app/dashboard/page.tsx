"use client"

import { useAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Trophy, TrendingUp, Play, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCoursesByUser, getAllUserProgress, dbCourseToAppCourse, dbProgressToAppProgress } from "@/lib/database"

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userCourses, setUserCourses] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHours: 0,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      const [dbCourses, dbProgress] = await Promise.all([getCoursesByUser(user.id), getAllUserProgress(user.id)])

      const coursesWithProgress = dbCourses.map((dbCourse) => {
        const course = dbCourseToAppCourse(dbCourse)
        const progress = dbProgress.find((p) => p.course_id === course.id)
        const appProgress = progress ? dbProgressToAppProgress(progress) : null

        const completedLessons = appProgress?.completedLessons.length || 0
        const totalLessons = course.lessons.length
        const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

        return {
          ...course,
          progress: progressPercentage,
          completedLessons,
          totalLessons,
          isStarted: !!appProgress,
        }
      })

      setUserCourses(coursesWithProgress)

      // Calculate stats
      const newStats = {
        totalCourses: coursesWithProgress.length,
        completedCourses: coursesWithProgress.filter((c) => c.progress === 100).length,
        inProgressCourses: coursesWithProgress.filter((c) => c.progress > 0 && c.progress < 100).length,
        totalHours:
          coursesWithProgress.reduce((acc, course) => {
            return (
              acc + course.lessons.reduce((lessonAcc: number, lesson: any) => lessonAcc + (lesson.duration || 45), 0)
            )
          }, 0) / 60,
      }
      setStats(newStats)
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Olá, {user.name}! 👋</h1>
          <p className="text-gray-600">Continue sua jornada de aprendizado</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  <p className="text-sm text-gray-600">Cursos Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedCourses}</p>
                  <p className="text-sm text-gray-600">Cursos Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgressCourses}</p>
                  <p className="text-sm text-gray-600">Em Progresso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.totalHours)}h</p>
                  <p className="text-sm text-gray-600">Total de Conteúdo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cursos em Progresso */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Meus Cursos</h2>
              <Button asChild>
                <Link href="/create-course" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Novo Curso
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {userCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {course.duration}
                          </span>
                          <span className="capitalize">{course.level}</span>
                          <span>{course.totalLessons} aulas</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso</span>
                            <span>
                              {course.completedLessons}/{course.totalLessons} aulas
                            </span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button asChild size="sm">
                          <Link href={`/course/${course.id}`} className="flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            {course.isStarted ? "Continuar" : "Começar"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar com atividade recente */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Atividade Recente</h2>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conquistas</CardTitle>
                <CardDescription>Seus marcos de aprendizado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.completedCourses > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Trophy className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium">Primeiro Curso Concluído!</p>
                      <p className="text-sm text-gray-600">Parabéns pelo marco</p>
                    </div>
                  </div>
                )}

                {stats.inProgressCourses > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Estudante Ativo</p>
                      <p className="text-sm text-gray-600">{stats.inProgressCourses} curso(s) em andamento</p>
                    </div>
                  </div>
                )}

                {stats.totalCourses === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhum curso criado ainda</p>
                    <Button asChild size="sm">
                      <Link href="/create-course">Criar Primeiro Curso</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
