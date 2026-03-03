import type {
  FolhaCctContrato,
  FolhaCctValorItem,
  FolhaCctContratoDiscrepanciaItem,
} from "@/lib/supabase/types";

export type ComparacaoItemLabel =
  | "Total Proventos"
  | "Total Descontos"
  | "Total Encargos"
  | "Total Custos Empresa"
  | "Líquido Funcionário"
  | "Custo Total Empresa";

function sumCategoriaContrato(
  itensCategoria: FolhaCctValorItem[] | undefined,
  discrepancias: Map<string, FolhaCctContratoDiscrepanciaItem>,
): number {
  if (!itensCategoria?.length) return 0;

  return itensCategoria.reduce((total, item) => {
    const disc = discrepancias.get(item.item);
    const valorContrato =
      disc && typeof disc.valor_contrato === "number"
        ? disc.valor_contrato
        : item.valor ?? 0;

    return total + (Number.isFinite(valorContrato) ? valorContrato : 0);
  }, 0);
}

export function computeContratoTotaisFromFolha(
  folha: FolhaCctContrato | null | undefined,
): Record<ComparacaoItemLabel, number> {
  if (!folha?.folha_cct) {
    return {
      "Total Proventos": 0,
      "Total Descontos": 0,
      "Total Encargos": 0,
      "Total Custos Empresa": 0,
      "Líquido Funcionário": 0,
      "Custo Total Empresa": 0,
    };
  }

  const discrepanciasMap = new Map<string, FolhaCctContratoDiscrepanciaItem>();
  for (const disc of folha.discrepancias?.itens ?? []) {
    if (disc && typeof disc.valor_contrato === "number") {
      discrepanciasMap.set(disc.item, disc);
    }
  }

  const totalProventos = sumCategoriaContrato(
    folha.folha_cct.proventos,
    discrepanciasMap,
  );
  const totalDescontos = sumCategoriaContrato(
    folha.folha_cct.descontos,
    discrepanciasMap,
  );
  const totalEncargos = sumCategoriaContrato(
    folha.folha_cct.encargos,
    discrepanciasMap,
  );
  const totalCustosEmpresa = sumCategoriaContrato(
    folha.folha_cct.custos_empresa,
    discrepanciasMap,
  );

  const liquidoFuncionario = totalProventos - totalDescontos;
  const custoTotalEmpresa =
    totalProventos - totalDescontos + totalEncargos + totalCustosEmpresa;

  return {
    "Total Proventos": totalProventos,
    "Total Descontos": totalDescontos,
    "Total Encargos": totalEncargos,
    "Total Custos Empresa": totalCustosEmpresa,
    "Líquido Funcionário": liquidoFuncionario,
    "Custo Total Empresa": custoTotalEmpresa,
  };
}

