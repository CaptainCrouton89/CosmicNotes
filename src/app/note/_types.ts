export const ZONES = ["personal", "work", "other"] as const;
export type Zone = (typeof ZONES)[number] | "";
