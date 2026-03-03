import { supabaseClient } from "../client";
import type {
  ComparacaoTotal,
  FolhaDePagamentoIaDuplicateRow,
} from "../types";

/**
 * Busca TODAS as folhas com `comparacao_totais` preenchido e
 * devolve um array agregado, somando os valores por item.
 *
 * Exemplo: todos os "Total Proventos" de todas as folhas são somados
 * em um único registro de "Total Proventos" (valor_atual e valor_cct).
 */
export async function getComparacaoTotais(): Promise<ComparacaoTotal[]> {
  const { data, error } = await supabaseClient
    .from("folha_de_pagamento_ia_duplicate")
    .select("id, comparacao_totais")
    .not("comparacao_totais", "is", null);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as FolhaDePagamentoIaDuplicateRow[];

  type Acumulado = {
    item: string;
    valor_atual: number;
    valor_cct: number;
    grupo?: string;
  };

  const mapa = new Map<string, Acumulado>();

  for (const row of rows) {
    const comparacoes = (row.comparacao_totais ?? []) as ComparacaoTotal[];

    for (const comp of comparacoes) {
      const chave = comp.item;
      const existente = mapa.get(chave);

      if (existente) {
        existente.valor_atual += comp.valor_atual;
        existente.valor_cct += comp.valor_cct;
      } else {
        mapa.set(chave, {
          item: comp.item,
          valor_atual: comp.valor_atual,
          valor_cct: comp.valor_cct,
          grupo: comp.grupo,
        });
      }
    }
  }

  return Array.from(mapa.entries()).map(
    ([chave, acumulado]): ComparacaoTotal => ({
      id: chave,
      item: acumulado.item,
      valor_atual: acumulado.valor_atual,
      valor_cct: acumulado.valor_cct,
      grupo: acumulado.grupo,
    }),
  );
}

export async function getCustoTotalEmpresa(): Promise<{
  valorAtual: number;
  valorCct: number;
} | null> {
  const comparacoes = await getComparacaoTotais();

  const custoTotalEmpresa = comparacoes.find(
    (item) => item.item === "Custo Total Empresa",
  );

  if (!custoTotalEmpresa) {
    return null;
  }

  return {
    valorAtual: custoTotalEmpresa.valor_atual,
    valorCct: custoTotalEmpresa.valor_cct,
  };
}

