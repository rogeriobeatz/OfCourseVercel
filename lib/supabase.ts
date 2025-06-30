import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Disable auth session for now since we're using custom auth
      },
    })
  }
  return supabaseClient
}

// Server-side client with service role (for admin operations)
export function getSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabase = getSupabaseClient()

// Types for database
export interface DbUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  bio?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  location?: string
  timezone?: string
  preferred_language?: string
  email_notifications?: boolean
  push_notifications?: boolean
  is_active?: boolean
  is_premium?: boolean
  premium_expires_at?: string
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface DbCourse {
  id: string
  title: string
  description: string
  short_description?: string
  duration: string
  level: string
  format: string
  category?: string
  tags?: string[]
  thumbnail_url?: string
  cover_image_url?: string
  lessons: any[] // JSON field
  total_lessons?: number
  estimated_hours?: number
  difficulty_score?: number
  created_by: string
  created_at: string
  updated_at: string
  is_public: boolean
  is_featured?: boolean
  is_archived?: boolean
  price?: number
  currency?: string
  enrollment_count?: number
  rating_average?: number
  rating_count?: number
}

export interface DbUserProgress {
  id: string
  user_id: string
  course_id: string
  completed_lessons: string[]
  quiz_scores: Record<string, number>
  total_time_spent?: number
  current_lesson_id?: string
  current_lesson_position?: number
  completion_percentage?: number
  started_at: string
  last_accessed_at?: string
  completed_at?: string
  certificate_issued: boolean
  notes?: Record<string, string>
  bookmarks?: string[]
}

export interface DbCertificate {
  id: string
  user_id: string
  course_id: string
  student_name: string
  course_name: string
  course_duration?: string
  completion_date: string
  certificate_number: string
  certificate_url?: string
  verification_code: string
  is_verified?: boolean
  issued_at: string
  expires_at?: string
  template_used?: string
}
