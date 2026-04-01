/**
 * Main — Entry point do Totem CRT
 * 
 * Em modo dev (browser): mostra 4 canvases em grid 2×2
 * Em modo produção (Electron fullscreen): renderiza no canvas 4K composto
 * 
 * MINHOSO: NÃO EDITAR ESTE ARQUIVO.
 * Seu trabalho fica em src/games/cyberrun.js
 */

import { init, tick } from './orchestrator.js';

// Init
init();

// Game loop ~60fps
function loop() {
  tick();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

console.log('[Totem CRT] Rodando. Aperte ENTER ou botão START pra começar.');
