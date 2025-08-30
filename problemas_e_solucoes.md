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