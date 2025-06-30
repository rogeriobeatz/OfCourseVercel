-- =====================================================
-- EDUPLATFORM - COMPLETE DATABASE SCHEMA
-- Execute this script in Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- DROP EXISTING TABLES (if you want to start fresh)
-- =====================================================
-- Uncomment these lines if you want to recreate everything
-- DROP TABLE IF EXISTS certificates CASCADE;
-- DROP TABLE IF EXISTS user_progress CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  website_url TEXT,
  location VARCHAR(255),
  timezone VARCHAR(100) DEFAULT 'America/Sao_Paulo',
  preferred_language VARCHAR(10) DEFAULT 'pt-BR',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500),
  duration VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL CHECK (level IN ('iniciante', 'basico', 'intermediario', 'avancado')),
  format VARCHAR(50) NOT NULL CHECK (format IN ('texto', 'video', 'pratica', 'misto')),
  category VARCHAR(100),
  tags TEXT[], -- Array of tags
  thumbnail_url TEXT,
  cover_image_url TEXT,
  lessons JSONB NOT NULL DEFAULT '[]',
  total_lessons INTEGER DEFAULT 0,
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  difficulty_score INTEGER DEFAULT 1 CHECK (difficulty_score BETWEEN 1 AND 10),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'BRL',
  enrollment_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0
);

-- =====================================================
-- USER PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons TEXT[] DEFAULT '{}',
  quiz_scores JSONB DEFAULT '{}',
  total_time_spent INTEGER DEFAULT 0, -- in minutes
  current_lesson_id TEXT,
  current_lesson_position INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN DEFAULT false,
  notes JSONB DEFAULT '{}', -- User notes per lesson
  bookmarks TEXT[] DEFAULT '{}', -- Bookmarked lessons
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- CERTIFICATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  course_name VARCHAR(500) NOT NULL,
  course_duration VARCHAR(100),
  completion_date DATE NOT NULL,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  certificate_url TEXT,
  verification_code VARCHAR(100) UNIQUE,
  is_verified BOOLEAN DEFAULT true,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Some certificates may expire
  template_used VARCHAR(100) DEFAULT 'default',
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- COURSE REVIEWS TABLE (New)
-- =====================================================
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_public BOOLEAN DEFAULT true,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- COURSE ENROLLMENTS TABLE (New)
-- =====================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_type VARCHAR(20) DEFAULT 'free' CHECK (enrollment_type IN ('free', 'paid', 'gifted')),
  payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_currency VARCHAR(3) DEFAULT 'BRL',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited access
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- LEARNING STREAKS TABLE (New - Gamification)
-- =====================================================
CREATE TABLE IF NOT EXISTS learning_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  total_study_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- USER ACHIEVEMENTS TABLE (New - Gamification)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- 'first_course', 'streak_7', 'quiz_master', etc.
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  icon_url TEXT,
  points_awarded INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT true
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_public ON courses(is_public);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating_average);

