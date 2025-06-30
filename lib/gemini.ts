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
  lessons: GeneratedLesson[]
}

export interface GeneratedLesson {
  id: string
  title: string
  objective: string
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

export async function generateCourseWithAI(data: CourseGenerationData): Promise<GeneratedCourse> {
  const prompt = `
Você é um especialista em educação e criação de cursos online. Crie um curso completo e detalhado baseado nas seguintes informações:

**Dados do Usuário:**
- Objetivo: ${data.objetivo}
- Nível: ${data.nivel}
- Formato preferido: ${data.formato}
- Tempo disponível por semana: ${data.tempo} horas
- Duração desejada: ${data.duracao} semanas
- Comentários extras: ${data.comentarios || "Nenhum"}

**Instruções:**
1. Crie um curso com 6-8 aulas progressivas
2. Cada aula deve ter conteúdo rico e didático
3. Adapte a linguagem ao nível do usuário (${data.nivel})
4. Inclua exemplos práticos e exercícios
5. Crie quizzes com 3-4 perguntas por aula
6. Use markdown para formatação do conteúdo
7. Seja específico e prático

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
      "objective": "Objetivo claro da aula",
      "content": "Conteúdo completo da aula em markdown com explicações detalhadas, exemplos de código (se aplicável), conceitos teóricos e práticos. Mínimo 800 palavras.",
      "materials": "Lista de materiais complementares específicos",
      "practice": "Exercício prático específico para consolidar o aprendizado",
      "duration": 45,
      "quiz": {
        "id": "quiz-1",
        "questions": [
          {
            "id": "q1",
            "question": "Pergunta específica sobre o conteúdo",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": 0,
            "explanation": "Explicação detalhada da resposta correta"
          }
        ]
      }
    }
  ]
}

**Importante:**
- Retorne APENAS o JSON válido, sem texto adicional
- Garanta que o conteúdo seja educativo e progressivo
- Adapte exemplos ao contexto brasileiro
- Use linguagem ${data.nivel === "iniciante" ? "simples e didática" : data.nivel === "avancado" ? "técnica e aprofundada" : "intermediária"}
`

  try {
    console.log("Calling Gemini API...")

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
            maxOutputTokens: 8192,
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

    // Add IDs to lessons if not present
    courseData.lessons = courseData.lessons.map((lesson: any, index: number) => ({
      ...lesson,
      id: lesson.id || `${index + 1}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
      order: index + 1, // Add order field
      quiz: {
        ...lesson.quiz,
        id: lesson.quiz?.id || `quiz-${index + 1}`,
        questions:
          lesson.quiz?.questions?.map((q: any, qIndex: number) => ({
            ...q,
            id: q.id || `q${qIndex + 1}`,
          })) || [],
      },
    }))

    console.log("Course generated successfully:", courseData.title)
    return courseData
  } catch (error) {
    console.error("Erro ao gerar curso com IA:", error)

    // Fallback: return a sample course if API fails
    return {
      title: `Curso: ${data.objetivo}`,
      description: `Este é um curso personalizado sobre ${data.objetivo}, criado especialmente para seu nível ${data.nivel}. O curso foi estruturado para ser concluído em ${data.duracao} semanas, dedicando ${data.tempo} horas por semana aos estudos.`,
      duration: `${data.duracao} semanas`,
      level: data.nivel,
      lessons: [
        {
          id: `1-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
          title: "🚀 Introdução e Fundamentos",
          objective: `Compreender os conceitos básicos relacionados a ${data.objetivo}`,
          content: `# Bem-vindo ao curso!

Este é o início da sua jornada de aprendizado sobre ${data.objetivo}. 

## O que você vai aprender

Nesta primeira aula, vamos cobrir:
- Conceitos fundamentais
- Terminologia importante
- Visão geral do que está por vir
- Configuração do ambiente de estudos

## Conceitos Fundamentais

${data.objetivo} é um tópico fascinante que tem aplicações práticas em diversas áreas. Para ${data.nivel === "iniciante" ? "quem está começando" : "seu nível de conhecimento"}, é importante estabelecer uma base sólida.

## Próximos Passos

Nas próximas aulas, vamos aprofundar cada conceito apresentado aqui, sempre com exemplos práticos e exercícios para fixar o aprendizado.`,
          materials: "Documentação oficial, artigos introdutórios, vídeos complementares",
          practice: "Faça uma pesquisa sobre as principais aplicações do tema e anote suas descobertas",
          duration: 45,
          order: 1,
          quiz: {
            id: "quiz-1",
            questions: [
              {
                id: "q1",
                question: "Qual é o principal objetivo desta primeira aula?",
                options: [
                  "Estabelecer fundamentos básicos",
                  "Resolver problemas complexos",
                  "Finalizar o curso",
                  "Apenas fazer exercícios",
                ],
                correctAnswer: 0,
                explanation: "A primeira aula sempre foca em estabelecer os fundamentos básicos do assunto.",
              },
            ],
          },
        },
        {
          id: `2-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
          title: "📚 Aprofundando os Conceitos",
          objective: "Expandir o conhecimento adquirido na aula anterior",
          content: `# Aprofundando os Conceitos

Agora que você já tem uma base sólida, vamos expandir seus conhecimentos.

## Revisão Rápida

Na aula anterior, cobrimos os fundamentos. Agora vamos:
- Explorar conceitos mais avançados
- Ver exemplos práticos
- Aplicar o conhecimento em situações reais

## Conceitos Avançados

${data.nivel === "avancado" ? "Para seu nível avançado, vamos explorar aspectos técnicos mais profundos" : "Vamos gradualmente aumentar a complexidade dos conceitos"}.

## Aplicação Prática

A teoria só faz sentido quando aplicada na prática. Por isso, esta aula inclui vários exemplos do mundo real.`,
          materials: "Estudos de caso, exemplos práticos, ferramentas recomendadas",
          practice: "Aplique os conceitos aprendidos em um pequeno projeto pessoal",
          duration: 60,
          order: 2,
          quiz: {
            id: "quiz-2",
            questions: [
              {
                id: "q1",
                question: "Por que é importante aplicar a teoria na prática?",
                options: [
                  "Para fixar melhor o aprendizado",
                  "Para complicar o processo",
                  "Não é importante",
                  "Apenas para passar no quiz",
                ],
                correctAnswer: 0,
                explanation:
                  "A aplicação prática ajuda a consolidar o conhecimento teórico e desenvolver habilidades reais.",
              },
            ],
          },
        },
      ],
    }
  }
}

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
