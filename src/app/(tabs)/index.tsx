/** Aba Resumo: indicadores financeiros do mês e contratos a vencer. */

import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao, Cartao, Etiqueta } from '@/components/ui';
import { colors, espacamento } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { contratosParaVencer, resumoDoMes } from '@/lib/finance';
import {
  dataParaBR,
  diasEntre,
  formatarBRL,
  hojeISO,
  mesAtual,
  rotuloMes,
} from '@/lib/format';

export default function TelaResumo() {
  const { dados } = useApp();
  const router = useRouter();

  const mes = mesAtual();
  const resumo = useMemo(
    () => resumoDoMes(dados.casas, dados.pagamentos, mes),
    [dados.casas, dados.pagamentos, mes],
  );
  const aVencer = useMemo(() => contratosParaVencer(dados.casas, 60), [dados.casas]);

  if (dados.casas.length === 0) {
    return (
      <View style={estilos.vazio}>
        <Text style={estilos.vazioEmoji}>🏡</Text>
        <Text style={estilos.vazioTitulo}>Nenhuma casa cadastrada</Text>
        <Text style={estilos.vazioTexto}>
          Cadastre suas casinhas para acompanhar os aluguéis, os pagamentos e o fim dos contratos.
        </Text>
        <Botao
          titulo="Cadastrar primeira casa"
          icone="add"
          onPress={() => router.push('/casa-form')}
          style={estilos.botaoVazio}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.mes}>{rotuloMes(mes)}</Text>

      <View style={estilos.grade}>
        <Indicador
          titulo="Previsto no mês"
          valor={formatarBRL(resumo.previsto)}
          subtitulo={`${resumo.quantidadeCasas} ${
            resumo.quantidadeCasas === 1 ? 'casa' : 'casas'
          } com contrato`}
        />
        <Indicador
          titulo="Recebido"
          valor={formatarBRL(resumo.recebido)}
          cor={colors.sucesso}
          subtitulo={
            resumo.previsto > 0
              ? `${Math.round((resumo.recebido / resumo.previsto) * 100)}% do previsto`
              : 'sem previsão'
          }
        />
        <Indicador
          titulo="A receber"
          valor={formatarBRL(resumo.aReceber)}
          cor={colors.primaria}
          subtitulo={`${resumo.quantidadePendentes} pendente(s)`}
        />
        <Indicador
          titulo="Em atraso"
          valor={formatarBRL(resumo.atrasado)}
          cor={colors.perigo}
          subtitulo={
            resumo.quantidadeAtrasados > 0
              ? `${resumo.quantidadeAtrasados} pagamento(s)`
              : 'tudo em dia'
          }
        />
      </View>

      <Text style={estilos.secao}>Contratos a encerrar (60 dias)</Text>

      {aVencer.length === 0 ? (
        <Cartao>
          <Text style={estilos.tudoOk}>👍 Nenhum contrato termina nos próximos 60 dias.</Text>
        </Cartao>
      ) : (
        aVencer.map((casa) => {
          const dias = diasEntre(hojeISO(), casa.contratoFim);
          const encerrado = dias < 0;
          return (
            <Cartao key={casa.id} style={estilos.cartaoContrato}>
              <View style={estilos.linhaContrato}>
                <View style={estilos.flex}>
                  <Text style={estilos.nomeContrato}>{casa.nome}</Text>
                  <Text style={estilos.detalheContrato}>
                    {casa.responsavel} · termina em {dataParaBR(casa.contratoFim)}
                  </Text>
                </View>
                <Etiqueta
                  texto={encerrado ? 'Encerrado' : `Em ${dias} dia(s)`}
                  tom={encerrado ? 'perigo' : 'aviso'}
                />
              </View>
            </Cartao>
          );
        })
      )}

      <View style={estilos.rodape}>
        <Botao
          titulo="Gerar backup agora"
          icone="cloud-upload-outline"
          variante="secundaria"
          onPress={() => router.push('/ajustes')}
        />
      </View>
    </ScrollView>
  );
}

function Indicador({
  titulo,
  valor,
  cor,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  cor?: string;
  subtitulo?: string;
}) {
  return (
    <Cartao style={estilos.indicador}>
      <Text style={estilos.indicadorTitulo}>{titulo}</Text>
      <Text style={[estilos.indicadorValor, cor ? { color: cor } : null]}>{valor}</Text>
      {subtitulo ? <Text style={estilos.indicadorSub}>{subtitulo}</Text> : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: espacamento.lg, paddingBottom: 40, gap: espacamento.md },
  mes: { fontSize: 15, fontWeight: '700', color: colors.textoSuave, marginBottom: 2 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espacamento.md },
  indicador: { flexGrow: 1, flexBasis: '46%', minWidth: 150 },
  indicadorTitulo: { fontSize: 13, color: colors.textoSuave, fontWeight: '600' },
  indicadorValor: { fontSize: 20, fontWeight: '800', color: colors.texto, marginTop: 6 },
  indicadorSub: { fontSize: 12, color: colors.textoFraco, marginTop: 4 },
  secao: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.texto,
    marginTop: espacamento.lg,
    marginBottom: 2,
  },
  cartaoContrato: { paddingVertical: espacamento.md },
  linhaContrato: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm },
  flex: { flex: 1 },
  nomeContrato: { fontSize: 15, fontWeight: '700', color: colors.texto },
  detalheContrato: { fontSize: 13, color: colors.textoSuave, marginTop: 2 },
  tudoOk: { fontSize: 14, color: colors.textoSuave, textAlign: 'center' },
  rodape: { marginTop: espacamento.lg },
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
