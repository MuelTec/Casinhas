/** Tipos centrais do aplicativo Casinhas. */

/** Imóvel cadastrado. */
export type Casa = {
  id: string;
  nome: string;
  endereco: string;
  responsavel: string;
  telefone?: string;
  /** Valor do aluguel em reais (ex.: 1250.5). */
  valorAluguel: number;
  /** Dia do mês em que o aluguel vence (1–31). */
  diaVencimento: number;
  /** Data de início do contrato no formato ISO 'YYYY-MM-DD'. */
  contratoInicio: string;
  /** Data de término do contrato no formato ISO 'YYYY-MM-DD'. */
  contratoFim: string;
  /** Se o imóvel está sendo alugado (false = vago/encerrado). */
  ativo: boolean;
  /** Data de criação do registro (ISO). */
  criadoEm: string;
};

/** Registro de pagamento de um mês específico. */
export type PagamentoRecord = {
  pago: boolean;
  /** Data em que o pagamento foi efetuado (ISO 'YYYY-MM-DD'). */
  pagoEm?: string;
  /** Valor efetivamente recebido (pode diferir do aluguel cheio). */
  valorPago?: number;
  observacao?: string;
};

/**
 * Mapa de pagamentos. Chave: `${idCasa}|YYYY-MM`
 * (ex.: "abc123|2026-10").
 */
export type PagamentosMap = Record<string, PagamentoRecord>;

/** Dados completos do aplicativo (conteúdo do backup). */
export type AppData = {
  casas: Casa[];
  pagamentos: PagamentosMap;
  atualizadoEm: string;
};

/** Situação do pagamento de uma casa em um mês. */
export type StatusPagamento = 'pago' | 'pendente' | 'atrasado' | 'sem_contrato';

/** Situação do contrato de uma casa. */
export type StatusContrato = 'encerrado' | 'a_vencer' | 'ativo';

/** Chave de um pagamento: casa + mês. */
export function chavePagamento(idCasa: string, mes: string): string {
  return `${idCasa}|${mes}`;
}
