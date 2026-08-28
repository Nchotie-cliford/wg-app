export const CATEGORIES = [
  { name: "Groceries", emoji: "🛒", color: "#2a78d6" },
  { name: "Cleaning Supplies", emoji: "🧴", color: "#eb6834" },
  { name: "Household", emoji: "🏠", color: "#1baf7a" },
  { name: "Internet & Bills", emoji: "📡", color: "#eda100" },
  { name: "Fun & Party", emoji: "🎉", color: "#e87ba4" },
  { name: "Other", emoji: "📦", color: "#008300" },
] as const;

export function categoryEmoji(name: string) {
  return CATEGORIES.find((c) => c.name === name)?.emoji ?? "📦";
}

export function categoryColor(name: string) {
  return CATEGORIES.find((c) => c.name === name)?.color ?? "#52514e";
}
