import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const linkifySummary = (summary: string, fuzzyMatch = false) => {
  if (fuzzyMatch) {
    return summary.replace(/(\d+)/g, (match, id) => `[[${id}](/note/${id})]`);
  }
  return summary.replace(/\[(\d+)\]/g, (match, id) => `[[${id}](/note/${id})]`);
};

// capitalizes first letter
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
