/** Estado global do aplicativo: casas, pagamentos, PIN e backup. */

import * as Crypto from 'expo-crypto';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

import {
  baixarBackupWeb,
  compartilharBackup,
  criarArquivoBackup,
  escolherEValidarBackup,
} from '@/lib/backup';
import { chaveMes, hojeISO } from '@/lib/format';
import { ePinValido, gerarHashPin } from '@/lib/pin';
import {
  apagarTudo as apagarTudoStorage,
  carregarDados,
  carregarPin,
  carregarPinPulado,
  dadosVazios,
  salvarDados,
  salvarPin,
  salvarPinPulado,
} from '@/lib/storage';
import type { AppData, Casa, PagamentosMap } from '@/types';
import { chavePagamento } from '@/types';
import type { ResultadoImportacao } from '@/lib/backup';

/** Dados informados no formulário da casa (id ausente = nova casa). */
export type CasaInput = {
  id?: string;
  nome: string;
  endereco: string;
  responsavel: string;
  telefone?: string;
  valorAluguel: number;
  diaVencimento: number;
  contratoInicio: string;
  contratoFim: string;
  ativo?: boolean;
};

type ContextoValor = {
  carregando: boolean;
  dados: AppData;
  pinHash: string | null;
  precisaCriarPin: boolean;
  bloqueado: boolean;
  salvarCasa: (input: CasaInput) => void;
  removerCasa: (id: string) => void;
  marcarPago: (idCasa: string, mes: string, valorPago?: number) => void;
  desmarcarPagamento: (idCasa: string, mes: string) => void;
  exportarBackup: () => Promise<string>;
  importarBackup: () => Promise<ResultadoImportacao>;
  aplicarImportacao: (dados: AppData) => void;
  definirPin: (pin: string) => Promise<void>;
  alterarPin: (atual: string, novo: string) => Promise<boolean>;
  removerPin: (atual: string) => Promise<boolean>;
  verificarPin: (pin: string) => Promise<boolean>;
  pularCriacaoPin: () => void;
  apagarTudo: () => Promise<void>;
};

