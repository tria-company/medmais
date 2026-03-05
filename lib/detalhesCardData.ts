import type { VisaoExecutivaColaborador } from "@/lib/supabase/repositories/visaoExecutivaColaboradoresRepository";
import type { ComparacaoItemLabel } from "@/lib/contratoTotais";

export interface DetalheItemValores {
  item: string;
  valorAtual: number;
  valorContrato: number;
  valorCct: number;
}

export interface RankingColaboradorItem {
  colaboradorId: string;
  nome: string;
  diferenca: number;
  valorAtual: number;
  valorContrato: number;
  valorCct: number;
}

export interface RankingColaboradorTotal {
  colaboradorId: string;
  nome: string;
  valorAtual: number;
  valorCct: number;
  diferenca: number;
}

export interface DetalhesCardData {
  cardKey: ComparacaoItemLabel;
  cardLabel: string;
  itens: DetalheItemValores[];
  rankingPorItem: Map<string, RankingColaboradorItem[]>;
  /**
   * Ranking agregado por colaborador para o total do card
   * (ex.: Total Proventos por colaborador, usando as colunas
   * de `comparacao_totais` do Supabase).
   */
  rankingColaboradoresTotais: RankingColaboradorTotal[];
}

const CARD_LABEL_MAP: Record<ComparacaoItemLabel, string> = {
  "Total Proventos": "Total Proventos",
  "Total Descontos": "Total Descontos",
  "Total Encargos": "Total Encargos",
  "Total Custos Empresa": "Total Custos Empresa",
  "Líquido Funcionário": "Líquido Funcionário",
  "Custo Total Empresa": "Custo Total Empresa",
};

// ---------------------------------------------------------------------------
// Categorias para consolidação de itens similares
// ---------------------------------------------------------------------------

const PROVENTO_CATEGORIES: { category: string; test: (n: string) => boolean }[] = [
  { category: "Férias", test: (n) => /F[EÉ]RIAS/i.test(n) },
  { category: "Horas Extras", test: (n) => /HORA\s*EXTRA|H\.?\s*EXTRA/i.test(n) },
  { category: "Adicional Noturno", test: (n) => /NOTURNO/i.test(n) },
  { category: "Insalubridade", test: (n) => /INSALUBR/i.test(n) },
  { category: "Periculosidade", test: (n) => /PERICUL/i.test(n) },
  { category: "Vale Transporte", test: (n) => /VALE\s*TRANSP/i.test(n) },
  { category: "Gratificações", test: (n) => /GRATIF/i.test(n) },
  { category: "Salário", test: (n) => /SAL[AÁ]RIO/i.test(n) },
];

const CUSTOS_EMPRESA_CATEGORIES: { category: string; test: (n: string) => boolean }[] = [
  { category: "Plano Ambulatorial", test: (n) => /PLANO\s*AMBULAT/i.test(n) },
  { category: "Assistência Odontológica", test: (n) => /ODONTOL[OÓ]G/i.test(n) },
  { category: "Seguro de Vida / Assistência Funeral", test: (n) => /FUNERAL|SEGURO\s*VIDA/i.test(n) },
  { category: "Vale Alimentação", test: (n) => /VALE\s*ALIMENT|ALIMENTA[CÇ][AÃ]O\s*EMPRESA/i.test(n) },
  { category: "Vale Transporte", test: (n) => /VALE\s*TRANSP/i.test(n) },
  { category: "Auxílio Lazer/Cultura", test: (n) => /LAZER|CULTURA/i.test(n) },
  { category: "Assistência Médica", test: (n) => /ASSIST\.?\s*MED/i.test(n) },
  { category: "Vale Refeição", test: (n) => /VALE\s*REFEI|REFEI[CÇ][AÃ]O\s*EMPRESA/i.test(n) },
];

