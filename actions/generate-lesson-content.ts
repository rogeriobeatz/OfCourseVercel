"use server"

import { generateLessonContentOnDemand } from "@/lib/gemini"
import { getCourseById, updateCourse } from "@/lib/database"

export async function generateLessonContentAction(courseId: string, lessonId: string) {
  try {
    const course = await getCourseById(courseId)
    if (!course) throw new Error("Curso não encontrado")

    const lessonIdx = course.lessons.findIndex((l: any) => l.id === lessonId)
    if (lessonIdx === -1) throw new Error("Aula não encontrada")

    const lesson = course.lessons[lessonIdx]
    if (lesson.content) {
      return { success: true, ...lesson }
    }

    const generated = await generateLessonContentOnDemand(lesson.title, lesson.objective, course.title, course.level)

    /* merge & persist */
    const updatedLessons = [...course.lessons]
    updatedLessons[lessonIdx] = { ...lesson, ...generated }
    await updateCourse(courseId, { lessons: updatedLessons })

    return { success: true, ...updatedLessons[lessonIdx] }
  } catch (err: any) {
    console.error("generateLessonContentAction error:", err)
    return { success: false, error: err.message ?? "Erro desconhecido" }
  }
}
