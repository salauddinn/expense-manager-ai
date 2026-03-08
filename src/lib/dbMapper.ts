/**
 * DB ↔ TypeScript field name conversion utilities.
 * Handles snake_case ↔ camelCase and special cases like credit_limit ↔ limit.
 */

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Convert DB row (snake_case) to TypeScript object (camelCase). */
export function toCamelCase<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    let camelKey = snakeToCamel(key);
    // Special case: credit_limit → limit (matches CreditCard TypeScript type)
    if (camelKey === 'creditLimit') camelKey = 'limit';
    result[camelKey] = obj[key];
  }
  return result as T;
}

/** Convert TypeScript object (camelCase) to DB row (snake_case). */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    let snakeKey = camelToSnake(key);
    // Special case: limit → credit_limit (SQL reserved word)
    if (snakeKey === 'limit') snakeKey = 'credit_limit';
    result[snakeKey] = obj[key];
  }
  return result;
}
