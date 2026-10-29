/** Criação e verificação do PIN de acesso (hash SHA-256). */

import * as Crypto from 'expo-crypto';

/** Sal fixo do app (o PIN nunca é armazenado em texto puro). */
const SAL = 'casinhas-app-pin-v1';

/** O PIN deve ter exatamente 4 dígitos. */
export function ePinValido(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/** Gera o hash do PIN para armazenamento/comparação. */
export async function gerarHashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${SAL}:${pin}`);
}
