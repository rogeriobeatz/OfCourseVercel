import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/* ---------- helpers ---------- */
function decodeB64(b64: string | undefined) {
  if (!b64) return ""
  try {
    return Buffer.from(b64, "base64").toString("utf-8")
  } catch {
    return ""
  }
}

/**
 * Turns huge free-text fields into base-64 to keep JSON valid.
 * After parse we decode and move them back to their plain keys.
 */
export async function generateLessonContentOnDemand(
  lessonTitle: string,
  lessonObjective: string,
  courseTitle: string,
  courseLevel: string,
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  })

  const prompt = `
Você é um especialista em educação. Gere o CONTEÚDO COMPLETO da aula abaixo.
IMPORTANTÍSSIMO: para evitar erros de JSON use **Base64** nas grandes strings!

Curso: "${courseTitle}"
Nível: ${courseLevel}
Aula: "${lessonTitle}"
Objetivo: "${lessonObjective}"

Retorne APENAS um JSON válido com esta forma exata
{
 "content_b64":   <string – markdown completo em Base64>,
 "materials": [
   {
     "title": <string>,
     "type": "pdf" | "video" | "link",
     "url":  <string>,
     "description_b64": <string>              // opcional
   }
 ],
 "practice": {
   "title": <string>,
   "description_b64": <string>,
   "steps": [<string>, …]
 },
 "duration": <number>,                        // minutos
 "quiz": {
   "id": "quiz-1",
   "title": <string>,
   "questions": [
     {
       "id": "q1",
       "question": <string>,
       "options": [<string>, <string>, <string>, <string>],
       "correct": <number 0-3>
     }
   ]
 }
}

Nunca inclua campos extras nem comentários.
`
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const rawText = response.text().trim()

    /* Try to isolate the JSON (strip \`\`\`json fences if present) */
    const match = rawText.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonString = (match ? match[1] : rawText)
      .replace(/^[^{]*/, "") /* garbage before { */
      .replace(/[^}]*$/, "") /* garbage after } */

    const parsed = JSON.parse(jsonString)

    /* --- decode b64 fields back to plain text --- */
    parsed.content = decodeB64(parsed.content_b64)
    delete parsed.content_b64

    if (Array.isArray(parsed.materials)) {
      parsed.materials = parsed.materials.map((m: any) => ({
        ...m,
        description: decodeB64(m?.description_b64),
      }))
    }

    if (parsed.practice) {
      parsed.practice.description = decodeB64(parsed.practice?.description_b64)
      delete parsed.practice.description_b64
    }

    return parsed
  } catch (err) {
    console.error("Gemini JSON decode error → fallback:", err)

    /* minimal but still valid fallback */
    return {
      content: `# ${lessonTitle}\n\n${lessonObjective}`,
      materials: [],
      practice: {
        title: "Exercício",
        description: "Revise e resuma o conteúdo em 3 parágrafos.",
        steps: [],
      },
      duration: 45,
      quiz: {
        id: "quiz-1",
        title: "Quiz Rápido",
        questions: [
          {
            id: "q1",
            question: "Qual o objetivo principal desta aula?",
            options: ["Entender o tema", "Nada", "Dormir", "Todas"],
            correct: 0,
          },
        ],
      },
    }
  }
}

export async function generateCourseWithAI(topic: string, level: string, duration: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    })

    const prompt = `
Crie um curso sobre "${topic}" para nível ${level} com duração de ${duration}.

Retorne APENAS um JSON válido com esta estrutura:
{
  "title": "Título do curso",
  "description": "Descrição detalhada do curso",
  "duration": "${duration}",
  "level": "${level}",
  "format": "online",
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Título da Aula 1",
      "objective": "Objetivo específico da aula",
      "order": 1
    },
    {
      "id": "lesson-2", 
      "title": "Título da Aula 2",
      "objective": "Objetivo específico da aula",
      "order": 2
    }
  ]
}

Crie entre 5-8 aulas. Não inclua conteúdo, quiz ou materiais - apenas estrutura básica.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Resposta da IA:", text)

    // Tentar extrair JSON da resposta
    let jsonString = text.trim()

    // Se tem \`\`\`json, extrair apenas o conteúdo
    const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim()
    }

    // Remover possíveis caracteres extras no início/fim
    jsonString = jsonString.replace(/^[^{]*/, "").replace(/[^}]*$/, "")

    try {
      const courseData = JSON.parse(jsonString)
      console.log("Curso gerado com sucesso:", courseData)
      return courseData
    } catch (parseError) {
      console.error("Erro no parse do JSON:", parseError)
      console.log("JSON string:", jsonString)

      // Fallback com curso básico
      return {
        title: `Curso de ${topic}`,
        description: `Aprenda ${topic} de forma prática e eficiente neste curso completo.`,
        duration,
        level,
        format: "online",
        lessons: [
          {
            id: "lesson-1",
            title: "Introdução",
            objective: `Entender os fundamentos de ${topic}`,
            order: 1,
          },
          {
            id: "lesson-2",
            title: "Conceitos Básicos",
            objective: `Aprender os conceitos essenciais de ${topic}`,
            order: 2,
          },
          {
            id: "lesson-3",
            title: "Prática",
            objective: `Aplicar conhecimentos de ${topic} na prática`,
            order: 3,
          },
        ],
      }
    }
  } catch (error) {
    console.error("Erro ao gerar curso:", error)
    throw new Error("Falha ao gerar curso com IA")
  }
}
