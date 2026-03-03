import type { Discrepancia } from "@/lib/supabase/types";

interface BenefitsTableProps {
  items: Discrepancia[];
}

type DiscrepanciaStatus = Discrepancia["status"];

const STATUS_VALIDOS: DiscrepanciaStatus[] = ["AUSENTE", "ABAIXO", "OK", "EXTRA"];

const STATUS_LABEL: Record<DiscrepanciaStatus, string> = {
  AUSENTE: "❌ AUSENTE",
  ABAIXO: "⚠️ ABAIXO",
  OK: "✅ OK",
  EXTRA: "ℹ️ EXTRA",
};

const STATUS_COLOR: Record<DiscrepanciaStatus, string> = {
  AUSENTE: "bg-rose-50 text-rose-700 ring-rose-100",
  ABAIXO: "bg-amber-50 text-amber-700 ring-amber-100",
  OK: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  EXTRA: "bg-sky-50 text-sky-700 ring-sky-100",
};

function normalizarStatus(
  valor: unknown,
): DiscrepanciaStatus {
  if (typeof valor !== "string") return "OK";
  const upper = valor.toUpperCase().trim() as DiscrepanciaStatus;
  return STATUS_VALIDOS.includes(upper) ? upper : "OK";
}

export function BenefitsTable({
  items,
}: BenefitsTableProps): React.ReactElement {
  if (!items.length) {
    return (
      <p className="text-sm text-slate-500">
        Nenhuma discrepância encontrada. Verifique se a tabela{" "}
        <code>discrepancias</code> do Supabase já está populada.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="max-h-[540px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Grupo</th>
              <th className="px-4 py-3">Item (CCT)</th>
              <th className="px-4 py-3">Como vem na folha</th>
              <th className="px-4 py-3 text-right">Valor CCT</th>
              <th className="px-4 py-3 text-right">Valor atual</th>
              <th className="px-4 py-3 text-right">Diferença</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-700">
                  {item.grupo}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-slate-700">
                  {item.item_cct}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                  {item.item_atual}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums text-slate-700">
                  {item.valor_cct.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums text-slate-700">
                  {item.valor_atual.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums">
                  <span
                    className={
                      item.diferenca >= 0 ? "text-emerald-700" : "text-rose-700"
                    }
                  >
                    {item.diferenca.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                      STATUS_COLOR[normalizarStatus(item.status)]
                    }`}
                  >
                    {STATUS_LABEL[normalizarStatus(item.status)]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
        Tabela baseada na coluna <code>discrepancias</code> especificada no
        arquivo <code>medmais.md</code>.
      </div>
    </div>
  );
}

