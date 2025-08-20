#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Simple file size reduction by creating smaller versions using sips (macOS built-in)
function optimizeWithSips(
  inputPath,
  outputPath,
  maxWidth = 1200,
  quality = 80
) {
  const { execSync } = require("child_process");

  try {
    // Use sips (built into macOS) to resize and compress
    const command = `sips -Z ${maxWidth} -s formatOptions ${quality} "${inputPath}" --out "${outputPath}"`;
    execSync(command, { stdio: "pipe" });
    console.log(`✅ Optimized: ${path.basename(inputPath)}`);

    // Show file size reduction
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const reduction = Math.round((1 - optimizedSize / originalSize) * 100);
    console.log(
      `   📊 Size reduction: ${reduction}% (${Math.round(
        originalSize / 1024 / 1024
      )}MB → ${Math.round(optimizedSize / 1024 / 1024)}MB)`
    );
  } catch (error) {
    console.error(
      `❌ Failed to optimize: ${path.basename(inputPath)}`,
      error.message
    );
  }
}

function main() {
  const imagesDir = "./images";
  const optimizedDir = "./images-optimized";

  // Create optimized directory
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir);
  }

  // Get all jpg files
  const imageFiles = fs
    .readdirSync(imagesDir)
    .filter((file) => file.toLowerCase().endsWith(".jpg"));

  console.log(`📸 Found ${imageFiles.length} images to optimize...`);
  console.log(`🎯 Target: Max width 1200px, 80% quality`);
  console.log("");

  imageFiles.forEach((file) => {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(optimizedDir, file);
    optimizeWithSips(inputPath, outputPath);
  });

  console.log("");
  console.log("🎉 Image optimization complete!");
  console.log("📁 Optimized images saved to: ./images-optimized/");
  console.log(
    '💡 Next step: Update your main.js imageUrls array to use "images-optimized/" instead of "images/"'
  );
}

main();
