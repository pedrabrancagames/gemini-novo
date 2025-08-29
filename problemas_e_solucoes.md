# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Refatoração do Código e Correção de Bug de AR

### Problema
O jogo estava travando na tela de seleção de local, impedindo o início da experiência de AR. A causa raiz era difícil de diagnosticar apenas pelos logs. Além disso, todo o código (HTML, CSS, JS) estava em um único arquivo `index.html`, dificultando a manutenção.

### Solução
1.  **Refatoração do Código:** Como uma potencial solução para problemas de performance e para melhorar a organização, o código foi separado em três arquivos distintos:
    - `index.html`: Agora contém apenas a estrutura HTML e os links para os outros arquivos.
    - `style.css`: Contém todo o código CSS para a estilização da interface.
    - `main.js`: Contém todo o código JavaScript que controla a lógica do jogo.
2.  **Correção de Bug de AR (Depuração):** Para diagnosticar o travamento, a lógica de exibição da retícula de posicionamento em AR foi alterada. A condição que exigia que o jogador estivesse perto do fantasma (`canPlaceGhost`) foi removida temporariamente do loop de renderização (`onXRFrame`). Isso força a retícula a aparecer sempre que uma superfície for detectada, permitindo verificar se o sistema de AR em si está funcionando, independentemente do GPS.
3.  **Correção do Favicon:** O link para o `favicon.ico` foi adicionado ao `<head>` do HTML.
4.  **Consolidação:** Todas as funcionalidades desenvolvidas anteriormente (Inventário, QR Code, etc.) foram incluídas nesta nova estrutura de arquivos para garantir que o projeto esteja unificado e atualizado.