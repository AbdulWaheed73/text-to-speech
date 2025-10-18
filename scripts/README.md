# DALL·E to Supabase Image Generation Pipeline

This script generates images using OpenAI's DALL·E API and automatically stores them in Supabase Storage with metadata saved to your database. It supports both JSON batch processing and interactive mode.

## Features

- 🎨 Batch processing from JSON files with multiple batches
- 🔄 Automatic retry logic (3 attempts) for failed generations
- 📤 Automatic upload to Supabase Storage
- 💾 Metadata storage in Supabase database with keywords
- 📝 Tracks original and revised prompts
- ✨ Detailed progress tracking and batch-level statistics
- 🏷️ Keyword-based file naming and categorization
- 📊 Comprehensive success/failure reporting

## Prerequisites

Before running the script, you need:

1. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Supabase Project** - Create one at [supabase.com](https://supabase.com)
3. **Node.js** - Version 16 or higher

## Setup Instructions

### 1. Install Dependencies

The required packages should already be installed. If not, run:

```bash
npm install
```

### 2. Configure Environment Variables

Add the following to your `.env.local` file in the project root:

```env
# OpenAI API Key (required)
OPENAI_API_KEY="your-openai-api-key-here"

# Supabase Configuration (required)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_BUCKET_NAME="dall-e-images"
```

**How to get Supabase credentials:**

1. Go to your Supabase project dashboard
2. Click on the Settings (gear icon) in the sidebar
3. Navigate to "API" section
4. Copy the "Project URL" → use as `SUPABASE_URL`
5. Copy the "anon public" key → use as `SUPABASE_ANON_KEY`

### 3. Set Up Supabase Storage

1. Go to your Supabase project dashboard
2. Navigate to "Storage" in the sidebar
3. Click "New bucket"
4. Create a bucket named `dall-e-images` (or whatever you set in `SUPABASE_BUCKET_NAME`)
5. Configure bucket settings:
   - **Public bucket**: ✅ Yes (if you want images to be publicly accessible)
   - **File size limit**: Set as needed (DALL·E images are typically ~500KB-2MB)
   - **Allowed MIME types**: `image/png` (recommended)

### 4. Set Up Supabase Database

Run the SQL schema in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor" in the sidebar
3. Click "New query"
4. Copy and paste the contents of `scripts/supabase-schema.sql`
5. Click "Run" to execute the schema

This will create:
- `generated_images` table with all necessary columns (including `keyword`)
- Indexes for performance
- Storage policies for anonymous uploads
- Automatic timestamp updates

### 5. Update Existing Database (If Applicable)

If you already have the `generated_images` table without the `keyword` column, run:

1. Go to Supabase SQL Editor
2. Copy/paste contents of `scripts/add-keyword-column.sql`
3. Run the query

## Usage

### Batch Processing Mode (Recommended)

Process multiple images from a JSON file:

```bash
# Using the example file
node scripts/generate-images.js scripts/prompts-example.json

# Using your own JSON file
node scripts/generate-images.js path/to/your/prompts.json

# Or with npm script
npm run generate-images scripts/prompts-example.json
```

### Interactive Mode

If you don't provide a JSON file, the script will run in interactive mode:

```bash
node scripts/generate-images.js
```

Then follow the prompts to enter keywords and prompts manually.

### Help

```bash
node scripts/generate-images.js --help
```

## JSON File Format

Create a JSON file with batches of prompts:

```json
{
  "batch_1": [
    {
      "keyword": "happy",
      "prompt": "Create a cute emoji of a smiling child's face showing happiness and joy. The style should be simple, soft, and colorful, suitable for children aged 3 to 6."
    },
    {
      "keyword": "water",
      "prompt": "Create an emoji-style image of a glass of water with a cheerful, friendly expression."
    }
  ],
  "batch_2": [
    {
      "keyword": "cat",
      "prompt": "Create a friendly cartoon cat emoji with big eyes and a sweet expression."
    },
    {
      "keyword": "dog",
      "prompt": "Create a playful dog emoji with floppy ears and a happy expression."
    }
  ]
}
```

**Requirements:**
- Each batch must be named `batch_1`, `batch_2`, etc.
- Each item must have both `keyword` and `prompt` fields
- Both fields must be strings
- Batches are processed sequentially in order

See `scripts/prompts-example.json` for a complete example.

## How It Works

### Batch Processing Flow

1. **Loads JSON file** - Validates structure and content
2. **Processes batches sequentially** - batch_1, batch_2, batch_3, etc.
3. **For each item in a batch:**
   - Generates image using DALL·E 3
   - Downloads the image
   - Uploads to Supabase Storage (filename: `keyword_timestamp.png`)
   - Saves metadata to database
   - Retries up to 3 times if any step fails
   - Waits 2 seconds before next item (rate limiting)
4. **Displays comprehensive summary** - Batch-level and overall statistics

### Retry Logic

- Each failed prompt is retried up to **3 times**
- **2-second delay** between retry attempts
- Continues with next prompt after all retries exhausted
- Final summary shows which prompts failed and after how many attempts

### File Naming

Images are saved as: `{keyword}_{timestamp}.png`

Examples:
- `happy_1729180234.png`
- `water_1729180236.png`
- `cat_1729180238.png`

This ensures:
- Easy identification by keyword
- No filename conflicts (unique timestamps)
- Clean, readable names

## Database Schema

The `generated_images` table contains:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `keyword` | VARCHAR(100) | Keyword/tag for the image |
| `original_prompt` | TEXT | Your original prompt |
| `revised_prompt` | TEXT | DALL·E's optimized prompt |
| `image_url` | TEXT | Public URL in Supabase Storage |
| `storage_path` | TEXT | File path in bucket |
| `model` | VARCHAR | Model used (dall-e-3) |
| `size` | VARCHAR | Image dimensions (1024x1024) |
| `quality` | VARCHAR | Quality setting (hd) |
| `style` | VARCHAR | Style (natural) |
| `status` | VARCHAR | Generation status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Querying Your Images

You can query generated images in Supabase:

```sql
-- Get all images by keyword
SELECT * FROM generated_images
WHERE keyword = 'happy'
ORDER BY created_at DESC;

-- Search by prompt content
SELECT * FROM generated_images
WHERE original_prompt ILIKE '%emoji%';

-- Get images from the last 24 hours
SELECT * FROM generated_images
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Count images per keyword
SELECT keyword, COUNT(*) as count
FROM generated_images
GROUP BY keyword
ORDER BY count DESC;
```

## Troubleshooting

### Error: OPENAI_API_KEY not found

Make sure you've added the OpenAI API key to `.env.local` and it's properly formatted.

### Error: Supabase credentials not found

Verify that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in `.env.local`.

### Error: Failed to upload to Storage

1. Check that the bucket exists and is named correctly
2. Verify storage policies allow anonymous uploads (run `scripts/supabase-schema.sql`)
3. Check that your Supabase project is active

### Error: Failed to save to database

1. Verify the `generated_images` table exists with `keyword` column
2. Check that RLS is disabled or policies allow inserts
3. Verify your Supabase key has the necessary permissions

### Error: Invalid JSON structure

1. Check that batches are named `batch_1`, `batch_2`, etc.
2. Ensure each item has both `keyword` and `prompt` fields
3. Validate JSON syntax (use a JSON validator)

### Rate Limiting

DALL·E API has rate limits. The script includes a 2-second delay between generations. If you still hit rate limits:

1. Reduce the number of items per batch
2. Increase `RETRY_DELAY` constant in the script
3. Check your OpenAI usage limits

## Cost Considerations

- **DALL·E 3**: ~$0.04 per image (1024x1024, standard quality) or ~$0.08 (HD quality)
- **Supabase Storage**: Free tier includes 1GB, then ~$0.021/GB/month
- **Supabase Database**: Free tier includes 500MB

**Example costs:**
- 100 images at HD quality: ~$8.00
- 100 images stored (~150MB): Free (under 1GB limit)

## Advanced Configuration

### Changing Image Settings

Edit `scripts/generate-images.js` to modify DALL·E parameters:

```javascript
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: prompt,
  n: 1,
  size: '1024x1024',  // Options: '1024x1024', '1792x1024', '1024x1792'
  quality: 'hd',       // Options: 'standard', 'hd'
  style: 'natural',    // Options: 'natural', 'vivid'
});
```

### Changing Retry Settings

Modify constants at the top of `scripts/generate-images.js`:

```javascript
const MAX_RETRIES = 3;      // Number of retry attempts
const RETRY_DELAY = 2000;   // Delay between retries (milliseconds)
```

## Security Notes

- Never commit `.env.local` to version control
- Storage policies allow anonymous uploads to `dall-e-images` bucket only
- Database RLS is disabled for development - enable for production
- Consider using a service role key for production environments
- Regularly rotate API keys

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs in your dashboard
3. Check OpenAI API status at [status.openai.com](https://status.openai.com)
4. Verify JSON file structure matches the required format

## License

This script is part of the text-to-speech-app project.
