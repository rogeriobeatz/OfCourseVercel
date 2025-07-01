import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

    // Se tem ```json, extrair apenas o conteúdo
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

export async function generateLessonContentOnDemand(
  lessonTitle: string,
  lessonObjective: string,
  courseTitle: string,
  courseLevel: string,
) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    })

    const prompt = `
Gere o conteúdo completo para esta aula:

Curso: "${courseTitle}"
Nível: ${courseLevel}
Aula: "${lessonTitle}"
Objetivo: "${lessonObjective}"

Retorne APENAS um JSON válido com esta estrutura:
{
  "content": "Conteúdo da aula em markdown (800-1200 palavras)",
  "materials": [
    {
      "title": "Nome do material",
      "type": "pdf",
      "url": "#"
    }
  ],
  "practice": {
    "title": "Exercício Prático",
    "description": "Descrição do exercício",
    "steps": ["Passo 1", "Passo 2"]
  },
  "quiz": {
    "id": "quiz-1",
    "title": "Quiz da Aula",
    "questions": [
      {
        "id": "q1",
        "question": "Pergunta?",
        "options": ["A", "B", "C", "D"],
        "correct": 0
      }
    ]
  },
  "duration": 45
}

O conteúdo deve ser educativo, bem estruturado e adequado ao nível ${courseLevel}.
Crie 3-4 perguntas no quiz.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Resposta da IA para conteúdo:", text.substring(0, 500) + "...")

    // Tentar extrair JSON da resposta
    let jsonString = text.trim()

    // Se tem ```json, extrair apenas o conteúdo
    const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim()
    }

    // Limpar possíveis caracteres extras
    jsonString = jsonString.replace(/^[^{]*/, "").replace(/[^}]*$/, "")

    // Tentar múltiplas estratégias de parsing
    try {
      const lessonContent = JSON.parse(jsonString)
      console.log("Conteúdo da aula gerado com sucesso")
      return lessonContent
    } catch (parseError) {
      console.error("Falha no JSON.parse, jsonString ➜", jsonString.substring(0, 200) + "...")

      // Fallback com conteúdo básico
      return {
        content: `# ${lessonTitle}\n\n## Objetivo\n${lessonObjective}\n\n## Conteúdo\n\nEsta aula aborda os conceitos fundamentais relacionados ao tema proposto. Você aprenderá de forma prática e objetiva.\n\n### Tópicos Principais\n\n1. **Introdução ao tema**\n2. **Conceitos fundamentais**\n3. **Aplicações práticas**\n4. **Exercícios**\n\n## Conclusão\n\nAo final desta aula, você terá uma compreensão sólida dos conceitos apresentados.`,
        materials: [
          {
            title: "Material de Apoio",
            type: "pdf",
            url: "#",
          },
        ],
        practice: {
          title: "Exercício Prático",
          description: "Aplique os conhecimentos adquiridos nesta aula",
          steps: ["Revise o conteúdo apresentado", "Identifique os pontos principais", "Pratique com exemplos"],
        },
        quiz: {
          id: "quiz-1",
          title: "Quiz da Aula",
          questions: [
            {
              id: "q1",
              question: "Qual é o objetivo principal desta aula?",
              options: ["Aprender conceitos básicos", "Fazer exercícios", "Ler materiais", "Todas as anteriores"],
              correct: 0,
            },
          ],
        },
        duration: 45,
      }
    }
  } catch (error) {
    console.error("Erro ao gerar conteúdo da aula:", error)
    throw new Error("Falha ao gerar conteúdo da aula")
  }
}
