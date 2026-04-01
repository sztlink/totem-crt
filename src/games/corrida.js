/**
 * CORRIDA — Nível 3 do Totem CRT
 * Racing pseudo-3D. Pilotar, desviar, ultrapassar. 1 lap.
 * Referências: Top Gear 3000 (SNES), Top Gear, Lotus Turbo Challenge
 * 
 * STATUS: STUB — ainda não implementado
 */

const W = 640, H = 480;

const corrida = {
  id: 'corrida',
  name: 'CORRIDA',
  difficulty: 3,

  init(canvas, input) {
    this._ctx = canvas.getContext('2d');
    this._input = input;
    this._state = 'playing';
  },

  update(dt) {
    // TODO: implementar
  },

  render(ctx) {
    const c = ctx || this._ctx;
    c.fillStyle = '#050518';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#ff0';
    c.font = '10px "Press Start 2P",monospace';
    c.textAlign = 'center';
    c.fillText('NÍVEL 3 — CORRIDA', W / 2, H / 2 - 20);
    c.fillStyle = '#666';
    c.font = '7px "Press Start 2P",monospace';
    c.fillText('EM DESENVOLVIMENTO', W / 2, H / 2 + 10);
    c.textAlign = 'left';
  },

  getState() { return this._state; },

  renderIdle(ctx) {
    this.render(ctx);
  },

  reset() { this._state = 'playing'; },
  destroy() {}
};

export default corrida;
