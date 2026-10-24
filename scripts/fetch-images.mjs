/**
 * scripts/fetch-images.mjs
 * Fetches freely-licensed images from Wikimedia Commons for Karnataka destinations.
 * Run locally: node scripts/fetch-images.mjs
 * NOT executed during Vercel production build.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES_JSON_PATH = path.join(__dirname, "../data/places.json");
const OUTPUT_DIR = path.join(__dirname, "../public/places");

const USER_AGENT = "DariKarnatakaTravelPlanner/1.0 (https://dari-karnataka.vercel.app; varshithvardhan@gmail.com)";
const ALLOWED_LICENSES = [
  "CC0",
  "CC BY 2.0",
  "CC BY 3.0",
  "CC BY 4.0",
  "CC BY-SA 2.0",
  "CC BY-SA 3.0",
  "CC BY-SA 4.0",
  "Public domain",
  "PD",
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchWikimediaCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=imageinfo&iiprop=url|extmetadata|size`;

  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.query?.pages ? Object.values(data.query.pages) : null;
  } catch (err) {
    console.warn(`Search failed for "${query}":`, err.message);
    return null;
  }
}

function parseLicenseAndArtist(page) {
  const info = page.imageinfo?.[0];
  if (!info || !info.extmetadata) return null;

  const meta = info.extmetadata;
  const licenseName = meta.LicenseShortName?.value || meta.License?.value || "";
  const artistRaw = meta.Artist?.value || meta.Credit?.value || "Unknown";
  // Strip HTML from artist string
  const artist = artistRaw.replace(/<[^>]*>?/gm, "").trim();
  const sourceUrl = info.descriptionurl || "";
  const directUrl = info.url || "";

  const isAllowed = ALLOWED_LICENSES.some((lic) =>
    licenseName.toLowerCase().includes(lic.toLowerCase())
  );

  if (!isAllowed) return null;

  return {
    artist,
    license: licenseName,
    sourceUrl,
    directUrl,
  };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const rawData = await fs.readFile(PLACES_JSON_PATH, "utf-8");
  const places = JSON.parse(rawData);

  console.log(`Starting Wikimedia image scan for ${places.length} places...`);
  const missingImages = [];

  for (const place of places) {
    if (place.image && place.image.file) {
      console.log(`✓ ${place.name_en} already has image.`);
      continue;
    }

    console.log(`Searching Wikimedia for: ${place.name_en} ${place.city}...`);
    await sleep(1000); // Respect Wikimedia Commons API etiquette

    const searchResults = await searchWikimediaCommons(`${place.name_en} ${place.city}`);
    let matched = false;

    if (searchResults) {
      for (const page of searchResults) {
        const licInfo = parseLicenseAndArtist(page);
        if (licInfo && licInfo.directUrl) {
          console.log(`  Found: "${licInfo.license}" by ${licInfo.artist}`);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      missingImages.push({ id: place.id, name: place.name_en, city: place.city });
    }
  }

  console.log("\n=================================");
  console.log(`Completed. Places without photo: ${missingImages.length}`);
  if (missingImages.length > 0) {
    console.table(missingImages);
  }
}

// Only execute when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("fetch-images error:", err);
    process.exit(1);
  });
}