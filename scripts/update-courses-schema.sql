-- Script para atualizar cursos existentes para suportar geração de conteúdo sob demanda
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos verificar se há cursos com conteúdo completo que precisam ser marcados
UPDATE courses 
SET lessons = jsonb_set(
  lessons,
  '{}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN lesson->>'content' IS NOT NULL AND lesson->>'content' != '' 
        THEN lesson
        ELSE jsonb_set(lesson, '{content}', 'null'::jsonb)
      END
    )
    FROM jsonb_array_elements(lessons) AS lesson
  )
)
WHERE jsonb_typeof(lessons) = 'array';

-- Adicionar índice para melhorar performance de busca por cursos
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);

-- Adicionar campo category se não existir
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Tecnologia';

-- Atualizar cursos existentes sem categoria
UPDATE courses 
SET category = 'Tecnologia' 
WHERE category IS NULL;

-- Comentário sobre a nova estrutura:
-- Agora os cursos podem ter lessons com content = null
-- Isso indica que o conteúdo precisa ser gerado sob demanda
-- A aplicação irá detectar isso e chamar a IA para gerar o conteúdo
