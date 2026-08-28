export const EMOJI_OPTIONS = [
  "🦊", "🐼", "🐸", "🐙", "🐯", "🦁", "🐨", "🐰",
  "🦄", "🐷", "🐵", "🐻", "🐶", "🐱", "🦖", "🐢",
  "🦉", "🐧", "🦈", "🐝", "🦋", "🐺", "🦥", "🦩",
  "🍄", "🌵", "🌞", "👻", "🤖", "👽", "🎃", "🐲",
] as const;

export const COLOR_OPTIONS = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#45AAF2",
  "#A55EEA", "#FD9644", "#26DE81", "#FC5C9C",
  "#778BEB", "#2BCBBA", "#F7B731", "#8854D0",
] as const;

export type PickableMember = {
  id: number;
  name: string;
  emoji: string;
  colorHex: string;
};