const AppContexto = createContext<ContextoValor | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<AppData>(dadosVazios);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [pinPulado, setPinPulado] = useState(false);

  // Carrega dados e PIN na abertura do app.
  useEffect(() => {
    let ativo = true;
    (async () => {
      const [dadosSalvos, hashSalvo, puladoSalvo] = await Promise.all([
        carregarDados(),
        carregarPin(),
        carregarPinPulado(),
      ]);
      if (!ativo) return;
      setDados(dadosSalvos);
      setPinHash(hashSalvo);
      setPinPulado(puladoSalvo);
      setBloqueado(hashSalvo !== null);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Persiste os dados sempre que mudam (e ignora o carregamento inicial).
  useEffect(() => {
    if (carregando) return;
    salvarDados(dados).catch(() => {
      // Falha de gravação não interrompe o uso; a próxima ação tenta de novo.
    });
  }, [dados, carregando]);

  const salvarCasa = useCallback((input: CasaInput) => {
    setDados((prev) => {
      const agora = new Date().toISOString();
      if (input.id) {
        const casas = prev.casas.map((c) =>
          c.id === input.id
            ? {
                ...c,
                nome: input.nome,
                endereco: input.endereco,
                responsavel: input.responsavel,
                telefone: input.telefone,
                valorAluguel: input.valorAluguel,
                diaVencimento: input.diaVencimento,
                contratoInicio: input.contratoInicio,
                contratoFim: input.contratoFim,
                ativo: input.ativo ?? c.ativo,
              }
            : c,
        );
        return { ...prev, casas, atualizadoEm: agora };
      }
      const nova: Casa = {
        id: Crypto.randomUUID(),
        nome: input.nome,
        endereco: input.endereco,
        responsavel: input.responsavel,
        telefone: input.telefone,
        valorAluguel: input.valorAluguel,
        diaVencimento: input.diaVencimento,
        contratoInicio: input.contratoInicio,
        contratoFim: input.contratoFim,
        ativo: input.ativo ?? true,
        criadoEm: agora,
      };
      return { ...prev, casas: [...prev.casas, nova], atualizadoEm: agora };
    });
  }, []);

  const removerCasa = useCallback((id: string) => {
    setDados((prev) => {
      const pagamentos: PagamentosMap = {};
      for (const [chave, registro] of Object.entries(prev.pagamentos)) {
        if (!chave.startsWith(`${id}|`)) pagamentos[chave] = registro;
      }
      return {
        ...prev,
        casas: prev.casas.filter((c) => c.id !== id),
        pagamentos,
        atualizadoEm: new Date().toISOString(),
      };
    });
  }, []);

  const marcarPago = useCallback((idCasa: string, mes: string, valorPago?: number) => {
    setDados((prev) => {
      const casa = prev.casas.find((c) => c.id === idCasa);
      if (!casa) return prev;
      const valor = valorPago ?? casa.valorAluguel;
      return {
        ...prev,
        pagamentos: {
          ...prev.pagamentos,
          [chavePagamento(idCasa, mes)]: { pago: true, pagoEm: hojeISO(), valorPago: valor },
        },
        atualizadoEm: new Date().toISOString(),
      };
    });
  }, []);

  const desmarcarPagamento = useCallback((idCasa: string, mes: string) => {
    setDados((prev) => {
      const pagamentos = { ...prev.pagamentos };
      delete pagamentos[chavePagamento(idCasa, mes)];
      return { ...prev, pagamentos, atualizadoEm: new Date().toISOString() };
    });
  }, []);

  const exportarBackup = useCallback(async (): Promise<string> => {
    if (Platform.OS === 'web') {
      return baixarBackupWeb(dados);
    }
    const { uri, nome } = await criarArquivoBackup(dados);
    await compartilharBackup(uri);
    return nome;
  }, [dados]);

  const importarBackup = useCallback(async (): Promise<ResultadoImportacao> => {
    return escolherEValidarBackup();
  }, []);

  const aplicarImportacao = useCallback((novosDados: AppData) => {
    setDados({ ...novosDados, atualizadoEm: new Date().toISOString() });
  }, []);

  const definirPin = useCallback(async (pin: string) => {
    if (!ePinValido(pin)) throw new Error('O PIN deve ter 4 dígitos.');
    const hash = await gerarHashPin(pin);
    await salvarPin(hash);
    await salvarPinPulado(false);
    setPinHash(hash);
    setPinPulado(false);
    setBloqueado(false);
  }, []);

  const verificarPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!pinHash || !ePinValido(pin)) return false;
      const hash = await gerarHashPin(pin);
      const correto = hash === pinHash;
      if (correto) setBloqueado(false);
      return correto;
    },
    [pinHash],
  );

  const alterarPin = useCallback(
    async (atual: string, novo: string): Promise<boolean> => {
      if (!ePinValido(novo)) throw new Error('O novo PIN deve ter 4 dígitos.');
      const hashAtual = await gerarHashPin(atual);
      if (hashAtual !== pinHash) return false;
      const hashNovo = await gerarHashPin(novo);
      await salvarPin(hashNovo);
      setPinHash(hashNovo);
      return true;
    },
    [pinHash],
  );

  const removerPin = useCallback(async (atual: string): Promise<boolean> => {
    const hashAtual = await gerarHashPin(atual);
    if (hashAtual !== pinHash) return false;
    await salvarPin(null);
    // Quem removeu o PIN de propósito não deve ser incomodado de novo.
    await salvarPinPulado(true);
    setPinHash(null);
    setPinPulado(true);
    return true;
  }, [pinHash]);

  const pularCriacaoPin = useCallback(() => {
    setPinPulado(true);
    setBloqueado(false);
    salvarPinPulado(true).catch(() => {
      // Sem persistência do aviso, o app apenas perguntará de novo.
    });
  }, []);

  const apagarTudo = useCallback(async () => {
    await apagarTudoStorage();
    setDados(dadosVazios());
    setPinHash(null);
    setBloqueado(false);
    setPinPulado(false);
  }, []);

  const precisaCriarPin = !carregando && pinHash === null && !pinPulado;

  const valor = useMemo<ContextoValor>(
    () => ({
      carregando,
      dados,
      pinHash,
      precisaCriarPin,
      bloqueado,
      salvarCasa,
      removerCasa,
      marcarPago,
      desmarcarPagamento,
      exportarBackup,
      importarBackup,
      aplicarImportacao,
      definirPin,
      alterarPin,
      removerPin,
      verificarPin,
      pularCriacaoPin,
      apagarTudo,
    }),
    [
      carregando,
      dados,
      pinHash,
      precisaCriarPin,
      bloqueado,
      salvarCasa,
      removerCasa,
      marcarPago,
      desmarcarPagamento,
      exportarBackup,
      importarBackup,
      aplicarImportacao,
      definirPin,
      alterarPin,
      removerPin,
      verificarPin,
      pularCriacaoPin,
      apagarTudo,
    ],
  );

  return <AppContexto.Provider value={valor}>{children}</AppContexto.Provider>;
}

export function useApp(): ContextoValor {
  const ctx = useContext(AppContexto);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>.');
  return ctx;
}

/** Atalho para o mês corrente usado pelas telas. */
export function mesDeHoje(): string {
  return chaveMes(hojeISO());
}
