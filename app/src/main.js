import { init, tick } from './orchestrator.js';
init();
let lastTime = 0;
const FRAME_TIME = 1000 / 60;
function loop(now) {
  requestAnimationFrame(loop);
  if (now - lastTime < FRAME_TIME) return;
  lastTime = now - ((now - lastTime) % FRAME_TIME);
  tick();
}
requestAnimationFrame(loop);
