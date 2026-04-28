const _bufferByCanvas = new WeakMap();

export const RETRO_FILTER_PRESETS = {
  soft16: {
    scale: 0.5,
    tintColor: '56, 78, 124',
    tintAlpha: 0.1,
    scanlineColor: '8, 12, 24',
    scanlineAlpha: 0.025,
    gridColor: '180, 220, 255',
    gridAlpha: 0.012,
  },
};

function getOrCreateBuffer(canvas, width, height) {
  let entry = _bufferByCanvas.get(canvas);
  if (!entry) {
    const buf = document.createElement('canvas');
    const bctx = buf.getContext('2d');
    entry = { canvas: buf, ctx: bctx, w: 0, h: 0 };
    _bufferByCanvas.set(canvas, entry);
  }
  if (entry.w !== width || entry.h !== height) {
    entry.canvas.width = width;
    entry.canvas.height = height;
    entry.w = width;
    entry.h = height;
  }
  return entry;
}

export function applyRetroFilter(ctx, sourceCanvas, width, height, timeMs, options = RETRO_FILTER_PRESETS.soft16) {
  if (!ctx || !sourceCanvas || !options) return;
  const scale = Math.max(0.1, Math.min(1, options.scale ?? 0.5));
  const sw = Math.max(1, Math.floor(width * scale));
  const sh = Math.max(1, Math.floor(height * scale));
  const { canvas: buffer, ctx: bctx } = getOrCreateBuffer(sourceCanvas, sw, sh);

  bctx.imageSmoothingEnabled = false;
  bctx.clearRect(0, 0, sw, sh);
  bctx.drawImage(sourceCanvas, 0, 0, sw, sh);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, 0, 0, sw, sh, 0, 0, width, height);

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(${options.tintColor ?? '56, 78, 124'}, ${options.tintAlpha ?? 0.1})`;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(${options.scanlineColor ?? '8, 12, 24'}, ${options.scanlineAlpha ?? 0.02})`;
  for (let y = 0; y < height; y += 2) ctx.fillRect(0, y, width, 1);

  ctx.fillStyle = `rgba(${options.gridColor ?? '180, 220, 255'}, ${options.gridAlpha ?? 0.01})`;
  const phase = ((timeMs * 0.02) | 0) & 1;
  for (let y = phase; y < height; y += 4) {
    for (let x = ((y >> 1) & 2); x < width; x += 4) ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}
