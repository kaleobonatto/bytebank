Markdown
# Bytebank Mobile App - Tech Challenge Fase 03

Aplicação de gerenciamento financeiro desenvolvida em React Native (Expo) para o Tech Challenge da Pós-Tech Front-End Engineering da FIAP.

## 📋 Sobre o Projeto


Este projeto integra os conhecimentos de navegação, segurança, autenticação e armazenamento em nuvem obtidos ao longo da fase. A aplicação entrega uma experiência mobile completa de controle de finanças pessoais.

## 🚀 Funcionalidades Principais

- **Autenticação:** Sistema de login e cadastro seguro integrado ao Firebase Authentication.
- **Dashboard Financeiro:** Visualização de saldo atualizado, gráficos analíticos (evolução de saldo, fluxo de caixa e distribuição por categorias) com animações fluidas baseadas em Animated.
- **Gestão de Transações:** Cadastro, edição e exclusão de movimentações com validação avançada de formulários e feedback visual de erros.
- **Listagem e Filtros:** Paginação e scroll infinito integrados ao Cloud Firestore, com suporte a busca por texto e filtros avançados por categorias.
- **Comprovantes:** Funcionalidade de anexo de recibos diretamente nas transações.

## 🛠️ Tecnologias e Ferramentas

- **Core:** React Native, Expo, Expo Router
- **Linguagem:** TypeScript
- **Gerenciamento de Estado:** Context API (`AuthContext` e `TransactionContext`)
- **Banco de Dados & Auth:** Firebase (Firestore e Auth)
- **Gráficos:** React Native Gifted Charts e React Native SVG

## ⚙️ Configuração do Firebase

Para facilitar a avaliação deste Tech Challenge, as chaves de acesso ao Firebase do projeto já estão configuradas por padrão no arquivo `src/services/firebase.ts`. A aplicação rodará conectada ao ambiente de testes automaticamente.

**Nota sobre boas práticas:** Em um ambiente de produção real, essas credenciais jamais seriam versionadas no código-fonte. Elas estariam isoladas em variáveis de ambiente (`.env`). 

Caso o avaliador deseje apontar para o seu próprio projeto Firebase, basta seguir os passos abaixo:
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative os serviços de **Authentication**, **Firestore** e **Storage**.
3. Substitua as credenciais no arquivo `src/services/firebase.ts`.


## 📥 Como Rodar o Projeto

1. Clone o repositório em sua máquina:
```bash
   git clone 
   cd bytebank-mobile-app. 
   ```
2. Instale as dependencias necessarias executando:
```bash
   npm install
```
3. Inicie o servidor de desenvolvimento do Expo:
```bash
   npx expo start
```

4. Pressione w para abrir no navegador web, utilize um emulador configurado ou escaneie o QR Code com o aplicativo Expo Go no seu smartphone.