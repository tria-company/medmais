"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Executivo", icon: "/globe.svg" },
  { href: "/colaborador", label: "Colaborador", icon: "/people.svg" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function SidebarNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex flex-1 flex-col gap-2 text-xs text-slate-600">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group mx-1 flex items-center gap-3 px-1 py-2 text-xs font-medium text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-900"
          >
            <span
              className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                active
                  ? "bg-[#ff7a00]/10 ring-1 ring-[#ff7a00] shadow-[0_4px_10px_rgba(255,122,0,0.35)]"
                  : "bg-[#ff7a00]/5"
              }`}
            >
              <img
                src={item.icon}
                alt=""
                className="h-4 w-4"
              />
            </span>
            <span className="hidden truncate text-sm group-hover:inline">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

