// Dynamic color definitions and helper utilities for project labels

export const LABEL_COLOR_OPTIONS = [
  { name: "Sky Blue", value: "#0284c7" },
  { name: "Amber Orange", value: "#d97706" },
  { name: "Stone Slate", value: "#57534e" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Cyan Teal", value: "#0891b2" },
  { name: "Purple", value: "#9333ea" },
  { name: "Rose Red", value: "#e11d48" },
  { name: "Emerald Green", value: "#059669" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Pink", value: "#db2777" },
  { name: "Zinc Slate", value: "#3f3f46" },
];

export const DEFAULT_PROJECT_LABELS = [
  { name: "3D Scanning", color: "#0284c7" },
  { name: "Reverse Engineering", color: "#d97706" },
  { name: "CAD Modeling", color: "#4f46e5" },
  { name: "Metrology", color: "#059669" },
  { name: "Quality Control", color: "#e11d48" },
  { name: "Documentation", color: "#57534e" },
];

export const PRESET_CONSTRUCTION_LABELS = DEFAULT_PROJECT_LABELS;

export const LABEL_COLORS = {
  "3D Scanning": {
    bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    dot: "bg-sky-500",
    color: "#0284c7",
  },
  "Reverse Engineering": {
    bg: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
    color: "#d97706",
  },
  "CAD Modeling": {
    bg: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    dot: "bg-indigo-500",
    color: "#4f46e5",
  },
  Metrology: {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
    color: "#059669",
  },
  "Quality Control": {
    bg: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dot: "bg-rose-500",
    color: "#e11d48",
  },
  Documentation: {
    bg: "bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700",
    dot: "bg-stone-600",
    color: "#57534e",
  },
};

export function hashLabelColor(labelName) {
  if (!labelName) return "#0284c7";
  const colors = [
    "#0284c7",
    "#d97706",
    "#4f46e5",
    "#059669",
    "#e11d48",
    "#9333ea",
    "#0891b2",
    "#db2777",
    "#57534e",
  ];
  let hash = 0;
  for (let i = 0; i < labelName.length; i++) {
    hash = labelName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Returns a style object or CSS class info for a given label name
 */
export function getLabelInfo(labelName, boardLabels = []) {
  if (!labelName) {
    return { name: "", color: "#64748b", className: "bg-surface-2 text-ink border-line" };
  }

  // Check if found in board labels
  const boardMatch = (boardLabels || []).find(
    (l) => (l.name || l).toLowerCase() === labelName.toLowerCase()
  );

  const colorHex = boardMatch?.color || LABEL_COLORS[labelName]?.color || hashLabelColor(labelName);

  const staticClass = LABEL_COLORS[labelName]?.bg;
  if (staticClass && !boardMatch?.color) {
    return {
      name: labelName,
      color: colorHex,
      className: staticClass,
    };
  }

  return {
    name: labelName,
    color: colorHex,
    style: {
      backgroundColor: `${colorHex}15`,
      borderColor: `${colorHex}40`,
      color: colorHex,
    },
  };
}

export function getLabelBadgeClass(label, boardLabels = []) {
  if (!label) return "bg-surface-2 text-ink border-line";
  const match = LABEL_COLORS[label];
  if (match) return match.bg;
  return "bg-surface-2 text-ink border-line";
}

export function getLabelDotColor(label, boardLabels = []) {
  if (!label) return "#94a3b8";
  const boardMatch = (boardLabels || []).find(
    (l) => (l.name || l).toLowerCase() === label.toLowerCase()
  );
  if (boardMatch?.color) return boardMatch.color;
  if (LABEL_COLORS[label]?.color) return LABEL_COLORS[label].color;
  return hashLabelColor(label);
}
