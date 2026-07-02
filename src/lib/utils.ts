import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Map phone number to a valid email format for Firebase Auth
export function phoneToEmail(phone: string) {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `${cleanPhone}@adma-english.local`;
}
