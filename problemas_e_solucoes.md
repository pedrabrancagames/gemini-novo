# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Refatoração para Componente A-Frame e Correção de Bugs

### Problema
O jogo continuava travando na tela de seleção de local, e a investigação apontou para um erro fatal no loop de renderização da AR (`onXRFrame`). Adicionalmente, alguns ícones da interface haviam desaparecido após uma refatoração anterior.

### Solução
1.  **Refatoração para Componente A-Frame:** A causa do erro fatal foi a maneira como o loop de renderização estava sendo gerenciado. A solução definitiva foi reescrever toda a lógica do jogo dentro de um **componente A-Frame customizado** (`game-manager`).
    - Isso move o código para a arquitetura padrão e recomendada pelo A-Frame.
    - O loop de renderização agora é gerenciado pelo método `tick(time, timeDelta)` do componente, que é mais estável e seguro, resolvendo o travamento.
2.  **Correção da UI:** Os `<img>` da logo do jogo e da Proton Pack foram adicionados de volta ao `index.html` e devidamente estilizados no `style.css`, corrigindo a regressão visual.
3.  **Consolidação Final:** Todas as funcionalidades (Login, Seleção de Local, GPS, Minimapa, Captura, Inventário, QR Code, Easter Egg do Ecto-1) foram migradas para dentro da nova estrutura de componente, resultando em um código mais limpo, organizado e, mais importante, funcional.