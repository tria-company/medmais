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
  } else if (cardKey === "Total Encargos") {
    // Para encargos, combinamos TUDO que é encargo:
    // - Itens da CCT (folha_cct.encargos) com seus contratos/discrepâncias
    // - Itens que existem apenas na folha_atual.encargos (ex.: INSS Patronal, FGTS, Terceiros, Acidente de Trabalho)
    //   assumindo CCT = 0 nesses casos.
    for (const colab of colaboradores) {
      const folha = colab.folhaCctContrato;
      if (!folha) continue;

      const encargosCct = folha.folha_cct?.encargos ?? [];
      // Folha atual pode vir acoplada em folhaCctContrato.folha_atual
      // ou, em alguns casos, diretamente no colaborador (colab as any).folha_atual.
      const folhaAtual: any =
        (folha as any).folha_atual ?? (colab as any).folha_atual ?? null;
      const encargosAtuais = (folhaAtual?.encargos as any[]) ?? [];

      const atualPorItem = new Map<string, number>();
      for (const enc of encargosAtuais) {
        if (!enc || !enc.item) continue;
        const nomeItem = enc.item;
        const valor = typeof enc.valor === "number" ? enc.valor : 0;
        atualPorItem.set(nomeItem, (atualPorItem.get(nomeItem) ?? 0) + valor);
      }

      const discsMap = new Map<string, FolhaCctContratoDiscrepanciaItem>();
      for (const disc of folha.discrepancias?.itens ?? []) {
        if (!disc || !disc.item) continue;
        discsMap.set(disc.item, disc);
      }

      const tratados = new Set<string>();

      // 1) Encargos que existem na CCT
      for (const encCct of encargosCct) {
        if (!encCct || !encCct.item) continue;
        const nomeItem = encCct.item;
        tratados.add(nomeItem);
        const baseCct =
          typeof encCct.valor === "number" ? encCct.valor : 0;

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

      // 2) Encargos que existem apenas na folha_atual (sem item correspondente na CCT)
      //    Ex.: INSS Patronal, FGTS (8%), Terceiros, Acidente de Trabalho.
      for (const enc of encargosAtuais) {
        if (!enc || !enc.item) continue;
        const nomeItem = enc.item;
        if (tratados.has(nomeItem)) continue;

        const valorAtual =
          typeof enc.valor === "number" && Number.isFinite(enc.valor)
            ? enc.valor
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

    // Garante que encargos padrão apareçam sempre como cards mesmo sem dados.
    for (const nome of ["INSS Patronal", "FGTS (8%)"]) {
      if (!agregadoPorItem.has(nome)) {
        agregadoPorItem.set(nome, { atual: 0, contrato: 0, cct: 0 });
      }
    }

    // "Terceiros" e "Acidente de Trabalho" existem APENAS em folha_atual —
    // nunca possuem valor de contrato ou CCT. Recomputamos sempre a soma do
    // atual diretamente de folha_atual.encargos, sobrescrevendo qualquer valor
    // incorreto que possa ter ficado de sections 1 ou 2.
    for (const nomeEncargo of ["Terceiros", "Acidente de Trabalho"]) {
      let somaAtual = 0;
      const rankingEncargo: RankingColaboradorItem[] = [];

      for (const colab of colaboradores) {
        const folha = colab.folhaCctContrato;
        const folhaAtualLocal: any =
          (folha as any).folha_atual ?? (colab as any).folha_atual ?? null;
        const encargosAtuaisLocal: any[] =
          (folhaAtualLocal?.encargos as any[]) ?? [];

        for (const enc of encargosAtuaisLocal) {
          if (!enc || enc.item !== nomeEncargo) continue;
          const valor =
            typeof enc.valor === "number" && Number.isFinite(enc.valor)
              ? enc.valor
              : 0;
          somaAtual += valor;
          if (valor > 1e-6) {
            rankingEncargo.push({
              colaboradorId: colab.id,
              nome: colab.nome,
              valorAtual: valor,
              valorContrato: 0,
              valorCct: 0,
              diferenca: -valor,
            });
          }
        }
      }

      agregadoPorItem.set(nomeEncargo, { atual: somaAtual, contrato: 0, cct: 0 });
      if (rankingEncargo.length > 0) {
        rankingPorItem.set(nomeEncargo, rankingEncargo);
      }
    }
  } else {
    // Para os demais cards (Descontos, Encargos, Custos Empresa),
    // usamos as discrepâncias por item do contrato x CCT.
    if (!categoria) {
      return {
        cardKey,
        cardLabel,
        itens: [],
        rankingPorItem,
        rankingColaboradoresTotais: [],
      };
    }

    for (const colab of colaboradores) {
      const folha = colab.folhaCctContrato;
      const discs = folha?.discrepancias?.itens ?? [];

      for (const disc of discs) {
        if (!disc || !discrepanciaPertenceAoCard(cardKey, disc)) continue;

        const nomeItem = disc.item ?? "";
        if (!nomeItem) continue;

        const valorContrato =
          typeof disc.valor_contrato === "number" ? disc.valor_contrato : 0;
        const valorCct =
          typeof disc.valor_cct === "number" ? disc.valor_cct : 0;
        const valorAtual = valorContrato;
        const diferenca = valorCct - valorContrato;

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
