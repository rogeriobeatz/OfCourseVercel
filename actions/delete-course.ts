"use server"

import { deleteCourse } from "@/lib/database"
import { revalidatePath } from "next/cache"

export async function deleteCourseAction(courseId: string) {
  try {
    const success = await deleteCourse(courseId)

    if (success) {
      revalidatePath("/dashboard")
      return { success: true }
    } else {
      return { success: false, error: "Falha ao excluir curso" }
    }
  } catch (error) {
    console.error("Erro ao excluir curso:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
