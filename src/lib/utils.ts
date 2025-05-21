/**
 * Utility function to conditionally join class names
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get initials from a name
 * @param name Full name to extract initials from
 * @param maxLength Maximum number of characters to return (default: 2)
 * @returns Uppercase initials
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return '';
  
  // Split the name by spaces and get the first letter of each part
  const parts = name.trim().split(/\s+/);
  const initials = parts.map(part => part.charAt(0).toUpperCase()).join('');
  
  // Return up to maxLength characters
  return initials.substring(0, maxLength);
}
