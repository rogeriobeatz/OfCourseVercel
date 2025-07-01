"use client"

import { getSupabaseClient } from "./supabase"
import type { DbUser, DbCourse, DbUserProgress } from "./supabase"
import type { Course, UserProgress } from "@/types/course"

const supabase = getSupabaseClient()

// User operations
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
          avatar_url: userData.avatar_url,
          bio: userData.bio,
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
    console.error("Error getting user:", error)
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
    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

// Course operations
export async function saveCourse(courseData: {
  title: string
  description: string
  duration: string
  level: string
  format: string
  lessons: any[]
  created_by: string
  is_public?: boolean
  category?: string
}): Promise<DbCourse | null> {
  try {
    // Ensure lessons have simple, consistent IDs
    const processedLessons = courseData.lessons.map((lesson: any, index: number) => ({
      ...lesson,
      id: `lesson-${index + 1}`, // Simple, consistent ID
      order: index + 1,
      duration: lesson.duration || 45,
    }))

    const courseWithStats = {
      title: courseData.title,
      description: courseData.description,
      duration: courseData.duration,
      level: courseData.level,
      format: courseData.format,
      lessons: processedLessons,
      created_by: courseData.created_by,
      is_public: courseData.is_public ?? true,
      category: courseData.category || "Tecnologia",
      total_lessons: processedLessons.length,
      estimated_hours:
        Math.round(
          (processedLessons.reduce((acc: number, lesson: any) => acc + (lesson.duration || 45), 0) / 60) * 100,
        ) / 100,
      difficulty_score:
        courseData.level === "iniciante"
          ? 2
          : courseData.level === "basico"
            ? 4
            : courseData.level === "intermediario"
              ? 6
              : 8,
      enrollment_count: 0,
      rating_average: 0,
      rating_count: 0,
      is_featured: false,
      is_archived: false,
      price: 0,
      currency: "BRL",
    }

    const { data, error } = await supabase.from("courses").insert([courseWithStats]).select().single()
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error saving course:", error)
    return null
  }
}

export async function getCoursesByUser(userId: string): Promise<DbCourse[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("created_by", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting user courses:", error)
    return []
  }
}

export async function getCourseById(courseId: string): Promise<DbCourse | null> {
  try {
    const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).single()
    if (error && error.code !== "PGRST116") throw error
    return data
  } catch (error) {
    console.error("Error getting course:", error)
    return null
  }
}

export async function updateCourse(courseId: string, updates: Partial<DbCourse>): Promise<DbCourse | null> {
  try {
    const { data, error } = await supabase.from("courses").update(updates).eq("id", courseId).select().single()
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating course:", error)
    return null
  }
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("courses").update({ is_archived: true }).eq("id", courseId)
    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting course:", error)
    return false
  }
}

// Progress operations
export async function getUserProgress(userId: string, courseId: string): Promise<DbUserProgress | null> {
  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  } catch (error) {
    console.error("Error getting user progress:", error)
    return null
  }
}

export async function saveUserProgress(progressData: {
  user_id: string
  course_id: string
  completed_lessons: string[]
  quiz_scores: Record<string, number>
  started_at: string
  completed_at?: string
  certificate_issued: boolean
  current_lesson_id?: string
}): Promise<DbUserProgress | null> {
  try {
    const course = await getCourseById(progressData.course_id)
    const completionPercentage = course?.total_lessons
      ? (progressData.completed_lessons.length / course.total_lessons) * 100
      : 0

    const progressWithStats = {
      user_id: progressData.user_id,
      course_id: progressData.course_id,
      completed_lessons: progressData.completed_lessons,
      quiz_scores: progressData.quiz_scores,
      started_at: progressData.started_at,
      completed_at: progressData.completed_at,
      certificate_issued: progressData.certificate_issued,
      current_lesson_id: progressData.current_lesson_id,
      completion_percentage: Math.round(completionPercentage * 100) / 100,
      last_accessed_at: new Date().toISOString(),
      total_time_spent: 0,
      current_lesson_position: 0,
      notes: {},
      bookmarks: [],
    }

    const { data, error } = await supabase
      .from("user_progress")
      .upsert([progressWithStats], {
        onConflict: "user_id,course_id",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error saving user progress:", error)
    return null
  }
}

export async function getAllUserProgress(userId: string): Promise<DbUserProgress[]> {
  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .order("last_accessed_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting all user progress:", error)
    return []
  }
}

// Utility functions - SIMPLIFIED
export function dbCourseToAppCourse(dbCourse: DbCourse): Course {
  // Ensure lessons have consistent IDs
  const processedLessons = dbCourse.lessons.map((lesson: any, index: number) => ({
    ...lesson,
    id: lesson.id || `lesson-${index + 1}`, // Fallback to simple ID
    order: lesson.order || index + 1,
    duration: lesson.duration || 45,
    quiz: lesson.quiz
      ? {
          ...lesson.quiz,
          id: lesson.quiz.id || `quiz-${index + 1}`,
          questions:
            lesson.quiz.questions?.map((q: any, qIndex: number) => ({
              ...q,
              id: q.id || `q${qIndex + 1}`,
            })) || [],
        }
      : undefined,
  }))

  return {
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    duration: dbCourse.duration,
    level: dbCourse.level as any,
    format: dbCourse.format,
    lessons: processedLessons,
    createdAt: new Date(dbCourse.created_at),
    completedBy: [],
  }
}

export function dbProgressToAppProgress(dbProgress: DbUserProgress): UserProgress {
  return {
    userId: dbProgress.user_id,
    courseId: dbProgress.course_id,
    completedLessons: dbProgress.completed_lessons,
    quizScores: dbProgress.quiz_scores,
    startedAt: new Date(dbProgress.started_at),
    completedAt: dbProgress.completed_at ? new Date(dbProgress.completed_at) : undefined,
    certificateIssued: dbProgress.certificate_issued,
  }
}
