# 🏠 Casinhas — controle de aluguéis

Aplicativo para **iOS e Android** (um único código, React Native + Expo) para acompanhar
financeiramente as casas de aluguel: quem é o responsável, quanto é o aluguel, quando o
contrato termina e o que já foi recebido mês a mês.

## ▶️ Usar agora (sem instalar nada)

O app está publicado como site. Abra no navegador (no iPhone, use o **Safari**):

**👉 <https://mueltec.github.io/Casinhas/>**

- **iPhone**: abra o link no Safari → toque em **Compartilhar** → **Adicionar à Tela de
  Início**. Vira um app com ícone próprio, em tela cheia.
- **Android/desktop**: abra o link normalmente. No Chrome, menu ⋮ → *Instalar app* /
  *Adicionar à tela inicial*.

> ⚠️ **iPhone (iOS)**: o Safari pode **apagar os dados** de sites na tela de início se você
> não abrir o app por uns **7 dias**. Use sempre **Ajustes → Criar backup** e guarde o
> arquivo `.json` — assim nunca perde nada. Para voltar, é só importar em
> **Ajustes → Restaurar backup**.

## Funcionalidades

- **Casas ilimitadas**: adicionar e remover casas, cada uma com
  - nome e endereço
  - responsável pelo imóvel (locatário) + telefone (botão "Ligar")
  - valor do aluguel
  - dia do vencimento
  - início e **fim do contrato**
- **Resumo financeiro do mês**: previsto, recebido, a receber e em atraso
- **Histórico de pagamentos**: marque cada aluguel como pago (com data) ou desfaça;
  o app calcula automaticamente quem está **pendente** e quem está **em atraso**
- **Alertas de contrato**: lista os contratos que terminam nos próximos 60 dias
- **Backup**:
  - *Criar backup* → gera um arquivo `backup-casinhas-DD-MM-AAAA-HHMM.json` e abre a
    folha de compartilhamento (WhatsApp, e-mail, Google Drive, Arquivos...)
  - *Restaurar backup* → escolhe um arquivo `.json` e substitui os dados
- **PIN de 4 dígitos** para abrir o aplicativo (com opção de pular, alterar ou remover)
- Os dados ficam **somente no aparelho** (AsyncStorage) — sem nuvem, sem cadastro

## Como testar no celular

1. Instale o **Expo Go** na Play Store (Android) ou App Store (iOS)
2. Na pasta do projeto, rode:

   ```bash
   npx expo start
   ```

3. Escaneie o **QR code** que aparece no terminal com o Expo Go
   - Android: pelo próprio Expo Go
   - iOS: pela câmera do iPhone
   - iPhone e computador precisam estar na **mesma rede Wi-Fi** (senão use
     `npx expo start --tunnel`)

Outros comandos úteis:

```bash
npx expo start --android   # abre no emulador Android
npx expo start --ios       # abre no simulador iOS (macOS)
npx tsc --noEmit           # verifica os tipos
npx eslint .               # verifica o código
npx expo-doctor            # diagnostica o projeto
```

## Como publicar nas lojas (EAS Build)

O Expo compila iOS e Android **na nuvem** — não precisa de Mac nem Android Studio.

```bash
npm install -g eas-cli        # uma única vez
eas login                     # conta gratuita em expo.dev
eas build:configure
eas build --platform android  # gera o .apk/.aab para a Play Store
eas build --platform ios      # gera o .ipa para a App Store (exige conta Apple Developer)
eas submit                    # envia direto para as lojas
```

Guarde o arquivo `.apk` gerado para instalar direto no celular (fora das lojas) também.

## Como atualizar o site publicado

Sempre que você mudar o código e quiser atualizar o endereço
<https://mueltec.github.io/Casinhas/>, rode na pasta do projeto:

```bash
npm run deploy
```

Isso gera a versão web (`expo export`) e envia para o GitHub automaticamente. Em cerca de
1 minuto o site atualizado já está no ar. (Só funciona depois que o `git push` da branch
`main` também foi feito, para o código ficar sincronizado.)

## Estrutura do projeto

```
src/
  app/                # rotas (Expo Router)
    _layout.tsx       # raiz: bloqueio por PIN + pilha
    casa-form.tsx     # modal de cadastro/edição da casa
    (tabs)/
      _layout.tsx     # abas do app
      index.tsx       # Resumo financeiro
      casas.tsx       # lista de casas
      pagamentos.tsx  # pagamentos por mês
      ajustes.tsx     # backup, PIN e dados
  components/         # componentes de UI (PinGate, cartões, botões)
  context/            # estado global (AppContext)
  lib/                # regras de negócio, formatação, storage, backup
  constants/          # tema (cores)
  types.ts            # tipos compartilhados
```

## Formato do backup

```json
{
  "app": "casinhas",
  "formato": 1,
  "exportadoEm": "2026-10-29T19:00:00.000Z",
  "dados": {
    "casas": [ ... ],
    "pagamentos": { "idCasa|2026-10": { "pago": true, "pagoEm": "2026-10-05" } }
  }
}
```

> O PIN **não** vai no backup (fica protegido no aparelho). Se você esquecer o PIN,
> a redefinição apaga os dados do aparelho — restaure um backup em *Ajustes* depois.
