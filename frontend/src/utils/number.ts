// Number utility functions

/**
 * Round number to specified decimal places
 */
export function round(num: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Convert number to percentage
 */
export function toPercentage(value: number, total: number, decimals: number = 1): number {
  if (total === 0) return 0;
  return round((value / total) * 100, decimals);
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if number is in range
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Generate random number between min and max
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if number is even
 */
export function isEven(num: number): boolean {
  return num % 2 === 0;
}

/**
 * Check if number is odd
 */
export function isOdd(num: number): boolean {
  return num % 2 !== 0;
}

/**
 * Calculate average of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

/**
 * Calculate sum of numbers
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

/**
 * Find minimum value in array
 */
export function min(numbers: number[]): number {
  return Math.min(...numbers);
}

/**
 * Find maximum value in array
 */
export function max(numbers: number[]): number {
  return Math.max(...numbers);
}

/**
 * Calculate median of numbers
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

/**
 * Calculate mode of numbers
 */
export function mode(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  
  const frequency: { [key: number]: number } = {};
  let maxFreq = 0;
  let modeValue = numbers[0];
  
  for (const num of numbers) {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
      modeValue = num;
    }
  }
  
  return modeValue;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const avg = average(numbers);
  const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  
  return Math.sqrt(avgSquareDiff);
}

/**
 * Check if number is positive
 */
export function isPositive(num: number): boolean {
  return num > 0;
}

/**
 * Check if number is negative
 */
export function isNegative(num: number): boolean {
  return num < 0;
}

/**
 * Check if number is zero
 */
export function isZero(num: number): boolean {
  return num === 0;
}

/**
 * Get absolute value
 */
export function abs(num: number): number {
  return Math.abs(num);
}

/**
 * Calculate factorial
 */
export function factorial(n: number): number {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Calculate power
 */
export function power(base: number, exponent: number): number {
  return Math.pow(base, exponent);
}

/**
 * Calculate square root
 */
export function sqrt(num: number): number {
  return Math.sqrt(num);
}

/**
 * Format number with thousand separators
 */
export function formatWithSeparators(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Convert to ordinal number (1st, 2nd, 3rd, etc.)
 */
export function toOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
} 