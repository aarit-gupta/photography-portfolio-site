#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Check if ImageMagick is installed
function checkImageMagick() {
  try {
    execSync("magick -version", { stdio: "ignore" });
    return true;
  } catch {
    try {
      execSync("convert -version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

// Get the command name (magick or convert)
function getConvertCommand() {
  try {
    execSync("magick -version", { stdio: "ignore" });
    return "magick";
  } catch {
    return "convert";
  }
}

function optimizeImage(inputPath, outputPath, maxWidth = 1920, quality = 85) {
  const convertCmd = getConvertCommand();
  const command = `${convertCmd} "${inputPath}" -resize ${maxWidth}x${maxWidth}> -quality ${quality} -strip "${outputPath}"`;

  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ Optimized: ${path.basename(inputPath)}`);
  } catch (error) {
    console.error(`❌ Failed to optimize: ${path.basename(inputPath)}`);
  }
}

function main() {
  if (!checkImageMagick()) {
    console.log("❌ ImageMagick not found. Installing...");
    console.log("Run: brew install imagemagick");
    console.log(
      "Or download from: https://imagemagick.org/script/download.php"
    );
    return;
  }

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

  imageFiles.forEach((file) => {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(optimizedDir, file);
    optimizeImage(inputPath, outputPath);
  });

  console.log("🎉 Image optimization complete!");
  console.log("📁 Optimized images saved to: ./images-optimized/");
  console.log(
    '💡 Update your main.js to use "images-optimized/" instead of "images/"'
  );
}

main();
