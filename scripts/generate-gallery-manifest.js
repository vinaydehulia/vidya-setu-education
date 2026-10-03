const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const imagesDirectory = path.join(projectRoot, "assets", "images");
const manifestPath = path.join(projectRoot, "assets", "gallery-images.json");

const imageNames = fs.readdirSync(imagesDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(jpe?g)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));

fs.writeFileSync(manifestPath, `${JSON.stringify(imageNames, null, 2)}\n`);
console.log(`Generated gallery manifest with ${imageNames.length} image(s).`);
