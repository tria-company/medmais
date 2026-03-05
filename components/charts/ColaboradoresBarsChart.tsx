"use client";

import { useState } from "react";
import type { VisaoExecutivaColaborador } from "@/lib/supabase/repositories/visaoExecutivaColaboradoresRepository";
import { VisaoExecutivaResumo } from "@/components/dashboard/VisaoExecutivaResumo";
import { ColaboradoresTable } from "@/components/dashboard/ColaboradoresTable";
import { FolhaCctContratoDetails } from "@/components/dashboard/FolhaCctContratoDetails";
import { computeContratoTotaisFromFolha } from "@/lib/contratoTotais";

interface ColaboradoresBarsChartProps {
  colaboradores: VisaoExecutivaColaborador[];
}

export function ColaboradoresBarsChart({
  colaboradores,
}: ColaboradoresBarsChartProps): React.ReactElement {
  if (!colaboradores.length) {
    return (
      <p className="text-sm text-slate-500">
        Nenhum colaborador encontrado para exibição.
      </p>
    );
  }

  const [selecionadoId, setSelecionadoId] = useState<string | null>(
    colaboradores[0]?.id ?? null,
  );
  const [funcaoFiltro, setFuncaoFiltro] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenarRiscoDesc, setOrdenarRiscoDesc] = useState(false);

  const funcoesDisponiveis = Array.from(
    new Set(
      colaboradores
        .map((c) => c.funcao)
        .filter((f): f is string => Boolean(f && f.trim().length > 0)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const normalizar = (valor: string | undefined | null) =>
    (valor ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const termoNormalizado = normalizar(searchTerm);

  const filtradosBase = colaboradores.filter((colaborador) => {
    if (funcaoFiltro !== "todas" && colaborador.funcao !== funcaoFiltro) {
      return false;
    }

    if (!termoNormalizado) return true;

    const alvo = [
      colaborador.nome,
      colaborador.cpf,
      colaborador.matricula,
      colaborador.competencia,
    ]
      .map((v) => normalizar(v))
      .join(" ");

    return alvo.includes(termoNormalizado);
  });

  const ordenados = [...filtradosBase];
  if (ordenarRiscoDesc) {
    ordenados.sort((a, b) => b.impactoAnual - a.impactoAnual);
  }

  const selecionado =
    selecionadoId != null
      ? ordenados.find((c) => c.id === selecionadoId) ?? null
      : null;

  return (
    <div className="space-y-6">
      {/* Filtros e busca */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, CPF, matrícula ou competência"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Função
            </span>
            <select
              value={funcaoFiltro}
              onChange={(event) => {
                setFuncaoFiltro(event.target.value);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="todas">Todas</option>
              {funcoesDisponiveis.map((funcao) => (
                <option key={funcao} value={funcao}>
                  {funcao}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOrdenarRiscoDesc((prev) => !prev);
          }}
          className={`mt-2 inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-medium md:mt-0 ${
            ordenarRiscoDesc
              ? "border-rose-300 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          {ordenarRiscoDesc
            ? "Risco anual: maior → menor"
            : "Risco anual: ordem padrão"}
        </button>
      </div>

      {/* Tabela em largura total */}
      <ColaboradoresTable
        colaboradores={ordenados}
        selectedId={selecionadoId}
        onSelect={(id) =>
          setSelecionadoId((current) => (current === id ? null : id))
        }
      />

      {selecionado && (
        <div className="space-y-5 border-t border-slate-200 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Visão executiva do colaborador selecionado
          </p>
          <VisaoExecutivaResumo
            custoAtual={selecionado.custoAtualEmpresa}
            custoCorreto={selecionado.custoCorretoEmpresa}
            impactoAnual={selecionado.impactoAnual}
            comparacaoTotais={selecionado.comparacaoTotais}
            showKpis={false}
            contratoPorItem={computeContratoTotaisFromFolha(
              selecionado.folhaContrato,
            )}
            colaboradores={[selecionado]}
            enableDetalhes={false}
          />

          <FolhaCctContratoDetails folhaCctContrato={selecionado.folhaCctContrato} />
        </div>
      )}
    </div>
  );
}
