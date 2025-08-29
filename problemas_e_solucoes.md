# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Depuração Avançada do Posicionamento AR

### Problema
O bug mais crítico do projeto persistia: mesmo com a retícula de mira aparecendo, o objeto (fantasma ou cubo de teste) não era renderizado na cena ao ser posicionado. Os logs do console não indicavam nenhum erro, sugerindo um problema de lógica sutil ou de estado.

### Solução
Para finalmente descobrir o ponto de falha, uma depuração manual e detalhada foi implementada.
1.  **Rastreamento com Alertas:** A função `placeObject`, responsável por posicionar o objeto no mundo, foi preenchida com uma série de `alert()`s numerados. Cada alerta representava um passo lógico dentro da função (ex: "1. Função chamada", "2. Verificação de condição", "3. Entidade encontrada", etc.).
2.  **Instrução ao Usuário:** O usuário foi instruído a realizar o teste e reportar o número do último alerta visível. Isso permitiria identificar exatamente qual linha de código estava falhando ou não estava sendo executada como esperado, mesmo sem um erro explícito no console.