"use server"

import { generateLessonContentOnDemand } from "@/lib/gemini"
import { getCourseById, updateCourse } from "@/lib/database"

export async function generateLessonContentAction(courseId: string, lessonId: string) {
  try {
    console.log(`Gerando conteúdo para aula ${lessonId} do curso ${courseId}`)

    // Buscar curso no banco
    const course = await getCourseById(courseId)
    if (!course) {
      throw new Error("Curso não encontrado")
    }

    // Encontrar a aula específica
    const lesson = course.lessons.find((l: any) => l.id === lessonId)
    if (!lesson) {
      throw new Error("Aula não encontrada")
    }

    // Verificar se já tem conteúdo
    if (lesson.content) {
      console.log("Aula já possui conteúdo, retornando existente")
      return {
        success: true,
        content: lesson,
      }
    }

    // Gerar conteúdo com IA
    const generatedContent = await generateLessonContentOnDemand(
      lesson.title,
      lesson.objective,
      course.title,
      course.level,
    )

    // Atualizar a aula no array de lessons
    const updatedLessons = course.lessons.map((l: any) => {
      if (l.id === lessonId) {
        return {
          ...l,
          content: generatedContent.content,
          materials: generatedContent.materials,
          practice: generatedContent.practice,
          quiz: generatedContent.quiz,
          duration: generatedContent.duration,
        }
      }
      return l
    })

    // Salvar no banco
    await updateCourse(courseId, { lessons: updatedLessons })

    console.log("Conteúdo da aula gerado e salvo com sucesso")

    return {
      success: true,
      content: {
        ...lesson,
        content: generatedContent.content,
        materials: generatedContent.materials,
        practice: generatedContent.practice,
        quiz: generatedContent.quiz,
        duration: generatedContent.duration,
      },
    }
  } catch (error) {
    console.error("Erro ao gerar conteúdo da aula:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
