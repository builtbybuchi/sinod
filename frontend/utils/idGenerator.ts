/**
 * Utility functions for generating short, unique IDs for events
 */

const ID_CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a random segment of characters
 * @param length - Length of the segment
 * @returns Random string segment
 */
function generateSegment(length: number): string {
  let result = '';
  const charset = ID_CHARSET;
  const randomValues = new Uint8Array(length);
  
  // Use crypto.getRandomValues for secure random generation
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  
  return result;
}

/**
 * Generate a readable short ID in format: xxx-xxx-xxx (9 chars + 2 dashes = 11 total)
 * Example: "a3f-k9z-2b7"
 * @returns Short unique ID
 */
export function generateEventId(): string {
  return `${generateSegment(3)}-${generateSegment(3)}-${generateSegment(3)}`;
}

/**
 * Generate an event ID with a prefix
 * Example: "evt-a3f-k9z-2b7"
 * @param prefix - Prefix to add before the ID
 * @returns Prefixed event ID
 */
export function generateEventIdWithPrefix(prefix: string): string {
  return `${prefix}-${generateEventId()}`;
}

/**
 * Generate a registration ID
 * Example: "reg-a3f-k9z-2b7"
 * @returns Registration ID
 */
export function generateRegistrationId(): string {
  return generateEventIdWithPrefix('reg');
}

/**
 * Generate a short ID for a form page URL
 * Example: "a3f-k9z-2b7"
 * @returns Short unique form ID
 */
export function generateFormId(): string {
  return generateEventId();
}

/**
 * Generate a short ID for a quiz page URL
 * Example: "a3f-k9z-2b7"
 * @returns Short unique quiz ID
 */
export function generateQuizId(): string {
  return generateEventId();
}
