"use client";

import { useMemo, useState } from "react";
import { BarComparisonChart } from "@/components/charts/BarComparisonChart";
import type {
  DetalhesCardData,
  RankingColaboradorItem,
} from "@/lib/detalhesCardData";
import type { RankingColaboradorTotal } from "@/lib/detalhesCardData";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface ModalDetalhesCardProps {
  open: boolean;
  onClose: () => void;
  data: DetalhesCardData | null;
}

export function ModalDetalhesCard({
  open,
  onClose,
  data,
}: ModalDetalhesCardProps): React.ReactElement | null {
  const [itemSelecionado, setItemSelecionado] = useState<string | null>(null);

  const ranking = useMemo((): RankingColaboradorItem[] => {
    if (!data || !itemSelecionado) return [];
    return data.rankingPorItem.get(itemSelecionado) ?? [];
  }, [data, itemSelecionado]);

  const rankingTotais = useMemo<RankingColaboradorTotal[]>(() => {
    return data?.rankingColaboradoresTotais ?? [];
  }, [data]);

  const pagosAMais = useMemo(
    () => rankingTotais.filter((r) => r.diferenca < 0),
    [rankingTotais],
  );

  const pagosAbaixo = useMemo(
    () => rankingTotais.filter((r) => r.diferenca > 0),
    [rankingTotais],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalhes-title"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-[98vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:h-[90vh] md:max-w-[94vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2
            id="modal-detalhes-title"
            className="text-lg font-semibold text-slate-900"
          >
            {data?.cardLabel ?? "Detalhes"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
            aria-label="Fechar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {!data ? (
            <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
          ) : !data.itens.length ? (
            <>
              <p className="text-sm text-slate-500">
                {data.cardKey === "Total Descontos"
                  ? "Não há detalhamento por tipo de desconto (itens CCT x contrato)."
                  : "Não há detalhamento por tipo de provento (itens CCT x contrato)."}
              </p>
              {(data.cardKey === "Total Proventos" || data.cardKey === "Total Descontos") && (
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {data.cardKey === "Total Descontos"
                      ? "Descontos irregulares por colaborador (Total Descontos)"
                      : "Proventos irregulares por colaborador (Total Proventos)"}
                  </h3>
                  <p className="mb-3 text-xs text-slate-600">
                    Valores conforme total por colaborador (comparação Atual x CCT).
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TabelaRankingColaboradoresTotais
                      titulo={data.cardKey === "Total Descontos" ? "Descontos a mais (acima da CCT)" : "Pagos a mais (acima da CCT)"}
                      rows={pagosAMais}
                      emptyMessage={data.cardKey === "Total Descontos" ? "Nenhum colaborador com descontos a mais." : "Nenhum colaborador com proventos pagos a mais."}
                    />
                    <TabelaRankingColaboradoresTotais
                      titulo={data.cardKey === "Total Descontos" ? "Descontos abaixo/irregulares (abaixo da CCT)" : "Pagos abaixo/irregulares (abaixo da CCT)"}
                      rows={pagosAbaixo}
                      emptyMessage={data.cardKey === "Total Descontos" ? "Nenhum colaborador com descontos abaixo." : "Nenhum colaborador com proventos pagos abaixo."}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {data.cardKey === "Total Descontos"
                    ? "Totais por desconto (Atual · Contrato · CCT)"
                    : "Totais por provento (Atual · Contrato · CCT)"}
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data.itens.map((it) => {
                    const selected = itemSelecionado === it.item;
                    const diffItem = it.valorCct - it.valorAtual;
                    const hasDiff = Math.abs(diffItem) > 1e-6;
                    return (
                      <button
                        key={it.item}
                        type="button"
                        onClick={() =>
                          setItemSelecionado((prev) =>
                            prev === it.item ? null : it.item,
                          )
                        }
                        className={`flex flex-col rounded-xl border-2 p-3 text-left transition ${
                          selected
                            ? "border-[#ff7a00] bg-orange-50/80 shadow-sm"
                            : hasDiff
                              ? "border-rose-300 bg-rose-50/70 shadow-sm"
                              : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <span className="mb-1 line-clamp-2 text-xs font-semibold text-slate-800">
                          {it.item}
                        </span>
                        {hasDiff && (
                          <span className="mb-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                            Com diferença
                          </span>
                        )}
                        <BarComparisonChart
                          data={[
                            {
                              label: it.item,
                              valorAtual: it.valorAtual,
                              valorContrato: it.valorContrato,
                              valorCct: it.valorCct,
                            },
                          ]}
                          compact
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {itemSelecionado && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Ranking por diferença — {itemSelecionado}
                  </h3>
                  {ranking.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                      Nenhum colaborador com diferença (Atual x CCT) para este item. Todos estão conformes.
                    </p>
                  ) : (
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Colaborador</th>
                          <th className="px-4 py-3 text-right">Atual</th>
                          <th className="px-4 py-3 text-right">Contrato</th>
                          <th className="px-4 py-3 text-right">CCT</th>
                          <th className="px-4 py-3 text-right">Diferença</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((r, idx) => (
                          <tr
                            key={r.colaboradorId}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-4 py-2 font-medium text-slate-900">
                              {idx + 1}. {r.nome}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-600">
                              {formatCurrency(r.valorAtual)}
                            </td>
                            <td className="px-4 py-2 text-right text-sky-700">
                              {formatCurrency(r.valorContrato)}
                            </td>
                            <td className="px-4 py-2 text-right text-emerald-700">
                              {formatCurrency(r.valorCct)}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-semibold ${
                                r.diferenca > 0
                                  ? "text-emerald-700"
                                  : r.diferenca < 0
                                    ? "text-rose-700"
                                    : "text-slate-600"
                              }`}
                            >
                              {formatCurrency(r.diferenca)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              )}

              {(data?.cardKey === "Total Proventos" || data?.cardKey === "Total Descontos") &&
                rankingTotais.length > 0 && (
                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {data.cardKey === "Total Descontos"
                        ? "Descontos irregulares por colaborador (Total Descontos)"
                        : "Proventos irregulares por colaborador (Total Proventos)"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TabelaRankingColaboradoresTotais
                        titulo={data.cardKey === "Total Descontos" ? "Descontos a mais (acima da CCT)" : "Pagos a mais (acima da CCT)"}
                        rows={pagosAMais}
                        emptyMessage={data.cardKey === "Total Descontos" ? "Nenhum colaborador com descontos a mais." : "Nenhum colaborador com proventos pagos a mais."}
                      />
                      <TabelaRankingColaboradoresTotais
                        titulo={data.cardKey === "Total Descontos" ? "Descontos abaixo/irregulares (abaixo da CCT)" : "Pagos abaixo/irregulares (abaixo da CCT)"}
                        rows={pagosAbaixo}
                        emptyMessage={data.cardKey === "Total Descontos" ? "Nenhum colaborador com descontos abaixo." : "Nenhum colaborador com proventos pagos abaixo."}
                      />
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabelaRankingColaboradoresTotais({
  titulo,
  rows,
  emptyMessage,
}: {
  titulo: string;
  rows: RankingColaboradorTotal[];
  emptyMessage: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
          {titulo}
        </h4>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-3 text-xs text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3 text-right">Atual</th>
                <th className="px-4 py-3 text-right">CCT</th>
                <th className="px-4 py-3 text-right">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.colaboradorId}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {idx + 1}. {r.nome}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">
                    {formatCurrency(r.valorAtual)}
                  </td>
                  <td className="px-4 py-2 text-right text-emerald-700">
                    {formatCurrency(r.valorCct)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      r.diferenca < 0
                        ? "text-emerald-700"
                        : r.diferenca > 0
                          ? "text-rose-700"
                          : "text-slate-600"
                    }`}
                  >
                    {formatCurrency(r.diferenca)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
