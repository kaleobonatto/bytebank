# Bytebank Mobile App - Tech Challenge Fase 04



Aplicação de gerenciamento financeiro desenvolvida em React Native (Expo) para o Tech Challenge da Pós-Tech Front-End Engineering da FIAP.



## 📋 Sobre o Projeto



Este projeto integra os conhecimentos de navegação, segurança, autenticação, armazenamento em nuvem, arquitetura limpa e otimização de performance obtidos ao longo das Fases 03 e 04. A aplicação entrega uma experiência mobile completa de controle de finanças pessoais, com foco em escalabilidade, modularidade e proteção de dados.



## 🚀 Funcionalidades Principais



- **Autenticação Segura:** Sistema de login, cadastro e logout ativo integrado ao Firebase Authentication, com persistência de sessão nativa (`AsyncStorage`) e proteção de rotas (`AuthGuard`).

- **Dashboard Financeiro:** Visualização de saldo atualizado e gráficos analíticos (evolução de saldo, fluxo de caixa e distribuição por categorias) com animações fluidas baseadas em `Animated` e carregamento sob demanda.

- **Gestão de Transações:** Cadastro, edição e exclusão de movimentações com validação de formulários e feedback visual de erros.

- **Listagem e Filtros Reativos:** Paginação e scroll infinito integrados ao Cloud Firestore, com suporte a busca por texto com debounce reativo e filtros por categorias.

- **Comprovantes em Nuvem:** Upload real de recibos diretamente para o Firebase Storage, vinculados às transações.



## 🏗️ Evoluções da Fase 04 (Arquitetura, Performance e Segurança)



Para atender aos requisitos avançados da Fase 04, a aplicação passou pelas seguintes melhorias estruturais:



- **Clean Architecture & Modularização:** Separação estrita entre as camadas `domain` (entidades e contratos de repositório), `infrastructure` (implementações do Firebase, cache e criptografia) e `presentation` (telas, componentes e stores), com fronteiras protegidas via regra `no-restricted-imports` no ESLint.

- **State Management Avançado:** Substituição do `TransactionContext` pelo **Zustand** (`useTransactionStore`), centralizando o estado das transações e evitando re-renderizações desnecessárias.

- **Cache Local Criptografado (AES-GCM):** Implementação do `CachedTransactionRepository` (padrão *Decorator* com estratégia *stale-while-revalidate*), armazenando os dados no dispositivo cifrados com **AES-GCM** (`@noble/ciphers` + `expo-crypto`) para carregamento instantâneo e proteção de dados sensíveis.

- **Programação Reativa:** Utilização de **RxJS** (`BehaviorSubject`, `debounceTime` e `distinctUntilChanged`) na busca de transações para manter a interface responsiva durante a digitação.

- **Lazy Loading & Pré-carregamento:** Carregamento assíncrono dos gráficos na tela inicial via `React.lazy` + `<Suspense>`, pré-carregamento de rotas (`router.prefetch`) e memoização de itens de lista com `React.memo`.



## 🛠️ Tecnologias e Ferramentas



- **Core:** React Native, Expo, Expo Router

- **Linguagem:** TypeScript

- **Gerenciamento de Estado:** Zustand & Context API (`AuthContext`)

- **Programação Reativa:** RxJS

- **Segurança & Criptografia:** `@noble/ciphers` (AES-GCM), `expo-crypto` e variáveis de ambiente (`.env`)

- **Banco de Dados, Auth & Storage:** Firebase (Firestore, Authentication e Storage)

- **Gráficos:** React Native Gifted Charts e React Native SVG



## ⚙️ Configuração do Firebase e Variáveis de Ambiente



Seguindo as boas práticas de segurança, nenhuma chave de acesso é versionada no código-fonte. Todas as credenciais são carregadas estritamente a partir de variáveis de ambiente (`.env`), com validação *fail-fast* na inicialização.



Caso deseje apontar para o seu próprio projeto Firebase:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).

2. Ative os serviços de **Authentication** (E-mail/Senha), **Firestore Database** e **Storage**, configurando as *Security Rules* de isolamento por `userId`.

3. Copie o arquivo `.env.example` para `.env` na raiz do projeto e preencha suas credenciais e a chave de criptografia (`EXPO_PUBLIC_CRYPTO_SECRET`).



## 📥 Como Rodar o Projeto



1. Clone o repositório em sua máquina:

   ```bash

   git clone <url-do-seu-repositorio>

   cd bytebank-mobile-app

   ```



2. Configure as variáveis de ambiente:

   ```bash

   cp .env.example .env

   ```

   *(Preencha as chaves no arquivo `.env` criado antes de iniciar)*



3. Instale as dependências necessárias executando:

   ```bash

   npm install

   ```



4. Inicie o servidor de desenvolvimento do Expo limpo:

   ```bash

   npx expo start -c

   ```



5. Pressione `w` para abrir no navegador web, `a` / `i` para emuladores, ou escaneie o QR Code com o aplicativo Expo Go no seu smartphone.