// Turns a board's single accent hex color into an ambient background gradient
export const boardGradient = (hex = "#0F172A") => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 15;
  const g = parseInt(clean.substring(2, 4), 16) || 23;
  const b = parseInt(clean.substring(4, 6), 16) || 42;
  return `radial-gradient(circle at 15% 10%, rgba(${r}, ${g}, ${b}, 0.12) 0%, transparent 55%), linear-gradient(160deg, rgba(234, 88, 12, 0.04) 0%, #FAF8F5 50%, #F4F0E8 100%)`;
};

// Rich, high-tech banner gradient for project cards in dashboard
export const boardBannerGradient = (hex = "#0F172A") => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 15;
  const g = parseInt(clean.substring(2, 4), 16) || 23;
  const b = parseInt(clean.substring(4, 6), 16) || 42;
  return `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.92) 0%, rgba(${Math.min(255, r + 25)}, ${Math.min(255, g + 25)}, ${Math.min(255, b + 35)}, 0.85) 100%)`;
};

export const PALETTE = [
  "#EA580C", // Precise Orange
  "#0F172A", // Slate Dark
  "#0369A1", // Sky Blue
  "#059669", // Emerald
  "#7C3AED", // Violet
  "#D97706", // Amber
  "#E11D48", // Rose
];
