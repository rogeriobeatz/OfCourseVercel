export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
}

export interface Course {
  id: string
  title: string
  description: string
  duration: string
  level: "iniciante" | "basico" | "intermediario" | "avancado"
  format: string
  lessons: Lesson[]
  createdAt: Date
  completedBy?: string[]
}

export interface Lesson {
  id: string
  title: string
  objective: string
  content: string
  materials: string
  practice: string
  quiz?: Quiz
  videoUrl?: string
  duration: number
  order: number
}

export interface Quiz {
  id: string
  questions: Question[]
}

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface UserProgress {
  userId: string
  courseId: string
  completedLessons: string[]
  quizScores: { [lessonId: string]: number }
  startedAt: Date
  completedAt?: Date
  certificateIssued: boolean
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  issuedAt: Date
  studentName: string
  courseName: string
}
