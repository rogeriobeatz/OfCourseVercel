"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { generateCourseAction } from "@/actions/generate-course"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Target,
  User,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Zap,
  Sparkles,
} from "lucide-react"

type Nivel = "iniciante" | "basico" | "intermediario" | "avancado"
type Formato = "texto" | "video" | "pratica" | "misto"

interface FormData {
  objetivo: string
  nivel: Nivel
  formato: Formato
  tempo: string
  duracao: string
  comentarios: string
}

const STEPS = [
  { id: 1, title: "Objetivo", description: "O que você quer aprender?" },
  { id: 2, title: "Perfil", description: "Seu nível e preferências" },
  { id: 3, title: "Cronograma", description: "Tempo e duração" },
  { id: 4, title: "Finalizar", description: "Detalhes extras" },
]

const EXAMPLE_OBJECTIVES = [
  "Aprender Python do zero para análise de dados",
  "Dominar marketing digital para pequenas empresas",
  "Criar aplicativos mobile com React Native",
  "Desenvolver habilidades de liderança e gestão",
  "Aprender inglês para negócios internacionais",
  "Dominar design UX/UI para web",
  "Entender investimentos e finanças pessoais",
  "Criar conteúdo para redes sociais",
]

export default function CreateCoursePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    objetivo: "",
    nivel: "iniciante",
    formato: "misto",
    tempo: "",
    duracao: "",
    comentarios: "",
  })

  const [generating, setGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando usuário digita
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.objetivo.trim()) {
          newErrors.objetivo = "Descreva seu objetivo de aprendizado"
        } else if (formData.objetivo.length < 10) {
          newErrors.objetivo = "Seja mais específico sobre seu objetivo (mín. 10 caracteres)"
        }
        break
      case 2:
        // Nível e formato são obrigatórios mas têm valores padrão
        break
      case 3:
        if (!formData.tempo) {
          newErrors.tempo = "Informe quantas horas por semana você tem disponível"
        } else if (Number.parseInt(formData.tempo) < 1 || Number.parseInt(formData.tempo) > 40) {
          newErrors.tempo = "Informe entre 1 e 40 horas por semana"
        }

        if (!formData.duracao) {
          newErrors.duracao = "Informe a duração desejada do curso"
        } else if (Number.parseInt(formData.duracao) < 1 || Number.parseInt(formData.duracao) > 52) {
          newErrors.duracao = "Informe entre 1 e 52 semanas"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar um curso.",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)

    try {
      const result = await generateCourseAction(formData, user.id)

      if (result.success && result.course) {
        toast({
          title: "🎉 Curso Criado com Sucesso!",
          description: "Seu curso personalizado está pronto. Redirecionando...",
        })

        setTimeout(() => {
          router.push(`/course/${result.course.id}`)
        }, 1500)
      } else {
        throw new Error(result.error || "Erro ao gerar o curso.")
      }
    } catch (err: any) {
      console.error("Erro:", err)
      toast({
        title: "Erro ao criar curso",
        description: err.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Criador de Cursos com IA
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crie Seu Curso Personalizado
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nossa IA criará um curso completo baseado nos seus objetivos e preferências de aprendizado
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}
                  `}
                  >
                    {step.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-500"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                      w-12 h-0.5 mx-4
                      ${currentStep > step.id ? "bg-blue-600" : "bg-gray-200"}
                    `}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Form Steps */}
          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              {/* Step 1: Objetivo */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Qual é seu objetivo?</h2>
                    <p className="text-gray-600">Seja específico sobre o que você quer aprender ou alcançar</p>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="objetivo" className="text-base font-medium">
                      Descreva seu objetivo de aprendizado *
                    </Label>
                    <Textarea
                      id="objetivo"
                      value={formData.objetivo}
                      onChange={(e) => handleChange("objetivo", e.target.value)}
                      placeholder="Ex: Quero aprender Python para análise de dados e conseguir uma vaga como analista..."
                      className="min-h-[120px] text-base"
                      error={errors.objetivo}
                    />
                    {errors.objetivo && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.objetivo}
                      </p>
                    )}
                  </div>

                  {/* Exemplos */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Exemplos de objetivos</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EXAMPLE_OBJECTIVES.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => handleChange("objetivo", example)}
                          className="text-left p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors text-sm border border-blue-200"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Perfil */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Seu perfil de aprendizado</h2>
                    <p className="text-gray-600">Vamos personalizar o curso para seu nível e estilo</p>
                  </div>

                  {/* Nível */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Qual seu nível de conhecimento no assunto?</Label>
                    <RadioGroup
                      value={formData.nivel}
                      onValueChange={(value) => handleChange("nivel", value)}
                      className="space-y-4"
                    >
                      {[
                        {
                          value: "iniciante",
                          label: "🌱 Iniciante",
                          desc: "Nunca estudei o assunto ou tenho conhecimento muito básico",
                        },
                        {
                          value: "basico",
                          label: "📚 Básico",
                          desc: "Já vi alguns conceitos mas preciso de uma base sólida",
                        },
                        {
                          value: "intermediario",
                          label: "⚡ Intermediário",
                          desc: "Tenho alguma experiência e quero aprofundar conhecimentos",
                        },
                        {
                          value: "avancado",
                          label: "🚀 Avançado",
                          desc: "Tenho boa base e quero me especializar ou atualizar",
                        },
                      ].map((option) => (
                        <div
                          key={option.value}
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={option.value} className="font-medium cursor-pointer">
                              {option.label}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Formato */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Como você prefere aprender?</Label>
                    <Select value={formData.formato} onValueChange={(value) => handleChange("formato", value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Escolha seu formato preferido" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="texto">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4" />
                            <div>
                              <div className="font-medium">📖 Leitura e texto</div>
                              <div className="text-xs text-gray-500">
                                Artigos, textos explicativos e materiais escritos
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">🎥 Vídeos e tutoriais</div>
                              <div className="text-xs text-gray-500">Videoaulas e demonstrações visuais</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="pratica">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">💻 Prática e exercícios</div>
                              <div className="text-xs text-gray-500">Hands-on, projetos e atividades práticas</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="misto">
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4" />
                            <div>
                              <div className="font-medium">🔄 Misto (Recomendado)</div>
                              <div className="text-xs text-gray-500">Combinação de texto, vídeo e prática</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Cronograma */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Planeje seu cronograma</h2>
                    <p className="text-gray-600">Vamos criar um plano que se adapte à sua rotina</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label htmlFor="tempo" className="text-base font-medium">
                        Quantas horas por semana você tem disponível? *
                      </Label>
                      <div className="relative">
                        <Input
                          id="tempo"
                          type="number"
                          min="1"
                          max="40"
                          placeholder="Ex: 5"
                          value={formData.tempo}
                          onChange={(e) => handleChange("tempo", e.target.value)}
                          className="h-12 text-base pr-16"
                          error={errors.tempo}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">horas</span>
                      </div>
                      {errors.tempo && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.tempo}
                        </p>
                      )}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">💡 Dica</h4>
                        <p className="text-sm text-blue-800">
                          Seja realista! É melhor estudar 2h consistentemente do que planejar 10h e não conseguir
                          cumprir.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="duracao" className="text-base font-medium">
                        Em quantas semanas quer concluir? *
                      </Label>
                      <div className="relative">
                        <Input
                          id="duracao"
                          type="number"
                          min="1"
                          max="52"
                          placeholder="Ex: 8"
                          value={formData.duracao}
                          onChange={(e) => handleChange("duracao", e.target.value)}
                          className="h-12 text-base pr-20"
                          error={errors.duracao}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          semanas
                        </span>
                      </div>
                      {errors.duracao && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.duracao}
                        </p>
                      )}

                      {formData.tempo && formData.duracao && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">📊 Resumo do seu plano</h4>
                          <div className="text-sm text-green-800 space-y-1">
                            <p>
                              • {formData.tempo}h por semana × {formData.duracao} semanas
                            </p>
                            <p>
                              • Total: {Number.parseInt(formData.tempo) * Number.parseInt(formData.duracao)} horas de
                              estudo
                            </p>
                            <p>
                              • Aproximadamente{" "}
                              {Math.ceil((Number.parseInt(formData.tempo) * Number.parseInt(formData.duracao)) / 45)}{" "}
                              aulas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Finalizar */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Últimos detalhes</h2>
                    <p className="text-gray-600">Adicione informações extras para personalizar ainda mais seu curso</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="comentarios" className="text-base font-medium">
                        Comentários adicionais (opcional)
                      </Label>
                      <Textarea
                        id="comentarios"
                        value={formData.comentarios}
                        onChange={(e) => handleChange("comentarios", e.target.value)}
                        placeholder="Ex: Tenho experiência em Excel, foco em aplicações para e-commerce, preciso de exemplos práticos..."
                        className="min-h-[100px]"
                      />
                      <p className="text-sm text-gray-500">
                        Conte sobre sua experiência prévia, contexto específico, ou preferências especiais
                      </p>
                    </div>

                    {/* Resumo */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        Resumo do seu curso
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Objetivo:</p>
                          <p className="text-gray-600 mb-3">{formData.objetivo}</p>

                          <p className="font-medium text-gray-700">Nível:</p>
                          <Badge variant="outline" className="mb-3">
                            {formData.nivel.charAt(0).toUpperCase() + formData.nivel.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Formato:</p>
                          <p className="text-gray-600 mb-3 capitalize">{formData.formato}</p>

                          <p className="font-medium text-gray-700">Cronograma:</p>
                          <p className="text-gray-600">
                            {formData.tempo}h/semana por {formData.duracao} semanas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <div className="text-sm text-gray-500">
                  Passo {currentStep} de {STEPS.length}
                </div>

                {currentStep < STEPS.length ? (
                  <Button onClick={nextStep} className="flex items-center gap-2">
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={generating}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Criando curso...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Criar Meu Curso
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
