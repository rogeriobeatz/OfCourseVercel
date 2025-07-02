"use client"

import { useAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  BookOpen,
  Clock,
  Play,
  Plus,
  Search,
  Filter,
  Users,
  Star,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
  Award,
  Target,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  getCoursesByUser,
  getAllUserProgress,
  dbCourseToAppCourse,
  dbProgressToAppProgress,
  deleteCourse,
} from "@/lib/database"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

const categories = [
  "Todos",
  "Tecnologia",
  "Negócios",
  "Design",
  "Marketing",
  "Desenvolvimento Pessoal",
  "Idiomas",
  "Saúde",
  "Arte",
  "Música",
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [isLoading, setIsLoading] = useState(true)
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadCourses()
    }
  }, [user, loading, router])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedCategory])

  const loadCourses = async () => {
    try {
      setIsLoading(true)
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
          category: dbCourse.category || "Tecnologia",
          progress: progressPercentage,
          completedLessons,
          totalLessons,
          isStarted: !!appProgress,
          students: Math.floor(Math.random() * 1000) + 50,
          rating: (Math.random() * 2 + 3).toFixed(1),
        }
      })

      setCourses(coursesWithProgress)
    } catch (error) {
      console.error("Error loading courses:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar cursos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "Todos") {
      filtered = filtered.filter((course) => course.category === selectedCategory)
    }

    setFilteredCourses(filtered)
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      setDeletingCourse(courseId)
      await deleteCourse(courseId)

      setCourses((prev) => prev.filter((course) => course.id !== courseId))

      toast({
        title: "Curso excluído",
        description: "O curso foi removido com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Erro",
        description: "Falha ao excluir curso",
        variant: "destructive",
      })
    } finally {
      setDeletingCourse(null)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalCourses = courses.length
  const completedCourses = courses.filter((c) => c.progress === 100).length
  const inProgressCourses = courses.filter((c) => c.progress > 0 && c.progress < 100).length
  const totalHours = courses.reduce((acc, course) => acc + course.totalLessons * 0.75, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Olá, {user.name.split(" ")[0]}! 👋</h1>
          <p className="text-gray-600">Continue sua jornada de aprendizado ou crie um novo curso personalizado</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Cursos</p>
                  <p className="text-2xl font-bold">{totalCourses}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{completedCourses}</p>
                </div>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Progresso</p>
                  <p className="text-2xl font-bold text-orange-600">{inProgressCourses}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horas de Estudo</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(totalHours)}h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                asChild
                className="h-auto p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/create-course" className="flex flex-col items-center gap-2">
                  <Plus className="w-6 h-6" />
                  <span className="font-medium">Criar Novo Curso</span>
                  <span className="text-xs opacity-90">Com IA personalizada</span>
                </Link>
              </Button>

              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <Link href="/explore" className="flex flex-col items-center gap-2">
                  <Target className="w-6 h-6" />
                  <span className="font-medium">Explorar Cursos</span>
                  <span className="text-xs text-gray-500">Descubra novos temas</span>
                </Link>
              </Button>

              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <Link href="/certificates" className="flex flex-col items-center gap-2">
                  <Award className="w-6 h-6" />
                  <span className="font-medium">Meus Certificados</span>
                  <span className="text-xs text-gray-500">Conquistas obtidas</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Courses Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Meus Cursos</h2>
            <p className="text-gray-600">Gerencie e acompanhe seus cursos</p>
          </div>
          <Button
            asChild
            className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Link href="/create-course" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar Novo Curso
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {courses.length === 0 ? "Nenhum curso criado ainda" : "Nenhum curso encontrado"}
            </h3>
            <p className="text-gray-600 mb-6">
              {courses.length === 0
                ? "Comece criando seu primeiro curso com nossa IA"
                : "Tente ajustar os filtros de busca"}
            </p>
            {courses.length === 0 && (
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/create-course">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Curso
                </Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/course/${course.id}`)}
              >
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/80" />
                  </div>
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800">{course.category}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                        <Link href={`/course/${course.id}/edit`} className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Editar Curso
                        </Link>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir Curso
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir curso</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o curso "{course.title}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCourse(course.id)}
                              disabled={deletingCourse === course.id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingCourse === course.id ? "Excluindo..." : "Excluir"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-2">{course.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">
                        {course.completedLessons}/{course.totalLessons} aulas
                      </span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      className="flex-1 bg-transparent"
                      variant="outline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/course/${course.id}`}>Ver Curso</Link>
                    </Button>
                    <Button asChild className="flex-1" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/course/${course.id}/lesson/${course.lessons[0]?.id || "lesson-1"}`}
                        className="flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {course.isStarted ? "Continuar" : "Começar"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
