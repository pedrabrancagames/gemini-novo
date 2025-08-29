# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Correção Arquitetural Final da Interface e Eventos

### Problema
O bug mais persistente do projeto: cliques na tela não eram registrados pela cena AR, impedindo o posicionamento de objetos. A refatoração anterior para separar os arquivos não foi suficiente, pois a causa raiz era a forma como a camada da UI (DOM) interceptava os eventos de toque.

### Solução
A solução definitiva envolveu uma re-arquitetura completa da UI para usar o sistema `dom-overlay` do A-Frame da maneira correta e robusta.
1.  **Separação Estrutural (HTML):** Todo o código da interface (telas, modais, botões) foi movido para um contêiner pai dedicado, `#ui-container`, que é um irmão da `<a-scene>`, e não um filho do overlay.
2.  **Vínculo via `dom-overlay`:** A `<a-scene>` foi explicitamente instruída a usar esse novo contêiner como sua camada de sobreposição através da propriedade `webxr="overlayElement: #ui-container"`.
3.  **Gerenciamento de Eventos (CSS):** A estratégia de `pointer-events` foi refinada. O contêiner `#ui-container` agora é, por padrão, transparente a cliques (`pointer-events: none;`). Apenas os elementos que devem ser interativos (botões, ícones) recebem a classe `.ui-element` que reativa os eventos (`pointer-events: auto;`). Isso garante que um toque em uma área vazia da tela "atravesse" a UI e seja registrado pela cena AR.
4.  **Visibilidade da UI (JS/CSS):** A lógica para mostrar e esconder as diferentes telas e a UI do jogo foi ajustada para funcionar com a nova estrutura, garantindo que a UI do jogo só apareça após o início da partida.