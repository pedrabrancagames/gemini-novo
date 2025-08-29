# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Correção Final do Bug de Evento de Clique (Tentativa 3)

### Problema
Mesmo após a re-arquitetura da UI, o clique na cena AR ainda não funcionava. O feedback do usuário de que os botões da UI (como o inventário) passaram a funcionar, mas o clique na cena não, foi a pista final. Isso provou que o problema não era o bloqueio de eventos, mas sim o *tipo* de evento que estava sendo escutado.

### Solução
O problema foi identificado como uma idiossincrasia do A-Frame ou do navegador mobile em como ele processa eventos de toque em uma sessão de WebXR.
1.  **Diagnóstico:** O evento sintético `click` não estava sendo disparado de forma confiável na cena AR.
2.  **Correção (JavaScript):** A solução foi substituir o listener de evento. Em vez de `addEventListener('click', ...)` na cena, foi utilizado `addEventListener('mousedown', ...)`. O evento `mousedown` é um evento de nível mais baixo que corresponde ao momento exato em que o dedo toca a tela, sendo mais robusto e confiável em ambientes 3D/AR do que o `click`, que depende de um ciclo de `touchstart` e `touchend`.
3.  **Limpeza:** Os `alert`s de depuração foram removidos do código, pois a correção do evento tornou-os desnecessários.