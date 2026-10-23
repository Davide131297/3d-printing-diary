/**
 * Color naming and calculation utilities for 3D printing filaments
 */

interface KnownColor {
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

const KNOWN_COLORS: KnownColor[] = [
  { name: "Schwarz", hex: "#000000", r: 0, g: 0, b: 0 },
  { name: "Weiß", hex: "#FFFFFF", r: 255, g: 255, b: 255 },
  { name: "Dunkelgrau", hex: "#4A4A4A", r: 74, g: 74, b: 74 },
  { name: "Grau", hex: "#808080", r: 128, g: 128, b: 128 },
  { name: "Hellgrau", hex: "#D3D3D3", r: 211, g: 211, b: 211 },
  { name: "Silber", hex: "#C0C0C0", r: 192, g: 192, b: 192 },
  { name: "Rot", hex: "#FF0000", r: 255, g: 0, b: 0 },
  { name: "Dunkelrot", hex: "#8B0000", r: 139, g: 0, b: 0 },
  { name: "Crimson", hex: "#DC143C", r: 220, g: 20, b: 60 },
  { name: "Gelb", hex: "#FFFF00", r: 255, g: 255, b: 0 },
  { name: "Sonnengelb", hex: "#EED211", r: 238, g: 210, b: 17 },
  { name: "Gold", hex: "#FFD700", r: 255, g: 215, b: 0 },
  { name: "Orange", hex: "#FFA500", r: 255, g: 165, b: 0 },
  { name: "Dunkelorange", hex: "#FF8C00", r: 255, g: 140, b: 0 },
  { name: "Grün", hex: "#008000", r: 0, g: 128, b: 0 },
  { name: "Hellgrün / Lime", hex: "#00FF00", r: 0, g: 255, b: 0 },
  { name: "Dunkelgrün", hex: "#004F00", r: 0, g: 79, b: 0 },
  { name: "Waldgrün", hex: "#228B22", r: 34, g: 139, b: 34 },
  { name: "Olivgrün", hex: "#808000", r: 128, g: 128, b: 0 },
  { name: "Blau", hex: "#0000FF", r: 0, g: 0, b: 255 },
  { name: "Königsblau", hex: "#4169E1", r: 65, g: 105, b: 225 },
  { name: "Dunkelblau / Navy", hex: "#000080", r: 0, g: 0, b: 128 },
  { name: "Hellblau / Sky", hex: "#87CEEB", r: 135, g: 206, b: 235 },
  { name: "Cyan / Türkis", hex: "#00FFFF", r: 0, g: 255, b: 255 },
  { name: "Teal", hex: "#008080", r: 0, g: 128, b: 128 },
  { name: "Lila / Violett", hex: "#800080", r: 128, g: 0, b: 128 },
  { name: "Purpur", hex: "#8A2BE2", r: 138, g: 43, b: 226 },
  { name: "Magenta", hex: "#FF00FF", r: 255, g: 0, b: 255 },
  { name: "Rosa / Pink", hex: "#FFC0CB", r: 255, g: 192, b: 203 },
  { name: "Hot Pink", hex: "#FF69B4", r: 255, g: 105, b: 180 },
  { name: "Braun", hex: "#8B4513", r: 139, g: 69, b: 19 },
  { name: "Schokobraun", hex: "#5C2C16", r: 92, g: 44, b: 22 },
  { name: "Beige / Hautfarbe", hex: "#F5F5DC", r: 245, g: 245, b: 220 },
  { name: "Kupfer", hex: "#B87333", r: 184, g: 115, b: 51 },
  { name: "Bronze", hex: "#CD7F32", r: 205, g: 127, b: 50 },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Returns a human-friendly German name for a hex color
 */
export function getColorName(hex: string): string {
  if (!hex) return "Unbekannt";
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // Exact match first
  const upper = hex.startsWith("#") ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
  const exact = KNOWN_COLORS.find((c) => c.hex.toUpperCase() === upper);
  if (exact) return exact.name;

  // Find nearest color using Euclidean distance with human perception weights
  let closest = KNOWN_COLORS[0];
  let minDistance = Infinity;

  for (const c of KNOWN_COLORS) {
    // Weighted Euclidean distance (redmean approximation)
    const rMean = (rgb.r + c.r) / 2;
    const rDiff = rgb.r - c.r;
    const gDiff = rgb.g - c.g;
    const bDiff = rgb.b - c.b;
    const weightR = 2 + rMean / 256;
    const weightG = 4.0;
    const weightB = 2 + (255 - rMean) / 256;

    const distance = Math.sqrt(
      weightR * rDiff * rDiff + weightG * gDiff * gDiff + weightB * bDiff * bDiff,
    );

    if (distance < minDistance) {
      minDistance = distance;
      closest = c;
    }
  }

  return closest.name;
}

/**
 * Normalizes hex string (always begins with # and is uppercase)
 */
export function normalizeHex(color: string): string {
  if (!color) return "#CCCCCC";
  let c = color.trim();
  if (!c.startsWith("#") && /^[0-9A-Fa-f]{3,6}$/.test(c)) {
    c = `#${c}`;
  }
  return c.toUpperCase();
}

/**
 * Returns true if the background color is bright (requires dark text)
 */
export function isBrightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  // Perceived brightness formula
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 160;
}

/**
 * Formats weight nicely (e.g. "123 g" or "1.25 kg")
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2).replace(/\.00$/, "")} kg`;
  }
  return `${Math.round(grams)} g`;
}

/**
 * Formats print time in minutes to "X Std. Y Min."
 */
export function formatPrintTime(minutes?: number): string {
  if (!minutes || minutes <= 0) return "–";
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours === 0) {
    return `${remainingMins} Min.`;
  }
  if (remainingMins === 0) {
    return `${hours} Std.`;
  }
  return `${hours} Std. ${remainingMins} Min.`;
}