const DESCONTO_CATEGORIES: { category: string; test: (n: string) => boolean }[] = [
  { category: "Férias", test: (n) => /F[EÉ]RIAS/i.test(n) },
  { category: "INSS", test: (n) => /^INSS\b/i.test(n) },
  { category: "IRRF", test: (n) => /^IR$|^IR\b.*\bbase\b|^IRRF/i.test(n) },
  { category: "Empréstimo Consignado", test: (n) => /CONSIGNADO|EMPRESTIMO/i.test(n) },
  { category: "Assistência Médica", test: (n) => /ASSIST\.?\s*MED/i.test(n) },
  { category: "Assistência Odontológica", test: (n) => /ASSIST\.?\s*ODONT/i.test(n) },
  { category: "Mensalidade Sindical", test: (n) => /SINDICAL/i.test(n) },
  { category: "Pensão Alimentícia", test: (n) => /PENS[AÃ]O|ALIMENTIC/i.test(n) },
  { category: "Vale Transporte", test: (n) => /VALE\s*TRANSP|DESC\.?\s*VT|Desconto\s+VT/i.test(n) },
  { category: "Vale Refeição", test: (n) => /Desconto\s+VR/i.test(n) },
  { category: "Faltas/Atrasos", test: (n) => /FALTA/i.test(n) },
];

function makeCategoryResolver(
  categories: { category: string; test: (n: string) => boolean }[],
): (name: string) => string {
  return (name: string) => {
    for (const cat of categories) {
      if (cat.test(name)) return cat.category;
    }
    return name;
  };
}

// ---------------------------------------------------------------------------
// Consolidação por categoria (reutilizado por Proventos e Descontos)
// ---------------------------------------------------------------------------

function consolidateByCategory(
  agregadoPorItem: Map<string, { atual: number; contrato: number; cct: number }>,
  rankingPorItem: Map<string, RankingColaboradorItem[]>,
  getCategory: (name: string) => string,
): void {
  // Agrupar agregadoPorItem
  const groupedAgg = new Map<string, { atual: number; contrato: number; cct: number }>();
  for (const [item, agg] of agregadoPorItem) {
    const cat = getCategory(item);
    if (!groupedAgg.has(cat)) {
      groupedAgg.set(cat, { atual: 0, contrato: 0, cct: 0 });
    }
    const g = groupedAgg.get(cat)!;
    g.atual += agg.atual;
    g.contrato += agg.contrato;
    g.cct += agg.cct;
  }
  agregadoPorItem.clear();
  for (const [cat, agg] of groupedAgg) {
    agregadoPorItem.set(cat, agg);
  }

  // Agrupar rankingPorItem (merge por colaborador dentro de cada categoria)
  const groupedRank = new Map<string, Map<string, RankingColaboradorItem>>();
  for (const [item, rankings] of rankingPorItem) {
    const cat = getCategory(item);
    if (!groupedRank.has(cat)) {
      groupedRank.set(cat, new Map());
    }
    const colabMap = groupedRank.get(cat)!;
    for (const r of rankings) {
      if (!colabMap.has(r.colaboradorId)) {
        colabMap.set(r.colaboradorId, {
          colaboradorId: r.colaboradorId,
          nome: r.nome,
          diferenca: 0,
          valorAtual: 0,
          valorContrato: 0,
          valorCct: 0,
        });
      }
      const existing = colabMap.get(r.colaboradorId)!;
      existing.valorAtual += r.valorAtual;
      existing.valorContrato += r.valorContrato;
      existing.valorCct += r.valorCct;
      existing.diferenca += r.diferenca;
    }
  }
  rankingPorItem.clear();
  for (const [cat, colabMap] of groupedRank) {
    const entries = Array.from(colabMap.values()).filter(
      (r) => Math.abs(r.diferenca) > 1e-6,
    );
    if (entries.length > 0) {
      rankingPorItem.set(cat, entries);
    }
  }
}

// ---------------------------------------------------------------------------
// Coleta de dados das 3 colunas (folha_atual, folha_contrato, folha_cct)
// ---------------------------------------------------------------------------

/**
 * Coleta itens de uma categoria (proventos, descontos, encargos, custos_empresa)
 * das 3 fontes separadas e agrega por item.
 */
