"use server"

const API_KEY = "AIzaSyD9v3FKmcRtLQProCGTx2DUAHFC0YwFglc"

export interface CourseGenerationData {
  objetivo: string
  nivel: "iniciante" | "basico" | "intermediario" | "avancado"
  formato: "texto" | "video" | "pratica" | "misto"
  tempo: string
  duracao: string
  comentarios?: string
}

export interface GeneratedCourse {
  title: string
  description: string
  duration: string
  level: string
  lessons: BasicLesson[]
}

export interface BasicLesson {
  id: string
  title: string
  objective: string
  order: number
}

export interface GeneratedLessonContent {
  content: string
  materials: string
  practice: string
  duration: number
  quiz: {
    id: string
    questions: {
      id: string
      question: string
      options: string[]
      correctAnswer: number
      explanation: string
    }[]
  }
}

export interface GeneratedLesson extends BasicLesson {
  content: string
  materials: string
  practice: string
  duration: number
  quiz: {
    id: string
    questions: {
      id: string
      question: string
      options: string[]
      correctAnswer: number
      explanation: string
    }[]
  }
}

// Função modificada - gera apenas estrutura básica do curso
export async function generateCourseWithAI(data: CourseGenerationData): Promise<GeneratedCourse> {
  const prompt = `
Você é um especialista em educação e criação de cursos online. Crie APENAS a estrutura básica de um curso baseado nas seguintes informações:

**Dados do Usuário:**
- Objetivo: ${data.objetivo}
- Nível: ${data.nivel}
- Formato preferido: ${data.formato}
- Tempo disponível por semana: ${data.tempo} horas
- Duração desejada: ${data.duracao} semanas
- Comentários extras: ${data.comentarios || "Nenhum"}

**Instruções:**
1. Crie um curso com 6-8 aulas progressivas
2. Para cada aula, gere APENAS: título e objetivo
3. NÃO gere conteúdo, materiais, prática ou quiz ainda
4. Adapte os títulos e objetivos ao nível do usuário (${data.nivel})
5. Seja específico nos objetivos de aprendizagem

**Formato de Resposta (JSON):**
{
  "title": "Título atrativo do curso",
  "description": "Descrição detalhada em 2-3 parágrafos explicando o que o aluno vai aprender",
  "duration": "${data.duracao} semanas",
  "level": "${data.nivel}",
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Título da aula com emoji",
      "objective": "Objetivo claro e específico da aula",
      "order": 1
    }
  ]
}

**Importante:**
- Retorne APENAS o JSON válido, sem texto adicional
- Garanta que os objetivos sejam progressivos e didáticos
- Use linguagem ${data.nivel === "iniciante" ? "simples e didática" : data.nivel === "avancado" ? "técnica e aprofundada" : "intermediária"}
- Adapte exemplos ao contexto brasileiro
`

  try {
    console.log("Calling Gemini API for course structure...")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048, // Reduzido já que não geramos conteúdo completo
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API Error:", response.status, errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Gemini API Response:", result)

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Resposta inválida da API")
    }

    const text = result.candidates[0].content.parts[0].text
    console.log("Generated text:", text)

    // Limpar possível markdown ou texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("No JSON found in response:", text)
      throw new Error("Resposta da IA não contém JSON válido")
    }

    const courseData = JSON.parse(jsonMatch[0])

    // Ensure lessons have proper structure
    courseData.lessons = courseData.lessons.map((lesson: any, index: number) => ({
      id: lesson.id || `lesson-${index + 1}`,
      title: lesson.title,
      objective: lesson.objective,
      order: index + 1,
    }))

    console.log("Course structure generated successfully:", courseData.title)
    return courseData
  } catch (error) {
    console.error("Erro ao gerar estrutura do curso com IA:", error)

    // Fallback: return a sample course structure if API fails
    return {
      title: `Curso: ${data.objetivo}`,
      description: `Este é um curso personalizado sobre ${data.objetivo}, criado especialmente para seu nível ${data.nivel}. O curso foi estruturado para ser concluído em ${data.duracao} semanas, dedicando ${data.tempo} horas por semana aos estudos.`,
      duration: `${data.duracao} semanas`,
      level: data.nivel,
      lessons: [
        {
          id: "lesson-1",
          title: "🚀 Introdução e Fundamentos",
          objective: `Compreender os conceitos básicos relacionados a ${data.objetivo}`,
          order: 1,
        },
        {
          id: "lesson-2",
          title: "📚 Aprofundando os Conceitos",
          objective: "Expandir o conhecimento adquirido na aula anterior",
          order: 2,
        },
      ],
    }
  }
}

