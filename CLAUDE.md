# Totem CRT — Player 1, Farol Santander

## O que é
Instalação interativa com 2 torres de 4 TVs CRT cada. Cada TV roda um minigame. Jogador sobe pela torre completando os 4 games no menor tempo possível.

## Estrutura do projeto
```
app/
├── index.html              ← página principal (NÃO EDITAR)
├── src/
│   ├── main.js             ← entry point (NÃO EDITAR)
│   ├── orchestrator.js     ← máquina de estados, timer, transições (NÃO EDITAR)
│   ├── input.js            ← teclado + gamepad unificados (NÃO EDITAR)
│   └── games/
│       ├── interface.js    ← contrato MiniGame (referência)
│       ├── cyberrun.js     ← ★ NÍVEL 1 — EDITAR AQUI
│       ├── nave.js         ← nível 2 (stub)
│       ├── corrida.js      ← nível 3 (stub)
│       └── luta.js         ← nível 4 (stub)
├── assets/cyberrun/        ← sprites e sons do CyberRun
└── config/corners.json     ← corner pin (gerado na calibração)
```

## Como rodar
```bash
npx serve . -p 3000
# Abre http://localhost:3000
# ENTER ou botão START pra começar
# Setas pra mover, ESPAÇO/Z pra pular
```

## Regras para editar o CyberRun (src/games/cyberrun.js)

1. **NÃO mudar os nomes das funções exportadas** (init, update, render, getState, renderIdle, reset, destroy) — o orquestrador depende delas
2. **NÃO mudar o id** ('cyberrun') nem o difficulty (1)
3. **Canvas é 640×480** (4:3) — GROUND está em 380
4. **getState()** deve retornar 'playing' enquanto o jogo roda e 'won' quando o jogador chega na nave
5. **Sem game over** — quando o jogador morre, respawna e continua. Timer não para.
6. **Input** vem do objeto passado em init() — { left, right, up, down, buttonA, buttonB }
7. **Safe zone** — não colocar informação importante nos 50px de cada borda (overscan do CRT)
8. **Pode criar funções internas** à vontade — só não mexer na interface exportada

## Os 4 níveis (ordem na torre, de baixo pra cima)
1. **CYBER RUN** (plataforma/pular) ← SEU JOGO
2. **NAVE** (shoot'em up/atirar) — stub
3. **CORRIDA** (racing pseudo-3D/desviar) — ref: Top Gear 3000
4. **LUTA** (fighting 2D/vencer) — ref: Street Fighter II

## Narrativa entre níveis
Final do CyberRun (nave) → início do jogo da Nave (pilota ela)
Final da Nave (pouso) → início da Corrida (pega um carro)
Final da Corrida (chegada) → início da Luta (confronto final)

## O que falta no CyberRun
- [ ] Canvas 4:3 (640×480) — ajustar posições
- [ ] Gamepad API (já tem no input.js, usar input.buttonA etc.)
- [ ] Attract mode (renderIdle) — visual bonito quando ninguém joga
- [ ] Balancear duração (~60-90 segundos pra completar)
- [ ] SFX via Web Audio API (opcional mas desejado)
