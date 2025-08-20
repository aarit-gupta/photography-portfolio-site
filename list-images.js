#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Path to the images directory
const imagesDir = path.join(__dirname, "images");

try {
  // Check if images directory exists
  if (!fs.existsSync(imagesDir)) {
    console.log("Images directory not found.");
    process.exit(1);
  }

  // Read all files in the images directory
  const files = fs.readdirSync(imagesDir);

  // Filter for common image file extensions
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  const imageFiles = files.filter((file) =>
    imageExtensions.some((ext) => file.toLowerCase().endsWith(ext))
  );

  if (imageFiles.length === 0) {
    console.log("No image files found in the images directory.");
    process.exit(0);
  }

  // Create the array with proper paths in single quotes
  const imagePaths = imageFiles.map((file) => `'images/${file}'`);

  // Output the array in a single line
  console.log(`const imageUrls = [${imagePaths.join(", ")}];`);

  console.log(`\n// Found ${imageFiles.length} image(s):`);
  imageFiles.forEach((file) => console.log(`//   - ${file}`));
} catch (error) {
  console.error("Error reading images directory:", error.message);
  process.exit(1);
}
