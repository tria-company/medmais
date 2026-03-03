import { supabaseClient } from "../client";
import type {
  ComparacaoTotal,
  FolhaDePagamentoIaDuplicateRow,
  FolhaCctContrato,
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
}

export async function getVisaoExecutivaPorColaborador(): Promise<
  VisaoExecutivaColaborador[]
> {
  const { data, error } = await supabaseClient
    .from("folha_de_pagamento_ia_duplicate")
    .select(
      "id, nome, funcao, cpf, matricula, competencia, comparacao_totais, dashboard_data, folha_cct_contrato, folha_atual",
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
      const baseFolhaCctContrato = (row.folha_cct_contrato ?? null) as
        | FolhaCctContrato
        | null;

      // Alguns dados de folha_atual vêm na raiz da linha; acoplamos esses dados
      // dentro de folhaCctContrato.folha_atual para facilitar o consumo nos detalhes.
      const mergedFolhaCctContrato: FolhaCctContrato | null =
        baseFolhaCctContrato || row.folha_atual
          ? {
              ...(baseFolhaCctContrato ?? {}),
              folha_atual: row.folha_atual ?? baseFolhaCctContrato?.folha_atual,
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
      } satisfies VisaoExecutivaColaborador;
    })
    .filter((item): item is VisaoExecutivaColaborador => item !== null);
}

