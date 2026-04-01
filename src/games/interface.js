/**
 * MiniGame Interface — contrato que todo jogo do Totem precisa implementar.
 * 
 * Cada jogo é um módulo que exporta um objeto com essas funções.
 * O orquestrador chama init() quando o nível ativa, update()/render() a cada frame,
 * e monitora getState() pra saber quando o jogador completou.
 * 
 * REGRAS:
 * - Cada game renderiza em 640×480 (4:3) no canvas que recebe
 * - Sem menu, sem overlay, sem game over — o orquestrador cuida disso
 * - Morte = respawn no mesmo nível, timer global continua
 * - getState() retorna 'won' quando o jogador completou o objetivo
 * - Safe zone: não colocar info importante nos 8% das bordas (~50px)
 * - Attract mode (renderIdle) = visual quando ninguém está jogando
 */

/**
 * @typedef {Object} GameInput
 * @property {boolean} left
 * @property {boolean} right
 * @property {boolean} up
 * @property {boolean} down
 * @property {boolean} buttonA   - ação principal (pular, atirar, confirmar)
 * @property {boolean} buttonB   - ação secundária
 */

/**
 * @typedef {Object} MiniGame
 * @property {string} id           - identificador único ('cyberrun', 'nave', 'corrida', 'luta')
 * @property {string} name         - nome exibido ('CYBER RUN')
 * @property {number} difficulty   - nível na torre (1-4)
 * 
 * @property {function(HTMLCanvasElement, GameInput): void} init
 *   Inicializa o jogo. Recebe o canvas (640×480) e o objeto de input.
 * 
 * @property {function(number): void} update
 *   Atualiza a lógica. dt = delta time em ms desde o último frame.
 * 
 * @property {function(CanvasRenderingContext2D): void} render
 *   Desenha o frame atual no canvas.
 * 
 * @property {function(): 'playing'|'won'} getState
 *   Retorna o estado atual. 'won' = completou, orquestrador avança pro próximo nível.
 * 
 * @property {function(CanvasRenderingContext2D): void} renderIdle
 *   Desenha o attract mode / screensaver quando ninguém está jogando.
 * 
 * @property {function(): void} reset
 *   Reinicia o jogo do zero.
 * 
 * @property {function(): void} destroy
 *   Cleanup: remove listeners, timers, etc.
 */

export default {};
