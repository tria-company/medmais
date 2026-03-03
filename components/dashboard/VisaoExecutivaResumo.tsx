"use client";

import { useState, useMemo } from "react";
import CardBase from "@/components/dashboard/CardBase";
import KpiMiniCard from "@/components/dashboard/KpiMiniCard";
import { BarComparisonChart } from "@/components/charts/BarComparisonChart";
import { ModalDetalhesCard } from "@/components/dashboard/ModalDetalhesCard";
import type { ComparacaoTotal } from "@/lib/supabase/types";
import type { ComparacaoItemLabel } from "@/lib/contratoTotais";
import type { VisaoExecutivaColaborador } from "@/lib/supabase/repositories/visaoExecutivaColaboradoresRepository";
import { getDetalhesCardData } from "@/lib/detalhesCardData";

interface VisaoExecutivaResumoProps {
  custoAtual: number;
  custoCorreto: number;
  impactoAnual: number;
  comparacaoTotais: ComparacaoTotal[];
  showKpis?: boolean;
  contratoPorItem?: Record<string, number>;
  /** Lista de colaboradores para o modal de detalhes (visão geral = todos, visão colaborador = [selecionado]) */
  colaboradores?: VisaoExecutivaColaborador[];
  /** Se false, esconde o botão/modal de detalhes (usado na visão por colaborador) */
  enableDetalhes?: boolean;
  /** Soma de todos os encargos atuais da folha (folha_atual) para todos os colaboradores */
  encargosAtualFromFolha?: number;
}

const ITENS_COMPARACAO = [
  "Total Proventos",
  "Total Descontos",
  "Total Encargos",
  "Total Custos Empresa",
  "Líquido Funcionário",
  "Custo Total Empresa",
] as const;

export function VisaoExecutivaResumo({
  custoAtual,
  custoCorreto,
  impactoAnual,
  comparacaoTotais,
  showKpis = true,
  contratoPorItem,
  colaboradores = [],
  enableDetalhes = true,
  encargosAtualFromFolha,
}: VisaoExecutivaResumoProps): React.ReactElement {
  const [modalCardKey, setModalCardKey] = useState<ComparacaoItemLabel | null>(null);

  const modalData = useMemo(() => {
    if (modalCardKey == null) return null;
    return getDetalhesCardData(colaboradores, modalCardKey);
  }, [colaboradores, modalCardKey]);

  /**
   * Totais derivados dos detalhes (soma dos itens) para alinhar o card principal
   * com o que é exibido dentro do popup para Proventos e Descontos.
   * Encargos volta a usar apenas `comparacao_totais` (lógica original do card).
   */
  const totaisFromDetalhes = useMemo(() => {
    const out: Partial<
      Record<
        ComparacaoItemLabel,
        { valorAtual: number; valorContrato: number; valorCct: number }
      >
    > = {};

    const keys: ComparacaoItemLabel[] = ["Total Proventos", "Total Descontos"];
    for (const key of keys) {
      const data = getDetalhesCardData(colaboradores, key);
      if (!data.itens.length) continue;

      let valorAtual = 0;
      let valorContrato = 0;
      let valorCct = 0;

      for (const it of data.itens) {
        valorAtual += it.valorAtual;
        valorContrato += it.valorContrato;
        valorCct += it.valorCct;
      }

      out[key] = { valorAtual, valorContrato, valorCct };
    }

    return out;
  }, [colaboradores]);

  const aumentoFolhaRaw = custoCorreto - custoAtual;
  const aumentoFolhaDisplay = Math.abs(aumentoFolhaRaw);

  const comparacaoCards = ITENS_COMPARACAO.map((itemNome) => {
    const encontrado = comparacaoTotais.find((item) => item.item === itemNome);
    const fromDetalhes = totaisFromDetalhes[itemNome];

    // Base padrão vinda do Supabase
    let valorAtualBase = encontrado?.valor_atual ?? 0;
    // Para Proventos/Descontos, priorizamos os totais calculados a partir dos detalhes
    if (fromDetalhes?.valorAtual !== undefined) {
      valorAtualBase = fromDetalhes.valorAtual;
    }
    // Para Encargos, se o total da folha atual for informado, usamos esse valor
    if (
      itemNome === "Total Encargos" &&
      typeof encargosAtualFromFolha === "number" &&
      encargosAtualFromFolha > 0
    ) {
      // Só substitui quando temos uma soma válida (> 0).
      // Caso contrário, mantemos o valor de `comparacao_totais`.
      valorAtualBase = encargosAtualFromFolha;
    }

    return {
      cardKey: itemNome,
      label:
        itemNome === "Total Custos Empresa"
          ? "Custo Total Benefícios"
          : itemNome,
      valorAtual: valorAtualBase,
      valorContrato:
        fromDetalhes?.valorContrato ??
        (contratoPorItem && typeof contratoPorItem[itemNome] === "number"
          ? contratoPorItem[itemNome]
          : undefined),
      valorCct: fromDetalhes?.valorCct ?? encontrado?.valor_cct ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      {showKpis && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-2 md:col-span-1">
            <KpiMiniCard
              label="Custo atual (o que fazem hoje)"
              value={custoAtual.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              tone="slate"
              icon="cash"
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <KpiMiniCard
              label="Custo correto (regra da CCT)"
              value={custoCorreto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              tone="emerald"
              icon="sheet"
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <KpiMiniCard
              label="Aumento na folha (regularização)"
              value={aumentoFolhaDisplay.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              tone={aumentoFolhaRaw >= 0 ? "emerald" : "rose"}
              icon="arrow"
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <KpiMiniCard
              label="Risco/passivo anual estimado"
              value={impactoAnual.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              tone="rose"
              icon="risk"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          Onde está a diferença?
        </h2>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {comparacaoCards.map((card) => (
            <CardBase
              key={card.label}
              title={card.label}
              compact
              className="flex flex-col"
              titleAction={
                enableDetalhes ? (
                  <button
                    type="button"
                    onClick={() => setModalCardKey(card.cardKey)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-[#ff7a00] hover:bg-orange-50 hover:text-[#ff7a00]"
                  >
                    Detalhes
                  </button>
                ) : null
              }
            >
              <BarComparisonChart
                data={[
                  {
                    label: card.label,
                    valorAtual: card.valorAtual,
                    valorContrato: card.valorContrato,
                    valorCct: card.valorCct,
                  },
                ]}
              />
            </CardBase>
          ))}
        </div>
      </div>

      {enableDetalhes && (
        <ModalDetalhesCard
          open={modalCardKey !== null}
          onClose={() => setModalCardKey(null)}
          data={modalData}
        />
      )}
    </div>
  );
}

