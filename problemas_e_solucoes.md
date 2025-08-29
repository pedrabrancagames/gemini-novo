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

## 29/08/2025 - Tela de Seleção de Local e Persistência de Dados

### Problema
O jogador precisa escolher uma área de jogo antes de entrar na experiência AR. Além disso, os dados do jogador (perfil, pontos, etc.) precisam ser salvos no banco de dados assim que ele faz o login pela primeira vez.

### Solução
1.  **SDK do Realtime Database:** A importação do SDK do Firebase Realtime Database foi adicionada ao `index.html`.
2.  **UI da Tela de Localização:**
    - Uma nova tela (`#location-screen`) foi criada e estilizada. Ela fica visível após o login e antes da entrada na AR.
    - Dois botões representam as áreas de jogo definidas nos requisitos.
    - O botão "Iniciar Caça" foi movido para esta tela e permanece desabilitado até que um local seja escolhido.
3.  **Lógica de Seleção:**
    - Um event listener foi adicionado aos botões de local. Ao clicar, o local correspondente é salvo em uma variável `selectedLocation`, o botão recebe um destaque visual e o botão "Iniciar Caça" é habilitado.
4.  **Persistência de Dados:**
    - Uma função `saveUserToDatabase` foi criada.
    - Essa função é chamada logo após o login do usuário ser confirmado pelo `onAuthStateChanged`.
    - Ela verifica se o usuário já existe no caminho `/users/` do Realtime Database. Se não existir, ela cria um novo registro com os dados básicos do perfil (nome, email) e estatísticas iniciais (pontos, capturas, nível).
5.  **Atualização do Fluxo:** O fluxo do usuário agora é: Login -> Seleção de Local -> Iniciar Caça (AR).

## 29/08/2025 - Integração de GPS e Minimapa

### Problema
O núcleo do jogo exige a navegação em um espaço real. É preciso integrar o GPS do dispositivo para rastrear a posição do jogador e exibir essa informação, juntamente com os alvos (fantasmas), em um minimapa.

### Solução
1.  **Biblioteca Leaflet.js:** A biblioteca de mapas interativos Leaflet.js foi adicionada ao projeto para renderizar o minimapa. O CSS e o JS da biblioteca foram incluídos no `<head>` do `index.html`.
2.  **Inicialização do Mapa:** Uma função `initMap` foi criada. Ela é chamada quando o jogo começa e inicializa o mapa dentro do `div#minimap`, usando a localização central escolhida pelo jogador.
3.  **Rastreamento por GPS:** A função `startGps` utiliza `navigator.geolocation.watchPosition` para receber atualizações contínuas da localização do jogador.
4.  **Marcadores no Mapa:**
    - Um marcador customizado para o jogador é criado e atualizado a cada nova posição do GPS.
    - Uma função `generateGhost` cria um marcador para um fantasma em uma posição aleatória, calculada dentro de um raio próximo ao centro da área de jogo.
5.  **Cálculo de Proximidade:**
    - A cada atualização do GPS, a distância entre o jogador e o fantasma é calculada usando a fórmula de Haversine.
    - Um novo elemento na UI (`#distance-info`) exibe essa distância em tempo real.
    - Se a distância for menor que o raio de captura (definido como 15 metros), uma flag `canPlaceGhost` é ativada e a UI notifica o jogador que ele pode iniciar a captura em AR.
6.  **Integração com AR:** A lógica de `onXRFrame`, que exibe a retícula de posicionamento, agora só é ativada se a flag `canPlaceGhost` for verdadeira, garantindo que os fantasmas só possam ser colocados no mundo real quando o jogador está fisicamente perto da sua localização virtual.

## 29/08/2025 - Ajustes de UI e Testabilidade

### Problema
Após testes iniciais, foram solicitados ajustes na interface para melhorar a usabilidade e na lógica do jogo para facilitar novos testes.

### Solução
1.  **Ajustes de Interface:**
    - O CSS foi modificado para aumentar o tamanho dos ícones `#inventory-icon` (Ghost Trap) e `#proton-pack-icon`.
    - O tamanho do `#capture-button` foi reduzido para ser menos obstrutivo.
    - O `border-radius` do `#minimap` foi alterado para `50%` para deixá-lo com uma aparência circular.
2.  **Facilidade de Teste:**
    - Na função `generateGhost`, o raio para o surgimento do fantasma foi drasticamente reduzido. Isso força o fantasma a sempre aparecer a poucos metros do jogador, eliminando a necessidade de longas caminhadas durante o teste do ciclo de captura.
3.  **Correção de Bug (Firebase):**
    - Os logs do console indicaram um erro de "Permission Denied" ao tentar salvar os dados do usuário. A causa foi identificada como as regras de segurança padrão do Firebase Realtime Database.
    - A solução recomendada foi atualizar as regras no console do Firebase para permitir que usuários autenticados leiam e escrevam em seus próprios dados, usando a regra: `".write": "$uid === auth.uid"`.