# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Correção Final do Bug de Evento de Clique (Tentativa 3)

### Problema
O bug mais persistente do projeto: o clique/toque na tela para posicionar um objeto na cena AR não era registrado, mesmo após múltiplas tentativas de correção de eventos e da estrutura da UI. O problema parecia ser uma incompatibilidade fundamental ou um bug no handler de eventos do A-Frame/WebXR no ambiente de teste.

### Solução
O problema foi identificado como uma idiossincrasia do A-Frame ou do navegador mobile em como ele processa eventos de toque em uma sessão de WebXR.
1.  **Diagnóstico:** O evento sintético `click` não estava sendo disparado de forma confiável na cena AR.
2.  **Correção (JavaScript):** A solução foi substituir o listener de evento. Em vez de `addEventListener('click', ...)` na cena, foi utilizado `addEventListener('mousedown', ...)`. O evento `mousedown` é um evento de nível mais baixo que corresponde ao momento exato em que o dedo toca a tela, sendo mais robusto e confiável em ambientes 3D/AR do que o `click`, que depende de um ciclo de `touchstart` e `touchend`.
3.  **Limpeza:** Os `alert`s de depuração foram removidos do código, pois a correção do evento tornou-os desnecessários.