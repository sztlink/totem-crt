/**
 * LUTA — Nível 4 do Totem CRT
 * Fighting 2D. Jogador vs CPU.
 * Referências: Street Fighter II, Mortal Kombat, Killer Instinct
 * 
 * STATUS: STUB — ainda não implementado
 */

const W = 640, H = 480;

const luta = {
  id: 'luta',
  name: 'LUTA',
  difficulty: 4,

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
    c.fillStyle = '#f0f';
    c.font = '10px "Press Start 2P",monospace';
    c.textAlign = 'center';
    c.fillText('NÍVEL 4 — LUTA', W / 2, H / 2 - 20);
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

export default luta;
