"use server"

import { generateLessonContentOnDemand } from "@/lib/gemini"
import { getCourseById, updateCourse } from "@/lib/database"

export async function generateLessonContentAction(
  courseId: string,
  lessonId: string,
): Promise<{ success: boolean; lessonContent?: any; error?: string }> {
  try {
    console.log(`Generating content for lesson ${lessonId} in course ${courseId}`)

    // Get course data
    const course = await getCourseById(courseId)
    if (!course) {
      throw new Error("Curso não encontrado")
    }

    // Find the specific lesson
    const lesson = course.lessons.find((l: any) => l.id === lessonId)
    if (!lesson) {
      throw new Error("Aula não encontrada")
    }

    // Check if content already exists
    if (lesson.content && lesson.content !== null) {
      console.log("Content already exists for lesson:", lessonId)
      return {
        success: true,
        lessonContent: lesson,
      }
    }

    // Generate lesson content with AI
    const generatedContent = await generateLessonContentOnDemand(
      lesson.title,
      lesson.objective,
      course.title,
      course.level,
      lesson.order || 1,
    )

    // Update the lesson with generated content
    const updatedLessons = course.lessons.map((l: any) => {
      if (l.id === lessonId) {
        return {
          ...l,
          content: generatedContent.content,
          materials: generatedContent.materials,
          practice: generatedContent.practice,
          duration: generatedContent.duration,
          quiz: generatedContent.quiz,
        }
      }
      return l
    })

    // Update course in database
    const updatedCourse = await updateCourse(courseId, {
      lessons: updatedLessons,
    })

    if (!updatedCourse) {
      throw new Error("Falha ao atualizar curso com conteúdo da aula")
    }

    const updatedLesson = updatedLessons.find((l: any) => l.id === lessonId)

    console.log(`Content generated successfully for lesson: ${lessonId}`)

    return {
      success: true,
      lessonContent: updatedLesson,
    }
  } catch (error) {
    console.error("Error in generateLessonContentAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao gerar conteúdo da aula",
    }
  }
}
