import type { FolhaCct } from "@/lib/supabase/types";

export type ComparacaoItemLabel =
  | "Total Proventos"
  | "Total Descontos"
  | "Total Encargos"
  | "Total Custos Empresa"
  | "Líquido Funcionário"
  | "Custo Total Empresa";

/**
 * Lê os totais do contrato diretamente de `folha_contrato.totais`.
 * Anteriormente, esta função tentava computar valores a partir de
 * discrepâncias do `folha_cct_contrato` (coluna removida do banco).
 * Agora usamos a coluna `folha_contrato` que já possui os totais prontos.
 */
export function computeContratoTotaisFromFolha(
  folhaContrato: FolhaCct | null | undefined,
): Record<ComparacaoItemLabel, number> {
  const zero: Record<ComparacaoItemLabel, number> = {
    "Total Proventos": 0,
    "Total Descontos": 0,
    "Total Encargos": 0,
    "Total Custos Empresa": 0,
    "Líquido Funcionário": 0,
    "Custo Total Empresa": 0,
  };

  if (!folhaContrato?.totais) return zero;

  const t = folhaContrato.totais;

  return {
    "Total Proventos": t.total_proventos ?? 0,
    "Total Descontos": t.total_descontos ?? 0,
    "Total Encargos": t.total_encargos ?? 0,
    "Total Custos Empresa": t.total_custos_empresa ?? 0,
    "Líquido Funcionário": t.liquido ?? 0,
    "Custo Total Empresa": t.custo_total_empresa ?? 0,
  };
}
