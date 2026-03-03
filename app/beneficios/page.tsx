import CardBase from "@/components/dashboard/CardBase";
import { BenefitsTable } from "@/components/dashboard/BenefitsTable";
import {
  getDiscrepancias,
  getDiscrepanciasCriticas,
} from "@/lib/supabase/repositories/discrepanciasRepository";

export const dynamic = "force-dynamic";

export default async function BeneficiosPage() {
  const [discrepancias, criticas] = await Promise.all([
    getDiscrepancias(),
    getDiscrepanciasCriticas(),
  ]);

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <span className="text-base leading-none">←</span>
          <span>Voltar para a home</span>
        </a>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          Página 2 · Benefício por benefício
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Tabela operacional do RH — CCT vs. folha atual.
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <CardBase title="Itens críticos" compact className="md:col-span-1">
          <p className="text-2xl font-semibold text-rose-700">
            {criticas.length}
          </p>
        </CardBase>

        <CardBase
          title="Total de discrepâncias"
          compact
          className="md:col-span-1"
        >
          <p className="text-2xl font-semibold text-slate-900">
            {discrepancias.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Linhas carregadas da tabela <code>discrepancias</code> no Supabase.
          </p>
        </CardBase>

        <CardBase
          title="Sugestão de filtro rápido"
          compact
          className="md:col-span-1"
        >
          <p className="text-xs text-slate-600">
            Você pode adicionar filtros por grupo (Proventos, Benefícios,
            Descontos, Encargos) e por status visual (❌, ⚠️, ✅, ℹ️) usando os
            campos <code>grupo</code> e <code>status</code>.
          </p>
        </CardBase>
      </div>

      <BenefitsTable items={discrepancias} />
    </section>
  );
}

