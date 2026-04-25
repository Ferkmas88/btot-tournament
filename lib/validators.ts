// Compartido entre cliente (wizard) y servidor (API).
// Estrategia: regex tolerante con caracteres comunes de nombres + cuenta de dígitos
// para teléfonos (no asumir formato cubano específico — admite extranjeros).

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,80}$/;
const PHONE_FORMAT_RE = /^\+?[\d\s().-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEAM_NAME_RE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'._-]{2,60}$/;

export function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (t.length < 5 || t.length > 120) return false;
  return EMAIL_RE.test(t);
}

export function isValidName(s: string): boolean {
  const t = s.trim();
  if (t.length < 2 || t.length > 80) return false;
  if (!NAME_RE.test(t)) return false;
  // exigir al menos una letra (que no sea solo espacios o caracteres)
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/.test(t);
}

export function isValidPhone(s: string): boolean {
  const t = s.trim();
  if (!PHONE_FORMAT_RE.test(t)) return false;
  const digits = t.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidTeamName(s: string): boolean {
  const t = s.trim();
  if (t.length < 2 || t.length > 60) return false;
  return TEAM_NAME_RE.test(t);
}

export const VALIDATION_MESSAGES = {
  email: 'Email inválido. Ejemplo: nombre@dominio.com',
  name: 'Nombre inválido. Mínimo 2 letras, sin números ni símbolos raros.',
  phone: 'Número inválido. Tiene que tener entre 7 y 15 dígitos.',
  team_name: 'Nombre de equipo inválido. Entre 2 y 60 caracteres.',
} as const;
