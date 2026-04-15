/**
 * Generates a reasonably unique ID string.
 * Combines a random string with the current timestamp.
 */
export const uid = (): string => Math.random().toString(36).slice(2) + Date.now().toString(36);
