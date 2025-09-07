-- Add profile_image column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.students.profile_image IS '학생 프로필 이미지 URL (S3 또는 외부 CDN URL)';

-- Create index for students with profile images (for filtering)
CREATE INDEX IF NOT EXISTS idx_students_has_profile_image 
ON public.students ((profile_image IS NOT NULL));