function collectThreeColumns(
  colaboradores: VisaoExecutivaColaborador[],
  categoriaFolha: "proventos" | "descontos" | "encargos" | "custos_empresa",
  agregadoPorItem: Map<string, { atual: number; contrato: number; cct: number }>,
  rankingPorItem: Map<string, RankingColaboradorItem[]>,
  normalizeKeyFn?: (name: string) => string,
): Map<string, string> | undefined {
  const normalize = normalizeKeyFn ?? ((n: string) => n);
  // bestDisplayNames é usado apenas quando há normalização de chave
  const bestDisplayNames = normalizeKeyFn ? new Map<string, string>() : undefined;

  for (const colab of colaboradores) {
    // --- Atual: folhaCctContrato.folha_atual (já é o objeto interno) ---
    const folhaAtual: any = colab.folhaCctContrato?.folha_atual ?? null;
    const itensAtual: any[] = folhaAtual?.[categoriaFolha] ?? [];

    // --- Contrato: coluna folha_contrato ---
    const itensContrato = colab.folhaContrato?.[categoriaFolha] ?? [];

    // --- CCT: coluna folha_cct ---
    const itensCct = colab.folhaCct?.[categoriaFolha] ?? [];

    const atualMap = new Map<string, number>();
    for (const item of itensAtual) {
      if (!item?.item) continue;
      const key = normalize(item.item);
      const val = typeof item.valor === "number" ? item.valor : 0;
      atualMap.set(key, (atualMap.get(key) ?? 0) + val);
      if (bestDisplayNames && !bestDisplayNames.has(key)) {
        bestDisplayNames.set(key, item.item);
      }
    }

    const contratoMap = new Map<string, number>();
    for (const item of itensContrato) {
      if (!item?.item) continue;
      const key = normalize(item.item);
      const val = typeof item.valor === "number" ? item.valor : 0;
      contratoMap.set(key, (contratoMap.get(key) ?? 0) + val);
      if (bestDisplayNames) bestDisplayNames.set(key, item.item);
    }

    const cctMap = new Map<string, number>();
    for (const item of itensCct) {
      if (!item?.item) continue;
      const key = normalize(item.item);
      const val = typeof item.valor === "number" ? item.valor : 0;
      cctMap.set(key, (cctMap.get(key) ?? 0) + val);
      if (bestDisplayNames) bestDisplayNames.set(key, item.item);
    }

    const allKeys = new Set([...atualMap.keys(), ...contratoMap.keys(), ...cctMap.keys()]);
    for (const key of allKeys) {
      const valorAtual = atualMap.get(key) ?? 0;
      const valorContrato = contratoMap.get(key) ?? 0;
      const valorCct = cctMap.get(key) ?? 0;

      if (!agregadoPorItem.has(key)) {
        agregadoPorItem.set(key, { atual: 0, contrato: 0, cct: 0 });
      }
      const agg = agregadoPorItem.get(key)!;
      agg.atual += valorAtual;
      agg.contrato += valorContrato;
      agg.cct += valorCct;

      const diferenca = valorCct - valorAtual;
      if (Math.abs(diferenca) > 1e-6) {
        let ranking = rankingPorItem.get(key);
        if (!ranking) {
          ranking = [];
          rankingPorItem.set(key, ranking);
        }
        ranking.push({
          colaboradorId: colab.id,
          nome: colab.nome,
          diferenca,
          valorAtual,
          valorContrato,
          valorCct,
        });
      }
    }
  }

  return bestDisplayNames;
}

// ---------------------------------------------------------------------------
// Função principal
// ---------------------------------------------------------------------------

/**
 * Agrega dados por item (Atual, Contrato, CCT) e ranking por colaborador
 * para um tipo de card, a partir da lista de colaboradores.
 *
 * Lê cada fonte de forma isolada (folha_atual, folha_contrato, folha_cct)
 * para evitar contaminação cruzada entre valores Atual/Contrato/CCT.
 */
