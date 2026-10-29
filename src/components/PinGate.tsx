/** Tela de PIN: criação na primeira execução e bloqueio de acesso. */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

type Modo = 'criar' | 'bloquear';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'apagar'];

export function PinGate({ modo }: { modo: Modo }) {
  const { definirPin, verificarPin, pularCriacaoPin, apagarTudo } = useApp();

  const [etapa, setEtapa] = useState<'digitar' | 'confirmar'>('digitar');
  const [pin, setPin] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;

    const processar = async () => {
      setOcupado(true);
      setErro(null);
      try {
        if (modo === 'criar') {
          if (etapa === 'digitar') {
            setConfirmacao(pin);
            setPin('');
            setEtapa('confirmar');
          } else if (pin === confirmacao) {
            await definirPin(pin);
          } else {
            setErro('Os PINs não coincidem. Tente de novo.');
            setEtapa('digitar');
            setConfirmacao('');
            setPin('');
          }
        } else {
          const correto = await verificarPin(pin);
          if (!correto) {
            setErro('PIN incorreto.');
            setPin('');
          }
        }
      } finally {
        setOcupado(false);
      }
    };

    void processar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const pressionar = (tecla: string) => {
    if (ocupado) return;
    setErro(null);
    if (tecla === 'apagar') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (tecla === '') return;
    setPin((p) => (p.length >= 4 ? p : p + tecla));
  };

  const esqueciPin = () => {
    Alert.alert(
      'Redefinir PIN',
      'Isso apagará os dados guardados neste aparelho.\n\nSe você tiver um backup, poderá importá-lo em Ajustes depois de criar um novo PIN. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Redefinir',
          style: 'destructive',
          onPress: () => {
            void apagarTudo();
          },
        },
      ],
    );
  };

  const titulo =
    modo === 'criar'
      ? etapa === 'digitar'
        ? 'Crie um PIN de 4 dígitos'
        : 'Confirme o PIN escolhido'
      : 'Digite seu PIN';

  const subtitulo =
    modo === 'criar'
      ? etapa === 'digitar'
        ? 'Ele protegerá seus dados de aluguel.'
        : 'Digite novamente para confirmar.'
      : 'Informe o PIN para abrir o aplicativo.';

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.topo}>
        <Text style={estilos.logo}>🏠</Text>
        <Text style={estilos.app}>Casinhas</Text>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.subtitulo}>{subtitulo}</Text>

        <View style={estilos.pontos}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[estilos.ponto, i < pin.length && estilos.pontoCheio]} />
          ))}
        </View>

        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
        {ocupado ? <ActivityIndicator color={colors.primaria} style={estilos.atividade} /> : null}
      </View>

      <View style={estilos.teclado}>
        {TECLAS.map((tecla, indice) => {
          if (tecla === '') {
            return <View key={`vazio-${indice}`} style={estilos.tecla} />;
          }
          return (
            <Pressable
              key={tecla}
              style={({ pressed }) => [estilos.tecla, pressed && estilos.teclaPressionada]}
              onPress={() => pressionar(tecla)}
              android_ripple={{ color: colors.borda, borderless: false }}>
              {tecla === 'apagar' ? (
                <Ionicons name="backspace-outline" size={26} color={colors.texto} />
              ) : (
                <Text style={estilos.numero}>{tecla}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={estilos.rodape}>
        {modo === 'criar' ? (
          <Pressable onPress={pularCriacaoPin} hitSlop={8}>
            <Text style={estilos.link}>Agora não</Text>
          </Pressable>
        ) : (
          <Pressable onPress={esqueciPin} hitSlop={8}>
            <Text style={estilos.link}>Esqueci meu PIN</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.fundo,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  topo: { alignItems: 'center', marginTop: 32 },
  logo: { fontSize: 56 },
  app: { fontSize: 24, fontWeight: '800', color: colors.texto, marginTop: 4 },
  titulo: { fontSize: 18, fontWeight: '700', color: colors.texto, marginTop: 24, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: colors.textoSuave, marginTop: 6, textAlign: 'center' },
  pontos: { flexDirection: 'row', gap: 16, marginTop: 28 },
  ponto: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.borda,
  },
  pontoCheio: { backgroundColor: colors.primaria },
  erro: { color: colors.perigo, marginTop: 14, fontSize: 14, fontWeight: '600' },
  atividade: { marginTop: 12 },
  teclado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  tecla: {
    width: 84,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.cartao,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borda,
  },
  teclaPressionada: { backgroundColor: colors.destaque },
  numero: { fontSize: 28, fontWeight: '600', color: colors.texto },
  rodape: { alignItems: 'center', paddingVertical: 8 },
  link: { color: colors.primaria, fontSize: 15, fontWeight: '600' },
});
