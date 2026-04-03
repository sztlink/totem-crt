# Cyber Run — Episódio 1

Jogo de plataforma 2D pixel art cyberpunk feito em HTML5 Canvas puro, sem frameworks externos.

## Visão geral

Jogo de plataforma side-scrolling onde o jogador precisa chegar até uma nave espacial no menor tempo possível, desviando de obstáculos, buracos, inimigos terrestres e voadores, coletando moedas e power-ups ao longo do caminho.

## Arquivo atual

Tudo está em um único `index.html` com JavaScript e sprites inline (base64).

## Mecânicas principais

- **Controles**: setas ← → para mover, ↑ ou Space para pular
- **Pulo**: altura reduzida propositalmente para aumentar dificuldade (JUMP_VEL = -9.2, GRAVITY = 0.62)
- **Câmera**: segue o player horizontalmente com suavização (lerp 0.12)
- **Canvas**: 640x280px fixo, GROUND = 200 (y do chão)
- **Objetivo**: chegar à nave no menor tempo — o jogo registra o melhor tempo (BEST)

## Personagem (Player)

- Sprites base64 inline, todos com fundo preto removido e transparência real
- 4 estados de animação com sprite sheets próprios:
  - `idle` — 4 frames, 71x67px por frame (parado)
  - `walk` — 16 frames, 71x67px por frame (andando devagar)
  - `run` — 8 frames, 71x67px por frame (correndo rápido)
  - `jump` — 5 frames, 71x67px por frame (no ar, dividido em fases: up/peak/down)
- Flip horizontal automático baseado na direção
- Hitbox menor que o sprite visual (margem de 6px nas laterais)

## Inimigos

| Tipo | Visual | Comportamento |
|------|--------|---------------|
| `walker` | Pixel art verde/cyan | Patrulha horizontal, reverte em buracos e bordas |
| `jumper` | Pixel art roxo/magenta | Fica no lugar, pula periodicamente e persegue o player lentamente |
| `flyer` | Pixel art magenta com asas | Voa em trajetória senoidal (baseY + sin * ampY), 5 no total na fase |

- Stompar (pular em cima) mata walker e jumper: +200 pontos, player quica
- SHIELD destrói qualquer inimigo por contato: +150 pontos
- STAR elimina automaticamente inimigos num raio de 120px: +200 pontos

## Power-ups

| Item | Duração | Efeito visual | Efeito gameplay |
|------|---------|---------------|-----------------|
| SPEED (S) | 350 ticks | Rastro laranja, visor amarelo | Velocidade x1.8, animação 2x mais rápida |
| SHIELD (O) | 400 ticks | Aura cyan ao redor | Invulnerável, destrói inimigos por contato |
| STAR (*) | 300 ticks | Aura magenta | Elimina inimigos em raio de 120px continuamente |

- Barra de progresso no HUD mostra tempo restante do power-up ativo

## Fase (Level)

- Comprimento total: LEVEL_LEN = 3400px
- **Blocos**: obstáculos no chão (26px largura, altura variável 28–60px)
- **Gaps**: buracos no chão — cair = perde vida e respawna
- **Plataformas**: plataformas neon flutuantes opcionais (atalhos arriscados)
- **Moedas**: +50 pontos cada, animação de rotação 4 frames
- **Power-ups**: 7 espalhados pela fase
- **Nave**: no final (FLAG_X = LEVEL_LEN - 120), flutuante com propulsores animados

## Sistema de vidas e pontuação

- 3 vidas (♥♥♥) — perde vida ao cair em buraco ou encostar em inimigo sem proteção
- Ao perder vida: respawna na posição da câmera atual, power-up é cancelado, 90 ticks de invulnerabilidade
- Score: moeda +50, power-up +100, obstáculo passado +100, inimigo stomped +200, nave +800
- Timer em tempo real, melhor tempo salvo na sessão

## Cenário (Background)

- Sky multicamada: #050518 → #080830
- 60 estrelas com twinkle individual e paralaxe leve (0.08x)
- Prédios distantes (paralaxe 0.18x): silhuetas cyan com janelas e antenas
- Prédios médios (paralaxe 0.32x): neon colorido (magenta, cyan, amarelo, laranja)
- Grade neon no chão (0.15 alpha)
- Efeito scanline CRT sutil (linhas pretas a cada 2px, alpha 0.04)
- Câmera com screen shake ao perder vida (20 ticks, intensidade 3→1)

## Nave espacial (fim de fase)

- Pixel art desenhada no canvas, flutua com movimento senoidal
- Propulsores com chamas animadas (laranja/amarelo/rosa)
- Cockpit iluminado, asas laterais, luzes vermelha/verde piscando
- Label "BOARDING" acima
- Ao entrar: tela de vitória com score, tempo e melhor tempo

## Estrutura sugerida para refatoração

```
cyberrun/
├── index.html
├── CLAUDE.md
├── assets/
│   └── sprites/
│       ├── idle.png
│       ├── walk.png
│       ├── run.png
│       └── jump.png
└── src/
    ├── game.js       — loop principal, state machine, HUD, telas de win/dead
    ├── player.js     — física, colisão, animação de sprites, power-ups
    ├── enemies.js    — update e draw de walker, jumper, flyer
    ├── level.js      — dados da fase (blocks, gaps, coins, powerups, enemies, platforms)
    └── renderer.js   — drawBG, drawGround, drawBlocks, drawPlatforms, drawShip, drawCoins, drawPowerups, drawParticles
```

## Como rodar localmente

```bash
# Com Node.js instalado
npx serve .

# Com Python instalado
python3 -m http.server 8080
```

Acesse `http://localhost:8080` no browser.

## Próximas ideias

- Episódio 2: jogo de nave (shooter espacial) como continuação
- Sistema de high score com localStorage
- Som usando Web Audio API (pulo, moeda, dano, power-up)
- Animação de morte do personagem
- Segundo nível com dificuldade maior
- PWA para instalar no celular
