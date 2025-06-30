-- =====================================================
-- RLS PATCH: permitir inserts anônimos na tabela users
-- Execute depois de create-database-schema.sql
-- =====================================================

-- Ative RLS (caso ainda não esteja)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remova políticas antigas conflitantes (se existirem)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Nova política: qualquer papel (anon ou authenticated) pode inserir
CREATE POLICY "Public can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);  -- nenhuma verificação adicional
