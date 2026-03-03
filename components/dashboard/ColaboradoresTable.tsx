"use client";

import { useState } from "react";
import type { VisaoExecutivaColaborador } from "@/lib/supabase/repositories/visaoExecutivaColaboradoresRepository";

interface ColaboradoresTableProps {
  colaboradores: VisaoExecutivaColaborador[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  pageSize?: number;
}

function formatCpf(v: string): string {
  if (!v || v === "—") return "—";
  const n = v.replace(/\D/g, "");
  if (n.length !== 11) return v;
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function ColaboradoresTable({
  colaboradores,
  selectedId,
  onSelect,
  pageSize = 12,
}: ColaboradoresTableProps): React.ReactElement {
  const [page, setPage] = useState(0);

  if (!colaboradores.length) {
    return (
      <p className="px-4 py-3 text-sm text-slate-500">
        Nenhum colaborador encontrado para exibição.
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(colaboradores.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const startIndex = safePage * pageSize;
  const pageColaboradores = colaboradores.slice(
    startIndex,
    startIndex + pageSize,
  );

  function handleChangePage(direction: "prev" | "next") {
    setPage((current) => {
      if (direction === "prev") {
        return Math.max(0, current - 1);
      }
      return Math.min(totalPages - 1, current + 1);
    });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50">
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-3 py-2">Colaborador</th>
              <th className="px-3 py-2">Função</th>
              <th className="px-3 py-2">CPF</th>
              <th className="px-3 py-2">Matrícula</th>
              <th className="px-3 py-2">Competência</th>
              <th className="px-3 py-2 text-right">Risco anual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageColaboradores.map((colaborador) => {
              const isSelected = colaborador.id === selectedId;

              return (
                <tr
                  key={colaborador.id}
                  className={`${
                    onSelect ? "cursor-pointer hover:bg-slate-50" : ""
                  } ${isSelected ? "bg-slate-100" : ""}`}
                  onClick={
                    onSelect ? () => onSelect(colaborador.id) : undefined
                  }
                >
                  <td className="max-w-[240px] truncate px-3 py-2 font-medium text-slate-800">
                    {colaborador.nome}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-slate-700">
                    {colaborador.funcao}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-700">
                    {formatCpf(colaborador.cpf)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {colaborador.matricula}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {colaborador.competencia}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-[11px] tabular-nums text-rose-700">
                    {colaborador.impactoAnual.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600">
        <span>
          Mostrando{" "}
          <span className="font-medium">
            {colaboradores.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + pageSize, colaboradores.length)}
          </span>{" "}
          de <span className="font-medium">{colaboradores.length}</span>{" "}
          colaboradores
        </span>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChangePage("prev")}
            disabled={safePage === 0}
            className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-[11px] font-medium text-slate-500">
            Página {totalPages === 0 ? 0 : safePage + 1} de {totalPages || 1}
          </span>
          <button
            type="button"
            onClick={() => handleChangePage("next")}
            disabled={safePage >= totalPages - 1}
            className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}

