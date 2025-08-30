# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Implementação de Variedade de Fantasmas e Nova Captura

### Problema
O jogo precisava de mais profundidade e desafio. Além disso, o método de captura precisava ser alterado para usar o ícone do Proton Pack, e o posicionamento do fantasma em AR precisava ser automático.

### Solução
1.  **Variedade de Fantasmas:**
    - A função `generateGhost` agora cria fantasmas comuns ou fortes (25% de chance).
    - Fantasmas fortes têm mais pontos (25 vs 10) e maior duração de captura (8s vs 5s).
    - Ícones diferentes são usados no minimapa para diferenciar os tipos de fantasmas (logo para comum, PKE meter para forte).
2.  **Captura pelo Proton Pack:**
    - O botão de captura central foi removido do HTML.
    - O ícone do Proton Pack (`#proton-pack-icon`) agora é o elemento clicável para iniciar a captura.
    - Uma nova barra de progresso (`#proton-pack-progress-bar`) foi adicionada acima do ícone do Proton Pack para feedback visual durante a captura.
3.  **Posicionamento Automático:**
    - A lógica de posicionamento do objeto (`placeObject`) foi movida para dentro do loop `tick`.
    - Assim que a retícula encontra uma superfície, o objeto (`ghost` ou `ecto1`) é posicionado automaticamente, sem a necessidade de um clique adicional.
4.  **Correção de Escala:** A escala do objeto posicionado foi ajustada para `0.5 0.5 0.5` para garantir visibilidade.

Com estas alterações, o jogo agora possui um ciclo de gameplay mais dinâmico e uma interação de captura mais intuitiva.

## 30/08/2025 - Correção de Bug Crítico na Renderização e Captura

### Problema
Após os testes, foi identificado um bug crítico: o fantasma não aparecia em modo AR quando o jogador se aproximava da sua localização. Como consequência, a mecânica de captura via Proton Pack também não funcionava, pois dependia de um fantasma visível na cena.

### Solução
A causa raiz era um erro de referência no `main.js` que não determinava corretamente qual entidade de fantasma (comum ou forte) deveria ser renderizada.

1.  **Gestão de Estado do Fantasma Ativo:**
    - Foi introduzida uma nova variável `this.activeGhostEntity` para armazenar a referência à entidade do fantasma que está atualmente próximo ao jogador.
2.  **Refatoração da Lógica de Proximidade:**
    - A função `checkProximity` foi corrigida para, além de detectar a proximidade, definir qual fantasma (`ghostComumEntity` ou `ghostForteEntity`) deve ser o `activeGhostEntity`.
3.  **Correção das Funções de Jogo:**
    - As funções `placeObject` (que posiciona o fantasma em AR) e `ghostCaptured` (que o remove após a captura) foram atualizadas para usar a nova variável `activeGhostEntity`, garantindo que o modelo 3D correto seja exibido e, posteriormente, ocultado.

Essa correção restaurou o ciclo de gameplay, garantindo que a renderização do fantasma e a mecânica de captura voltem a funcionar como esperado.

## 30/08/2025 - Correção de Bug de Tela Branca Pós-Captura

### Problema
Após a captura de um fantasma, ao fechar a mensagem de confirmação (`alert`), a imagem da câmera em AR ficava completamente branca, interrompendo a jogabilidade. Os elementos de UI continuavam visíveis, mas o ambiente real não era mais renderizado.

### Solução
O problema era causado pelo uso da função `alert()`, que pausa toda a execução de scripts da página, incluindo o loop de renderização da câmera AR. Ao ser dispensado, o contexto de renderização do WebXR era perdido.

1.  **Criação de Notificação Customizada:** Foi implementado um modal de notificação não-bloqueante usando HTML, CSS e JavaScript.
2.  **Alteração do HTML (`index.html`):** Adicionada a estrutura para a janela de notificação.
3.  **Estilização (`style.css`):** Adicionadas regras de CSS para formatar a janela, garantindo que ela se sobreponha à UI do jogo sem bloquear a renderização.
4.  **Atualização do Script (`main.js`):** A lógica foi refatorada para substituir todas as chamadas de `alert()` pela nova função `showNotification()`, que exibe a mensagem na janela customizada sem pausar o jogo. Isso garante que a câmera continue funcionando após a exibição das mensagens.

## 30/08/2025 - Correção de Conflito de Câmera entre AR e Scanner de QR

### Problema
Ao tentar abrir o scanner de QR Code para depositar fantasmas, o scanner falhava e a câmera do modo AR quebrava (tela branca). O scanner só funcionava numa segunda tentativa, após a câmera AR já ter parado de funcionar. Isso indicou um conflito pelo controle do hardware da câmera.

### Solução
Foi implementado um gerenciamento explícito do controle da câmera para evitar que o modo AR (WebXR) e a biblioteca de scanner (`Html5Qrcode`) tentassem usar a câmera simultaneamente.

1.  **Liberar Câmera Antes de Escanear:** A função `startQrScanner` foi modificada para primeiro sair do modo AR (`exitAR()`) e aguardar a liberação da câmera antes de tentar iniciar o scanner de QR Code.
2.  **Retornar ao Fluxo Padrão:** A função `stopQrScanner` foi ajustada para, após fechar o scanner, levar o usuário de volta à tela de seleção de local. Isso força o usuário a re-entrar no modo AR através do botão "Iniciar Caça", garantindo que a câmera seja re-inicializada de forma limpa e sem conflitos.

## 30/08/2025 - Correção de Race Condition na Liberação da Câmera

### Problema
A solução anterior para o conflito de câmera gerou uma "race condition". O scanner de QR era iniciado imediatamente após a conclusão do comando `exitAR()`, mas o navegador ainda não havia liberado completamente o recurso da câmera, resultando em um erro de permissão.

### Solução
Foi adicionado um pequeno atraso (`setTimeout` de 200ms) na função `startQrScanner`. Esse atraso ocorre após a saída do modo AR e antes da inicialização do scanner. A pausa, embora imperceptível para o usuário, dá ao navegador tempo suficiente para liberar totalmente a câmera, resolvendo a condição de corrida e permitindo que o scanner seja iniciado com sucesso na primeira tentativa.