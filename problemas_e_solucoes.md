# Diário de Desenvolvimento: Ghostbusters AR

Este documento registra os desafios encontrados e as soluções aplicadas durante o desenvolvimento do jogo de Realidade Aumentada Ghostbusters.

## 29/08/2025 - Estrutura Inicial do Projeto (MVP)

### Problema
Iniciar o projeto com uma base de código limpa, seguindo os requisitos, sem depender da estrutura de um projeto anterior. O desafio é criar um `index.html` que contenha toda a lógica necessária para um protótipo funcional (MVP): tela de carregamento, entrada em modo AR, detecção de superfície (hit-test) e posicionamento de um objeto 3D na cena.

### Solução
1.  **Criação do `index.html`:** Um novo arquivo foi criado do zero.
2.  **Estrutura HTML:** Contém os elementos essenciais: `<head>` com metadados e importação do A-Frame, e `<body>` com a `<a-scene>` e o `<div>` do overlay da UI.
3.  **CSS:** Estilos foram escritos para implementar a tela de carregamento e a UI principal do jogo, utilizando a paleta de cores verde (#92F428) e os ícones definidos nos documentos de design.
4.  **A-Frame Scene:** A cena foi configurada com os componentes essenciais para WebXR (`webxr` com `hit-test` e `dom-overlay`), assets, iluminação, câmera e as entidades para a retícula e o fantasma (inicialmente invisíveis).
5.  **JavaScript (Lógica do MVP):**
    - O script principal é envolvido por um listener `DOMContentLoaded`.
    - **Fluxo de Execução:**
        a. Uma função `simulateLoading` mostra uma barra de progresso e depois exibe o botão "Iniciar Caça".
        b. O clique no botão chama `startARSession`, que verifica a compatibilidade e solicita a entrada no modo AR.
        c. O evento `enter-vr` do A-Frame aciona a função `initGame`.
        d. `initGame` esconde a tela de carregamento, exibe a UI do jogo e configura o `hitTestSource`.
        e. A função `onXRFrame` é executada em loop, usando o `hitTestSource` para posicionar a retícula em superfícies detectadas.
        f. Um clique na cena chama `placeGhost`, que posiciona o modelo 3D do fantasma na localização da retícula e o torna visível.

Este setup inicial cria uma base sólida e funcional para as próximas fases, como a integração com GPS e Firebase.

## 29/08/2025 - Integração com Firebase Authentication

### Problema
O jogo precisa de um sistema de autenticação para identificar os jogadores, salvar seu progresso e exibir rankings. A tela inicial deve ser um portal de login, e não uma entrada direta no jogo.

### Solução
1.  **SDK do Firebase:** Os scripts do Firebase (App e Auth) foram adicionados ao `index.html` usando a importação de módulos ES6 (`type="module"`).
2.  **Configuração:** O objeto `firebaseConfig` fornecido foi adicionado ao script para inicializar a conexão com o Firebase.
3.  **UI de Login:**
    - O `index.html` foi modificado para transformar a tela de carregamento em uma tela de login.
    - Um botão "Login com Google" foi adicionado.
    - O botão "Iniciar Caça" agora fica oculto até que o login seja efetuado com sucesso.
4.  **Lógica de Autenticação:**
    - Uma função `handleGoogleLogin` foi criada para gerenciar o fluxo de login com `signInWithPopup`.
    - Um observador `onAuthStateChanged` foi implementado para monitorar o estado de login do usuário. Ele atualiza a UI dinamicamente, mostrando o botão de login ou o de iniciar o jogo, e exibindo uma mensagem de boas-vindas para o usuário logado.
5.  **Fluxo do Usuário:** O fluxo agora é: Usuário abre a página -> Vê o botão de login -> Clica para logar com a conta Google -> Após o sucesso, o botão de "Iniciar Caça" aparece -> O usuário clica para entrar na experiência AR.
