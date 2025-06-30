-- =====================================================
-- FIX RLS USERS TABLE - SOLUÇÃO DEFINITIVA
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- OPÇÃO 1: Desabilitar RLS temporariamente (mais simples para MVP)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Se quiser manter RLS, remova todas as políticas restritivas
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Public can insert users" ON users;

-- Criar políticas mais permissivas para desenvolvimento
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VERIFICAR SE AS OUTRAS TABELAS TAMBÉM PRECISAM DE AJUSTE
-- =====================================================

-- Courses - permitir criação por qualquer usuário logado
DROP POLICY IF EXISTS "Users can create courses" ON courses;
CREATE POLICY "Allow course creation" ON courses FOR INSERT WITH CHECK (true);

-- User Progress - permitir qualquer operação
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can create own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

CREATE POLICY "Allow all progress operations" ON user_progress FOR ALL USING (true) WITH CHECK (true);

-- Certificates - permitir qualquer operação
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can create own certificates" ON certificates;

CREATE POLICY "Allow all certificate operations" ON certificates FOR ALL USING (true) WITH CHECK (true);

-- Course Reviews - permitir qualquer operação
DROP POLICY IF EXISTS "Anyone can view public reviews" ON course_reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON course_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON course_reviews;

CREATE POLICY "Allow all review operations" ON course_reviews FOR ALL USING (true) WITH CHECK (true);

-- Enrollments - permitir qualquer operação
DROP POLICY IF EXISTS "Users can view own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON course_enrollments;

CREATE POLICY "Allow all enrollment operations" ON course_enrollments FOR ALL USING (true) WITH CHECK (true);

-- Learning Streaks - permitir qualquer operação
DROP POLICY IF EXISTS "Users can view own streaks" ON learning_streaks;
DROP POLICY IF EXISTS "Users can manage own streaks" ON learning_streaks;

CREATE POLICY "Allow all streak operations" ON learning_streaks FOR ALL USING (true) WITH CHECK (true);

-- Achievements - permitir qualquer operação
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can create own achievements" ON user_achievements;

CREATE POLICY "Allow all achievement operations" ON user_achievements FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully!';
    RAISE NOTICE '🔓 All tables now allow operations for development';
    RAISE NOTICE '⚠️  Remember to tighten security before production';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now test login/registration!';
END $$;
