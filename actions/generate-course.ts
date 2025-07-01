"use server"

import { generateCourseWithAI, type CourseGenerationData } from "@/lib/gemini"
import { saveCourse } from "@/lib/database"

export async function generateCourseAction(
  data: CourseGenerationData,
  userId: string,
): Promise<{ success: boolean; course?: any; error?: string }> {
  try {
    console.log("Starting course generation for user:", userId)

    // Generate course structure with AI (without full lesson content)
    const generatedCourse = await generateCourseWithAI(data)

    console.log("Course structure generated:", generatedCourse.title)

    // Convert basic lessons to the format expected by the database
    const lessonsForDb = generatedCourse.lessons.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      objective: lesson.objective,
      order: lesson.order,
      duration: 45, // Default duration, will be updated when content is generated
      // Content will be generated on-demand, so we don't include it here
      content: null, // Explicitly null to indicate content needs to be generated
      materials: null,
      practice: null,
      quiz: null,
    }))

    // Save course to database
    const savedCourse = await saveCourse({
      title: generatedCourse.title,
      description: generatedCourse.description,
      duration: generatedCourse.duration,
      level: generatedCourse.level,
      format: data.formato,
      lessons: lessonsForDb,
      created_by: userId,
      is_public: true,
      category: "Tecnologia", // Default category, can be customized later
    })

    if (!savedCourse) {
      throw new Error("Falha ao salvar curso no banco de dados")
    }

    console.log("Course saved successfully:", savedCourse.id)

    return {
      success: true,
      course: {
        id: savedCourse.id,
        title: savedCourse.title,
        description: savedCourse.description,
      },
    }
  } catch (error) {
    console.error("Error in generateCourseAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
