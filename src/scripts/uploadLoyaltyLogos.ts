/**
 * Script to download, resize, and upload loyalty program logos to Supabase
 *
 * Usage: VITE_SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." npx tsx src/scripts/uploadLoyaltyLogos.ts
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET_NAME = "loyalty-programs";
const TARGET_SIZE = 64; // 64x64 pixels

// Loyalty program logos - remaining ones to upload using PNG files
const LOYALTY_PROGRAMS: { name: string; filename: string; url: string }[] = [
  {
    name: "Aeroplan",
    filename: "aeroplan.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Air_Canada_Logo.svg/200px-Air_Canada_Logo.svg.png",
  },
  {
    name: "Asia Miles",
    filename: "asia-miles.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Cathay_Pacific_logo.svg/200px-Cathay_Pacific_logo.svg.png",
  },
  {
    name: "Flying Blue",
    filename: "flying-blue.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/KLM_logo.svg/200px-KLM_logo.svg.png",
  },
  {
    name: "Marriott Bonvoy",
    filename: "marriott-bonvoy.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Marriott_Logo.svg/200px-Marriott_Logo.svg.png",
  },
  {
    name: "Citi ThankYou",
    filename: "citi-thankyou.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Citi.svg/200px-Citi.svg.png",
  },
  {
    name: "Scene+",
    filename: "scene-plus.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Scotiabank_Logo.svg/200px-Scotiabank_Logo.svg.png",
  },
  {
    name: "RBC Avion",
    filename: "rbc-avion.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Royal_Bank_of_Canada.svg/200px-Royal_Bank_of_Canada.svg.png",
  },
];

/**
 * Download image from URL using fetch
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Resize image to square with padding
 */
async function resizeImage(buffer: Buffer, size: number): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/**
 * Create bucket if it doesn't exist
 */
async function ensureBucketExists(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!exists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 1024 * 1024, // 1MB
    });
    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }
}

/**
 * Upload image to Supabase storage
 */
async function uploadToSupabase(
  filename: string,
  buffer: Buffer
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

/**
 * Main function
 */
async function main() {
  console.log("Starting loyalty program logo upload...\n");

  // Ensure bucket exists
  await ensureBucketExists();

  const results: { name: string; url: string; status: string }[] = [];

  for (const program of LOYALTY_PROGRAMS) {
    try {
      console.log(`Processing: ${program.name}`);

      // Download
      console.log(`  Downloading from ${program.url}`);
      const originalBuffer = await downloadImage(program.url);
      console.log(`  Downloaded: ${originalBuffer.length} bytes`);

      // Resize
      const resizedBuffer = await resizeImage(originalBuffer, TARGET_SIZE);
      console.log(`  Resized to ${TARGET_SIZE}x${TARGET_SIZE}`);

      // Upload
      const publicUrl = await uploadToSupabase(program.filename, resizedBuffer);
      console.log(`  Uploaded: ${publicUrl}\n`);

      results.push({ name: program.name, url: publicUrl, status: "success" });
    } catch (error) {
      console.error(`  Error: ${error}\n`);
      results.push({ name: program.name, url: "", status: `failed: ${error}` });
    }
  }

  // Print summary
  console.log("\n=== Upload Summary ===");
  console.log("Copy this mapping to use in the app:\n");
  console.log("const LOYALTY_PROGRAM_LOGOS: Record<string, string> = {");
  for (const result of results) {
    if (result.status === "success") {
      console.log(`  "${result.name}": "${result.url}",`);
    }
  }
  console.log("};");

  // Print failures
  const failures = results.filter((r) => r.status !== "success");
  if (failures.length > 0) {
    console.log("\nFailed uploads:");
    failures.forEach((f) => console.log(`  - ${f.name}: ${f.status}`));
  }
}

main().catch(console.error);
