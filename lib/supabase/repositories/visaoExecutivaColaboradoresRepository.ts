import { supabaseClient } from "../client";
import type {
  ComparacaoTotal,
  FolhaDePagamentoIaDuplicateRow,
  FolhaCctContrato,
  FolhaCct,
} from "../types";

export interface VisaoExecutivaColaborador {
  id: string;
  nome: string;
  funcao: string;
  cpf: string;
  matricula: string;
  competencia: string;
  custoAtualEmpresa: number;
  custoCorretoEmpresa: number;
  impactoAnual: number;
  comparacaoTotais: ComparacaoTotal[];
  folhaCctContrato: FolhaCctContrato | null;
  folhaContrato: FolhaCct | null;
  folhaCct: FolhaCct | null;
}

export async function getVisaoExecutivaPorColaborador(): Promise<
  VisaoExecutivaColaborador[]
> {
  const { data, error } = await supabaseClient
    .from("folha_de_pagamento_ia_duplicate")
    .select(
      "id, nome, funcao, cpf, matricula, competencia, comparacao_totais, dashboard_data, folha_atual, folha_contrato, folha_cct",
    )
    .not("comparacao_totais", "is", null)
    .not("dashboard_data", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as FolhaDePagamentoIaDuplicateRow[];

  return rows
    .map((row) => {
      const nome = row.nome ?? "Sem nome";
      const comparacoes = (row.comparacao_totais ?? []) as ComparacaoTotal[];

      // Reconstrói folhaCctContrato a partir das colunas separadas
      // para manter compatibilidade com o restante do código.
      const folhaCctCol = (row.folha_cct as FolhaCct | null) ?? null;
      // A coluna folha_atual tem estrutura { folha_atual: { proventos, encargos, totais, ... } }
      // Extraímos o objeto interno para compatibilidade com o código existente.
      const folhaAtualRaw: any = row.folha_atual ?? null;
      const folhaAtualInner = (folhaAtualRaw?.folha_atual ?? folhaAtualRaw) as
        | import("../types").FolhaAtual
        | null;
      const mergedFolhaCctContrato: FolhaCctContrato | null =
        folhaCctCol || folhaAtualInner
          ? {
              folha_cct: folhaCctCol ?? undefined,
              folha_atual: folhaAtualInner ?? undefined,
            }
          : null;

      const custoTotal = comparacoes.find(
        (item) => item.item === "Custo Total Empresa",
      );

      if (!custoTotal || !row.dashboard_data) {
        return null;
      }

      return {
        id: row.id,
        nome,
        funcao: row.funcao ?? "—",
        cpf: row.cpf ?? "—",
        matricula: row.matricula ?? "—",
        competencia: row.competencia ?? "—",
        custoAtualEmpresa: custoTotal.valor_atual,
        custoCorretoEmpresa: custoTotal.valor_cct,
        impactoAnual: row.dashboard_data.impacto_anual,
        comparacaoTotais: comparacoes,
        folhaCctContrato: mergedFolhaCctContrato,
        folhaContrato: (row.folha_contrato as FolhaCct | null) ?? null,
        folhaCct: (row.folha_cct as FolhaCct | null) ?? null,
      } satisfies VisaoExecutivaColaborador;
    })
    .filter((item): item is VisaoExecutivaColaborador => item !== null);
}

