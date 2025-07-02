"use server"

import { generateCourseWithAI } from "@/lib/gemini"
import { saveCourse } from "@/lib/database"

export interface CourseGenerationData {
  objetivo: string
  nivel: "iniciante" | "basico" | "intermediario" | "avancado"
  formato: "texto" | "video" | "pratica" | "misto"
  tempo: string // horas por semana
  duracao: string // semanas de duração
  comentarios?: string
}

interface BasicCourse {
  id: string
  title: string
  description: string
}

export async function generateCourseAction(
  data: CourseGenerationData,
  userId: string,
): Promise<{ success: boolean; course?: BasicCourse; error?: string }> {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Usuário inválido." }
  }

  if (!data?.objetivo || !data?.formato) {
    return { success: false, error: "Dados insuficientes para gerar o curso." }
  }

  try {
    console.log("Iniciando geração de curso para usuário:", userId)
    console.log("Dados do formulário:", data)

    const generatedCourse = await generateCourseWithAI({
      objetivo: data.objetivo,
      nivel: data.nivel,
      formato: data.formato,
      tempo: data.tempo,
      duracao: data.duracao,
      comentarios: data.comentarios ?? "",
    })

    console.log("Estrutura gerada pela IA:", generatedCourse.title)

    const lessonsForDb = generatedCourse.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      objective: lesson.objective,
      order: lesson.order,
      duration: 45,
      content: null,
      materials: null,
      practice: null,
      quiz: null,
    }))

    const savedCourse = await saveCourse(
      {
        title: generatedCourse.title,
        description: generatedCourse.description,
        duration: generatedCourse.duration,
        level: generatedCourse.level,
        format: data.formato,
        lessons: lessonsForDb,
        created_by: userId,
        is_public: true,
        category: "Tecnologia",
      },
      userId,
    )

    if (!savedCourse) {
      throw new Error("Falha ao salvar curso no banco de dados.")
    }

    console.log("Curso salvo com sucesso:", savedCourse.id)

    return {
      success: true,
      course: {
        id: savedCourse.id,
        title: savedCourse.title,
        description: savedCourse.description,
      },
    }
  } catch (error) {
    console.error("Erro ao gerar curso:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao gerar curso.",
    }
  }
}
