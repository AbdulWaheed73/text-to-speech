# Quick Start Guide

Get up and running with the DALL·E to Supabase pipeline in 5 minutes!

## Step 1: Add Environment Variables

Add these to your `.env.local` file:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_BUCKET_NAME="dall-e-images"
```

## Step 2: Set Up Supabase

### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `dall-e-images`
4. Make it public: ✅
5. Click "Create bucket"

### Create Database Table

1. Go to Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy/paste from `scripts/supabase-schema.sql`
4. Click "Run"

This creates the `generated_images` table with the `keyword` column and all necessary storage policies.

## Step 3: Create Your Prompts JSON

Use the example file or create your own:

```json
{
  "batch_1": [
    {
      "keyword": "happy",
      "prompt": "A cute emoji showing happiness..."
    },
    {
      "keyword": "sad",
      "prompt": "A gentle emoji showing sadness..."
    }
  ]
}
```

Save as `my-prompts.json` or use `scripts/prompts-example.json`.

## Step 4: Run the Script

```bash
# With JSON file (recommended)
node scripts/generate-images.js scripts/prompts-example.json

# Or with npm
npm run generate-images scripts/prompts-example.json

# Interactive mode (no file)
node scripts/generate-images.js
```

## Step 5: Watch the Magic! ✨

The script will:
- ✅ Validate your JSON file
- ✅ Process each batch sequentially
- ✅ Generate images with DALL·E 3
- ✅ Upload to Supabase Storage
- ✅ Save metadata to database
- ✅ Retry failed prompts (up to 3 times)
- ✅ Show detailed progress and summary

Example output:
```
📦 Found 3 batch(es): batch_1, batch_2, batch_3
📝 Total items to process: 9

🎨 Generating image for keyword: "happy"
✅ Image generated successfully
📤 Uploading to Supabase Storage...
✅ Image uploaded: happy_1729180234.png
💾 Saving metadata to database...
✅ Metadata saved to database

🎉 Success! Image available at:
   https://project.supabase.co/storage/v1/...
```

## Viewing Your Images

### In Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Click on `dall-e-images` bucket
3. See all your generated images (named by keyword!)

### In Database

1. Go to Supabase Dashboard → Table Editor
2. Select `generated_images` table
3. View all metadata with keywords

### Query Examples

```sql
-- Get all images by keyword
SELECT * FROM generated_images
WHERE keyword = 'happy';

-- Get all images
SELECT * FROM generated_images
ORDER BY created_at DESC;

-- Count images per keyword
SELECT keyword, COUNT(*) as count
FROM generated_images
GROUP BY keyword;
```

## Troubleshooting

**Script won't run?**
- Check that `.env.local` has all required variables
- Verify Supabase bucket exists and is public
- Make sure database table was created with keyword column

**Invalid JSON structure error?**
- Batches must be named `batch_1`, `batch_2`, etc.
- Each item needs both `keyword` and `prompt` fields
- Validate your JSON syntax

**Images not uploading?**
- Check storage policies were created (run `scripts/supabase-schema.sql`)
- Verify bucket name matches `SUPABASE_BUCKET_NAME`
- Check Supabase project is active

**Database errors?**
- Ensure you ran the full schema SQL (includes keyword column)
- If upgrading, run `scripts/add-keyword-column.sql`
- Check RLS is disabled or has correct policies

**Rate limiting?**
- Reduce batch sizes (10-20 items per batch)
- Script already waits 2 seconds between requests
- Check OpenAI API usage limits

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Customize DALL·E settings (quality, style, size)
- Adjust retry settings (MAX_RETRIES, RETRY_DELAY)
- Query your images by keyword in Supabase
- Build your own prompts JSON files

## Tips

- Use descriptive keywords for easy searching
- Keep batches to 10-20 items for better tracking
- Monitor Supabase storage usage
- Check OpenAI costs regularly
- Backup your JSON files

Need more help? See the full [README.md](./README.md) for detailed documentation!