-- User progress indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completion ON user_progress(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_accessed ON user_progress(last_accessed_at);

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON course_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON course_reviews(rating);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrolled_at ON course_enrollments(enrolled_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Courses policies
DROP POLICY IF EXISTS "Anyone can view public courses" ON courses;
CREATE POLICY "Anyone can view public courses" ON courses 
  FOR SELECT USING (is_public = true OR auth.uid()::text = created_by::text);

DROP POLICY IF EXISTS "Users can create courses" ON courses;
CREATE POLICY "Users can create courses" ON courses 
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

DROP POLICY IF EXISTS "Users can update own courses" ON courses;
CREATE POLICY "Users can update own courses" ON courses 
  FOR UPDATE USING (auth.uid()::text = created_by::text);

DROP POLICY IF EXISTS "Users can delete own courses" ON courses;
CREATE POLICY "Users can delete own courses" ON courses 
  FOR DELETE USING (auth.uid()::text = created_by::text);

-- User progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" ON user_progress 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create own progress" ON user_progress;
CREATE POLICY "Users can create own progress" ON user_progress 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" ON user_progress 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Certificates policies
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates" ON certificates 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create own certificates" ON certificates;
CREATE POLICY "Users can create own certificates" ON certificates 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Course reviews policies
DROP POLICY IF EXISTS "Anyone can view public reviews" ON course_reviews;
CREATE POLICY "Anyone can view public reviews" ON course_reviews 
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can create own reviews" ON course_reviews;
CREATE POLICY "Users can create own reviews" ON course_reviews 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own reviews" ON course_reviews;
CREATE POLICY "Users can update own reviews" ON course_reviews 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Enrollments policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON course_enrollments;
CREATE POLICY "Users can view own enrollments" ON course_enrollments 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create own enrollments" ON course_enrollments;
CREATE POLICY "Users can create own enrollments" ON course_enrollments 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Learning streaks policies
DROP POLICY IF EXISTS "Users can view own streaks" ON learning_streaks;
CREATE POLICY "Users can view own streaks" ON learning_streaks 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can manage own streaks" ON learning_streaks;
CREATE POLICY "Users can manage own streaks" ON learning_streaks 
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Achievements policies
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create own achievements" ON user_achievements;
CREATE POLICY "Users can create own achievements" ON user_achievements 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at 
  BEFORE UPDATE ON user_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.certificate_number = 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('certificate_sequence')::text, 6, '0');
    NEW.verification_code = encode(gen_random_bytes(16), 'hex');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_sequence START 1;

-- Trigger for certificate number generation
DROP TRIGGER IF EXISTS generate_certificate_number_trigger ON certificates;
CREATE TRIGGER generate_certificate_number_trigger 
  BEFORE INSERT ON certificates 
  FOR EACH ROW EXECUTE FUNCTION generate_certificate_number();

-- Function to update course statistics
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update enrollment count
    UPDATE courses 
    SET enrollment_count = (
        SELECT COUNT(*) 
        FROM course_enrollments 
        WHERE course_id = NEW.course_id AND is_active = true
    )
    WHERE id = NEW.course_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for course stats
DROP TRIGGER IF EXISTS update_course_stats_trigger ON course_enrollments;
CREATE TRIGGER update_course_stats_trigger 
  AFTER INSERT OR UPDATE ON course_enrollments 
  FOR EACH ROW EXECUTE FUNCTION update_course_stats();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample user (you can remove this)
INSERT INTO users (id, email, name, bio) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'admin@eduplatform.com', 'Admin User', 'Platform administrator')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VIEWS FOR ANALYTICS (Optional)
-- =====================================================

-- Course analytics view
CREATE OR REPLACE VIEW course_analytics AS
SELECT 
    c.id,
    c.title,
    c.level,
    c.category,
    c.enrollment_count,
    c.rating_average,
    c.rating_count,
    COUNT(DISTINCT up.user_id) as active_learners,
    AVG(up.completion_percentage) as avg_completion,
    COUNT(DISTINCT cert.id) as certificates_issued
FROM courses c
LEFT JOIN user_progress up ON c.id = up.course_id
LEFT JOIN certificates cert ON c.id = cert.course_id
WHERE c.is_public = true
GROUP BY c.id, c.title, c.level, c.category, c.enrollment_count, c.rating_average, c.rating_count;

-- User learning stats view
CREATE OR REPLACE VIEW user_learning_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT up.course_id) as courses_enrolled,
    COUNT(DISTINCT cert.id) as certificates_earned,
    AVG(up.completion_percentage) as avg_completion,
    SUM(up.total_time_spent) as total_study_time,
    ls.current_streak,
    ls.longest_streak
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN certificates cert ON u.id = cert.user_id
LEFT JOIN learning_streaks ls ON u.id = ls.user_id
GROUP BY u.id, u.name, u.email, ls.current_streak, ls.longest_streak;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 EduPlatform database schema created successfully!';
    RAISE NOTICE '📊 Tables created: users, courses, user_progress, certificates, course_reviews, course_enrollments, learning_streaks, user_achievements';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '⚡ Indexes created for optimal performance';
    RAISE NOTICE '🔧 Triggers and functions configured';
    RAISE NOTICE '📈 Analytics views available';
    RAISE NOTICE '';
    RAISE NOTICE '✅ You can now use the application!';
END $$;
