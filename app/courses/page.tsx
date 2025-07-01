"use client"

import { useAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Play, Plus, Search, Filter, Users, Star, Edit, Trash2, MoreVertical } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCoursesByUser, getAllUserProgress, dbCourseToAppCourse, dbProgressToAppProgress } from "@/lib/database"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [isLoading, setIsLoading] = useState(true)

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
          students: Math.floor(Math.random() * 1000) + 50, // Mock data
          rating: (Math.random() * 2 + 3).toFixed(1), // Mock rating 3-5
        }
      })

      setCourses(coursesWithProgress)
    } catch (error) {
      console.error("Error loading courses:", error)
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

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Cursos</h1>
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
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/80" />
                  </div>
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800">{course.category}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="absolute top-3 right-3 bg-white/90 hover:bg-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/course/${course.id}/edit`} className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Editar Curso
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                        <Trash2 className="w-4 h-4" />
                        Excluir Curso
                      </DropdownMenuItem>
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
                    <Button asChild className="flex-1 bg-transparent" variant="outline">
                      <Link href={`/course/${course.id}`}>Ver Curso</Link>
                    </Button>
                    <Button asChild className="flex-1">
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
    </div>
  )
}
