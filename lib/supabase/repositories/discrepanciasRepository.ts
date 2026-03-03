import { supabaseClient } from "../client";
import type {
  Discrepancia,
  FolhaDePagamentoIaDuplicateRow,
} from "../types";

async function getUltimaFolha(): Promise<FolhaDePagamentoIaDuplicateRow | null> {
  const { data, error } = await supabaseClient
    .from("folha_de_pagamento_ia_duplicate")
    .select("id, discrepancias")
    .not("discrepancias", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as FolhaDePagamentoIaDuplicateRow) ?? null;
}

export async function getDiscrepancias(): Promise<Discrepancia[]> {
  const folha = await getUltimaFolha();
  return folha?.discrepancias ?? [];
}

export async function getDiscrepanciasCriticas(): Promise<Discrepancia[]> {
  const todas = await getDiscrepancias();
  return todas.filter((item) => item.severidade === "critica");
}

