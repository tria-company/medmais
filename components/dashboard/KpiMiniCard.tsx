interface KpiMiniCardProps {
  label: string;
  value: string;
  tone?: "emerald" | "sky" | "rose" | "slate";
  icon?: "cash" | "sheet" | "arrow" | "risk";
}

const TONE_RING: Record<NonNullable<KpiMiniCardProps["tone"]>, string> = {
  emerald: "ring-emerald-100 text-emerald-600",
  sky: "ring-sky-100 text-sky-600",
  rose: "ring-rose-100 text-rose-600",
  slate: "ring-slate-100 text-slate-500",
};

const ICON_SRC: Record<NonNullable<KpiMiniCardProps["icon"]>, string> = {
  cash: "/Cash_blue.svg",
  sheet: "/people.svg",
  arrow: "/ArrowRight.svg",
  risk: "/Attention.svg",
};

function getIconFilter(icon: NonNullable<KpiMiniCardProps["icon"]>): string {
  switch (icon) {
    case "cash":
      return "brightness(0) saturate(100%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(350deg)";
    case "sheet":
      return "brightness(0) saturate(100%) invert(32%) sepia(78%) saturate(1200%) hue-rotate(100deg)";
    case "arrow":
      return "brightness(0) saturate(100%) invert(55%) sepia(90%) saturate(800%) hue-rotate(360deg)";
    case "risk":
      return "brightness(0) saturate(100%) invert(15%) sepia(88%) saturate(1800%) hue-rotate(350deg)";
    default:
      return "none";
  }
}

function Icon({
  icon = "cash",
}: {
  icon?: KpiMiniCardProps["icon"];
}): React.ReactElement {
  switch (icon) {
    case "sheet":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-7 w-7"
        >
          <path
            d="M7 4.75A1.75 1.75 0 0 1 8.75 3h4.19c.46 0 .9.18 1.23.51l3.32 3.32c.33.33.51.77.51 1.23v10.19A1.75 1.75 0 0 1 16.25 20h-7.5A1.75 1.75 0 0 1 7 18.25v-13.5Z"
            fill="currentColor"
            opacity="0.16"
          />
          <path
            d="M9 13h6M9 16h3M9 7h2.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "arrow":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-7 w-7"
        >
          <path
            d="M5 16.5 12 7l7 9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "risk":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-7 w-7"
        >
          <path
            d="M12 4.5 4.75 8v4.75C4.75 16.8 7.01 20 12 20s7.25-3.2 7.25-7.25V8L12 4.5Z"
            fill="currentColor"
            opacity="0.16"
          />
          <path
            d="M12 9v4M12 16.5h.01"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cash":
    default:
      return (
        <Image
          src="/icons/kpi-custo-atual.png"
          alt="Ícone de custo atual"
          width={40}
          height={40}
          priority
        />
      );
  }
}

export default function KpiMiniCard({
  label,
  value,
  tone = "slate",
  icon = "cash",
}: KpiMiniCardProps): React.ReactElement {
  const toneRing = TONE_RING[tone] ?? TONE_RING.slate;
  const src = ICON_SRC[icon ?? "cash"];

  return (
    <div className="flex min-w-0 items-center gap-5">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.12)] ring-1 ${toneRing}`}
        aria-hidden
      >
        <img
          src={src}
          alt=""
          width={28}
          height={28}
          style={{ filter: getIconFilter(icon ?? "cash") }}
        />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-0.5">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-[30px] font-semibold leading-[120%] text-black">
          {value}
        </p>
      </div>
    </div>
  );
}

