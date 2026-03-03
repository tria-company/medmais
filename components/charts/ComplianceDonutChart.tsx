import type { GraficoConformidadeSegment } from "@/lib/supabase/types";

interface ComplianceDonutChartProps {
  segments: GraficoConformidadeSegment[];
}

const LABELS: Record<string, string> = {
  critico: "Crítico",
  alerta: "Alerta",
  informativo: "Informativo",
  conforme: "Conforme",
};

const COLORS: Record<string, string> = {
  critico: "bg-rose-500",
  alerta: "bg-amber-400",
  informativo: "bg-sky-400",
  conforme: "bg-emerald-500",
};

const SVG_COLORS: Record<string, string> = {
  critico: "rgb(244 63 94)",
  alerta: "rgb(251 191 36)",
  informativo: "rgb(56 189 248)",
  conforme: "rgb(16 185 129)",
};

const SEGMENT_ORDER: GraficoConformidadeSegment["status"][] = [
  "critico",
  "alerta",
  "informativo",
  "conforme",
];

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = {
    x: cx + r * Math.cos(startAngle - Math.PI / 2),
    y: cy + r * Math.sin(startAngle - Math.PI / 2),
  };
  const end = {
    x: cx + r * Math.cos(endAngle - Math.PI / 2),
    y: cy + r * Math.sin(endAngle - Math.PI / 2),
  };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function ComplianceDonutChart({
  segments,
}: ComplianceDonutChartProps): React.ReactElement {
  const total = segments.reduce((acc, item) => acc + item.quantidade, 0);

  if (!segments.length || total === 0) {
    return (
      <p className="text-sm text-slate-500">
        Ainda não há dados de conformidade disponíveis no Supabase.
      </p>
    );
  }

  const byStatus = Object.fromEntries(
    segments.map((s) => [s.status, s]),
  ) as Record<string, GraficoConformidadeSegment>;
  const ordered = SEGMENT_ORDER.map((status) => byStatus[status]).filter(Boolean);
  let cumulative = 0;
  const arcs = ordered.map((seg) => {
    const startAngle = (cumulative / 100) * 2 * Math.PI;
    cumulative += seg.percentual;
    const endAngle = (cumulative / 100) * 2 * Math.PI;
    return { status: seg.status, startAngle, endAngle };
  });

  const size = 192;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-stretch">
      <div className="flex flex-1 flex-col items-center justify-center md:min-h-[280px]">
        <div className="relative h-48 w-48 md:h-52 md:w-52">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="h-full w-full"
            aria-hidden
          >
            {arcs.map((arc) => (
              <path
                key={arc.status}
                d={describeArc(cx, cy, r, arc.startAngle, arc.endAngle)}
                fill="none"
                stroke={SVG_COLORS[arc.status] ?? "rgb(148 163 184)"}
                strokeWidth={stroke}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ margin: stroke / 2 }}
          >
            <span className="text-center">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Conformidade
              </span>
              <span className="block text-2xl font-bold text-emerald-600 md:text-3xl">
                {(
                  segments.find((s) => s.status === "conforme")?.percentual ?? 0
                ).toFixed(0)}
                %
              </span>
            </span>
          </div>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col justify-center gap-3">
        {segments.map((segment) => (
          <li
            key={segment.status}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${COLORS[segment.status] ?? "bg-slate-400"}`}
              />
              <span className="text-sm font-medium text-slate-800">
                {LABELS[segment.status] ?? segment.status}
              </span>
            </div>
            <span className="shrink-0 text-sm tabular-nums font-medium text-slate-700">
              {segment.quantidade} itens · {segment.percentual.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

