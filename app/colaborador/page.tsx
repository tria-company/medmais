import { ColaboradoresTable } from "@/components/dashboard/ColaboradoresTable";
import { getVisaoExecutivaPorColaborador } from "@/lib/supabase/repositories/visaoExecutivaColaboradoresRepository";

export const dynamic = "force-dynamic";

export default async function ColaboradorPage() {
  const colaboradores = await getVisaoExecutivaPorColaborador();

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          Página 2 · Colaborador
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Visão por colaborador
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Lista consolidada de colaboradores com função, CPF, matrícula e
          competência, além do risco anual estimado.
        </p>
      </header>

      <ColaboradoresTable colaboradores={colaboradores} />
    </section>
  );
}

