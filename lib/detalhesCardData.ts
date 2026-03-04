import type { VisaoExecutivaColaborador } from "@/lib/supabase/repositories/visaoExecutivaColaboradoresRepository";
import type { ComparacaoItemLabel } from "@/lib/contratoTotais";
import type { FolhaCctContratoDiscrepanciaItem } from "@/lib/supabase/types";

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
  "Total Custos Empresa": "Custo Total Benefícios",
  "Líquido Funcionário": "Líquido Funcionário",
  "Custo Total Empresa": "Custo Total Empresa",
};

type CategoriaFolha =
  | "proventos"
  | "descontos"
  | "encargos"
  | "custos_empresa";

const CARD_TO_CATEGORIA: Partial<Record<ComparacaoItemLabel, CategoriaFolha>> = {
  "Total Proventos": "proventos",
  "Total Descontos": "descontos",
  "Total Encargos": "encargos",
  "Total Custos Empresa": "custos_empresa",
};

function discrepanciaPertenceAoCard(
  cardKey: ComparacaoItemLabel,
  disc: FolhaCctContratoDiscrepanciaItem,
): boolean {
  const tipo = disc.tipo?.toLowerCase() ?? "";

  switch (cardKey) {
    case "Total Proventos":
      return tipo.includes("provento");
    case "Total Descontos":
      return tipo.includes("desconto");
    case "Total Encargos":
      return tipo.includes("encargo");
    case "Total Custos Empresa":
      return tipo.includes("custo") || tipo.includes("benef");
    default:
      return false;
  }
}

/**
 * Agrega dados por item (Atual, Contrato, CCT) e ranking por colaborador
 * para um tipo de card, a partir da lista de colaboradores.
 */
