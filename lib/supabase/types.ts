export interface ComparacaoTotal {
  id: string;
  item: string;
  valor_atual: number;
  valor_cct: number;
  grupo?: string;
}

export interface DashboardData {
  impacto_anual: number;
  grafico_conformidade: GraficoConformidadeSegment[];
}

export interface GraficoConformidadeSegment {
  status: "critico" | "alerta" | "informativo" | "conforme";
  quantidade: number;
  percentual: number;
}

export type DiscrepanciaStatus = "AUSENTE" | "ABAIXO" | "OK" | "EXTRA";

export interface Discrepancia {
  id: string;
  grupo: string;
  item_cct: string;
  item_atual: string;
  valor_cct: number;
  valor_atual: number;
  diferenca: number;
  status: DiscrepanciaStatus;
  severidade?: "baixa" | "media" | "alta" | "critica";
}

export interface FolhaCctTotais {
  liquido: number;
  total_encargos: number;
  total_descontos: number;
  total_proventos: number;
  total_beneficios: number;
  custo_total_empresa: number;
  total_custos_empresa: number;
}

export interface FolhaCctValorItem {
  item: string;
  valor: number;
  clausula?: string;
  destinatario?: string;
}

export interface FolhaAtualProvento {
  item: string;
  valor: number;
  cod_verba?: string;
  tipo_lanc?: string;
  referencia?: number;
}

export interface FolhaAtual {
  proventos?: FolhaAtualProvento[];
  descontos?: { item: string; valor: number }[];
  encargos?: { item: string; valor: number; cod_verba?: string }[];
  // Outros campos da folha atual podem existir, mas não são usados aqui.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface FolhaCctContratoDiscrepanciaItem {
  item: string;
  tipo: string;
  diferenca: number;
  valor_cct: number;
  valor_contrato: number;
  severidade?: string;
  descricao?: string;
}

export interface FolhaCctContratoDiscrepanciasResumo {
  alertas: number;
  criticas: number;
  conformidade: string;
  informativas: number;
  total_discrepancias: number;
}

export interface FolhaCct {
  totais: FolhaCctTotais;
  encargos: FolhaCctValorItem[];
  descontos: FolhaCctValorItem[];
  proventos: FolhaCctValorItem[];
  beneficios: FolhaCctValorItem[];
  custos_empresa: FolhaCctValorItem[];
}

export interface FolhaCctContrato {
  folha_cct?: FolhaCct;
  folha_atual?: FolhaAtual;
  discrepancias?: {
    itens: FolhaCctContratoDiscrepanciaItem[];
    resumo?: FolhaCctContratoDiscrepanciasResumo;
  };
  competencia?: string;
}

export interface FolhaDePagamentoIaDuplicateRow {
  id: string;
  comparacao_totais: ComparacaoTotal[] | null;
  dashboard_data: DashboardData | null;
  discrepancias: Discrepancia[] | null;
  folha_cct_contrato?: FolhaCctContrato | null;
  folha_atual?: FolhaAtual | null;
  nome?: string;
  funcao?: string;
  cpf?: string;
  matricula?: string;
  competencia?: string;
  created_at?: string;
}

