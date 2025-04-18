import { Mode } from "@/types/types";
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
  // capitalize letters after hyphens and _ too
  str = str.replace(/[-_]\w/g, (char) => char.toUpperCase());
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${month} ${day}, ${year} at ${hours}:${minutes}`;
};

// Format date to show only the date (no time)
export const formatDateOnly = (dateString: string) => {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}, ${year}`;
};

/**
 * Sanitizes text by removing null bytes and control characters
 * that can cause issues with PostgreSQL storage
 */
export const sanitizeText = (text: string): string => {
  if (!text) return "";

  // Remove null bytes and other control characters while preserving newlines and tabs
  return text
    .replace(/[\u0000]/g, "") // Remove null bytes
    .replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "") // Remove control chars except tabs and newlines
    .replace(/\\u0000/g, ""); // Also remove literal \u0000 strings
};

/**
 * Converts the Mode to the corresponding OpenAI model name
 */
export const getModeModel = (mode: Mode): string => {
  switch (mode) {
    case "standard":
      return "gpt-4.1-nano-2025-04-14";
    case "medium":
      return "gpt-4.1-mini-2025-04-14";
    case "high":
      return "gpt-4.1-2025-04-14";
    default:
      return "gpt-4.1-2025-04-14"; // Default to highest capability
  }
};
