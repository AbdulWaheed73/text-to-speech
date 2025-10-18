-- Migration: Add keyword column to existing generated_images table
-- Run this if you already have the generated_images table without the keyword column

-- Add keyword column if it doesn't exist
ALTER TABLE public.generated_images
ADD COLUMN IF NOT EXISTS keyword VARCHAR(100);

-- Create index on keyword for faster searching
CREATE INDEX IF NOT EXISTS idx_generated_images_keyword
ON public.generated_images(keyword);

-- Add comment for documentation
COMMENT ON COLUMN public.generated_images.keyword IS 'Keyword/tag associated with the image for categorization and search';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'generated_images'
  AND column_name = 'keyword';
