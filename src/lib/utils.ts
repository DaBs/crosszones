import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique ID with alphanumeric characters and hyphens
 * Suitable for Tauri window labels which only accept alphanumeric and hyphens
 */
export function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

/**
 * Generates a unique zone ID
 */
export function generateZoneId(): string {
  return generateId('zone');
}

/**
 * Generates a unique layout ID
 */
export function generateLayoutId(): string {
  return generateId('layout');
}
