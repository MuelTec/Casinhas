/** Componentes de UI reutilizados pelas telas. */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, espacamento } from '@/constants/theme';

type Tom = 'sucesso' | 'aviso' | 'perigo' | 'neutro' | 'primaria';

const TOMS: Record<Tom, { fundo: string; texto: string }> = {
  sucesso: { fundo: '#DCFCE7', texto: '#15803D' },
  aviso: { fundo: '#FEF3C7', texto: '#B45309' },
  perigo: { fundo: '#FEE2E2', texto: '#B91C1C' },
  neutro: { fundo: '#F1F5F9', texto: '#475569' },
  primaria: { fundo: '#DBEAFE', texto: '#1D4ED8' },
};

/** Cartão branco com borda e sombra suave. */
export function Cartao({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[estilos.cartao, style]}>{children}</View>;
}

/** Etiqueta (pill) com cor de fundo. */
export function Etiqueta({ texto, tom }: { texto: string; tom: Tom }) {
  const cores = TOMS[tom];
  return (
    <Text style={[estilos.etiqueta, { backgroundColor: cores.fundo, color: cores.texto }]}>
      {texto}
    </Text>
  );
}

/** Botão com variantes primária, secundária e perigo. */
export function Botao({
  titulo,
  onPress,
  variante = 'primaria',
  icone,
  desabilitado,
  carregando,
  style,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primaria' | 'secundaria' | 'perigo' | 'sucesso';
  icone?: keyof typeof Ionicons.glyphMap;
  desabilitado?: boolean;
  carregando?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fundos = {
    primaria: colors.primaria,
    secundaria: colors.cartao,
    perigo: colors.perigo,
    sucesso: colors.sucesso,
  } as const;
  const textos = {
    primaria: '#FFFFFF',
    secundaria: colors.primaria,
    perigo: '#FFFFFF',
    sucesso: '#FFFFFF',
  } as const;

  const ativo = !desabilitado && !carregando;

  return (
    <Pressable
      onPress={onPress}
      disabled={!ativo}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: fundos[variante] },
        variante === 'secundaria' && estilos.botaoSecundario,
        !ativo && estilos.botaoDesabilitado,
        pressed && ativo && estilos.botaoPressionado,
        style,
      ]}>
      {carregando ? (
        <ActivityIndicator color={textos[variante]} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={18} color={textos[variante]} /> : null}
          <Text style={[estilos.botaoTexto, { color: textos[variante] }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: colors.cartao,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borda,
    padding: espacamento.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacamento.sm,
    minHeight: 48,
    paddingHorizontal: espacamento.lg,
    borderRadius: 12,
    paddingVertical: espacamento.md,
  },
  botaoSecundario: {
    borderWidth: 1.5,
    borderColor: colors.primaria,
  },
  botaoDesabilitado: { opacity: 0.55 },
  botaoPressionado: { opacity: 0.85 },
  botaoTexto: { fontSize: 16, fontWeight: '700' },
});
