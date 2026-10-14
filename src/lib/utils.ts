import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// globals.css で決めた角（rounded-control・rounded-card）と影（shadow-card・shadow-overlay）の名前を
// tailwind-merge に教える。教えないと「角」「影」のクラスとして扱われず、
// 同じ要素に2つ付いたとき（例: rounded-control と rounded-full）に後の指定で上書きされない（WO-007 S-5）。
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["control", "card"],
      shadow: ["card", "overlay"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
