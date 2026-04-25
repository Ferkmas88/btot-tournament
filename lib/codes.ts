import { randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LEN = 6;

export function generateJoinCode(): string {
  const bytes = randomBytes(LEN);
  let out = '';
  for (let i = 0; i < LEN; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function isValidJoinCode(code: string): boolean {
  if (code.length !== LEN) return false;
  for (const c of code) {
    if (!ALPHABET.includes(c)) return false;
  }
  return true;
}
