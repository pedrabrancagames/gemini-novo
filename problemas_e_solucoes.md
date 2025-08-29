# Diário de Desenvolvimento: Ghostbusters AR

[...]

## 29/08/2025 - Unidade de Contenção com QR Code

### Problema
Para completar o ciclo de gameplay, os jogadores precisam de uma maneira de esvaziar seus inventários cheios. Conforme os requisitos, isso deve ser feito escaneando um QR Code em um local físico, simulando uma "Unidade de Contenção".

### Solução
1.  **Biblioteca de QR Code:** A biblioteca `html5-qrcode` foi adicionada ao projeto via CDN para fornecer a funcionalidade de scanner.
2.  **UI do Scanner:**
    - Uma nova tela (`#qr-scanner-screen`) foi criada para abrigar o leitor de vídeo da câmera.
    - Um botão "Depositar Fantasmas" foi adicionado ao modal do inventário, que fica visível apenas quando há fantasmas para depositar.
3.  **Lógica do Scanner:**
    - Ao clicar em "Depositar", a função `startQrScanner` é chamada. Ela esconde as outras UIs e inicia a câmera para procurar por um QR Code.
    - Uma função de callback `onScanSuccess` é executada quando um código é lido com sucesso.
4.  **Validação e Depósito:**
    - O texto do QR Code lido é validado contra um valor pré-definido (`GHOSTBUSTERS_CONTAINMENT_UNIT_01`).
    - Se a validação for bem-sucedida, a função `depositGhosts` é chamada.
    - `depositGhosts` limpa o array de inventário local, atualiza o Firebase para refletir o inventário vazio, e chama `generateGhost` para que a caça possa recomeçar.
5.  **Fluxo do Usuário:** O ciclo agora está completo: Caçar -> Capturar -> Encher o inventário -> Ir para a unidade de contenção -> Escanear QR Code -> Esvaziar inventário -> Repetir.