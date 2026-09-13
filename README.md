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