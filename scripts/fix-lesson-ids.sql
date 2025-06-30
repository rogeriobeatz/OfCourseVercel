-- Script para corrigir IDs das lições nos cursos existentes
-- Execute no Supabase SQL Editor

DO $$
DECLARE
    course_record RECORD;
    updated_lessons JSONB;
    lesson_record JSONB;
    lesson_index INTEGER;
BEGIN
    -- Loop through all courses
    FOR course_record IN SELECT id, title, lessons FROM courses LOOP
        updated_lessons := '[]'::jsonb;
        lesson_index := 0;
        
        -- Loop through lessons in each course
        FOR lesson_record IN SELECT * FROM jsonb_array_elements(course_record.lessons) LOOP
            lesson_index := lesson_index + 1;
            
            -- Add or fix the lesson ID
            lesson_record := lesson_record || jsonb_build_object(
                'id', COALESCE(lesson_record->>'id', 'lesson-' || lesson_index || '-' || extract(epoch from now())::bigint),
                'order', lesson_index
            );
            
            -- Add to updated lessons array
            updated_lessons := updated_lessons || lesson_record;
        END LOOP;
        
        -- Update the course with fixed lessons
        UPDATE courses 
        SET lessons = updated_lessons 
        WHERE id = course_record.id;
        
        RAISE NOTICE 'Fixed course: % (% lessons)', course_record.title, jsonb_array_length(updated_lessons);
    END LOOP;
    
    RAISE NOTICE 'All courses updated successfully!';
END $$;
