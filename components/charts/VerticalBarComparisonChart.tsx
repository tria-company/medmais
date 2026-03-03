interface VerticalBarComparisonChartProps {
  valorAtual: number;
  valorCct: number;
  maxValue: number;
}

export function VerticalBarComparisonChart({
  valorAtual,
  valorCct,
  maxValue,
}: VerticalBarComparisonChartProps): React.ReactElement {
  const safeMax = maxValue <= 0 ? 1 : maxValue;
  const atualPct = (valorAtual / safeMax) * 100;
  const cctPct = (valorCct / safeMax) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-52 items-end justify-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-40 w-7 items-end overflow-hidden rounded-full bg-slate-100">
            <div
              className="w-full rounded-full bg-sky-500/90"
              style={{ height: `${Math.max(atualPct, 6)}%` }}
            />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Atual
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex h-40 w-7 items-end overflow-hidden rounded-full bg-slate-100">
            <div
              className="w-full rounded-full bg-emerald-500/90"
              style={{ height: `${Math.max(cctPct, 6)}%` }}
            />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            CCT
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600">
        <span>Atual</span>
        <span className="text-sm font-semibold text-slate-900">
          {valorAtual.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-600">
        <span>CCT</span>
        <span className="text-sm font-semibold text-emerald-700">
          {valorCct.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>
    </div>
  );
}

