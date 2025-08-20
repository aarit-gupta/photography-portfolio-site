#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Directory containing images
const imagesDir = "./images-optimized";

try {
  // Read directory contents
  const files = fs.readdirSync(imagesDir);

  // Filter for image files (jpg, jpeg, png, gif, webp)
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
  });

  // Sort files alphabetically
  imageFiles.sort();

  // Generate the array format for main.js
  const imageArray = imageFiles.map((file) => `"images-optimized/${file}"`);

  console.log(`Found ${imageFiles.length} optimized images:`);
  console.log("\n// Optimized images array for main.js:");
  console.log(`const imageUrls = [${imageArray.join(", ")}];`);
} catch (error) {
  console.error("Error reading images directory:", error.message);
  console.log("Make sure the images-optimized folder exists.");
}
