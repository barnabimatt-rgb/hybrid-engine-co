import { v4 as uuidv4 } from 'uuid';

export function generateId() {
  return uuidv4();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function safeParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function now() {
  return new Date().toISOString();
}

export function pct(used, total) {
  if (total === 0) return 100;
  return Math.round((used / total) * 10000) / 100;
}

export function truncate(text, maxLen) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

export async function trySafe(fn) {
  try {
    const result = await fn();
    return [null, result];
  } catch (err) {
    return [err, null];
  }
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function chunk(arr, n) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += n) {
    chunks.push(arr.slice(i, i + n));
  }
  return chunks;
}

export function formatUSD(cents) {
  return '$' + (cents / 100).toFixed(2);
}

export function merge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      output[key] = merge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