export function getDetalhesCardData(
  colaboradores: VisaoExecutivaColaborador[],
  cardKey: ComparacaoItemLabel,
): DetalhesCardData {
  const cardLabel = CARD_LABEL_MAP[cardKey];
  const categoria = CARD_TO_CATEGORIA[cardKey];

  const rankingPorItem = new Map<string, RankingColaboradorItem[]>();
  const agregadoPorItem = new Map<
    string,
    { atual: number; contrato: number; cct: number }
  >();

  // Caso especial: Total Proventos — soma proventos da folha_atual quando o nome do item
  // coincidir com o da CCT; senão usa o valor do contrato como Atual para não exibir zero.
  if (cardKey === "Total Proventos") {
    for (const colab of colaboradores) {
      const folha = colab.folhaCctContrato;
      if (!folha) continue;

      const proventosCct = folha.folha_cct?.proventos ?? [];
      const proventosAtuais = folha.folha_atual?.proventos ?? [];

      const atualPorItem = new Map<string, number>();
      for (const prov of proventosAtuais) {
        if (!prov || !prov.item) continue;
        const nomeItem = prov.item;
        const valor = typeof prov.valor === "number" ? prov.valor : 0;
        atualPorItem.set(nomeItem, (atualPorItem.get(nomeItem) ?? 0) + valor);
      }

      const discsMap = new Map<string, FolhaCctContratoDiscrepanciaItem>();
      for (const disc of folha.discrepancias?.itens ?? []) {
        if (!disc || !disc.item) continue;
        discsMap.set(disc.item, disc);
      }

      const tratados = new Set<string>();

      for (const provCct of proventosCct) {
        if (!provCct || !provCct.item) continue;
        const nomeItem = provCct.item;
        tratados.add(nomeItem);
        const baseCct =
          typeof provCct.valor === "number" ? provCct.valor : 0;

        const disc = discsMap.get(nomeItem);
        const valorContrato =
          disc && typeof disc.valor_contrato === "number"
            ? disc.valor_contrato
            : baseCct;
        const valorCct = baseCct;
        const valorAtual = atualPorItem.get(nomeItem) ?? valorContrato;
        const diferenca = valorCct - valorAtual;

        if (!agregadoPorItem.has(nomeItem)) {
          agregadoPorItem.set(nomeItem, { atual: 0, contrato: 0, cct: 0 });
        }
        const agg = agregadoPorItem.get(nomeItem)!;
        agg.atual += valorAtual;
        agg.contrato += valorContrato;
        agg.cct += valorCct;

        if (Math.abs(diferenca) > 1e-6) {
          let ranking = rankingPorItem.get(nomeItem);
          if (!ranking) {
            ranking = [];
            rankingPorItem.set(nomeItem, ranking);
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

      // Proventos que existem apenas na folha_atual (sem item correspondente na CCT)
      // também devem aparecer: consideramos CCT = 0 e Contrato = Atual.
      for (const prov of proventosAtuais) {
        if (!prov || !prov.item) continue;
        const nomeItem = prov.item;
        if (tratados.has(nomeItem)) continue;

        const valorAtual =
          typeof prov.valor === "number" && Number.isFinite(prov.valor)
            ? prov.valor
            : 0;
        const valorContrato = valorAtual;
        const valorCct = 0;
        const diferenca = valorCct - valorAtual;

        if (!agregadoPorItem.has(nomeItem)) {
          agregadoPorItem.set(nomeItem, { atual: 0, contrato: 0, cct: 0 });
        }
        const agg = agregadoPorItem.get(nomeItem)!;
        agg.atual += valorAtual;
        agg.contrato += valorContrato;
        agg.cct += valorCct;

        if (Math.abs(diferenca) > 1e-6) {
          let ranking = rankingPorItem.get(nomeItem);
          if (!ranking) {
            ranking = [];
            rankingPorItem.set(nomeItem, ranking);
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

    // Consolida itens similares em categorias (ex: "FERIAS", "1/3 FERIAS MS" → "Férias")
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

    function getProventoCategory(itemName: string): string {
      for (const cat of PROVENTO_CATEGORIES) {
        if (cat.test(itemName)) return cat.category;
      }
      return itemName; // sem categoria conhecida, mantém o nome original
    }

    // Agrupar agregadoPorItem por categoria
    const groupedAgregado = new Map<string, { atual: number; contrato: number; cct: number }>();
    for (const [item, agg] of agregadoPorItem) {
      const category = getProventoCategory(item);
      if (!groupedAgregado.has(category)) {
        groupedAgregado.set(category, { atual: 0, contrato: 0, cct: 0 });
      }
      const g = groupedAgregado.get(category)!;
      g.atual += agg.atual;
      g.contrato += agg.contrato;
      g.cct += agg.cct;
    }
    agregadoPorItem.clear();
    for (const [cat, agg] of groupedAgregado) {
      agregadoPorItem.set(cat, agg);
    }

    // Agrupar rankingPorItem por categoria (merge por colaborador)
    const groupedRanking = new Map<string, Map<string, RankingColaboradorItem>>();
    for (const [item, rankings] of rankingPorItem) {
      const category = getProventoCategory(item);
      if (!groupedRanking.has(category)) {
        groupedRanking.set(category, new Map());
      }
      const colabMap = groupedRanking.get(category)!;
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
    for (const [cat, colabMap] of groupedRanking) {
      const entries = Array.from(colabMap.values()).filter(
        (r) => Math.abs(r.diferenca) > 1e-6,
      );
      if (entries.length > 0) {
        rankingPorItem.set(cat, entries);
      }
    }
  } else if (cardKey === "Total Descontos") {
    // Para descontos seguimos a mesma ideia: usamos SEMPRE os itens da folha_cct.descontos
    // para montar os cards, e o Atual vem da folha_atual.descontos quando existir,
    // caindo para o valor de contrato quando não houver informação de folha atual.
    for (const colab of colaboradores) {
      const folha = colab.folhaCctContrato;
      if (!folha) continue;

      const descontosCct = folha.folha_cct?.descontos ?? [];
      const descontosAtuais = folha.folha_atual?.descontos ?? [];

      const atualPorItem = new Map<string, number>();
      for (const d of descontosAtuais) {
        if (!d || !d.item) continue;
        const nomeItem = d.item;
        const valor = typeof d.valor === "number" ? d.valor : 0;
        atualPorItem.set(nomeItem, (atualPorItem.get(nomeItem) ?? 0) + valor);
      }

      const discsMap = new Map<string, FolhaCctContratoDiscrepanciaItem>();
      for (const disc of folha.discrepancias?.itens ?? []) {
        if (!disc || !disc.item) continue;
        discsMap.set(disc.item, disc);
      }

      const tratados = new Set<string>();

      for (const descCct of descontosCct) {
        if (!descCct || !descCct.item) continue;
        const nomeItem = descCct.item;
        tratados.add(nomeItem);
        const baseCct =
          typeof descCct.valor === "number" ? descCct.valor : 0;

        const disc = discsMap.get(nomeItem);
        const valorContrato =
          disc && typeof disc.valor_contrato === "number"
            ? disc.valor_contrato
            : baseCct;
        const valorCct = baseCct;
        const valorAtual = atualPorItem.get(nomeItem) ?? valorContrato;
        const diferenca = valorCct - valorAtual;

        if (!agregadoPorItem.has(nomeItem)) {
          agregadoPorItem.set(nomeItem, { atual: 0, contrato: 0, cct: 0 });
        }
        const agg = agregadoPorItem.get(nomeItem)!;
        agg.atual += valorAtual;
        agg.contrato += valorContrato;
        agg.cct += valorCct;

        if (Math.abs(diferenca) > 1e-6) {
          let ranking = rankingPorItem.get(nomeItem);
          if (!ranking) {
            ranking = [];
            rankingPorItem.set(nomeItem, ranking);
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

      // Descontos que existem apenas na folha_atual (sem item correspondente na CCT)
      // também devem aparecer: consideramos CCT = 0 e Contrato = Atual.
      for (const d of descontosAtuais) {
        if (!d || !d.item) continue;
        const nomeItem = d.item;
        if (tratados.has(nomeItem)) continue;

        const valorAtual =
          typeof d.valor === "number" && Number.isFinite(d.valor)
            ? d.valor
            : 0;
        const valorContrato = valorAtual;
        const valorCct = 0;
        const diferenca = valorCct - valorAtual;

        if (!agregadoPorItem.has(nomeItem)) {
          agregadoPorItem.set(nomeItem, { atual: 0, contrato: 0, cct: 0 });
        }
        const agg = agregadoPorItem.get(nomeItem)!;
        agg.atual += valorAtual;
        agg.contrato += valorContrato;
        agg.cct += valorCct;

        if (Math.abs(diferenca) > 1e-6) {
          let ranking = rankingPorItem.get(nomeItem);
          if (!ranking) {
            ranking = [];
            rankingPorItem.set(nomeItem, ranking);
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

    // Consolida itens similares em categorias (ex: "LIQUIDO FERIAS", "IR.FERIAS" → "Férias")
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

    function getDescontoCategory(itemName: string): string {
      for (const cat of DESCONTO_CATEGORIES) {
        if (cat.test(itemName)) return cat.category;
      }
      return itemName;
    }

    const groupedDescontoAgregado = new Map<string, { atual: number; contrato: number; cct: number }>();
    for (const [item, agg] of agregadoPorItem) {
      const category = getDescontoCategory(item);
      if (!groupedDescontoAgregado.has(category)) {
        groupedDescontoAgregado.set(category, { atual: 0, contrato: 0, cct: 0 });
      }
      const g = groupedDescontoAgregado.get(category)!;
      g.atual += agg.atual;
      g.contrato += agg.contrato;
      g.cct += agg.cct;
    }
    agregadoPorItem.clear();
    for (const [cat, agg] of groupedDescontoAgregado) {
      agregadoPorItem.set(cat, agg);
    }

    const groupedDescontoRanking = new Map<string, Map<string, RankingColaboradorItem>>();
    for (const [item, rankings] of rankingPorItem) {
      const category = getDescontoCategory(item);
      if (!groupedDescontoRanking.has(category)) {
        groupedDescontoRanking.set(category, new Map());
      }
      const colabMap = groupedDescontoRanking.get(category)!;
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
    for (const [cat, colabMap] of groupedDescontoRanking) {
      const entries = Array.from(colabMap.values()).filter(
        (r) => Math.abs(r.diferenca) > 1e-6,
      );
      if (entries.length > 0) {
        rankingPorItem.set(cat, entries);
      }
    }
  } else if (cardKey === "Total Encargos") {
    // Lê encargos das 3 colunas separadas: folha_atual, folha_contrato, folha_cct.
    // Normaliza nomes para fazer matching entre fontes (ex: "INSS Patronal" ↔ "INSS Patronal (20%)").
    function normalizeEncargoKey(name: string): string {
      return name.replace(/\s*\(\d+\.?\d*%\)\s*$/, "").trim();
    }

    // Mapas com chave normalizada para agregar valores e encontrar o melhor nome de exibição
    const normalizedAgregado = new Map<string, { atual: number; contrato: number; cct: number }>();
    const bestDisplayNames = new Map<string, string>();
    const normalizedRanking = new Map<string, RankingColaboradorItem[]>();

    for (const colab of colaboradores) {
      // --- Atual: folhaCctContrato.folha_atual já é o objeto interno com encargos ---
      const folhaAtual: any = colab.folhaCctContrato?.folha_atual ?? null;
      const encargosAtual: any[] = folhaAtual?.encargos ?? [];

      // --- Contrato: coluna folha_contrato (encargos direto em .encargos) ---
      const encargosContrato = colab.folhaContrato?.encargos ?? [];

      // --- CCT: coluna folha_cct (encargos direto em .encargos) ---
      const encargosCctArr = colab.folhaCct?.encargos ?? [];

      // Mapas por fonte: chave normalizada → valor
      const atualMap = new Map<string, number>();
      for (const enc of encargosAtual) {
        if (!enc?.item) continue;
        const key = normalizeEncargoKey(enc.item);
        const val = typeof enc.valor === "number" ? enc.valor : 0;
        atualMap.set(key, (atualMap.get(key) ?? 0) + val);
        if (!bestDisplayNames.has(key)) bestDisplayNames.set(key, enc.item);
      }

      const contratoMap = new Map<string, number>();
      for (const enc of encargosContrato) {
        if (!enc?.item) continue;
        const key = normalizeEncargoKey(enc.item);
        const val = typeof enc.valor === "number" ? enc.valor : 0;
        contratoMap.set(key, (contratoMap.get(key) ?? 0) + val);
        // Nome do contrato tem prioridade sobre Atual
        bestDisplayNames.set(key, enc.item);
      }

      const cctMap = new Map<string, number>();
      for (const enc of encargosCctArr) {
        if (!enc?.item) continue;
        const key = normalizeEncargoKey(enc.item);
        const val = typeof enc.valor === "number" ? enc.valor : 0;
        cctMap.set(key, (cctMap.get(key) ?? 0) + val);
        // Nome da CCT tem maior prioridade (mais descritivo)
        bestDisplayNames.set(key, enc.item);
      }

      // Agrega todos os itens únicos deste colaborador
      const allKeys = new Set([...atualMap.keys(), ...contratoMap.keys(), ...cctMap.keys()]);
      for (const key of allKeys) {
        const valorAtual = atualMap.get(key) ?? 0;
        const valorContrato = contratoMap.get(key) ?? 0;
        const valorCct = cctMap.get(key) ?? 0;

        if (!normalizedAgregado.has(key)) {
          normalizedAgregado.set(key, { atual: 0, contrato: 0, cct: 0 });
        }
        const agg = normalizedAgregado.get(key)!;
        agg.atual += valorAtual;
        agg.contrato += valorContrato;
        agg.cct += valorCct;

        const diferenca = valorCct - valorAtual;
        if (Math.abs(diferenca) > 1e-6) {
          let ranking = normalizedRanking.get(key);
          if (!ranking) {
            ranking = [];
            normalizedRanking.set(key, ranking);
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

    // Converte chaves normalizadas para nomes de exibição
    for (const [key, agg] of normalizedAgregado) {
      const displayName = bestDisplayNames.get(key) ?? key;
      agregadoPorItem.set(displayName, agg);
    }
    for (const [key, ranking] of normalizedRanking) {
      const displayName = bestDisplayNames.get(key) ?? key;
      rankingPorItem.set(displayName, ranking);
    }
  } else if (cardKey === "Total Custos Empresa") {
    // Lê custos_empresa das 3 colunas separadas: folha_atual, folha_contrato, folha_cct.
    for (const colab of colaboradores) {
      const folhaAtual: any = colab.folhaCctContrato?.folha_atual ?? null;
      const custosAtual: any[] = folhaAtual?.custos_empresa ?? [];
      const custosContrato = colab.folhaContrato?.custos_empresa ?? [];
      const custosCct = colab.folhaCct?.custos_empresa ?? [];

      const atualMap = new Map<string, number>();
      for (const c of custosAtual) {
        if (!c?.item) continue;
        const val = typeof c.valor === "number" ? c.valor : 0;
        atualMap.set(c.item, (atualMap.get(c.item) ?? 0) + val);
      }

      const contratoMap = new Map<string, number>();
      for (const c of custosContrato) {
        if (!c?.item) continue;
        const val = typeof c.valor === "number" ? c.valor : 0;
        contratoMap.set(c.item, (contratoMap.get(c.item) ?? 0) + val);
      }

      const cctMap = new Map<string, number>();
      for (const c of custosCct) {
        if (!c?.item) continue;
        const val = typeof c.valor === "number" ? c.valor : 0;
        cctMap.set(c.item, (cctMap.get(c.item) ?? 0) + val);
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
  }

  for (const [, ranking] of rankingPorItem) {
    ranking.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
  }

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
