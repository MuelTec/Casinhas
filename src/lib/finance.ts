/** Regras de negócio: contratos, pagamentos e resumos financeiros. */

import type { Casa, PagamentosMap, StatusContrato, StatusPagamento } from '@/types';
import { chavePagamento } from '@/types';
import {
  chaveMes,
  diasEntre,
  fimDoMes,
  hojeISO,
  inicioDoMes,
  mesAtual,
} from '@/lib/format';

/** Retorna o número de dias de um mês ('YYYY-MM'). */
function diasNoMes(mes: string): number {
  const [a, m] = mes.split('-').map(Number);
  return new Date(a, m, 0).getDate();
}

/**
 * Data de vencimento do aluguel em um mês ('YYYY-MM').
 * O dia é ajustado para o último dia do mês quando necessário
 * (ex.: dia 31 em fevereiro -> 28/29).
 */
export function vencimentoNoMes(casa: Casa, mes: string): string {
  const dia = Math.min(casa.diaVencimento, diasNoMes(mes));
  return `${mes}-${String(dia).padStart(2, '0')}`;
}

/** O contrato da casa cobre alguma parte do mês indicado? */
export function contratoCobreMes(casa: Casa, mes: string): boolean {
  return casa.contratoInicio <= fimDoMes(mes) && casa.contratoFim >= inicioDoMes(mes);
}

/** Casas cujo contrato cobre o mês indicado (e que estão ativas). */
export function casasNoMes(casas: Casa[], mes: string): Casa[] {
  return casas.filter((c) => c.ativo && contratoCobreMes(c, mes));
}

/** Situação do pagamento da casa no mês. */
export function statusPagamento(
  casa: Casa,
  mes: string,
  pagamentos: PagamentosMap,
): StatusPagamento {
  if (!contratoCobreMes(casa, mes)) return 'sem_contrato';

  const registro = pagamentos[chavePagamento(casa.id, mes)];
  if (registro?.pago) return 'pago';

  // Pendente enquanto o vencimento não passou; atrasado depois dele.
  const vencimento = vencimentoNoMes(casa, mes);
  return vencimento < hojeISO() ? 'atrasado' : 'pendente';
}

/** Situação do contrato em relação a hoje. */
export function statusContrato(casa: Casa): StatusContrato {
  const hoje = hojeISO();
  if (casa.contratoFim < hoje) return 'encerrado';
  if (casa.contratoFim <= addDias(hoje, 60)) return 'a_vencer';
  return 'ativo';
}

/** Soma dias a uma data ISO. */
function addDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** Resumo financeiro de um mês. */
export type ResumoMes = {
  mes: string;
  /** Quantidade de casas com contrato vigente no mês. */
  quantidadeCasas: number;
  /** Soma dos aluguéis previstos no mês. */
  previsto: number;
  /** Soma dos valores já recebidos no mês. */
  recebido: number;
  /** Previsto ainda não recebido (pendente + atrasado). */
  aReceber: number;
  /** Parte do aReceber cujo vencimento já passou. */
  atrasado: number;
  /** Quantidade de pagamentos em atraso. */
  quantidadeAtrasados: number;
  /** Quantidade de pagamentos pendentes (em dia). */
  quantidadePendentes: number;
};

export function resumoDoMes(casas: Casa[], pagamentos: PagamentosMap, mes: string): ResumoMes {
  const doMes = casasNoMes(casas, mes);

  let previsto = 0;
  let recebido = 0;
  let atrasado = 0;
  let quantidadeAtrasados = 0;
  let quantidadePendentes = 0;

  for (const casa of doMes) {
    previsto += casa.valorAluguel;
    const status = statusPagamento(casa, mes, pagamentos);
    if (status === 'pago') {
      const reg = pagamentos[chavePagamento(casa.id, mes)];
      recebido += reg?.valorPago ?? casa.valorAluguel;
    } else if (status === 'atrasado') {
      atrasado += casa.valorAluguel;
      quantidadeAtrasados += 1;
    } else {
      quantidadePendentes += 1;
    }
  }

  return {
    mes,
    quantidadeCasas: doMes.length,
    previsto,
    recebido,
    aReceber: previsto - recebido,
    atrasado,
    quantidadeAtrasados,
    quantidadePendentes,
  };
}

/** Casas com contrato terminando nos próximos [dias] dias (ou já encerrado). */
export function contratosParaVencer(casas: Casa[], dias: number = 60): Casa[] {
  const hoje = hojeISO();
  const limite = addDias(hoje, dias);
  return casas
    .filter((c) => c.ativo && c.contratoFim <= limite)
    .sort((a, b) => a.contratoFim.localeCompare(b.contratoFim));
}

/** Dias restantes até o fim do contrato (negativo = já encerrou). */
export function diasParaFimContrato(casa: Casa): number {
  return diasEntre(hojeISO(), casa.contratoFim);
}

/** Mês de referência "de hoje" (reexportado para conveniência das telas). */
export { mesAtual, chaveMes };
