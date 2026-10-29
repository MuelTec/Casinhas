/** Aba Ajustes: backup, PIN de acesso e dados do aplicativo. */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Botao, Cartao } from '@/components/ui';
import { colors, espacamento } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { dataParaBR, hojeISO } from '@/lib/format';


type TipoModal = 'criar' | 'alterar' | 'remover' | null;

export default function TelaAjustes() {
  const {
    dados,
    pinHash,
    exportarBackup,
    importarBackup,
    aplicarImportacao,
    apagarTudo,
  } = useApp();

  const [ocupado, setOcupado] = useState<'exportar' | 'importar' | null>(null);
  const [modal, setModal] = useState<TipoModal>(null);

  const exportar = async () => {
    try {
      setOcupado('exportar');
      const nome = await exportarBackup();
      Alert.alert(
        'Backup pronto ✅',
        Platform.OS === 'web'
          ? `Arquivo "${nome}" baixado para a pasta Downloads do computador.`
          : `Arquivo "${nome}" gerado com ${dados.casas.length} casa(s).\n\nEscolha onde guardar: WhatsApp, e-mail, Google Drive, Arquivos etc.`,
      );
    } catch (erro) {
      Alert.alert('Não foi possível exportar', mensagemDeErro(erro));
    } finally {
      setOcupado(null);
    }
  };

  const importar = async () => {
    try {
      setOcupado('importar');
      const resultado = await importarBackup();
      if (!resultado.ok) {
        if (!resultado.cancelado) Alert.alert('Importação', resultado.mensagem);
        return;
      }
      Alert.alert(
        'Backup encontrado',
        `${resultado.quantidadeCasas} casa(s) e ${resultado.quantidadePagamentos} registro(s) de pagamento.\n\nImportar SUBSTITUIRÁ os dados atuais deste aparelho. Deseja continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            style: 'destructive',
            onPress: () => {
              aplicarImportacao(resultado.dados);
              Alert.alert('Importação concluída', 'Os dados do backup foram restaurados.');
            },
          },
        ],
      );
    } catch (erro) {
      Alert.alert('Não foi possível importar', mensagemDeErro(erro));
    } finally {
      setOcupado(null);
    }
  };

  const confirmarApagar = () => {
    Alert.alert(
      'Apagar todos os dados',
      'Isso remove todas as casas, pagamentos e o PIN deste aparelho, sem possibilidade de desfazer.\n\nRecomendamos exportar um backup antes. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => {
            void apagarTudo();
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.secao}>Backup</Text>
      <Cartao style={estilos.cartao}>
        <Linha
          icone="cloud-upload-outline"
          titulo="Criar backup"
          subtitulo="Gera um arquivo .json com casas e pagamentos para você guardar"
          onPress={ocupado ? undefined : exportar}
          carregando={ocupado === 'exportar'}
        />
        <View style={estilos.divisor} />
        <Linha
          icone="cloud-download-outline"
          titulo="Restaurar backup"
          subtitulo="Importa um arquivo de backup gerado anteriormente"
          onPress={ocupado ? undefined : importar}
          carregando={ocupado === 'importar'}
        />
      </Cartao>

      <Text style={estilos.secao}>Segurança</Text>
      <Cartao style={estilos.cartao}>
        {pinHash === null ? (
          <Linha
            icone="key-outline"
            titulo="Criar PIN"
            subtitulo="Protege o aplicativo com 4 dígitos"
            onPress={() => setModal('criar')}
          />
        ) : (
          <>
            <Linha
              icone="key-outline"
              titulo="Alterar PIN"
              subtitulo="Atualize o código de acesso"
              onPress={() => setModal('alterar')}
            />
            <View style={estilos.divisor} />
            <Linha
              icone="key-outline"
              titulo="Remover PIN"
              subtitulo="Abre o aplicativo direto, sem bloqueio"
              onPress={() => setModal('remover')}
            />
          </>
        )}
      </Cartao>

      <Text style={estilos.secao}>Dados</Text>
      <Cartao style={estilos.cartao}>
        <Linha
          icone="trash-outline"
          tom="perigo"
          titulo="Apagar todos os dados"
          subtitulo="Remove casas, pagamentos e PIN deste aparelho"
          onPress={confirmarApagar}
        />
      </Cartao>

      <Text style={estilos.secao}>Sobre</Text>
      <Cartao style={estilos.cartao}>
        <View style={estilos.linhaSobre}>
          <Text style={estilos.rotuloSobre}>Aplicativo</Text>
          <Text style={estilos.valorSobre}>Casinhas</Text>
        </View>
        <View style={estilos.linhaSobre}>
          <Text style={estilos.rotuloSobre}>Versão</Text>
          <Text style={estilos.valorSobre}>1.0.0</Text>
        </View>
        <View style={estilos.linhaSobre}>
          <Text style={estilos.rotuloSobre}>Casas cadastradas</Text>
          <Text style={estilos.valorSobre}>{dados.casas.length}</Text>
        </View>
        <View style={estilos.linhaSobre}>
          <Text style={estilos.rotuloSobre}>Última atualização</Text>
          <Text style={estilos.valorSobre}>
            {dataParaBR((dados.atualizadoEm || hojeISO()).slice(0, 10))}
          </Text>
        </View>
      </Cartao>

      <Text style={estilos.rodape}>
        Seus dados ficam guardados apenas neste aparelho. Faça backup regularmente!
      </Text>

      <ModalPin tipo={modal} aoFechar={() => setModal(null)} />
    </ScrollView>
  );
}

function Linha({
  icone,
  titulo,
  subtitulo,
  tom = 'primaria',
  onPress,
  carregando,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo: string;
  tom?: 'primaria' | 'perigo';
  onPress?: () => void;
  carregando?: boolean;
}) {
  const cor = tom === 'perigo' ? colors.perigo : colors.primaria;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [estilos.linha, pressed && { backgroundColor: colors.destaque }]}>
      <View style={[estilos.iconeCaixa, { backgroundColor: `${cor}1A` }]}>
        <Ionicons name={carregando ? 'hourglass-outline' : icone} size={20} color={cor} />
      </View>
      <View style={estilos.flex}>
        <Text style={[estilos.linhaTitulo, tom === 'perigo' && { color: colors.perigo }]}>
          {titulo}
        </Text>
        <Text style={estilos.linhaSubtitulo}>{subtitulo}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textoFraco} />
    </Pressable>
  );
}

/** Modal com campos do PIN (criar, alterar ou remover). */
function ModalPin({ tipo, aoFechar }: { tipo: TipoModal; aoFechar: () => void }) {
  const { definirPin, alterarPin, removerPin } = useApp();
  const [atual, setAtual] = useState('');
  const [novo, setNovo] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const fechar = () => {
    setAtual('');
    setNovo('');
    setConfirmacao('');
    setErro(null);
    aoFechar();
  };

  const confirmar = async () => {
    setErro(null);
    try {
      setSalvando(true);
      if (tipo === 'criar') {
        if (!/^\d{4}$/.test(novo)) return setErro('Digite um PIN de 4 dígitos.');
        if (novo !== confirmacao) return setErro('A confirmação não coincide.');
        await definirPin(novo);
        Alert.alert('PIN criado', 'O aplicativo pedirá esse PIN ao abrir.');
        fechar();
      } else if (tipo === 'alterar') {
        if (!/^\d{4}$/.test(atual)) return setErro('Digite o PIN atual.');
        if (!/^\d{4}$/.test(novo)) return setErro('Digite um novo PIN de 4 dígitos.');
        if (novo !== confirmacao) return setErro('A confirmação não coincide.');
        const ok = await alterarPin(atual, novo);
        if (!ok) return setErro('O PIN atual está incorreto.');
        Alert.alert('PIN alterado', 'Use o novo PIN na próxima abertura.');
        fechar();
      } else if (tipo === 'remover') {
        if (!/^\d{4}$/.test(atual)) return setErro('Digite o PIN atual.');
        const ok = await removerPin(atual);
        if (!ok) return setErro('O PIN está incorreto.');
        Alert.alert('PIN removido', 'O aplicativo abrirá sem bloqueio.');
        fechar();
      }
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const titulo =
    tipo === 'criar' ? 'Criar PIN' : tipo === 'alterar' ? 'Alterar PIN' : 'Remover PIN';

  return (
    <Modal visible={tipo !== null} transparent animationType="fade" onRequestClose={fechar}>
      <KeyboardAvoidingView
        style={estilos.fundoModal}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={estilos.caixaModal}>
          <Text style={estilos.tituloModal}>{titulo}</Text>

          {tipo !== 'criar' ? (
            <CampoPin rotulo="PIN atual" valor={atual} aoMudar={setAtual} />
          ) : null}
          {tipo !== 'remover' ? (
            <>
              <CampoPin rotulo="Novo PIN (4 dígitos)" valor={novo} aoMudar={setNovo} />
              <CampoPin rotulo="Confirmar novo PIN" valor={confirmacao} aoMudar={setConfirmacao} />
            </>
          ) : null}

          {erro ? <Text style={estilos.erroModal}>{erro}</Text> : null}

          <View style={estilos.botoesModal}>
            <Botao titulo="Cancelar" variante="secundaria" onPress={fechar} style={estilos.botaoModal} />
            <Botao
              titulo="Confirmar"
              variante={tipo === 'remover' ? 'perigo' : 'primaria'}
              onPress={() => void confirmar()}
              carregando={salvando}
              style={estilos.botaoModal}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CampoPin({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotuloCampo}>{rotulo}</Text>
      <TextInput
        style={estilos.entrada}
        value={valor}
        onChangeText={(v) => aoMudar(v.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        placeholder="••••"
        placeholderTextColor={colors.textoFraco}
      />
    </View>
  );
}

function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Erro inesperado. Tente novamente.';
}

const estilos = StyleSheet.create({
  conteudo: { padding: espacamento.lg, paddingBottom: 40 },
  secao: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textoFraco,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: espacamento.lg,
    marginBottom: espacamento.sm,
    marginLeft: 4,
  },
  cartao: { padding: 0, overflow: 'hidden' },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.md,
    padding: espacamento.lg,
  },
  iconeCaixa: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  linhaTitulo: { fontSize: 15, fontWeight: '700', color: colors.texto },
  linhaSubtitulo: { fontSize: 12.5, color: colors.textoSuave, marginTop: 2, lineHeight: 17 },
  divisor: { height: 1, backgroundColor: colors.borda, marginLeft: 68 },
  linhaSobre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: espacamento.lg,
  },
  rotuloSobre: { fontSize: 14, color: colors.textoSuave },
  valorSobre: { fontSize: 14, fontWeight: '700', color: colors.texto },
  rodape: {
    fontSize: 12.5,
    color: colors.textoFraco,
    textAlign: 'center',
    marginTop: espacamento.xl,
    lineHeight: 18,
  },
  fundoModal: {
    flex: 1,
    backgroundColor: '#0F172A99',
    justifyContent: 'center',
    padding: 24,
  },
  caixaModal: {
    backgroundColor: colors.cartao,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  tituloModal: { fontSize: 18, fontWeight: '800', color: colors.texto, marginBottom: 4 },
  campo: { gap: 6 },
  rotuloCampo: { fontSize: 13, fontWeight: '600', color: colors.textoSuave },
  entrada: {
    borderWidth: 1.5,
    borderColor: colors.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    letterSpacing: 8,
    color: colors.texto,
    backgroundColor: colors.fundo,
  },
  erroModal: { color: colors.perigo, fontSize: 13, fontWeight: '600' },
  botoesModal: { flexDirection: 'row', gap: espacamento.sm, marginTop: 6 },
  botaoModal: { flex: 1 },
});
