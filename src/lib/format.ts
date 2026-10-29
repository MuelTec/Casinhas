/** Utilitários de formatação (moeda, datas e meses) em pt-BR. */

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** Formata um número como Real brasileiro: 1250.5 -> "R$ 1.250,50". */
export function formatarBRL(valor: number): string {
  const negativo = valor < 0;
  const absoluto = Math.abs(valor);
  const [inteiro, decimal] = absoluto.toFixed(2).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}R$ ${comMilhar},${decimal}`;
}

/**
 * Converte um texto digitado pelo usuário em número.
 * Aceita "1.234,56", "1234,56", "1234.56" e "1234".
 */
export function paraNumero(texto: string): number | null {
  const limpo = texto
    .trim()
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // remove ponto de milhar
    .replace(',', '.');
  if (limpo === '' || limpo === '-') return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

/** Valida se uma string é uma data ISO válida (YYYY-MM-DD). */
export function eDataISO(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [a, m, d] = texto.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d;
}

/** Converte 'YYYY-MM-DD' para 'DD/MM/AAAA'. */
export function dataParaBR(iso: string): string {
  if (!eDataISO(iso)) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/**
 * Converte 'DD/MM/AAAA' para 'YYYY-MM-DD'.
 * Retorna null se a data for inválida.
 */
export function brParaData(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Mascara a digitação de uma data: "15102026" -> "15/10/2026". */
export function mascaraData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** Mascara monetária simples: "1234,56" (mantém apenas números e vírgula). */
export function mascaraDinheiro(texto: string): string {
  const t = texto.replace(/[^\d.,]/g, '');
  const partes = t.split(/[,.]/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]},${partes.slice(1).join('').slice(0, 2)}`;
}

/** Chave de mês de uma data ISO: 'YYYY-MM-DD' -> 'YYYY-MM'. */
export function chaveMes(iso: string): string {
  return iso.slice(0, 7);
}

/** Chave de mês de hoje. */
export function mesAtual(): string {
  return chaveMes(hojeISO());
}

/** Data de hoje em ISO (fuso local): 'YYYY-MM-DD'. */
export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** Primeiro dia de um mês ('YYYY-MM') em ISO. */
export function inicioDoMes(mes: string): string {
  return `${mes}-01`;
}

/** Último dia de um mês ('YYYY-MM') em ISO. */
export function fimDoMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  const ultimo = new Date(a, m, 0).getDate();
  return `${mes}-${String(ultimo).padStart(2, '0')}`;
}

/** Rótulo legível de um mês: '2026-10' -> 'Outubro de 2026'. */
export function rotuloMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  if (!a || !m || m < 1 || m > 12) return mes;
  const nome = MESES[m - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${a}`;
}

/** Rótulo curto: '2026-10' -> 'out/2026'. */
export function rotuloMesCurto(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  if (!a || !m || m < 1 || m > 12) return mes;
  return `${MESES[m - 1].slice(0, 3)}/${a}`;
}

/** Soma meses a uma chave de mês ('YYYY-MM'). */
export function somarMeses(mes: string, quantidade: number): string {
  const [a, m] = mes.split('-').map(Number);
  const data = new Date(a, m - 1 + quantidade, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/** Dias decorridos entre duas datas ISO (positivo se posterior). */
export function diasEntre(deISO: string, paraISO: string): number {
  const de = new Date(`${deISO}T00:00:00`);
  const para = new Date(`${paraISO}T00:00:00`);
  return Math.round((para.getTime() - de.getTime()) / 86_400_000);
}

/** Formata a data do sistema como relativa: "hoje", "ontem", "em 3 dias", "há 2 dias". */
export function rotuloRelativo(iso: string): string {
  const diff = diasEntre(hojeISO(), iso);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  if (diff === -1) return 'ontem';
  if (diff > 0) return `em ${diff} dias`;
  return `há ${Math.abs(diff)} dias`;
}
