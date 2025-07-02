import { getSupabaseClient } from "./supabase"
import type { Course, UserProgress } from "@/types/course"

// Usa anon key no client e service-role no server, evitando erro de variável não definida.
const supabase = getSupabaseClient()

// --- Enum maps para respeitar CHECK CONSTRAINTS do Supabase ---
const levelMap: Record<string, string> = {
  iniciante: "beginner",
  basico: "basic",
  intermediario: "intermediate",
  avancado: "advanced",
}

const formatMap: Record<string, string> = {
  texto: "text",
  video: "video",
  pratica: "practice",
  misto: "mixed",
}

// Database types
export interface DbCourse {
  id: string
  title: string
  description: string
  level: string
  duration: string
  lessons: any[]
  created_at: string
  updated_at: string
  created_by: string // Changed from user_id to created_by to match schema
  category?: string
  total_lessons: number
  estimated_hours: number
  difficulty_score: number
  enrollment_count: number
  rating_average: number
  rating_count: number
  is_featured: boolean
  is_archived: boolean
  price: number
  currency: string
  format: string // Added format to DbCourse
}

export interface DbUserProgress {
  id: string
  user_id: string
  course_id: string
  completed_lessons: string[]
  quiz_scores: Record<string, number>
  started_at: string
  completed_at?: string
  certificate_issued: boolean
  current_lesson_id?: string
}

export interface DbUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  bio?: string
  is_active: boolean
  created_at: string
  updated_at: string
  email_notifications: boolean
  push_notifications: boolean
  preferred_language: string
  timezone: string
}

// ---------- USER OPERATIONS ----------
export async function createUser(userData: {
  email: string
  name: string
  avatar_url?: string
  bio?: string
}): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url ?? null,
          bio: userData.bio ?? null,
          is_active: true,
          email_notifications: true,
          push_notifications: true,
          preferred_language: "pt-BR",
          timezone: "America/Sao_Paulo",
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()
    if (error && error.code !== "PGRST116") throw error
    return data
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function getUserById(userId: string): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
    if (error && error.code !== "PGRST116") throw error
    return data
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

export async function updateUser(userId: string, updates: Partial<DbUser>): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}
// ---------- END USER OPERATIONS ----------

// Convert database course to app course
export function dbCourseToAppCourse(dbCourse: DbCourse): Course {
  return {
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    level: dbCourse.level as any, // Cast to any to match Course interface
    duration: dbCourse.duration,
    format: dbCourse.format, // Ensure format is mapped
    lessons: dbCourse.lessons.map((lesson, index) => ({
      id: lesson.id || `lesson-${index + 1}`,
      title: lesson.title,
      objective: lesson.objective,
      content: lesson.content || null,
      materials: lesson.materials || null,
      practice: lesson.practice || null,
      duration: lesson.duration || 45,
      order: lesson.order || index + 1,
      quiz: lesson.quiz || null,
    })),
    createdAt: new Date(dbCourse.created_at),
    updatedAt: new Date(dbCourse.updated_at),
  }
}

// Convert database progress to app progress
export function dbProgressToAppProgress(dbProgress: DbUserProgress): UserProgress {
  return {
    userId: dbProgress.user_id,
    courseId: dbProgress.course_id,
    completedLessons: dbProgress.completed_lessons || [],
    quizScores: dbProgress.quiz_scores || {},
    startedAt: new Date(dbProgress.started_at),
    completedAt: dbProgress.completed_at ? new Date(dbProgress.completed_at) : undefined,
    certificateIssued: dbProgress.certificate_issued || false,
  }
}

// Save course to database
export async function saveCourse(
  courseData: {
    title: string
    description: string
    duration: string
    level: string
    format: string
    lessons: any[]
    created_by: string
    is_public?: boolean
    category?: string
  },
  userId: string, // Ensure userId is passed and used
): Promise<Course> {
  try {
    // Calculate derived fields for the database
    const totalLessons = courseData.lessons.length
    const estimatedHours =
      Math.round(
        (courseData.lessons.reduce((acc: number, lesson: any) => acc + (lesson.duration || 45), 0) / 60) * 100,
      ) / 100
    const difficultyScore =
      courseData.level === "iniciante"
        ? 2
        : courseData.level === "basico"
          ? 4
          : courseData.level === "intermediario"
            ? 6
            : 8

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: courseData.title,
        description: courseData.description,
        // Converte nível e formato para strings aceitas pelo banco
        level: levelMap[courseData.level] ?? courseData.level,
        duration: courseData.duration,
        format: formatMap[courseData.format] ?? courseData.format,
        lessons: courseData.lessons,
        created_by: userId,
        is_public: courseData.is_public ?? true,
        category: courseData.category || "Tecnologia",
        total_lessons: totalLessons,
        estimated_hours: estimatedHours,
        difficulty_score: difficultyScore,
        enrollment_count: 0,
        rating_average: 0,
        rating_count: 0,
        is_featured: false,
        is_archived: false,
        price: 0,
        currency: "BRL",
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error details in saveCourse:", error)
      throw error // Re-throw to be caught by the outer try-catch in generateCourseAction
    }

    return dbCourseToAppCourse(data)
  } catch (error) {
    console.error("Error in saveCourse function:", error)
    throw new Error(
      "Falha ao salvar curso no banco de dados: " + (error instanceof Error ? error.message : "Erro desconhecido"),
    )
  }
}

// Get course by ID
export async function getCourseById(courseId: string): Promise<DbCourse | null> {
  const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).single()

  if (error) {
    console.error("Error getting course:", error)
    return null
  }

  return data
}

// Update course
export async function updateCourse(courseId: string, updates: Partial<DbCourse>): Promise<DbCourse | null> {
  const { data, error } = await supabase
    .from("courses")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .select()
    .single()

  if (error) {
    console.error("Error updating course:", error)
    return null
  }

  return data
}

// Delete course
export async function deleteCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase.from("courses").delete().eq("id", courseId)

  if (error) {
    console.error("Error deleting course:", error)
    return false
  }

  return true
}

// Get courses by user
export async function getCoursesByUser(userId: string): Promise<DbCourse[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("created_by", userId) // Corrected column name to created_by
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting courses by user:", error)
    return []
  }

  return data || []
}

// Get user progress
export async function getUserProgress(userId: string, courseId: string): Promise<DbUserProgress | null> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No progress found, return null
      return null
    }
    console.error("Error getting user progress:", error)
    return null
  }

  return data
}

// Get all user progress
export async function getAllUserProgress(userId: string): Promise<DbUserProgress[]> {
  const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error getting all user progress:", error)
    return []
  }

  return data || []
}

// Save user progress
export async function saveUserProgress(progress: Omit<DbUserProgress, "id">): Promise<DbUserProgress | null> {
  const { data, error } = await supabase
    .from("user_progress")
    .upsert({
      user_id: progress.user_id,
      course_id: progress.course_id,
      completed_lessons: progress.completed_lessons,
      quiz_scores: progress.quiz_scores,
      started_at: progress.started_at,
      completed_at: progress.completed_at,
      certificate_issued: progress.certificate_issued,
      current_lesson_id: progress.current_lesson_id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving user progress:", error)
    return null
  }

  return data
}

// Get course for public access (used in lesson pages)
export async function getCourse(courseId: string): Promise<Course> {
  const dbCourse = await getCourseById(courseId)
  if (!dbCourse) {
    throw new Error("Curso não encontrado")
  }
  return dbCourseToAppCourse(dbCourse)
}
