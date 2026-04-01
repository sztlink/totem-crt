/**
 * NAVE — Nível 2 do Totem CRT
 * Shoot'em up. Atirar e desviar.
 * Referências: Galaga, Space Invaders, R-Type, Gradius
 * 
 * STATUS: STUB — ainda não implementado
 */

const W = 640, H = 480;

const nave = {
  id: 'nave',
  name: 'NAVE',
  difficulty: 2,

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
    c.fillStyle = '#0ff';
    c.font = '10px "Press Start 2P",monospace';
    c.textAlign = 'center';
    c.fillText('NÍVEL 2 — NAVE', W / 2, H / 2 - 20);
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

export default nave;
