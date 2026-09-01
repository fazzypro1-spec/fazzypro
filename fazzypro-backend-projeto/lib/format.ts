export function money(v: number | null | undefined): string {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export function cpfDigits(s: string): string {
  return (s || '').replace(/\D/g, '');
}
