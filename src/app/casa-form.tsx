/** Modal de cadastro/edição de casa. */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Botao } from '@/components/ui';
import { colors, espacamento } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { brParaData, dataParaBR, hojeISO, mascaraData, mascaraDinheiro, paraNumero } from '@/lib/format';

type Erros = Partial<Record<'nome' | 'responsavel' | 'valor' | 'dia' | 'inicio' | 'fim', string>>;

export default function TelaFormularioCasa() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { dados, salvarCasa } = useApp();

  const existente = useMemo(
    () => (id ? dados.casas.find((c) => c.id === id) : undefined),
    [id, dados.casas],
  );

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [endereco, setEndereco] = useState(existente?.endereco ?? '');
  const [responsavel, setResponsavel] = useState(existente?.responsavel ?? '');
  const [telefone, setTelefone] = useState(existente?.telefone ?? '');
  const [valor, setValor] = useState(
    existente ? existente.valorAluguel.toFixed(2).replace('.', ',') : '',
  );
  const [dia, setDia] = useState(existente ? String(existente.diaVencimento) : '5');
  const [inicio, setInicio] = useState(
    existente ? dataParaBR(existente.contratoInicio) : dataParaBR(hojeISO()),
  );
  const [fim, setFim] = useState(existente ? dataParaBR(existente.contratoFim) : '');
  const [ativo, setAtivo] = useState(existente?.ativo ?? true);
  const [erros, setErros] = useState<Erros>({});

  const salvar = () => {
    const novosErros: Erros = {};

    if (!nome.trim()) novosErros.nome = 'Informe um nome para a casa.';
    if (!responsavel.trim()) novosErros.responsavel = 'Informe o responsável pelo imóvel.';

    const valorNumero = paraNumero(valor);
    if (valorNumero === null || valorNumero <= 0) {
      novosErros.valor = 'Informe o valor do aluguel (ex.: 1200,00).';
    }

    const diaNumero = Number(dia);
    if (!Number.isInteger(diaNumero) || diaNumero < 1 || diaNumero > 31) {
      novosErros.dia = 'O dia deve estar entre 1 e 31.';
    }

    const inicioISO = brParaData(inicio);
    if (!inicioISO) novosErros.inicio = 'Data inválida (use DD/MM/AAAA).';

    const fimISO = brParaData(fim);
    if (!fimISO) novosErros.fim = 'Data inválida (use DD/MM/AAAA).';

    if (inicioISO && fimISO && fimISO < inicioISO) {
      novosErros.fim = 'O fim não pode ser anterior ao início.';
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    try {
      salvarCasa({
        id: existente?.id,
        nome: nome.trim(),
        endereco: endereco.trim(),
        responsavel: responsavel.trim(),
        telefone: telefone.trim() || undefined,
        valorAluguel: valorNumero!,
        diaVencimento: diaNumero,
        contratoInicio: inicioISO!,
        contratoFim: fimISO!,
        ativo,
      });
      router.back();
    } catch (erro) {
      Alert.alert(
        'Não foi possível salvar',
        erro instanceof Error ? erro.message : 'Erro inesperado.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existente ? 'Editar casa' : 'Nova casa' }} />
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Campo rotulo="Nome da casa *" erro={erros.nome}>
          <TextInput
            style={estilos.entrada}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex.: Casa da Rua A"
            placeholderTextColor={colors.textoFraco}
            autoCapitalize="words"
          />
        </Campo>

        <Campo rotulo="Endereço">
          <TextInput
            style={estilos.entrada}
            value={endereco}
            onChangeText={setEndereco}
            placeholder="Rua, número, bairro"
            placeholderTextColor={colors.textoFraco}
          />
        </Campo>

        <Campo rotulo="Responsável pelo imóvel *" erro={erros.responsavel}>
          <TextInput
            style={estilos.entrada}
            value={responsavel}
            onChangeText={setResponsavel}
            placeholder="Nome do locatário"
            placeholderTextColor={colors.textoFraco}
            autoCapitalize="words"
          />
        </Campo>

        <Campo rotulo="Telefone (opcional)">
          <TextInput
            style={estilos.entrada}
            value={telefone}
            onChangeText={setTelefone}
            placeholder="(11) 99999-9999"
            placeholderTextColor={colors.textoFraco}
            keyboardType="phone-pad"
          />
        </Campo>

        <View style={estilos.dupla}>
          <Campo rotulo="Valor do aluguel (R$) *" erro={erros.valor} style={estilos.flex}>
            <TextInput
              style={estilos.entrada}
              value={valor}
              onChangeText={(v) => setValor(mascaraDinheiro(v))}
              placeholder="0,00"
              placeholderTextColor={colors.textoFraco}
              keyboardType="decimal-pad"
            />
          </Campo>

          <Campo rotulo="Dia do vencimento *" erro={erros.dia} style={estilos.flex}>
            <TextInput
              style={estilos.entrada}
              value={dia}
              onChangeText={(v) => setDia(v.replace(/\D/g, '').slice(0, 2))}
              placeholder="5"
              placeholderTextColor={colors.textoFraco}
              keyboardType="number-pad"
            />
          </Campo>
        </View>

        <View style={estilos.dupla}>
          <Campo rotulo="Início do contrato *" erro={erros.inicio} style={estilos.flex}>
            <TextInput
              style={estilos.entrada}
              value={inicio}
              onChangeText={(v) => setInicio(mascaraData(v))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.textoFraco}
              keyboardType="number-pad"
            />
          </Campo>

          <Campo rotulo="Fim do contrato *" erro={erros.fim} style={estilos.flex}>
            <TextInput
              style={estilos.entrada}
              value={fim}
              onChangeText={(v) => setFim(mascaraData(v))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.textoFraco}
              keyboardType="number-pad"
            />
          </Campo>
        </View>

        <View style={estilos.linhaSwitch}>
          <View style={estilos.flex}>
            <Text style={estilos.rotulo}>Imóvel alugado</Text>
            <Text style={estilos.ajuda}>
              Desligue quando a casa ficar vaga ou o contrato encerrar.
            </Text>
          </View>
          <Switch
            value={ativo}
            onValueChange={setAtivo}
            trackColor={{ true: colors.primaria, false: colors.borda }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Botao titulo={existente ? 'Salvar alterações' : 'Adicionar casa'} icone="save-outline" onPress={salvar} style={estilos.botaoSalvar} />
        <Botao titulo="Cancelar" variante="secundaria" onPress={() => router.back()} style={estilos.botaoCancelar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({
  rotulo,
  erro,
  children,
  style,
}: {
  rotulo: string;
  erro?: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[estilos.campo, style]}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      {children}
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.fundo },
  conteudo: { padding: espacamento.lg, paddingBottom: 48, gap: espacamento.md },
  campo: { gap: 6 },
  flex: { flex: 1 },
  dupla: { flexDirection: 'row', gap: espacamento.md },
  rotulo: { fontSize: 13, fontWeight: '700', color: colors.textoSuave },
  ajuda: { fontSize: 12, color: colors.textoFraco, marginTop: 2 },
  entrada: {
    backgroundColor: colors.cartao,
    borderWidth: 1.5,
    borderColor: colors.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.texto,
  },
  erro: { fontSize: 12.5, color: colors.perigo, fontWeight: '600' },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.md,
    backgroundColor: colors.cartao,
    borderWidth: 1,
    borderColor: colors.borda,
    borderRadius: 12,
    padding: espacamento.lg,
    marginTop: 4,
  },
  botaoSalvar: { marginTop: espacamento.sm },
  botaoCancelar: { marginTop: 4 },
});
