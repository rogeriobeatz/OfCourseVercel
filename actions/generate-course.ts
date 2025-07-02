"use server"

import { generateCourseWithAI } from "@/lib/gemini"
import { saveCourse } from "@/lib/database"

export interface CourseGenerationData {
  objetivo: string
  nivel: "iniciante" | "basico" | "intermediario" | "avancado"
  formato: "texto" | "video" | "pratica" | "misto"
  tempo: string
  duracao: string
  comentarios?: string
}

export async function generateCourseAction(data: CourseGenerationData, userId: string) {
  try {
    console.log("Gerando curso com dados:", data)

    // Validação
    if (!data.objetivo || !data.nivel || !data.formato || !data.tempo || !data.duracao) {
      throw new Error("Dados insuficientes para gerar o curso.")
    }

    if (!userId) {
      throw new Error("Usuário não autenticado.")
    }

    // Gerar curso com IA
    const generatedCourse = await generateCourseWithAI(data.objetivo, data.nivel, data.duracao)

    // Adicionar categoria baseada no objetivo
    const category = inferCategory(data.objetivo)
    generatedCourse.category = category

    // Salvar no banco
    const savedCourse = await saveCourse(generatedCourse, userId)

    console.log("Curso gerado e salvo com sucesso:", savedCourse.id)

    return {
      success: true,
      course: savedCourse,
    }
  } catch (error) {
    console.error("Erro ao gerar curso:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

function inferCategory(objetivo: string): string {
  const objetivo_lower = objetivo.toLowerCase()

  if (
    objetivo_lower.includes("programação") ||
    objetivo_lower.includes("código") ||
    objetivo_lower.includes("desenvolvimento")
  ) {
    return "Tecnologia"
  }
  if (objetivo_lower.includes("design") || objetivo_lower.includes("ui") || objetivo_lower.includes("ux")) {
    return "Design"
  }
  if (
    objetivo_lower.includes("marketing") ||
    objetivo_lower.includes("vendas") ||
    objetivo_lower.includes("publicidade")
  ) {
    return "Marketing"
  }
  if (
    objetivo_lower.includes("negócio") ||
    objetivo_lower.includes("empreendedorismo") ||
    objetivo_lower.includes("gestão")
  ) {
    return "Negócios"
  }
  if (objetivo_lower.includes("idioma") || objetivo_lower.includes("inglês") || objetivo_lower.includes("espanhol")) {
    return "Idiomas"
  }

  return "Desenvolvimento Pessoal"
}
