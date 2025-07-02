import { createClient } from "@supabase/supabase-js"

// ---------- Supabase connection ----------
// URL is always required
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Prefer the service-role key when present (server contexts),
// otherwise gracefully fall back to the public anon key (browser / preview)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Throw early if, for some reason, neither key is defined
if (!supabaseServiceKey) {
  throw new Error("No Supabase key found. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set.")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at: string
}

export interface DbCourse {
  id: string
  title: string
  description: string
  level: string
  duration: string
  format: string
  lessons: any[]
  created_by: string
  created_at: string
  updated_at: string
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
}

export interface DbUserProgress {
  user_id: string
  course_id: string
  completed_lessons: string[]
  quiz_scores: Record<string, number>
  started_at: string
  completed_at?: string
  certificate_issued: boolean
  current_lesson_id?: string
}

// Mapear valores em português para inglês (conforme constraint do DB)
function mapLevelToDb(level: string): string {
  const mapping: Record<string, string> = {
    iniciante: "beginner",
    basico: "basic",
    intermediario: "intermediate",
    avancado: "advanced",
  }
  return mapping[level] || level
}

function mapFormatToDb(format: string): string {
  const mapping: Record<string, string> = {
    texto: "text",
    video: "video",
    pratica: "practice",
    misto: "mixed",
  }
  return mapping[format] || format
}

export async function createUser(userData: Omit<User, "id" | "created_at">) {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          ...userData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }

    return data
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }

    return data
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function updateUser(id: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function saveCourse(courseData: any, userId: string) {
  try {
    console.log("Salvando curso no banco:", { courseData, userId })

    const courseToSave = {
      title: courseData.title,
      description: courseData.description,
      level: mapLevelToDb(courseData.level),
      duration: courseData.duration,
      format: mapFormatToDb(courseData.format),
      lessons: courseData.lessons || [],
      created_by: userId,
      category: courseData.category || "Geral",
      total_lessons: courseData.lessons?.length || 0,
      estimated_hours: Math.ceil((courseData.lessons?.length || 0) * 0.75),
      difficulty_score: courseData.level === "advanced" ? 5 : courseData.level === "intermediate" ? 3 : 1,
      enrollment_count: 0,
      rating_average: 0,
      rating_count: 0,
      is_featured: false,
      is_archived: false,
      price: 0,
      currency: "BRL",
    }

    const { data, error } = await supabase.from("courses").insert([courseToSave]).select().single()

    if (error) {
      console.error("Supabase error details in saveCourse:", error)
      throw error
    }

    console.log("Curso salvo com sucesso:", data)
    return data
  } catch (error) {
    console.error("Error saving course:", error)
    throw error
  }
}

export async function getCoursesByUser(userId: string): Promise<DbCourse[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting courses by user:", error)
    throw error
  }
}

export async function getCourseById(id: string): Promise<DbCourse | null> {
  try {
    const { data, error } = await supabase.from("courses").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }

    return data
  } catch (error) {
    console.error("Error getting course by id:", error)
    return null
  }
}

export async function updateCourse(id: string, updates: Partial<DbCourse>) {
  try {
    const { data, error } = await supabase
      .from("courses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating course:", error)
    throw error
  }
}

export async function deleteCourse(id: string) {
  try {
    const { error } = await supabase.from("courses").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting course:", error)
    throw error
  }
}

export async function getUserProgress(userId: string, courseId: string): Promise<DbUserProgress | null> {
  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }

    return data
  } catch (error) {
    console.error("Error getting user progress:", error)
    return null
  }
}

export async function getAllUserProgress(userId: string): Promise<DbUserProgress[]> {
  try {
    const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting all user progress:", error)
    return []
  }
}

export async function saveUserProgress(progress: DbUserProgress) {
  try {
    const { data, error } = await supabase
      .from("user_progress")
      .upsert([progress], { onConflict: "user_id,course_id" })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error saving user progress:", error)
    throw error
  }
}

// Helper functions for type conversion
export function dbCourseToAppCourse(dbCourse: DbCourse): any {
  return {
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    level: dbCourse.level,
    duration: dbCourse.duration,
    format: dbCourse.format,
    lessons: dbCourse.lessons || [],
    createdBy: dbCourse.created_by,
    createdAt: dbCourse.created_at,
    category: dbCourse.category,
  }
}

export function dbProgressToAppProgress(dbProgress: DbUserProgress): any {
  return {
    userId: dbProgress.user_id,
    courseId: dbProgress.course_id,
    completedLessons: dbProgress.completed_lessons || [],
    quizScores: dbProgress.quiz_scores || {},
    startedAt: new Date(dbProgress.started_at),
    completedAt: dbProgress.completed_at ? new Date(dbProgress.completed_at) : undefined,
    certificateIssued: dbProgress.certificate_issued,
    currentLessonId: dbProgress.current_lesson_id,
  }
}

// Alias for compatibility
export const getCourse = getCourseById
