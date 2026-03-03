import { supabaseClient } from "../client";
import type {
  DashboardData,
  FolhaDePagamentoIaDuplicateRow,
} from "../types";

export async function getDashboardData(): Promise<DashboardData | null> {
  const { data, error } = await supabaseClient
    .from("folha_de_pagamento_ia_duplicate")
    .select("id, dashboard_data")
    .not("dashboard_data", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = (data as FolhaDePagamentoIaDuplicateRow) ?? null;

  return row?.dashboard_data ?? null;
}
