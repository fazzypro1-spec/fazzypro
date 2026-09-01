// Validações usadas tanto no cliente quanto no servidor.

// CPF válido — algoritmo oficial (11 dígitos + 2 dígitos verificadores).
export function cpfDigits(s: string): string {
  return (s || '').replace(/\D/g, '');
}

export function cpfValid(s: string): boolean {
  const d = cpfDigits(s);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;

  let s1 = 0;
  for (let i = 0; i < 9; i++) s1 += +d[i] * (10 - i);
  const r1 = s1 % 11;
  const d1 = r1 < 2 ? 0 : 11 - r1;
  if (d1 !== +d[9]) return false;

  let s2 = 0;
  for (let i = 0; i < 10; i++) s2 += +d[i] * (11 - i);
  const r2 = s2 % 11;
  const d2 = r2 < 2 ? 0 : 11 - r2;
  return d2 === +d[10];
}

// E-mail simples.
export function emailValid(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
}

// Máscara de exibição: 000.000.000-00
export function cpfMask(s: string): string {
  const d = cpfDigits(s);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

// Monta o endereço completo: "Rua, 123 · Bairro, Cidade"
export function buildAddress(p: {
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city?: string | null;
}): string {
  const rua = p.street || '';
  const num = p.number || '';
  const bairro = p.district || '';
  const cidade = p.city || '';
  const linha = `${rua}${num ? ', ' + num : ''}`;
  const parte = [bairro, cidade].filter(Boolean).join(', ');
  return [linha, parte].filter(Boolean).join(' · ');
}
