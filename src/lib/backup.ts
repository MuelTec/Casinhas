/** Exportação e importação de backup em arquivo JSON. */

import { Platform } from 'react-native';

import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import type { AppData } from '@/types';
import { normalizarDados } from '@/lib/storage';

const IDENTIFICADOR = 'casinhas';
const FORMATO = 1;

export type BackupExportado = { uri: string; nome: string };

export type ResultadoImportacao =
  | { ok: true; dados: AppData; quantidadeCasas: number; quantidadePagamentos: number }
  | { ok: false; cancelado?: boolean; mensagem: string };

/** Nome padronizado do arquivo de backup. */
function nomeArquivoBackup(): string {
  const agora = new Date();
  const dd = String(agora.getDate()).padStart(2, '0');
  const mm = String(agora.getMonth() + 1).padStart(2, '0');
  const aaaa = agora.getFullYear();
  const hh = String(agora.getHours()).padStart(2, '0');
  const min = String(agora.getMinutes()).padStart(2, '0');
  return `backup-casinhas-${dd}-${mm}-${aaaa}-${hh}${min}.json`;
}

/** Monta o conteúdo do arquivo de backup (JSON legível). */
export function conteudoBackup(dados: AppData): string {
  return JSON.stringify(
    {
      app: IDENTIFICADOR,
      formato: FORMATO,
      exportadoEm: new Date().toISOString(),
      dados: {
        casas: dados.casas,
        pagamentos: dados.pagamentos,
        atualizadoEm: dados.atualizadoEm,
      },
    },
    null,
    2,
  );
}

/** Cria o arquivo de backup no cache do app e devolve o caminho. */
export async function criarArquivoBackup(dados: AppData): Promise<BackupExportado> {
  const nome = nomeArquivoBackup();

  const arquivo = new File(Paths.cache, nome);
  if (arquivo.exists) {
    arquivo.delete();
  }
  arquivo.create({ overwrite: true });
  await arquivo.write(conteudoBackup(dados));

  return { uri: arquivo.uri, nome };
}

/**
 * No navegador (teste/uso em PC), não há folha de compartilhamento:
 * baixa o .json direto para a pasta de downloads.
 */
export function baixarBackupWeb(dados: AppData): string {
  if (Platform.OS !== 'web') {
    throw new Error('Este modo de backup é apenas para o navegador.');
  }
  const nome = nomeArquivoBackup();
  const conteudo = conteudoBackup(dados);
  const blob = new Blob([conteudo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
  return nome;
}

/** Abre a folha de compartilhamento do sistema (WhatsApp, e-mail, Drive...). */
export async function compartilharBackup(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste dispositivo.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Enviar backup do Casinhas',
    UTI: 'public.json',
  });
}

/** Lê e valida um arquivo de backup escolhido pelo usuário. */
export async function escolherEValidarBackup(): Promise<ResultadoImportacao> {
  const resultado = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: '*/*',
  });

  if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
    return { ok: false, cancelado: true, mensagem: 'Seleção cancelada.' };
  }

  const asset = resultado.assets[0];

  let texto: string;
  try {
    // No navegador o próprio objeto File do browser já tem o conteúdo.
    texto = asset.file ? await asset.file.text() : await new File(asset.uri).text();
  } catch {
    return { ok: false, mensagem: 'Não foi possível ler o arquivo escolhido.' };
  }

  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, mensagem: 'O arquivo não é um backup válido (JSON ilegível).' };
  }

  const conteudo = extrairDados(bruto);
  if (!conteudo) {
    return {
      ok: false,
      mensagem: 'O arquivo não parece ser um backup do aplicativo Casinhas.',
    };
  }

  const dados = normalizarDados(conteudo);
  if (dados.casas.length === 0 && Object.keys(dados.pagamentos).length === 0) {
    return { ok: false, mensagem: 'O backup está vazio (nenhuma casa encontrada).' };
  }

  return {
    ok: true,
    dados,
    quantidadeCasas: dados.casas.length,
    quantidadePagamentos: Object.keys(dados.pagamentos).length,
  };
}

/** Aceita tanto o formato do app ({ app, dados }) quanto o formato cru ({ casas }). */
function extrairDados(bruto: unknown): Partial<AppData> | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const obj = bruto as Record<string, unknown>;

  if (obj.app === IDENTIFICADOR && obj.dados && typeof obj.dados === 'object') {
    return obj.dados as Partial<AppData>;
  }
  if (Array.isArray(obj.casas)) {
    return obj as Partial<AppData>;
  }
  return null;
}
