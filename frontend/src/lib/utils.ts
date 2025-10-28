import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email
  }

  const [username, domain] = email.split('@')

  if (username.length <= 2) {
    return `${username[0]}***@${domain}`
  }

  const visibleChars = Math.min(3, Math.floor(username.length / 3))
  const maskedUsername = username.substring(0, visibleChars) + '***'

  return `${maskedUsername}@${domain}`
}