export function getDetalhesCardData(
  colaboradores: VisaoExecutivaColaborador[],
  cardKey: ComparacaoItemLabel,
): DetalhesCardData {
  const cardLabel = CARD_LABEL_MAP[cardKey];

  const rankingPorItem = new Map<string, RankingColaboradorItem[]>();
  const agregadoPorItem = new Map<
    string,
    { atual: number; contrato: number; cct: number }
  >();

  if (cardKey === "Total Proventos") {
    collectThreeColumns(colaboradores, "proventos", agregadoPorItem, rankingPorItem);
    consolidateByCategory(
      agregadoPorItem,
      rankingPorItem,
      makeCategoryResolver(PROVENTO_CATEGORIES),
    );
  } else if (cardKey === "Total Descontos") {
    collectThreeColumns(colaboradores, "descontos", agregadoPorItem, rankingPorItem);
    consolidateByCategory(
      agregadoPorItem,
      rankingPorItem,
      makeCategoryResolver(DESCONTO_CATEGORIES),
    );
  } else if (cardKey === "Total Encargos") {
    // Encargos usa normalização de nome para matching entre fontes
    // (ex: "INSS Patronal" ↔ "INSS Patronal (20%)").
    function normalizeEncargoKey(name: string): string {
      return name.replace(/\s*\(\d+\.?\d*%\)\s*$/, "").trim();
    }

    const bestDisplayNames = collectThreeColumns(
      colaboradores,
      "encargos",
      agregadoPorItem,
      rankingPorItem,
      normalizeEncargoKey,
    );

    // Converte chaves normalizadas para nomes de exibição
    if (bestDisplayNames) {
      const resolvedAgg = new Map<string, { atual: number; contrato: number; cct: number }>();
      for (const [key, agg] of agregadoPorItem) {
        resolvedAgg.set(bestDisplayNames.get(key) ?? key, agg);
      }
      agregadoPorItem.clear();
      for (const [k, v] of resolvedAgg) agregadoPorItem.set(k, v);

      const resolvedRank = new Map<string, RankingColaboradorItem[]>();
      for (const [key, ranking] of rankingPorItem) {
        resolvedRank.set(bestDisplayNames.get(key) ?? key, ranking);
      }
      rankingPorItem.clear();
      for (const [k, v] of resolvedRank) rankingPorItem.set(k, v);
    }
  } else if (cardKey === "Total Custos Empresa") {
    collectThreeColumns(colaboradores, "custos_empresa", agregadoPorItem, rankingPorItem);
    consolidateByCategory(
      agregadoPorItem,
      rankingPorItem,
      makeCategoryResolver(CUSTOS_EMPRESA_CATEGORIES),
    );
  }

  // Ordenar rankings por maior diferença absoluta
  for (const [, ranking] of rankingPorItem) {
    ranking.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
  }

  // Ranking agregado por colaborador (usando comparacao_totais do Supabase)
  const rankingColaboradoresTotais: RankingColaboradorTotal[] = [];

  for (const colab of colaboradores) {
    const comp = colab.comparacaoTotais.find(
      (item) => item.item === cardKey,
    );

    if (!comp) continue;

    const valorAtual = typeof comp.valor_atual === "number" ? comp.valor_atual : 0;
    const valorCct = typeof comp.valor_cct === "number" ? comp.valor_cct : 0;
    const diferenca = valorCct - valorAtual;

    if (!Number.isFinite(diferenca) || diferenca === 0) continue;

    rankingColaboradoresTotais.push({
      colaboradorId: colab.id,
      nome: colab.nome,
      valorAtual,
      valorCct,
      diferenca,
    });
  }

  rankingColaboradoresTotais.sort(
    (a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca),
  );

  const itens: DetalheItemValores[] = Array.from(agregadoPorItem.entries()).map(
    ([item, agg]) => ({
      item,
      valorAtual: agg.atual,
      valorContrato: agg.contrato,
      valorCct: agg.cct,
    }),
  );

  itens.sort((a, b) => {
    const diffA = Math.abs(a.valorCct - a.valorAtual);
    const diffB = Math.abs(b.valorCct - b.valorAtual);
    return diffB - diffA;
  });

  return {
    cardKey,
    cardLabel,
    itens,
    rankingPorItem,
    rankingColaboradoresTotais,
  };
}

/**
 * Retorna dados de detalhe para todos os 6 cards.
 */
export function getAllDetalhesCardsData(
  colaboradores: VisaoExecutivaColaborador[],
): Map<ComparacaoItemLabel, DetalhesCardData> {
  const labels: ComparacaoItemLabel[] = [
    "Total Proventos",
    "Total Descontos",
    "Total Encargos",
    "Total Custos Empresa",
    "Líquido Funcionário",
    "Custo Total Empresa",
  ];
  const map = new Map<ComparacaoItemLabel, DetalhesCardData>();
  for (const key of labels) {
    map.set(key, getDetalhesCardData(colaboradores, key));
  }
  return map;
}
