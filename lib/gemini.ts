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
Você é um especialista em educação online. Crie conteúdo COMPLETO e ENVOLVENTE para esta aula.

Curso: "${courseTitle}"
Nível: ${courseLevel}
Aula: "${lessonTitle}"
Objetivo: "${lessonObjective}"

IMPORTANTE: Use Base64 para textos longos para evitar erros de JSON!

Retorne APENAS um JSON válido:
{
 "content_b64": "<conteúdo completo da aula em markdown, codificado em Base64>",
 "materials": [
   {
     "title": "Nome do material",
     "type": "pdf" | "video" | "link" | "article",
     "url": "https://exemplo.com/recurso",
     "description_b64": "<descrição em Base64>"
   }
 ],
 "practice": {
   "title": "Exercício Prático",
   "description_b64": "<descrição detalhada em Base64>",
   "steps": ["Passo 1", "Passo 2", "Passo 3"]
 },
 "duration": 45,
 "quiz": {
   "id": "quiz-1",
   "title": "Quiz da Aula",
   "questions": [
     {
       "id": "q1",
       "question": "Pergunta clara e objetiva?",
       "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
       "correct": 0
     }
   ]
 }
}

DIRETRIZES:
- Conteúdo: 1200+ palavras, didático, com exemplos reais
- Materiais: Inclua links reais da internet quando possível
- Prática: Exercícios aplicáveis e relevantes
- Quiz: 4-5 perguntas desafiadoras mas justas
- Use referências atuais e recursos online existentes
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const rawText = response.text().trim()

    /* Try to isolate the JSON (strip ```json fences if present) */
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
      content: `# ${lessonTitle}\n\n## Objetivo\n${lessonObjective}\n\n## Introdução\n\nEsta aula aborda os conceitos fundamentais relacionados ao tema proposto. Você aprenderá de forma prática e objetiva.\n\n### Tópicos Principais\n\n1. **Conceitos Fundamentais**\n   - Definições importantes\n   - Contexto histórico\n   - Aplicações práticas\n\n2. **Exemplos Práticos**\n   - Casos de uso reais\n   - Demonstrações passo a passo\n   - Melhores práticas\n\n3. **Aplicação no Mundo Real**\n   - Cenários profissionais\n   - Tendências atuais\n   - Oportunidades de carreira\n\n## Conclusão\n\nAo final desta aula, você terá uma compreensão sólida dos conceitos apresentados e estará preparado para aplicá-los na prática.`,
      materials: [
        {
          title: "Documentação Oficial",
          type: "link",
          url: "https://docs.google.com",
          description: "Recursos oficiais e documentação técnica",
        },
        {
          title: "Artigo Complementar",
          type: "article",
          url: "https://medium.com",
          description: "Leitura adicional sobre o tema",
        },
      ],
      practice: {
        title: "Exercício Prático",
        description:
          "Aplique os conhecimentos adquiridos nesta aula através de um exercício hands-on que simula situações reais do mercado.",
        steps: [
          "Revise o conteúdo apresentado na aula",
          "Identifique os pontos principais e conceitos-chave",
          "Pratique com os exemplos fornecidos",
          "Crie seu próprio exemplo baseado no aprendizado",
        ],
      },
      duration: 45,
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
          {
            id: "q2",
            question: "Qual a importância da prática no aprendizado?",
            options: ["Não é importante", "Ajuda a fixar conceitos", "É opcional", "Apenas para avaliação"],
            correct: 1,
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
