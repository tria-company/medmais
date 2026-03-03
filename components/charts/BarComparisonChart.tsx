interface BarComparisonChartProps {
  data: {
    label: string;
    valorAtual: number;
    valorContrato?: number;
    valorCct: number;
  }[];
  /** Cores da barra "Atual" por índice (classes Tailwind, ex: bg-sky-500/90) para diferenciação */
  barColorClasses?: string[];
  /** Reduz espaçamento e tamanho de fonte para uso em cards menores */
  compact?: boolean;
}

const DEFAULT_ATUAL_COLOR = "bg-rose-700/90";
const CONTRATO_COLOR = "bg-sky-500/90";
const CCT_COLOR = "bg-emerald-500/90";

export function BarComparisonChart({
  data,
  barColorClasses = [],
  compact = false,
}: BarComparisonChartProps): React.ReactElement {
  if (!data.length) {
    return (
      <p className={compact ? "text-xs text-slate-500" : "text-sm text-slate-500"}>
        Nenhum dado de comparação encontrado no Supabase.
      </p>
    );
  }

  const maxValueRaw = Math.max(
    ...data.flatMap((item) => [
      item.valorAtual,
      item.valorContrato ?? 0,
      item.valorCct,
    ]),
  );
  const maxValue = maxValueRaw > 0 ? maxValueRaw : 1;
  const hasContrato = data.some(
    (item) =>
      typeof item.valorContrato === "number" &&
      !Number.isNaN(item.valorContrato),
  );

  const spaceY = compact ? "space-y-3" : "space-y-5";
  const itemSpaceY = compact ? "space-y-1" : "space-y-2";
  const innerSpaceY = compact ? "space-y-1" : "space-y-1.5";
  const labelClass = compact ? "text-[10px] text-slate-600" : "text-xs text-slate-600";
  const valueClass = compact ? "text-[10px] font-semibold" : "text-sm font-semibold";
  const barHeight = compact ? "h-2.5" : "h-4";
  const mtBar = compact ? "mt-1" : "mt-2";

  return (
    <div className={spaceY}>
      {data.map((item, index) => {
        const atualPct = (item.valorAtual / maxValue) * 100;
        const contratoPct =
          typeof item.valorContrato === "number"
            ? (item.valorContrato / maxValue) * 100
            : 0;
        const cctPct = (item.valorCct / maxValue) * 100;
        const atualBarClass = barColorClasses[index] ?? DEFAULT_ATUAL_COLOR;

        return (
          <div key={item.label} className={itemSpaceY}>
            <div className={innerSpaceY}>
              {/* Barra Atual */}
              <div className={`flex items-center justify-between ${labelClass}`}>
                <span>Atual</span>
                <span className={`${valueClass} text-slate-900`}>
                  {item.valorAtual.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className={`${barHeight} w-full overflow-hidden rounded-full bg-slate-100`}>
                <div
                  className={`h-full rounded-full ${atualBarClass}`}
                  style={{ width: `${Math.max(atualPct, 6)}%` }}
                />
              </div>

              {hasContrato && (
                <>
                  <div className={`${mtBar} flex items-center justify-between ${labelClass}`}>
                    <span>Contrato</span>
                    <span className={`${valueClass} text-sky-700`}>
                      {item.valorContrato?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }) ?? "R$ 0,00"}
                    </span>
                  </div>
                  <div className={`${barHeight} w-full overflow-hidden rounded-full bg-slate-100`}>
                    <div
                      className={`h-full rounded-full ${CONTRATO_COLOR}`}
                      style={{ width: `${Math.max(contratoPct, 6)}%` }}
                    />
                  </div>
                </>
              )}

              {/* Barra CCT */}
              <div className={`${mtBar} flex items-center justify-between ${labelClass}`}>
                <span>CCT</span>
                <span className={`${valueClass} text-emerald-700`}>
                  {item.valorCct.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className={`${barHeight} w-full overflow-hidden rounded-full bg-slate-100`}>
                <div
                  className={`h-full rounded-full ${CCT_COLOR}`}
                  style={{ width: `${Math.max(cctPct, 6)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

