#!/usr/bin/env node

/**
 * DALL·E to Supabase Image Generation Pipeline
 *
 * This script generates images using OpenAI's DALL·E API and stores them in Supabase.
 * It downloads the generated images, uploads them to Supabase Storage, and saves
 * metadata to a database table.
 *
 * Usage:
 *   node scripts/generate-images.js <path-to-prompts.json>
 *   node scripts/generate-images.js  (interactive mode)
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
import dotenv from 'dotenv';
const envPath = path.join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'dall-e-images';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Promisified question function for readline
 */
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate image using DALL·E
 */
async function generateImage(prompt, keyword) {
  console.log(`\n🎨 Generating image for keyword: "${keyword}"`);
  console.log(`   Prompt: "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"`);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    console.log(`✅ Image generated successfully`);

    return {
      imageUrl,
      revisedPrompt,
    };
  } catch (error) {
    console.error(`❌ Error generating image: ${error.message}`);
    throw error;
  }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(imageBuffer, keyword, originalPrompt, revisedPrompt) {
  try {
    // Generate filename using keyword and timestamp
    const timestamp = Date.now();
    const sanitizedKeyword = keyword
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const filename = `${sanitizedKeyword}_${timestamp}.png`;

    console.log(`📤 Uploading to Supabase Storage...`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log(`✅ Image uploaded: ${filename}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    // Insert record into database
    console.log(`💾 Saving metadata to database...`);

    const { error: dbError } = await supabase
      .from('generated_images')
      .insert([
        {
          keyword: keyword,
          original_prompt: originalPrompt,
          revised_prompt: revisedPrompt,
          image_url: publicUrl,
          storage_path: filename,
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'hd',
          style: 'natural',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ]);

    if (dbError) {
      console.error(`⚠️  Warning: Failed to save to database: ${dbError.message}`);
      console.log(`Image is still available at: ${publicUrl}`);
    } else {
      console.log(`✅ Metadata saved to database`);
    }

    return publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading to Supabase: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single prompt with retry logic
 */
async function processPromptWithRetry(item, index, total, batchName, itemIndex, batchTotal) {
  const { keyword, prompt } = item;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Batch: ${batchName} | Item ${itemIndex + 1} of ${batchTotal} | Overall ${index + 1} of ${total}`);
  console.log(`Keyword: ${keyword}`);
  console.log(`${'='.repeat(60)}`);

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`\n🔄 Retry attempt ${attempt} of ${MAX_RETRIES}...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }

      // Generate image with DALL·E
      const { imageUrl, revisedPrompt } = await generateImage(prompt, keyword);

      // Download the image
      console.log(`⬇️  Downloading image...`);
      const imageBuffer = await downloadImage(imageUrl);
      console.log(`✅ Image downloaded (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

      // Upload to Supabase
      const publicUrl = await uploadToSupabase(imageBuffer, keyword, prompt, revisedPrompt);

      console.log(`\n🎉 Success! Image available at:`);
      console.log(`   ${publicUrl}`);

      return {
        success: true,
        keyword,
        prompt,
        publicUrl,
        attempts: attempt,
        batchName,
      };
    } catch (error) {
      lastError = error;
      console.error(`\n💥 Attempt ${attempt} failed: ${error.message}`);

      if (attempt === MAX_RETRIES) {
        console.error(`❌ All ${MAX_RETRIES} attempts failed for keyword: ${keyword}`);
      }
    }
  }

  return {
    success: false,
    keyword,
    prompt,
    error: lastError.message,
    attempts: MAX_RETRIES,
    batchName,
  };
}

/**
 * Validate JSON structure
 */
function validateJSON(data) {
  const errors = [];

  if (typeof data !== 'object' || data === null) {
    errors.push('JSON must be an object');
    return errors;
  }

  const batchKeys = Object.keys(data).filter(key => key.startsWith('batch_'));

  if (batchKeys.length === 0) {
    errors.push('No batches found. Batches should be named batch_1, batch_2, etc.');
    return errors;
  }

  batchKeys.forEach(batchName => {
    const batch = data[batchName];

    if (!Array.isArray(batch)) {
      errors.push(`${batchName} must be an array`);
      return;
    }

    if (batch.length === 0) {
      errors.push(`${batchName} is empty`);
      return;
    }

    batch.forEach((item, index) => {
      if (!item.keyword) {
        errors.push(`${batchName}[${index}] is missing 'keyword' field`);
      }
      if (!item.prompt) {
        errors.push(`${batchName}[${index}] is missing 'prompt' field`);
      }
      if (typeof item.keyword !== 'string') {
        errors.push(`${batchName}[${index}].keyword must be a string`);
      }
      if (typeof item.prompt !== 'string') {
        errors.push(`${batchName}[${index}].prompt must be a string`);
      }
    });
  });

  return errors;
}

/**
 * Load and validate JSON file
 */
function loadJSONFile(filePath) {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const data = JSON.parse(content);

    const errors = validateJSON(data);
    if (errors.length > 0) {
      throw new Error(`Invalid JSON structure:\n  - ${errors.join('\n  - ')}`);
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON syntax: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Process batches from JSON file
 */
async function processBatches(jsonData) {
  // Extract and sort batch names
  const batchNames = Object.keys(jsonData)
    .filter(key => key.startsWith('batch_'))
    .sort((a, b) => {
      const numA = parseInt(a.split('_')[1]);
      const numB = parseInt(b.split('_')[1]);
      return numA - numB;
    });

  console.log(`\n📦 Found ${batchNames.length} batch(es): ${batchNames.join(', ')}`);

  // Calculate total items
  const totalItems = batchNames.reduce((sum, batchName) => {
    return sum + jsonData[batchName].length;
  }, 0);

  console.log(`📝 Total items to process: ${totalItems}\n`);

  const allResults = [];
  const batchResults = {};
  let overallIndex = 0;

  for (let batchIdx = 0; batchIdx < batchNames.length; batchIdx++) {
    const batchName = batchNames[batchIdx];
    const batch = jsonData[batchName];

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📦 Processing ${batchName} (${batchIdx + 1}/${batchNames.length})`);
    console.log(`   Items in this batch: ${batch.length}`);
    console.log(`${'═'.repeat(60)}`);

    const batchStartTime = Date.now();
    const results = [];

    for (let i = 0; i < batch.length; i++) {
      const result = await processPromptWithRetry(
        batch[i],
        overallIndex,
        totalItems,
        batchName,
        i,
        batch.length
      );
      results.push(result);
      allResults.push(result);
      overallIndex++;

      // Add delay between requests (except for last item in last batch)
      if (!(batchIdx === batchNames.length - 1 && i === batch.length - 1)) {
        console.log(`\n⏳ Waiting 2 seconds before next generation...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const batchTime = ((Date.now() - batchStartTime) / 1000).toFixed(1);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    batchResults[batchName] = {
      total: batch.length,
      successful,
      failed,
      time: batchTime,
    };

    console.log(`\n✅ ${batchName} completed in ${batchTime}s (${successful}/${batch.length} successful)`);
  }

  return { allResults, batchResults };
}

/**
 * Display final summary
 */
function displaySummary(allResults, batchResults) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 FINAL SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);

  // Batch-level summary
  console.log(`📦 Batch Results:\n`);
  Object.entries(batchResults).forEach(([batchName, stats]) => {
    const successRate = ((stats.successful / stats.total) * 100).toFixed(1);
    console.log(`   ${batchName}:`);
    console.log(`     ✅ Successful: ${stats.successful}/${stats.total} (${successRate}%)`);
    console.log(`     ⏱️  Time: ${stats.time}s`);
    console.log();
  });

  // Overall summary
  const totalSuccessful = allResults.filter(r => r.success).length;
  const totalFailed = allResults.filter(r => !r.success).length;
  const overallSuccessRate = ((totalSuccessful / allResults.length) * 100).toFixed(1);

  console.log(`📈 Overall Results:\n`);
  console.log(`   ✅ Successful: ${totalSuccessful}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   📝 Total: ${allResults.length}`);
  console.log(`   📊 Success Rate: ${overallSuccessRate}%\n`);

  // Successful generations
  if (totalSuccessful > 0) {
    console.log(`✅ Successful Generations:\n`);
    allResults
      .filter(r => r.success)
      .forEach((r, i) => {
        const retryInfo = r.attempts > 1 ? ` (after ${r.attempts} attempts)` : '';
        console.log(`   ${i + 1}. [${r.batchName}] ${r.keyword}${retryInfo}`);
        console.log(`      ${r.publicUrl}\n`);
      });
  }

  // Failed generations
  if (totalFailed > 0) {
    console.log(`❌ Failed Generations:\n`);
    allResults
      .filter(r => !r.success)
      .forEach((r, i) => {
        console.log(`   ${i + 1}. [${r.batchName}] ${r.keyword}`);
        console.log(`      Prompt: ${r.prompt.substring(0, 60)}...`);
        console.log(`      Error: ${r.error}\n`);
      });
  }
}

/**
 * Interactive mode (fallback)
 */
async function interactiveMode() {
  console.log(`💡 Tip: For batch processing, use: node scripts/generate-images.js <file.json>\n`);

  try {
    // Ask for number of images
    const countStr = await question('How many images would you like to generate? ');
    const count = parseInt(countStr, 10);

    if (isNaN(count) || count <= 0) {
      console.error('❌ Invalid number. Please enter a positive integer.');
      return;
    }

    console.log(`\n📝 Please enter ${count} prompt(s) with keywords:\n`);

    // Collect prompts
    const items = [];
    for (let i = 0; i < count; i++) {
      const keyword = await question(`Keyword ${i + 1}: `);
      const prompt = await question(`Prompt ${i + 1}: `);

      if (keyword.trim() && prompt.trim()) {
        items.push({ keyword: keyword.trim(), prompt: prompt.trim() });
      } else {
        console.log('⚠️  Empty keyword or prompt, skipping...');
        i--; // Ask again
      }
    }

    console.log(`\n🎬 Starting image generation for ${items.length} prompt(s)...`);

    // Process each item
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const result = await processPromptWithRetry(
        items[i],
        i,
        items.length,
        'interactive',
        i,
        items.length
      );
      results.push(result);

      // Add delay between requests
      if (i < items.length - 1) {
        console.log(`\n⏳ Waiting 2 seconds before next generation...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Simple summary for interactive mode
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Generation Summary`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${results.length}\n`);

    if (successful > 0) {
      console.log(`Successful generations:`);
      results
        .filter(r => r.success)
        .forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.keyword}`);
          console.log(`     ${r.publicUrl}\n`);
        });
    }

    if (failed > 0) {
      console.log(`Failed generations:`);
      results
        .filter(r => !r.success)
        .forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.keyword}`);
          console.log(`     Error: ${r.error}\n`);
        });
    }
  } catch (error) {
    console.error(`\n💥 Error in interactive mode: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀 DALL·E to Supabase Image Generation Pipeline`);
  console.log(`${'═'.repeat(60)}\n`);

  // Verify environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Error: Supabase credentials not found in .env.local');
    console.error('   Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Check for JSON file argument
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive mode
    await interactiveMode();
  } else if (args[0] === '--help' || args[0] === '-h') {
    // Show help
    console.log(`Usage:`);
    console.log(`  node scripts/generate-images.js <path-to-prompts.json>`);
    console.log(`  node scripts/generate-images.js  (interactive mode)\n`);
    console.log(`Example:`);
    console.log(`  node scripts/generate-images.js scripts/prompts-example.json\n`);
    console.log(`JSON Format:`);
    console.log(`  {`);
    console.log(`    "batch_1": [`);
    console.log(`      { "keyword": "happy", "prompt": "..." },`);
    console.log(`      { "keyword": "sad", "prompt": "..." }`);
    console.log(`    ],`);
    console.log(`    "batch_2": [ ... ]`);
    console.log(`  }\n`);
  } else {
    // Batch processing mode
    const jsonFilePath = args[0];

    try {
      console.log(`📂 Loading JSON file: ${jsonFilePath}\n`);
      const jsonData = loadJSONFile(jsonFilePath);
      console.log(`✅ JSON file loaded and validated successfully`);

      const { allResults, batchResults } = await processBatches(jsonData);
      displaySummary(allResults, batchResults);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(`\n✨ Pipeline completed!\n`);
  rl.close();
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  rl.close();
  process.exit(1);
});
