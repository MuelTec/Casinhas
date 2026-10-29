/** Persistência local dos dados e do PIN (AsyncStorage). */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppData, Casa, PagamentosMap } from '@/types';

const CHAVE_DADOS = '@casinhas/dados/v1';
const CHAVE_PIN = '@casinhas/pin/v1';
const CHAVE_PIN_PULADO = '@casinhas/pin-pulado/v1';

/** Dados vazios usados na primeira execução. */
export function dadosVazios(): AppData {
  return { casas: [], pagamentos: {}, atualizadoEm: new Date().toISOString() };
}

/** Carrega os dados salvos; em caso de erro ou arquivo corrompido, retorna vazio. */
export async function carregarDados(): Promise<AppData> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_DADOS);
    if (!bruto) return dadosVazios();
    const parsed = JSON.parse(bruto) as Partial<AppData>;
    return normalizarDados(parsed);
  } catch {
    return dadosVazios();
  }
}

/** Converte um objeto desconhecido em AppData válido (usado também na importação de backup). */
export function normalizarDados(parsed: Partial<AppData> | unknown): AppData {
  const obj = (parsed ?? {}) as Partial<AppData>;
  const casas: Casa[] = Array.isArray(obj.casas)
    ? obj.casas.filter((c): c is Casa => !!c && typeof c === 'object' && typeof c.id === 'string')
    : [];
  const pagamentos: PagamentosMap =
    obj.pagamentos && typeof obj.pagamentos === 'object' && !Array.isArray(obj.pagamentos)
      ? (obj.pagamentos as PagamentosMap)
      : {};
  return {
    casas,
    pagamentos,
    atualizadoEm: typeof obj.atualizadoEm === 'string' ? obj.atualizadoEm : new Date().toISOString(),
  };
}

/** Grava os dados completos. Lança erro se o storage falhar. */
export async function salvarDados(dados: AppData): Promise<void> {
  await AsyncStorage.setItem(CHAVE_DADOS, JSON.stringify(dados));
}

/** Lê o hash do PIN (null = nenhum PIN configurado). */
export async function carregarPin(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CHAVE_PIN);
  } catch {
    return null;
  }
}

/** Grava o hash do PIN. */
export async function salvarPin(hash: string | null): Promise<void> {
  if (hash === null) {
    await AsyncStorage.removeItem(CHAVE_PIN);
  } else {
    await AsyncStorage.setItem(CHAVE_PIN, hash);
  }
}

/** O usuário pulou a criação do PIN? (evita perguntar a cada abertura) */
export async function carregarPinPulado(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CHAVE_PIN_PULADO)) === '1';
  } catch {
    return false;
  }
}

export async function salvarPinPulado(pulado: boolean): Promise<void> {
  if (pulado) {
    await AsyncStorage.setItem(CHAVE_PIN_PULADO, '1');
  } else {
    await AsyncStorage.removeItem(CHAVE_PIN_PULADO);
  }
}

/** Apaga todos os dados (casas, pagamentos e PIN). */
export async function apagarTudo(): Promise<void> {
  await AsyncStorage.multiRemove([CHAVE_DADOS, CHAVE_PIN, CHAVE_PIN_PULADO]);
}
