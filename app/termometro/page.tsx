import CardBase from "@/components/dashboard/CardBase";
import { ComplianceDonutChart } from "@/components/charts/ComplianceDonutChart";
import { getDashboardData } from "@/lib/supabase/repositories/dashboardDataRepository";
import { getDiscrepancias } from "@/lib/supabase/repositories/discrepanciasRepository";
import type { GraficoConformidadeSegment } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function TermometroPage() {
  const [dashboardData, discrepancias] = await Promise.all([
    getDashboardData(),
    getDiscrepancias(),
  ]);

  const graficoConformidadeRaw = dashboardData?.grafico_conformidade;

  let graficoConformidade: GraficoConformidadeSegment[] = [];

  if (Array.isArray(graficoConformidadeRaw)) {
    graficoConformidade = graficoConformidadeRaw;
  } else if (graficoConformidadeRaw && typeof graficoConformidadeRaw === "object") {
    const entries = Object.entries(graficoConformidadeRaw as Record<string, number>);
    const total = entries.reduce((acc, [, quantidade]) => acc + (quantidade ?? 0), 0);

    graficoConformidade = entries.map(([status, quantidade]) => ({
      status: status as GraficoConformidadeSegment["status"],
      quantidade: quantidade ?? 0,
      percentual: total > 0 ? ((quantidade ?? 0) / total) * 100 : 0,
    }));
  }

  const statusUpper = (s: string) => (s ?? "").toUpperCase().trim();

  const errosFrequentes = discrepancias
    .filter(
      (item) =>
        statusUpper(item.status) === "AUSENTE" ||
        statusUpper(item.status) === "ABAIXO" ||
        item.diferenca < 0,
    )
    .sort((a, b) => a.diferenca - b.diferenca)
    .slice(0, 6);

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <span className="text-base leading-none">←</span>
          <span>Voltar para a home</span>
        </a>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
          Termômetro de conformidade
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
        <CardBase
          title="Termômetro de conformidade"
          className="min-h-0"
        >
          <div className="py-2">
            <ComplianceDonutChart segments={graficoConformidade} />
          </div>
        </CardBase>

        <CardBase title="Resumo de erros frequentes" className="min-h-0">
          {errosFrequentes.length === 0 ? (
            <p className="py-4 text-sm leading-relaxed text-slate-500">
              Não há erros frequentes cadastrados ainda. Alimente a tabela{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">discrepancias</code>{" "}
              no Supabase para ver aqui os benefícios mais problemáticos.
            </p>
          ) : (
            <ul className="space-y-3 py-1">
              {errosFrequentes.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                      {item.item_cct}
                    </p>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-rose-600">
                      {item.diferenca.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.grupo} · {item.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBase>
      </div>
    </section>
  );
}