// Nova função para gerar conteúdo sob demanda
export async function generateLessonContentOnDemand(
  lessonTitle: string,
  lessonObjective: string,
  courseTitle: string,
  courseLevel: string,
  lessonOrder: number,
): Promise<GeneratedLessonContent> {
  const prompt = `
Você é um professor especialista. Crie conteúdo COMPLETO e DETALHADO para esta aula específica:

**Contexto do Curso:** ${courseTitle}
**Nível do Curso:** ${courseLevel}
**Título da Aula:** ${lessonTitle}
**Objetivo da Aula:** ${lessonObjective}
**Posição no Curso:** Aula ${lessonOrder}

**Instruções:**
1. Crie conteúdo educativo COMPLETO em markdown (mínimo 1200 palavras)
2. Inclua explicações teóricas claras e detalhadas
3. Adicione exemplos práticos e relevantes
4. Use código quando aplicável (com syntax highlighting)
5. Destaque conceitos importantes
6. Crie materiais complementares específicos
7. Desenvolva um exercício prático desafiador
8. Gere um quiz com 4-5 perguntas de qualidade
9. Adapte a linguagem ao nível ${courseLevel}

**Formato de Resposta (JSON):**
{
  "content": "Conteúdo completo da aula em markdown com explicações detalhadas, exemplos práticos, conceitos teóricos. Use formatação markdown rica com títulos, listas, código, etc. Mínimo 1200 palavras.",
  "materials": "Lista detalhada de materiais complementares específicos para esta aula, incluindo links, livros, artigos, ferramentas, etc.",
  "practice": "Exercício prático específico e desafiador para consolidar o aprendizado desta aula. Seja detalhado nas instruções.",
  "duration": 45,
  "quiz": {
    "id": "quiz-${lessonOrder}",
    "questions": [
      {
        "id": "q1",
        "question": "Pergunta específica e relevante sobre o conteúdo da aula",
        "options": ["Opção A detalhada", "Opção B detalhada", "Opção C detalhada", "Opção D detalhada"],
        "correctAnswer": 0,
        "explanation": "Explicação detalhada e educativa da resposta correta"
      }
    ]
  }
}

**Importante:**
- Retorne APENAS o JSON válido, sem texto adicional
- O conteúdo deve ser rico, educativo e envolvente
- Use exemplos do contexto brasileiro quando relevante
- Garanta que o quiz teste realmente o aprendizado
- Seja específico e prático em todos os elementos
`

  try {
    console.log(`Generating content for lesson: ${lessonTitle}`)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192, // Máximo para conteúdo completo
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API Error:", response.status, errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Resposta inválida da API")
    }

    const text = result.candidates[0].content.parts[0].text

    // Limpar possível markdown ou texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("No JSON found in response:", text)
      throw new Error("Resposta da IA não contém JSON válido")
    }

    const lessonContent = JSON.parse(jsonMatch[0])

    // Ensure quiz questions have proper IDs
    if (lessonContent.quiz && lessonContent.quiz.questions) {
      lessonContent.quiz.questions = lessonContent.quiz.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${index + 1}`,
      }))
    }

    console.log(`Lesson content generated successfully for: ${lessonTitle}`)
    return lessonContent
  } catch (error) {
    console.error("Erro ao gerar conteúdo da aula:", error)

    // Fallback content
    return {
      content: `# ${lessonTitle}

## Objetivo da Aula
${lessonObjective}

## Introdução
Bem-vindo a esta aula do curso **${courseTitle}**. Nesta sessão, vamos explorar os conceitos fundamentais relacionados ao nosso objetivo de aprendizagem.

## Conteúdo Principal

### Conceitos Fundamentais
Esta aula aborda conceitos essenciais que são fundamentais para seu desenvolvimento no tema proposto.

### Exemplos Práticos
Vamos ver alguns exemplos práticos de como aplicar esses conceitos no dia a dia.

### Aplicação
A aplicação prática desses conceitos é fundamental para consolidar o aprendizado.

## Resumo
Nesta aula, cobrimos os principais pontos relacionados ao objetivo proposto. Continue praticando para consolidar seu aprendizado.`,
      materials: "Documentação oficial, artigos complementares, vídeos de apoio",
      practice: "Pratique os conceitos apresentados criando um pequeno projeto pessoal aplicando o que foi aprendido",
      duration: 45,
      quiz: {
        id: `quiz-${lessonOrder}`,
        questions: [
          {
            id: "q1",
            question: "Qual é o principal objetivo desta aula?",
            options: [
              "Compreender os conceitos fundamentais",
              "Apenas fazer exercícios",
              "Finalizar o curso",
              "Revisar conteúdo anterior",
            ],
            correctAnswer: 0,
            explanation: "O principal objetivo é sempre compreender e aplicar os conceitos fundamentais apresentados.",
          },
        ],
      },
    }
  }
}

// Função existente mantida para compatibilidade
export async function generateLessonContent(
  lessonTitle: string,
  objective: string,
  level: string,
  courseContext: string,
): Promise<string> {
  const prompt = `
Você é um professor especialista. Crie conteúdo detalhado para esta aula:

**Contexto do Curso:** ${courseContext}
**Título da Aula:** ${lessonTitle}
**Objetivo:** ${objective}
**Nível:** ${level}

Crie conteúdo educativo completo em markdown com:
- Introdução ao tópico
- Explicações teóricas claras
- Exemplos práticos
- Código (se aplicável)
- Conceitos importantes destacados
- Resumo final

Mínimo 1000 palavras. Use linguagem adequada ao nível ${level}.
`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const result = await response.json()
    return result.candidates[0].content.parts[0].text
  } catch (error) {
    console.error("Erro ao gerar conteúdo da aula:", error)
    throw new Error("Falha na geração do conteúdo")
  }
}
