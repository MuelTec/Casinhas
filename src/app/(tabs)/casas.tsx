/** Aba Casas: lista dos imóveis com acesso a editar/remover. */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Botao, Cartao, Etiqueta } from '@/components/ui';
import { colors, espacamento } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { diasParaFimContrato, statusContrato, statusPagamento } from '@/lib/finance';
import { dataParaBR, formatarBRL, mesAtual, rotuloRelativo } from '@/lib/format';
import type { Casa } from '@/types';

export default function TelaCasas() {
  const { dados, removerCasa } = useApp();
  const router = useRouter();
  const mes = mesAtual();

  const casas = useMemo(
    () => [...dados.casas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [dados.casas],
  );

  const confirmarRemocao = (casa: Casa) => {
    Alert.alert(
      'Remover casa',
      `Deseja remover "${casa.nome}"? Os pagamentos registrados desta casa também serão apagados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removerCasa(casa.id) },
      ],
    );
  };

  if (casas.length === 0) {
    return (
      <View style={estilos.vazio}>
        <Text style={estilos.vazioEmoji}>🏠</Text>
        <Text style={estilos.vazioTitulo}>Sem casas ainda</Text>
        <Text style={estilos.vazioTexto}>
          Toque no botão abaixo para cadastrar a sua primeira casa de aluguel.
        </Text>
        <Botao
          titulo="Adicionar casa"
          icone="add"
          onPress={() => router.push('/casa-form')}
          style={estilos.botaoVazio}
        />
      </View>
    );
  }

  return (
    <View style={estilos.tela}>
      <FlatList
        data={casas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <Text style={estilos.contador}>
            {casas.length} {casas.length === 1 ? 'casa cadastrada' : 'casas cadastradas'}
          </Text>
        }
        renderItem={({ item }) => (
          <ItemCasa
            casa={item}
            mes={mes}
            pagamentos={dados.pagamentos}
            aoEditar={() =>
              router.push({ pathname: '/casa-form', params: { id: item.id } })
            }
            aoRemover={() => confirmarRemocao(item)}
          />
        )}
      />

      <Pressable
        style={({ pressed }) => [estilos.fab, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/casa-form')}
        android_ripple={{ color: '#FFFFFF33', borderless: true }}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function ItemCasa({
  casa,
  mes,
  pagamentos,
  aoEditar,
  aoRemover,
}: {
  casa: Casa;
  mes: string;
  pagamentos: ReturnType<typeof useApp>['dados']['pagamentos'];
  aoEditar: () => void;
  aoRemover: () => void;
}) {
  const status = statusContrato(casa);
  const dias = diasParaFimContrato(casa);
  const pagamentoMes = statusPagamento(casa, mes, pagamentos);

  const etiquetaContrato =
    status === 'encerrado'
      ? { texto: 'Contrato encerrado', tom: 'perigo' as const }
      : status === 'a_vencer'
        ? { texto: `Encerra ${rotuloRelativo(casa.contratoFim)}`, tom: 'aviso' as const }
        : { texto: 'Contrato ativo', tom: 'sucesso' as const };

  const podeLigar = !!casa.telefone && casa.telefone.replace(/\D/g, '').length >= 10;

  return (
    <Cartao style={estilos.cartao}>
      <Pressable onPress={aoEditar}>
        <View style={estilos.cabecalho}>
          <View style={estilos.flex}>
            <Text style={estilos.nome}>{casa.nome}</Text>
            {casa.endereco ? <Text style={estilos.endereco}>{casa.endereco}</Text> : null}
          </View>
          <Etiqueta texto={etiquetaContrato.texto} tom={etiquetaContrato.tom} />
        </View>

        <View style={estilos.linhaResponsavel}>
          <Text style={estilos.responsavel}>👤 {casa.responsavel}</Text>
          {podeLigar ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${casa.telefone!.replace(/\D/g, '')}`)}
              hitSlop={8}
              style={estilos.botaoLigar}>
              <Ionicons name="call-outline" size={14} color={colors.primaria} />
              <Text style={estilos.textoLigar}>Ligar</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={estilos.divisor} />

        <View style={estilos.linhas}>
          <Text style={estilos.rotulo}>Aluguel</Text>
          <Text style={estilos.valor}>{formatarBRL(casa.valorAluguel)}</Text>
        </View>
        <View style={estilos.linhas}>
          <Text style={estilos.rotulo}>Vencimento</Text>
          <Text style={estilos.valorTexto}>todo dia {casa.diaVencimento}</Text>
        </View>
        <View style={estilos.linhas}>
          <Text style={estilos.rotulo}>Contrato</Text>
          <Text style={estilos.valorTexto}>
            {dataParaBR(casa.contratoInicio)} → {dataParaBR(casa.contratoFim)}
            {status !== 'encerrado' ? ` · ${dias} dia(s) restantes` : ''}
          </Text>
        </View>

        {casa.ativo ? (
          <View style={estilos.linhaPagamento}>
            <Text style={estilos.rotulo}>Pagamento deste mês</Text>
            <Etiqueta
              texto={
                pagamentoMes === 'pago'
                  ? 'Pago'
                  : pagamentoMes === 'atrasado'
                    ? 'Em atraso'
                    : pagamentoMes === 'pendente'
                      ? 'Pendente'
                      : 'Sem contrato'
              }
              tom={
                pagamentoMes === 'pago'
                  ? 'sucesso'
                  : pagamentoMes === 'atrasado'
                    ? 'perigo'
                    : 'neutro'
              }
            />
          </View>
        ) : null}
      </Pressable>

      <View style={estilos.acoes}>
        <Botao titulo="Editar" icone="create-outline" variante="secundaria" onPress={aoEditar} style={estilos.botaoAcao} />
        <Botao titulo="Remover" icone="trash-outline" variante="perigo" onPress={aoRemover} style={estilos.botaoAcao} />
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.fundo },
  lista: { padding: espacamento.lg, paddingBottom: 96, gap: espacamento.md },
  contador: { fontSize: 13, color: colors.textoFraco, marginBottom: 2, fontWeight: '600' },
  cartao: { padding: espacamento.lg, gap: 6 },
  cabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: espacamento.sm },
  flex: { flex: 1 },
  nome: { fontSize: 17, fontWeight: '800', color: colors.texto },
  endereco: { fontSize: 13, color: colors.textoFraco, marginTop: 2 },
  linhaResponsavel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  responsavel: { fontSize: 14, color: colors.textoSuave, fontWeight: '600', flex: 1 },
  botaoLigar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textoLigar: { color: colors.primaria, fontSize: 13, fontWeight: '700' },
  divisor: { height: 1, backgroundColor: colors.borda, marginVertical: 8 },
  linhas: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rotulo: { fontSize: 13, color: colors.textoFraco, fontWeight: '600' },
  valor: { fontSize: 15, fontWeight: '800', color: colors.texto },
  valorTexto: { fontSize: 13, color: colors.texto, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  linhaPagamento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  acoes: { flexDirection: 'row', gap: espacamento.sm, marginTop: 8 },
  botaoAcao: { flex: 1, minHeight: 42, paddingVertical: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.fundo,
  },
  vazioEmoji: { fontSize: 56 },
  vazioTitulo: { fontSize: 20, fontWeight: '800', color: colors.texto, marginTop: 12 },
  vazioTexto: {
    fontSize: 15,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  botaoVazio: { marginTop: 24, alignSelf: 'stretch' },
});
