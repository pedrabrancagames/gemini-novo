# Diário de Desenvolvimento: Ghostbusters AR

Este documento registra os desafios encontrados e as soluções aplicadas durante o desenvolvimento do jogo de Realidade Aumentada Ghostbusters.

## 29/08/2025 - Estrutura Inicial do Projeto (MVP)

[...]

## 29/08/2025 - Ajustes de UI, Testabilidade e Diagnóstico de Bugs

[...]

## 29/08/2025 - Correção de Bug e Implementação de Inventário

### Problema
O bug crítico que impedia o aparecimento do fantasma na câmera AR foi diagnosticado como uma falha no carregamento do modelo 3D. Além disso, o ciclo de jogo estava incompleto sem um sistema de inventário para armazenar os fantasmas capturados.

### Solução
1.  **Correção do Modelo 3D:** Com a confirmação de que o arquivo `ghost.glb` estava acessível online, a entidade do fantasma no A-Frame foi revertida para usar o `gltf-model` em vez da forma geométrica provisória. Isso resolve o problema visual principal.
2.  **Lógica de Inventário:**
    - Uma variável `inventory = []` foi criada para armazenar os fantasmas capturados.
    - Uma constante `INVENTORY_LIMIT = 5` foi definida.
    - A função `ghostCaptured` agora adiciona um objeto de fantasma ao array `inventory` e salva o inventário atualizado no Firebase.
3.  **UI do Inventário:**
    - Um `div` para o contador (`#inventory-badge`) foi adicionado sobre o ícone da Ghost Trap.
    - Uma janela modal (`#inventory-modal`) foi criada em HTML e estilizada com CSS. Ela contém uma lista (`<ul>`) para os fantasmas.
    - Uma função `updateInventoryUI` foi criada para atualizar o texto do contador e gerar dinamicamente os itens da lista com base no array `inventory`.
4.  **Controle de Fluxo:**
    - A função `updateInventoryUI` é chamada após a captura de um fantasma e no login do usuário (para carregar o estado salvo do Firebase).
    - Se o inventário atinge o limite, a função `generateGhost` é impedida de criar um novo fantasma e um alerta informa o jogador que o inventário está cheio.
    - A captura também é desabilitada se o inventário estiver cheio.
4.  **Interatividade:** Listeners de clique foram adicionados para abrir e fechar a janela do inventário.