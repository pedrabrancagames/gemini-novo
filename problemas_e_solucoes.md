# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Correção Arquitetural da Interface (DOM Overlay)

### Problema
O bug mais persistente do projeto: cliques na tela não eram registrados pela cena AR, impedindo o posicionamento de objetos. As tentativas de correção com `pointer-events` em CSS se mostraram insuficientes, indicando um problema mais fundamental na forma como a camada de UI e a camada AR estavam sobrepostas.

### Solução
Foi aplicada uma refatoração arquitetural, que é a maneira correta e recomendada pelo A-Frame para lidar com UIs sobrepostas.
1.  **Separação da UI:** Todo o código HTML da interface (telas, modais, botões) foi movido para fora da `<a-scene>` e agrupado em um contêiner principal, `#ui-container`.
2.  **Uso do `dom-overlay`:** A `<a-scene>` foi configurada para usar este novo contêiner como sua camada de sobreposição oficial através da propriedade `webxr="overlayElement: #ui-container"`.
3.  **Gerenciamento de Estado:** A lógica de JavaScript para mostrar e esconder as diferentes partes da UI (como a tela de login e a tela de jogo) foi ajustada para funcionar com esta nova estrutura, garantindo que apenas a UI relevante esteja visível e que a cena AR receba os eventos de toque corretamente.

Esta abordagem elimina a raiz do conflito de eventos, garantindo que toques na área de visualização da câmera sejam processados pela cena AR, enquanto toques nos botões sejam processados pela UI.