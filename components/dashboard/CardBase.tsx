import type { ReactNode } from "react";

interface CardBaseProps {
  children: ReactNode;
  title?: string;
  titleAction?: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function CardBase({
  children,
  title,
  titleAction,
  className = "",
  compact = false,
}: CardBaseProps): React.ReactElement {
  return (
    <section
      className={`rounded-2xl border border-[#E4E4E7] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${compact ? "p-5" : "p-7"} ${className}`}
    >
      {(title || titleAction) && (
        <header
          className={`flex items-center justify-between gap-3 ${compact ? "mb-3" : "mb-4"}`}
        >
          {title && (
            <h2
              className={`font-semibold text-[#2c3545] ${compact ? "text-base" : "text-lg"}`}
            >
              {title}
            </h2>
          )}
          {titleAction}
        </header>
      )}
      {children}
    </section>
  );
}

