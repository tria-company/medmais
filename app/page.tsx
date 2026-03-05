import CardBase from "@/components/dashboard/CardBase";
import { ColaboradoresBarsChart } from "@/components/charts/ColaboradoresBarsChart";
import { VisaoExecutivaResumo } from "@/components/dashboard/VisaoExecutivaResumo";
import {
  getComparacaoTotais,
  getCustoTotalEmpresa,
} from "@/lib/supabase/repositories/comparacaoTotaisRepository";
import { getVisaoExecutivaPorColaborador } from "@/lib/supabase/repositories/visaoExecutivaColaboradoresRepository";
import { getDashboardData } from "@/lib/supabase/repositories/dashboardDataRepository";
import {
  computeContratoTotaisFromFolha,
  type ComparacaoItemLabel,
} from "@/lib/contratoTotais";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    custoTotalEmpresa,
    dashboardData,
    comparacaoTotais,
    visaoColaboradores,
  ] = await Promise.all([
    getCustoTotalEmpresa(),
    getDashboardData(),
    getComparacaoTotais(),
    getVisaoExecutivaPorColaborador(),
  ]);

  const custoAtual = custoTotalEmpresa?.valorAtual ?? 0;
  const custoCorreto = custoTotalEmpresa?.valorCct ?? 0;
  const impactoAnual = dashboardData?.impacto_anual ?? 0;

  const contratoPorItem: Record<ComparacaoItemLabel, number> = {
    "Total Proventos": 0,
    "Total Descontos": 0,
    "Total Encargos": 0,
    "Total Custos Empresa": 0,
    "Líquido Funcionário": 0,
    "Custo Total Empresa": 0,
  };

  for (const colaborador of visaoColaboradores) {
    const totaisContrato = computeContratoTotaisFromFolha(
      colaborador.folhaContrato,
    );

    (Object.keys(totaisContrato) as ComparacaoItemLabel[]).forEach((chave) => {
      contratoPorItem[chave] += totaisContrato[chave] ?? 0;
    });
  }

  // Soma de todos os encargos atuais diretamente da folha_atual.totais.total_encargos
  // para todos os colaboradores da visão executiva.
  let encargosAtualFromFolha = 0;
  for (const colaborador of visaoColaboradores) {
    const folha: any = colaborador.folhaCctContrato?.folha_atual ?? null;
    const totalEncargos = folha?.totais?.total_encargos;
    if (typeof totalEncargos === "number" && Number.isFinite(totalEncargos)) {
      encargosAtualFromFolha += totalEncargos;
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          Visão executiva
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Custo atual vs. custo correto e risco trabalhista.
        </h1>
      </header>

      <VisaoExecutivaResumo
        custoAtual={custoAtual}
        custoCorreto={custoCorreto}
        impactoAnual={impactoAnual}
        comparacaoTotais={comparacaoTotais}
        contratoPorItem={contratoPorItem}
        colaboradores={visaoColaboradores}
        encargosAtualFromFolha={encargosAtualFromFolha}
      />

      <CardBase title="Comparativo por colaborador (custo e risco)">
        <ColaboradoresBarsChart colaboradores={visaoColaboradores} />
      </CardBase>
    </section>
  );
}
