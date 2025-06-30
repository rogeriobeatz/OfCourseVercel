"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Clock, Target, User, Calendar, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { generateCourseAction } from "@/actions/generate-course"
import { useRouter } from "next/navigation"

export default function CourseBuilder() {
  const [formData, setFormData] = useState({
    objetivo: "",
    nivel: "",
    formato: "",
    tempo: "",
    duracao: "",
    comentarios: "",
  })

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Você precisa estar logado para criar um curso")
      return
    }

    setError("")
    setGenerating(true)

    try {
      const result = await generateCourseAction(
        {
          objetivo: formData.objetivo,
          nivel: formData.nivel as any,
          formato: formData.formato as any,
          tempo: formData.tempo,
          duracao: formData.duracao,
          comentarios: formData.comentarios,
        },
        user.id,
      )

      if (result.success && result.course) {
        setSuccess(true)
        // Redirect to the course page after a short delay
        setTimeout(() => {
          router.push(`/course/${result.course.id}`)
        }, 2000)
      } else {
        setError(result.error || "Erro ao gerar curso")
      }
    } catch (err) {
      console.error("Error generating course:", err)
      setError("Erro inesperado ao gerar curso. Tente novamente.")
    } finally {
      setGenerating(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Curso Criado com Sucesso! 🎉</h2>
            <p className="text-green-700 mb-4">Seu curso personalizado foi gerado com IA e salvo no banco de dados.</p>
            <p className="text-sm text-green-600">Redirecionando para o curso...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">🎯 Criador de Cursos Personalizados</h1>
        <p className="text-gray-600">
          Vamos criar um curso sob medida para você! Preencha as informações abaixo e nossa IA montará um plano de
          estudos personalizado com base em seus objetivos e disponibilidade.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Seu Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="objetivo">O que você quer aprender ou alcançar?</Label>
            <Textarea
              id="objetivo"
              placeholder="Ex: Aprender JavaScript para conseguir meu primeiro emprego como desenvolvedor"
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              className="mt-2"
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Nível de Conhecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.nivel}
              onValueChange={(value) => setFormData({ ...formData, nivel: value })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="iniciante" id="iniciante" />
                <Label htmlFor="iniciante">🌱 Iniciante - Nunca estudei o assunto</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basico" id="basico" />
                <Label htmlFor="basico">📚 Básico - Já vi alguns conceitos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intermediario" id="intermediario" />
                <Label htmlFor="intermediario">⚡ Intermediário - Tenho alguma experiência</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="avancado" id="avancado" />
                <Label htmlFor="avancado">🚀 Avançado - Quero me especializar</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formato Preferido</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.formato} onValueChange={(value) => setFormData({ ...formData, formato: value })}>
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

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Tempo Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="tempo">Horas disponíveis por semana</Label>
              <Input
                id="tempo"
                type="number"
                min="1"
                max="40"
                placeholder="Ex: 5"
                value={formData.tempo}
                onChange={(e) => setFormData({ ...formData, tempo: e.target.value })}
                className="mt-2"
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Duração Desejada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="duracao">Quantas semanas?</Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                max="52"
                placeholder="Ex: 8"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                className="mt-2"
                required
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentários Extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="comentarios">Algo mais que eu deveria saber?</Label>
            <Textarea
              id="comentarios"
              placeholder="Ex: Tenho dificuldade com matemática, prefiro exemplos práticos..."
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={generating}>
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Gerando seu curso com IA...
            </>
          ) : (
            "🎯 Criar Meu Curso Personalizado"
          )}
        </Button>
      </form>

      {error && (
        <Card className="mt-4 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {generating && (
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Nossa IA está criando seu curso personalizado... Isso pode levar alguns segundos.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
