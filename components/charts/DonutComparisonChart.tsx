interface DonutComparisonChartProps {
  valorAtual: number;
  valorCct: number;
  size?: number;
  showCenterTotal?: boolean;
}

export function DonutComparisonChart({
  valorAtual,
  valorCct,
  size = 140,
  showCenterTotal = true,
}: DonutComparisonChartProps): React.ReactElement {
  const total = valorAtual + valorCct;
  const safeTotal = total <= 0 ? 1 : total;
  const atualPct = (valorAtual / safeTotal) * 100;
  const cctPct = (valorCct / safeTotal) * 100;

  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const toRad = (pct: number) => (pct / 100) * 2 * Math.PI;
  const endAtual = toRad(atualPct);
  const endCct = toRad(100);

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = {
      x: x + radius * Math.cos(startAngle - Math.PI / 2),
      y: y + radius * Math.sin(startAngle - Math.PI / 2),
    };
    const end = {
      x: x + radius * Math.cos(endAngle - Math.PI / 2),
      y: y + radius * Math.sin(endAngle - Math.PI / 2),
    };
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const pathAtual = describeArc(cx, cy, r, 0, endAtual);
  const pathCct = describeArc(cx, cy, r, endAtual, 2 * Math.PI);

  return (
    <div className="flex flex-row items-center justify-between gap-6">
      {/* Legenda à esquerda — valores em destaque */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full bg-rose-700" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-600">Atual</span>
            <span className="text-base font-semibold tabular-nums text-slate-900">
              {valorAtual.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-600">CCT</span>
            <span className="text-base font-semibold tabular-nums text-emerald-700">
              {valorCct.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico à direita */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-0" aria-hidden>
          <path
            d={pathAtual}
            fill="none"
            stroke="rgb(190 18 60)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d={pathCct}
            fill="none"
            stroke="rgb(16 185 129)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </svg>
        {showCenterTotal && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ margin: stroke / 2 }}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Total
            </span>
            <span className="text-xs font-semibold tabular-nums text-slate-700">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
