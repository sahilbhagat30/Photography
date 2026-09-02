import fs from "fs";
import path from "path";
import sharp from "sharp";

export interface PhotoData {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export async function getPhotos(): Promise<PhotoData[]> {
  const baseDir = path.join(process.cwd(), "public", "photos");
  const metaPath = path.join(baseDir, "meta.json");
  
  let metadata: Record<string, string> = {};
  if (fs.existsSync(metaPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch (e) {
      console.error("Error reading photos metadata", e);
    }
  }

  if (!fs.existsSync(baseDir)) return [];

  const files = fs
    .readdirSync(baseDir)
    .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(files.map(async (file) => {
    const filePath = path.join(baseDir, file);
    let width = 1;
    let height = 1;

    try {
      const dimensions = await sharp(filePath).metadata();
      width = dimensions.width ?? 1;
      height = dimensions.height ?? 1;
    } catch (error) {
      console.error(`Error reading dimensions for ${file}`, error);
    }

    return {
      src: `/photos/${file}`,
      alt: metadata[file] || "A captured moment",
      width,
      height,
    };
  }));
}
