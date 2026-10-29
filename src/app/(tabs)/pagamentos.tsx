/** Aba Pagamentos: marcar recebimentos mês a mês. */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao, Cartao, Etiqueta } from '@/components/ui';
import { colors, espacamento } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { casasNoMes, resumoDoMes, statusPagamento, vencimentoNoMes } from '@/lib/finance';
import { dataParaBR, formatarBRL, mesAtual, rotuloMes, somarMeses } from '@/lib/format';
import { chavePagamento, type Casa, type PagamentosMap } from '@/types';

export default function TelaPagamentos() {
  const { dados, marcarPago, desmarcarPagamento } = useApp();
  const [mes, setMes] = useState(mesAtual());

  const casas = useMemo(() => casasNoMes(dados.casas, mes), [dados.casas, mes]);
  const resumo = useMemo(
    () => resumoDoMes(dados.casas, dados.pagamentos, mes),
    [dados.casas, dados.pagamentos, mes],
  );

  return (
    <View style={estilos.tela}>
      <View style={estilos.seletor}>
        <Pressable
          onPress={() => setMes((m) => somarMeses(m, -1))}
          style={estilos.seta}
          hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.primaria} />
        </Pressable>
        <View style={estilos.meioSeletor}>
          <Text style={estilos.mes}>{rotuloMes(mes)}</Text>
          {mes !== mesAtual() ? (
            <Pressable onPress={() => setMes(mesAtual())} hitSlop={8}>
              <Text style={estilos.voltarHoje}>voltar ao mês atual</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setMes((m) => somarMeses(m, 1))}
          style={estilos.seta}
          hitSlop={8}>
          <Ionicons name="chevron-forward" size={22} color={colors.primaria} />
        </Pressable>
      </View>

      <Cartao style={estilos.resumo}>
        <View style={estilos.colunaResumo}>
          <Text style={estilos.rotuloResumo}>Recebido</Text>
          <Text style={[estilos.valorResumo, { color: colors.sucesso }]}>
            {formatarBRL(resumo.recebido)}
          </Text>
        </View>
        <View style={estilos.separadorResumo} />
        <View style={estilos.colunaResumo}>
          <Text style={estilos.rotuloResumo}>A receber</Text>
          <Text style={[estilos.valorResumo, { color: colors.primaria }]}>
            {formatarBRL(resumo.aReceber)}
          </Text>
        </View>
        <View style={estilos.separadorResumo} />
        <View style={estilos.colunaResumo}>
          <Text style={estilos.rotuloResumo}>Atrasado</Text>
          <Text style={[estilos.valorResumo, { color: colors.perigo }]}>
            {formatarBRL(resumo.atrasado)}
          </Text>
        </View>
      </Cartao>

      <FlatList
        data={casas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <Cartao>
            <Text style={estilos.vazioTexto}>
              Nenhuma casa tem contrato vigente neste mês.
            </Text>
          </Cartao>
        }
        renderItem={({ item }) => (
          <ItemPagamento
            casa={item}
            mes={mes}
            pagamentos={dados.pagamentos}
            aoMarcar={() => marcarPago(item.id, mes)}
            aoDesmarcar={() => desmarcarPagamento(item.id, mes)}
          />
        )}
      />
    </View>
  );
}

function ItemPagamento({
  casa,
  mes,
  pagamentos,
  aoMarcar,
  aoDesmarcar,
}: {
  casa: Casa;
  mes: string;
  pagamentos: PagamentosMap;
  aoMarcar: () => void;
  aoDesmarcar: () => void;
}) {
  const status = statusPagamento(casa, mes, pagamentos);
  const registro = pagamentos[chavePagamento(casa.id, mes)];
  const pago = status === 'pago';

  return (
    <Cartao style={estilos.cartao}>
      <View style={estilos.cabecalhoItem}>
        <View style={estilos.flex}>
          <Text style={estilos.nome}>{casa.nome}</Text>
          <Text style={estilos.responsavel}>{casa.responsavel}</Text>
        </View>
        <Etiqueta
          texto={pago ? 'Pago' : status === 'atrasado' ? 'Atrasado' : 'Pendente'}
          tom={pago ? 'sucesso' : status === 'atrasado' ? 'perigo' : 'aviso'}
        />
      </View>

      <View style={estilos.linhaDetalhe}>
        <Text style={estilos.detalhe}>
          Vence dia {casa.diaVencimento} · {dataParaBR(vencimentoNoMes(casa, mes))}
        </Text>
        <Text style={estilos.valor}>{formatarBRL(casa.valorAluguel)}</Text>
      </View>

      {pago ? (
        <View style={estilos.linhaPago}>
          <Text style={estilos.textoPago}>
            ✅ Recebido {registro?.pagoEm ? dataParaBR(registro.pagoEm) : ''}
            {registro?.valorPago !== undefined && registro.valorPago !== casa.valorAluguel
              ? ` · ${formatarBRL(registro.valorPago)}`
              : ''}
          </Text>
          <Pressable onPress={aoDesmarcar} hitSlop={8}>
            <Text style={estilos.desfazer}>Desfazer</Text>
          </Pressable>
        </View>
      ) : (
        <Botao
          titulo="Marcar como pago"
          icone="checkmark-circle-outline"
          variante="sucesso"
          onPress={aoMarcar}
          style={estilos.botaoPagar}
        />
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.fundo, paddingTop: espacamento.md },
  seletor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.md,
  },
  seta: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.destaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meioSeletor: { alignItems: 'center' },
  mes: { fontSize: 17, fontWeight: '800', color: colors.texto },
  voltarHoje: { fontSize: 12, color: colors.primaria, marginTop: 2 },
  resumo: {
    flexDirection: 'row',
    marginHorizontal: espacamento.lg,
    marginTop: espacamento.md,
    paddingVertical: espacamento.md,
    alignItems: 'center',
  },
  colunaResumo: { flex: 1, alignItems: 'center' },
  separadorResumo: { width: 1, height: 34, backgroundColor: colors.borda },
  rotuloResumo: { fontSize: 12, color: colors.textoFraco, fontWeight: '600' },
  valorResumo: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  lista: { padding: espacamento.lg, paddingBottom: 40, gap: espacamento.md },
  cartao: { gap: 6 },
  cabecalhoItem: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm },
  flex: { flex: 1 },
  nome: { fontSize: 16, fontWeight: '800', color: colors.texto },
  responsavel: { fontSize: 13, color: colors.textoSuave, marginTop: 2 },
  linhaDetalhe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detalhe: { fontSize: 13, color: colors.textoFraco },
  valor: { fontSize: 15, fontWeight: '800', color: colors.texto },
  botaoPagar: { minHeight: 44, marginTop: 4 },
  linhaPago: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  textoPago: { fontSize: 14, color: colors.sucesso, fontWeight: '600' },
  desfazer: { fontSize: 13, color: colors.perigo, fontWeight: '700' },
  vazioTexto: { fontSize: 14, color: colors.textoSuave, textAlign: 'center' },
});
