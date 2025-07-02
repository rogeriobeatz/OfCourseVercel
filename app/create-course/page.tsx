"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { generateCourseAction } from "@/actions/generate-course"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { AlertCircle, Target, User, Clock, Calendar, MessageSquare } from "lucide-react"

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

export default function CourseBuilder() {
  const router = useRouter()
  const { user } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    objetivo: "",
    nivel: "iniciante",
    formato: "texto",
    tempo: "",
    duracao: "",
    comentarios: "",
  })

  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (status === "error") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [status])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar um curso.",
        variant: "destructive",
      })
      return
    }

    if (!formData.objetivo || !formData.tempo || !formData.duracao) {
      setStatus("error")
      setErrorMessage("Preencha todos os campos obrigatórios.")
      return
    }

    const tempoSemanal = Number.parseInt(formData.tempo)
    const duracaoSemanas = Number.parseInt(formData.duracao)

    if (isNaN(tempoSemanal) || isNaN(duracaoSemanas)) {
      setStatus("error")
      setErrorMessage("Informe números válidos para tempo semanal e duração.")
      return
    }

    setGenerating(true)
    setStatus("idle")
    setErrorMessage("")

    try {
      const result = await generateCourseAction(
        {
          objetivo: formData.objetivo,
          nivel: formData.nivel,
          formato: formData.formato,
          tempo: formData.tempo,
          duracao: formData.duracao,
          comentarios: formData.comentarios || "",
        },
        user.id,
      )

      if (result.success && result.course) {
        toast({
          title: "Curso Criado com Sucesso!",
          description: "Você será redirecionado para o curso.",
        })
        router.push(`/course/${result.course.id}`)
      } else {
        throw new Error(result.error || "Erro ao gerar o curso.")
      }
    } catch (err: any) {
      console.error("Erro:", err)
      setStatus("error")
      setErrorMessage(err.message || "Erro desconhecido ao gerar curso.")
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">🎯 Criador de Cursos Personalizados</h1>
        <p className="text-gray-600">
          Preencha as informações e nossa IA criará um plano de estudos com base nos seus objetivos.
        </p>
      </div>

      {status === "error" && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Objetivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" /> Seu Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="objetivo">O que você quer aprender ou alcançar?</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => handleChange("objetivo", e.target.value)}
              className="mt-2"
              required
            />
          </CardContent>
        </Card>

        {/* Nível */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Nível de Conhecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.nivel}
              onValueChange={(value) => handleChange("nivel", value)}
              className="space-y-3"
            >
              {[
                { value: "iniciante", label: "🌱 Iniciante - Nunca estudei o assunto" },
                { value: "basico", label: "📚 Básico - Já vi alguns conceitos" },
                { value: "intermediario", label: "⚡ Intermediário - Tenho alguma experiência" },
                { value: "avancado", label: "🚀 Avançado - Quero me especializar" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Formato */}
        <Card>
          <CardHeader>
            <CardTitle>Formato Preferido</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.formato} onValueChange={(value) => handleChange("formato", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Como você prefere aprender?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="texto">📖 Leitura e texto</SelectItem>
                <SelectItem value="video">🎥 Vídeos e tutoriais</SelectItem>
                <SelectItem value="pratica">💻 Prática e exercícios</SelectItem>
                <SelectItem value="misto">🔄 Misto (texto + vídeo + prática)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tempo e Duração */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" /> Tempo Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="tempo">Horas por semana</Label>
              <Input
                id="tempo"
                type="number"
                min="1"
                max="40"
                placeholder="Ex: 5"
                value={formData.tempo}
                onChange={(e) => handleChange("tempo", e.target.value)}
                className="mt-2"
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Duração do Curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="duracao">Semanas de duração</Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                max="52"
                placeholder="Ex: 8"
                value={formData.duracao}
                onChange={(e) => handleChange("duracao", e.target.value)}
                className="mt-2"
                required
              />
            </CardContent>
          </Card>
        </div>

        {/* Comentários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Comentários Extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="comentarios">Algo mais que deveríamos saber?</Label>
            <Textarea
              id="comentarios"
              value={formData.comentarios}
              onChange={(e) => handleChange("comentarios", e.target.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Botão de envio */}
        <Button type="submit" className="w-full" size="lg" disabled={generating}>
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Gerando curso com IA...
            </>
          ) : (
            "🎯 Criar Meu Curso Personalizado"
          )}
        </Button>
      </form>
    </div>
  )
}
