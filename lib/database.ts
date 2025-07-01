import { getSupabaseClient } from "./supabase"
import type { Course, UserProgress } from "@/types/course"

// Usa anon key no client e service-role no server, evitando erro de variável não definida.
const supabase = getSupabaseClient()

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
  created_by: string
  category?: string
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
    level: dbCourse.level,
    duration: dbCourse.duration,
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
  course: Omit<Course, "id" | "createdAt" | "updatedAt">,
  userId: string,
): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title: course.title,
      description: course.description,
      level: course.level,
      duration: course.duration,
      lessons: course.lessons.map((lesson, index) => ({
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
      created_by: userId,
      category: "Tecnologia", // Default category
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving course:", error)
    throw new Error("Falha ao salvar curso")
  }

  return dbCourseToAppCourse(data)
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
    .eq("created_by", userId)
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
