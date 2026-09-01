// Detecção de categoria por palavras-chave (isomórfico: roda no servidor e no cliente).
// Em produção: substituir por um modelo de IA real. Aqui mantemos determinístico/offline.

const KEYWORDS: Record<string, string[]> = {
  limpeza: ['faxina', 'limpeza', 'faxinar', 'higien', 'piso', 'banheiro', 'cozinha', 'janela', 'cortina', 'lavanderia'],
  eletrica: ['chuveiro', 'elétric', 'tomada', 'luminária', 'disjuntor', 'curto', 'interruptor', 'fio', 'energia', 'quadro', 'lâmpada', 'instala', 'rede'],
  hidraulica: ['vazamento', 'encana', 'torneira', 'sifão', 'pia', 'vaso', 'desentup', 'caixa', 'chuveiro', 'água', 'ralo', 'canos', 'registro'],
  montagem: ['montar', 'montagem', 'guarda-roupa', 'cômoda', 'estante', 'móvel', 'desmont', 'fixa', 'armário'],
  ar: ['ar', 'condicionado', 'split', 'climatiz', 'gás', 'manuten', 'higieniz', 'filtro', 'gelar'],
  beleza: ['cabelo', 'cabeleireir', 'unha', 'manicure', 'pedicure', 'estética', 'maquiagem', 'sobrancelha', 'barba'],
  jardim: ['poda', 'grama', 'jardim', 'planta', 'árvore', 'horta', 'gramado'],
  pets: ['banho', 'petshop', 'tosa', 'cachorro', 'gato', 'pet', 'animal'],
};

export function guessCategory(text: string): string {
  const t = (text || '').toLowerCase();
  const scores: Record<string, number> = {};
  Object.keys(KEYWORDS).forEach((id) => {
    let s = 0;
    KEYWORDS[id].forEach((w) => {
      if (t.includes(w)) s += w.length > 4 ? 2 : 1.2;
    });
    if (s > 0) scores[id] = s;
  });
  const top = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  return top[0] || 'gerais';
}
