import CardBase from "@/components/dashboard/CardBase";
import { BarComparisonChart } from "@/components/charts/BarComparisonChart";
import type { FolhaCctContrato } from "@/lib/supabase/types";

interface FolhaCctContratoDetailsProps {
  folhaCctContrato: FolhaCctContrato | null;
}

function formatCurrency(valor: number | null | undefined): string {
  if (typeof valor !== "number" || Number.isNaN(valor)) {
    return "R$ 0,00";
  }

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function severityTone(severidade?: string):
  | "critica"
  | "alerta"
  | "info"
  | "default" {
  if (!severidade) return "default";
  const s = severidade.toLowerCase();
  if (s.includes("critica")) return "critica";
  if (s.includes("alerta")) return "alerta";
  if (s.includes("info")) return "info";
  return "default";
}

export function FolhaCctContratoDetails({
  folhaCctContrato,
}: FolhaCctContratoDetailsProps): React.ReactElement | null {
  const itens =
    folhaCctContrato?.discrepancias?.itens?.filter(
      (item) =>
        typeof item.valor_cct === "number" &&
        typeof item.valor_contrato === "number",
    ) ?? [];

  if (!itens.length) {
    return (
      <CardBase compact title="Comparações CCT x contrato">
        <p className="text-xs text-slate-500">
          Não há comparações detalhadas disponíveis para este colaborador.
        </p>
      </CardBase>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Folha x Contrato x CCT
      </h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {itens.map((item) => {
          const tone = severityTone(item.severidade);

          const badgeClasses =
            tone === "critica"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : tone === "alerta"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : tone === "info"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-slate-50 text-slate-600 border-slate-200";

          const label =
            tone === "critica"
              ? "Crítica"
              : tone === "alerta"
                ? "Alerta"
                : tone === "info"
                  ? "Info"
                  : "Item";

          return (
            <CardBase
              key={item.item}
              title={item.item}
              compact
              className="flex flex-col gap-3"
              titleAction={
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${badgeClasses}`}
                >
                  {label}
                </span>
              }
            >
              <div className="space-y-1 text-[11px] text-slate-600">
                <p>
                  <span className="font-medium">CCT:</span>{" "}
                  {formatCurrency(item.valor_cct)}
                </p>
                <p>
                  <span className="font-medium">Contrato:</span>{" "}
                  {formatCurrency(item.valor_contrato)}
                </p>
                <p>
                  <span className="font-medium">Diferença:</span>{" "}
                  <span
                    className={
                      item.diferenca < 0
                        ? "font-semibold text-rose-700"
                        : item.diferenca > 0
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-slate-700"
                    }
                  >
                    {formatCurrency(item.diferenca)}
                  </span>
                </p>
              </div>

              <div className="mt-3">
                <BarComparisonChart
                  data={[
                    {
                      label: "",
                      valorAtual: item.valor_contrato ?? 0,
                      valorContrato: item.valor_contrato ?? 0,
                      valorCct: item.valor_cct ?? 0,
                    },
                  ]}
                />
              </div>
            </CardBase>
          );
        })}
      </div>
    </div>
  );
}

