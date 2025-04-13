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
