export const TASK_META: Record<string, { color: string; blurb: string }> = {
  Kitchen: { color: "#FF6B6B", blurb: "Floor, dishes, counters & table" },
  Bathroom: { color: "#45AAF2", blurb: "Sink, shower, mirror & floor" },
  Toilet: { color: "#FFD93D", blurb: "Bowl, seat, handle & paper stock" },
  "Floor & Trash": {
    color: "#4ECDC4",
    blurb: "Common areas + every bin in the flat",
  },
};

export function taskColor(name: string) {
  return TASK_META[name]?.color ?? "#898781";
}

export function taskBlurb(name: string) {
  return TASK_META[name]?.blurb ?? "";
}
