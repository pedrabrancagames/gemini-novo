# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Teste Definitivo: Substituindo o Modelo 3D por um Primitivo

### Problema
Mesmo com a lógica de posicionamento e escala corrigida, o fantasma continuava invisível na câmera AR. Isso isolou o problema ao próprio arquivo de modelo 3D (`ghost.glb`), que poderia estar corrompido, com problemas de material ou com seu ponto de origem deslocado.

### Solução
Para provar que toda a lógica de programação (proximidade, detecção de superfície, posicionamento, escala, visibilidade) estava correta, uma medida de depuração definitiva foi tomada:
1.  **Substituição do Modelo:** A entidade `#ghost` no `index.html` foi alterada. A referência ao `gltf-model` foi removida e substituída por componentes de geometria e material padrão do A-Frame (`geometry="primitive: box; ..."` e `material="color: white;"`).
2.  **Objetivo do Teste:** O objetivo é verificar se um objeto simples e garantidamente funcional (um cubo branco) aparece no lugar do fantasma. Se o cubo aparecer, confirma-se que o problema reside exclusivamente no arquivo `ghost.glb`, e não no código.
3.  **Próximo Passo (Pós-teste):** Se o teste for bem-sucedido, a solução será recriar ou reexportar o arquivo `ghost.glb` para garantir que ele seja um asset válido e funcional.