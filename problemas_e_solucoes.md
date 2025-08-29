# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Refatoração do Código e Correção de Bug Crítico

### Problema
O jogo estava travando na tela de seleção de local, impedindo o início da experiência de AR. A causa raiz foi identificada como um problema no tempo de carregamento do JavaScript, que tentava acessar elementos HTML antes de estarem prontos.

### Solução
1.  **Refatoração do Código:** O código foi separado em três arquivos distintos: `index.html` (estrutura), `style.css` (estilos), e `main.js` (lógica), melhorando a organização e a performance.
2.  **Correção do Carregamento do Script:** A chamada para o script `main.js` foi movida do `<head>` para o final do `<body>`. Isso garante que toda a página HTML seja carregada e analisada pelo navegador antes da execução de qualquer código JavaScript, resolvendo o problema de travamento.
3.  **Remoção de Código de Depuração:** O `alert` que havia sido adicionado para testes foi removido.
4.  **Consolidação:** Todas as funcionalidades desenvolvidas anteriormente (Inventário, QR Code, etc.) foram mantidas na nova estrutura de arquivos.