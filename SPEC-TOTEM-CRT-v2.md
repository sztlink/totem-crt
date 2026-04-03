# TOTEM CRT — Spec Técnico v2

> Player 1 — 50 Anos do Videogame · Farol Santander SP
> Abertura: 19/06/2026 · Encerramento: 20/09/2026
> Atualizado: 01/04/2026

---

## 1. Conceito

Duas torres independentes de TVs CRT, cada uma com 4 televisores empilhados verticalmente. Cada TV exibe um minigame diferente inspirado em mecânicas fundamentais dos videogames retrô. O jogador começa na TV de baixo e sobe — completar um jogo desbloqueia o próximo. Um cronômetro global marca o tempo total da subida. Objetivo: completar os 4 games no menor tempo possível.

As torres são **idênticas** — mesmos 4 games, mesma experiência. Duas pessoas podem jogar simultaneamente, cada uma em sua torre, sem interação entre elas. Como dois fliperamas lado a lado.

---

## 2. Layout Físico

```
         MONOLITO A                    MONOLITO B
     ┌──────────────┐             ┌──────────────┐
     │   TIMER /    │             │   TIMER /    │
     │   RANKING    │             │   RANKING    │
     │   OVERLAY    │             │   OVERLAY    │
     ├──────────────┤             ├──────────────┤
     │              │             │              │
     │   NÍVEL 4    │             │   NÍVEL 4    │
     │   LUTA       │             │   LUTA       │
     │              │             │              │
     ├──────────────┤             ├──────────────┤
     │              │             │              │
     │   NÍVEL 3    │             │   NÍVEL 3    │
     │   CORRIDA    │             │   CORRIDA    │
     │ (pseudo-3D)  │             │ (pseudo-3D)  │
     │              │             │              │
     ├──────────────┤             ├──────────────┤
     │              │             │              │
     │   NÍVEL 2    │             │   NÍVEL 2    │
     │   NAVE       │             │   NAVE       │
     │              │             │              │
     ├──────────────┤             ├──────────────┤
     │              │             │              │
     │   NÍVEL 1    │             │   NÍVEL 1    │
     │   CYBER RUN  │             │   CYBER RUN  │
     │  (plataforma)│             │  (plataforma)│
     │              │             │              │
     └──────────────┘             └──────────────┘
       ┌──────────┐                 ┌──────────┐
       │ JOYSTICK │                 │ JOYSTICK │
       │ + BOTÕES │                 │ + BOTÕES │
       └──────────┘                 └──────────┘
```

### Dimensões estimadas por torre
- **TVs:** 4× CRT 29"-32" (mesmo modelo/família para uniformidade)
- **Altura total:** ~2.2m (4 TVs empilhadas + estrutura)
- **Largura:** ~0.6m (largura do CRT)
- **Profundidade:** ~0.6m (profundidade do CRT)
- **Total de TVs:** 8 (4 por torre)
- **Controle:** 1 painel arcade por torre (joystick + 2-3 botões)

### Timer / Ranking
O cronômetro global pode ser:
- **Opção A:** Overlay na TV do nível ativo (HUD dentro do game)
- **Opção B:** Display dedicado no topo (5ª tela pequena, LED, ou monitor fino)
- **Opção C:** Projeção/LED externo acima da torre

**Decisão pendente** — depende do espaço e da estética final.

---

## 3. Os 4 Games

Cada game trabalha UMA ação central. Design direto, era 8-bit/16-bit. Sem tutorial — a mecânica é óbvia ao pegar o controle.

### Nível 1 — CYBER RUN (Plataforma / Pular)
- **Ação central:** pular no tempo certo
- **Gênero:** platformer side-scrolling
- **Status:** ✅ Protótipo funcional (Minhoso — cyberrun/)
- **Objetivo speedrun:** chegar à nave no menor tempo
- **Adaptações necessárias:** ver seção 6

### Nível 2 — NAVE (Shoot'em up / Atirar)
- **Ação central:** atirar e desviar
- **Gênero:** shoot'em up vertical ou horizontal
- **Status:** ❌ Não iniciado
- **Objetivo speedrun:** sobreviver X ondas ou destruir o boss
- **Referências:** Galaga, Space Invaders, R-Type, Gradius

### Nível 3 — CORRIDA (Racing / Desviar)
- **Ação central:** pilotar, desviar, ultrapassar
- **Gênero:** corrida pseudo-3D — 1 lap
- **Status:** ❌ Não iniciado
- **Objetivo speedrun:** completar 1 volta no menor tempo
- **Mecânica:** pista com curvas, subidas, outros carros (IA), nitro/boost, ultrapassagem
- **Referências:** Top Gear 3000 (SNES), Top Gear, Lotus Turbo Challenge
- **Nota:** visão traseira pseudo-3D (Mode 7 style), sensação de velocidade alta, curvas com scaling de sprites, SFX de motor e derrapagem

### Nível 4 — LUTA (Fighting / Vencer)
- **Ação central:** lutar e vencer
- **Gênero:** fighting 2D — jogador vs CPU
- **Status:** ❌ Não iniciado
- **Objetivo speedrun:** derrotar o oponente no menor tempo (melhor de 1 round ou 2 rounds)
- **Mecânica:** 2 personagens, golpes básicos (soco, chute, especial), bloqueio, barra de vida
- **Referências:** Street Fighter II, Mortal Kombat (simplificado), Killer Instinct
- **Nota:** o oponente é CPU com dificuldade calibrada — difícil mas vencível. O desafio é vencer rápido, não só vencer

---

## 4. Seleção de Personagem

Antes de iniciar a subida, tela de **CHARACTER SELECT** com 6 personagens jogáveis — cada um representa um integrante da equipe de desenvolvimento. Mesma mecânica/hitbox para todos, só muda o sprite.

| # | Personagem | Integrante | Diretriz de visual |
|---|-----------|------------|--------------------|
| 1 | ? | **Felipe** | (a definir) |
| 2 | ? | **Antonio** | (a definir) |
| 3 | ? | **Leonardo** | (a definir) |
| 4 | ? | **Ana Clara** | (a definir) |
| 5 | ? | **Ihon** | (a definir) |
| 6 | ? | **Minhoso** | Personagem atual do CyberRun (robô/runner cyberpunk) |

**Regras:**
- Cada integrante dá as diretrizes de como quer seu personagem (referência visual, cores, estilo)
- Sprites criados em pixel art, mesmo tamanho/proporção
- Seleção via joystick (esquerda/direita) + botão A pra confirmar
- Personagem escolhido aparece em **todos os 4 games** e nas cutscenes de transição
- Tela de select no estilo arcade clássico (grid 3×2 ou fila de 6, portraits com nome)
- Tempo na tela de select **não conta** no timer — timer inicia no countdown 3-2-1 após escolha

---

## 5. Narrativa entre níveis

Os 4 games são conectados por uma linha narrativa contínua. O final de cada jogo é o início do próximo — ideia original do Minhoso.

| Transição | O que acontece |
|-----------|----------------|
| **CyberRun → Nave** | Personagem foge pela cidade cyberpunk, chega na nave e embarca → corte pra cockpit, agora ele pilota |
| **Nave → Corrida** | Nave pousa / faz pouso forçado → personagem sai e pega um veículo terrestre, fuga continua |
| **Corrida → Luta** | Veículo chega ao destino / é bloqueado → confronto final corpo a corpo contra o antagonista |

Cada transição é uma **cutscene curta** (2-3 segundos, pixel art animada) que roda na TV do nível que acabou de ser completado enquanto a TV do próximo nível ativa. O timer global **não para** durante a transição — faz parte do speedrun.

---

## 6. Fluxo de Jogo (Máquina de Estados)

```
┌────────────────────────┐
│         IDLE            │
│  Todas as 4 TVs com    │
│  idle animations /     │
│  attract mode          │
│  Ranking do dia na     │
│  TV do topo            │
│  "PRESS START"         │
└──────────┬─────────────┘
           │
     Jogador aperta START
           │
┌──────────▼─────────────┐
│      COUNTDOWN          │
│  3... 2... 1... GO!    │
│  Timer global inicia   │
└──────────┬─────────────┘
           │
┌──────────▼─────────────┐
│    NÍVEL 1 — ATIVO      │
│  TV 1: game rodando    │
│  TV 2-4: estado idle   │
│  ou teaser do próximo  │
│  Timer: correndo       │
└──────────┬─────────────┘
           │
     Jogador completa
     nível 1
           │
┌──────────▼─────────────┐
│    TRANSIÇÃO 1→2        │
│  TV 1: "COMPLETO ✓"    │
│  Efeito visual de      │
│  subida (glitch/flash) │
│  TV 2: ativa           │
│  ~1s de transição      │
└──────────┬─────────────┘
           │
┌──────────▼─────────────┐
│    NÍVEL 2 — ATIVO      │
│  (repete padrão)       │
└──────────┬─────────────┘
           │
           ... (nível 3, nível 4)
           │
┌──────────▼─────────────┐
│      VITÓRIA            │
│  Timer para            │
│  Todas as 4 TVs:       │
│  animação sincronizada │
│  Score final + ranking │
│  Se bateu recorde:     │
│  efeito especial       │
│  Input: 3 letras       │
│  (arcade clássico)     │
└──────────┬─────────────┘
           │
     Timeout 15s
           │
┌──────────▼─────────────┐
│    IDLE (volta)         │
└─────────────────────────┘
```

### Regras
- **Timer global** corre do START até completar o nível 4
- **Morte/falha** dentro de um game = respawn no mesmo nível (perde tempo, não regride)
- **Sem vidas limitadas** — o jogador sempre pode continuar (tempo é a punição)
- **Ranking:** top 10 melhores tempos do dia, visível no IDLE
- **Input de nome:** 3 letras estilo arcade (AAA, BOB, etc.) ao completar

---

## 7. Arquitetura Técnica

### Cadeia de sinal (sem Resolume)

```
┌──────────────────────────────────────────────────────────────┐
│                  ALIENWARE M16 R1 (por monolito)              │
│                                                                │
│  Electron App (fullscreen 3840×2160)                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  4× Offscreen Canvas (games, 640×480 cada, 4:3)         │ │
│  │  ├── Game 1 (CyberRun) renderiza aqui                   │ │
│  │  ├── Game 2 (Nave) renderiza aqui                       │ │
│  │  ├── Game 3 (Corrida) renderiza aqui                    │ │
│  │  └── Game 4 (Luta) renderiza aqui                       │ │
│  │                                                          │ │
│  │  Compositor WebGL (output final 3840×2160)               │ │
│  │  ├── Pega 4 texturas (offscreen canvases)               │ │
│  │  ├── Aplica corner pin por quadrante (4 pontos livres)  │ │
│  │  └── Renderiza no canvas de saída em grid 2×2           │ │
│  │                                                          │ │
│  │  Orquestrador (main process)                             │ │
│  │  ├── State machine (IDLE→SELECT→PLAY→VICTORY)           │ │
│  │  ├── Timer global                                       │ │
│  │  ├── Ranking (localStorage / JSON)                      │ │
│  │  ├── Transições / cutscenes entre níveis                │ │
│  │  └── Input router (Gamepad API)                         │ │
│  │                                                          │ │
│  │  Corner Pin Config (JSON persistido)                     │ │
│  │  └── corners: { tv1: [[x,y]×4], tv2: [...], ... }      │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  HDMI 2.1 (4K60)                                               │
│  └──► Video Wall Controller 2×2 (1 in → 4 out)                │
│       ├──► HDMI out 1 → Conversor HDMI→Composto → CRT 1      │
│       ├──► HDMI out 2 → Conversor HDMI→Composto → CRT 2      │
│       ├──► HDMI out 3 → Conversor HDMI→Composto → CRT 3      │
│       └──► HDMI out 4 → Conversor HDMI→Composto → CRT 4      │
│                                                                │
│  P2 / USB Audio → Caixas de som (1 par por monolito)          │
│  USB ◄── Painel arcade (joystick + botões)                    │
└──────────────────────────────────────────────────────────────┘
```

### Canvas 4K — layout 2×2

O app renderiza 1 canvas 3840×2160. O video wall controller divide em 4 quadrantes, cada um vira uma saída HDMI independente:

```
3840×2160
┌───────────────────┬───────────────────┐
│                   │                   │
│   TV 4 (LUTA)     │  TV 3 (CORRIDA)   │
│   1920×1080       │  1920×1080        │
│                   │                   │
├───────────────────┼───────────────────┤
│                   │                   │
│   TV 2 (NAVE)     │  TV 1 (CYBERRUN)  │
│   1920×1080       │  1920×1080        │
│                   │                   │
└───────────────────┴───────────────────┘
```

O mapeamento quadrante → TV física é configurável (depende da cabeação do video wall controller). Cada game renderiza em 4:3 (640×480) no offscreen canvas. O compositor WebGL escala e posiciona com corner pin dentro do quadrante 1920×1080.

### Corner Pin (substitui Resolume)

Cada CRT pode ter overscan, desalinhamento ou distorção leve. Em vez de usar Resolume pra corrigir, o próprio app tem corner pin integrado:

- **Modo calibração** (atalho `Ctrl+C` na montagem):
  - Cada quadrante mostra grid de teste (linhas brancas, fundo preto)
  - Mouse/teclado arrasta os 4 cantos de cada TV
  - Preview em tempo real
  - Salva em `corners.json` local
  - Faz uma vez na montagem, não precisa mais tocar

- **Implementação:** shader WebGL com perspective transform por quadrante. Cada game renderiza normalmente no offscreen canvas 640×480 → o compositor aplica a transformação ao posicionar a textura no canvas final.

- **Safe zone:** todos os games respeitam margem de ~8% nas bordas (prática padrão dos games 8/16-bit pra compensar overscan dos CRTs). Conteúdo importante nunca encosta na borda.

### Aspecto 4:3

CRTs são 4:3. Cada game renderiza no offscreen canvas a 640×480 (4:3). O compositor posiciona essa textura centralizada (pillarbox) dentro do quadrante 16:9. O conversor HDMI→Composto + CRT mostram o resultado em 4:3 nativo. O corner pin permite ajuste fino se necessário.

### Áudio

Áudio centralizado no laptop, saída P2 ou USB → 1 par de caixas por monolito. O orquestrador controla que som toca baseado no nível ativo. SFX via Web Audio API. Não depende de qual TV está ativa.

### Interface de cada minigame (contrato)

```typescript
interface MiniGame {
  id: string;                    // 'cyberrun', 'nave', 'corrida', 'luta'
  name: string;                  // nome exibido
  difficulty: 1 | 2 | 3 | 4;    // nível na torre

  init(canvas: HTMLCanvasElement, input: GameInput): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  getState(): 'playing' | 'won';  // sem 'lost' — morte = respawn, timer continua
  getIdleAnimation(): void;       // attract mode quando não está ativo
  reset(): void;                  // reiniciar o game
  destroy(): void;                // cleanup
}

interface GameInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  buttonA: boolean;   // ação principal (pulo, tiro, confirmar)
  buttonB: boolean;   // ação secundária (se necessário)
}
```

Cada game é um **módulo independente** que respeita esse contrato. O orquestrador chama `init()`, roda `update()`/`render()` no loop, e monitora `getState()` pra saber quando subir pro próximo.

---

## 8. Adaptações do CyberRun (Minhoso) → Nível 1

O protótipo do Minhoso funciona e tem estética coerente. Adaptações para encaixar no Totem:

### Deve manter ✅
- Estética cyberpunk (neon, parallax, scanlines)
- Mecânica de platformer side-scrolling
- Power-ups (speed, shield, star)
- Inimigos (walker, jumper, flyer)
- Cenário de cidade neon

### Deve mudar 🔧
| Item | Atual | Necessário |
|------|-------|------------|
| Objetivo | Chegar à nave | Chegar ao final no menor tempo (sem nave — só linha de chegada) |
| Vidas | 3 vidas, game over | Sem game over — morte = respawn, timer continua |
| Score | Pontuação + tempo | Só tempo (score pode existir mas não é o objetivo) |
| Canvas | 640×280 fixo | Configurável (aspect ratio do CRT, ~4:3) |
| Input | Teclado + touch | Gamepad API (joystick + botão A pra pular) |
| HUD | Score, timer, vidas, power-up | Timer global (do orquestrador), power-up bar |
| Estrutura | Monolito HTML único | Módulo JS que implementa interface MiniGame |
| Áudio | Nenhum | Web Audio API — SFX chiptune (pulo, moeda, hit, power-up) |
| Idle | Tela de menu | Attract mode automático (demo jogando sozinho ou loop visual) |

### Não precisa agora ⏳
- Sprites polidos (pode ficar com pixel art procedural por enquanto)
- Música de fundo (SFX primeiro)
- Mobile/touch (arcade only)

---

## 9. Hardware

| Item | Qtd | Observação |
|------|-----|------------|
| TV CRT 29"-32" | 8+2 | 4 por monolito + 2 reserva. Mesmo modelo/família |
| Laptop Alienware m16 R1 | 2 | 1 por monolito. HDMI 2.1 4K60 |
| Video Wall Controller 2×2 | 2 | 1 in → 4 out HDMI. Mesmo modelo da Beleza Astral |
| Conversor HDMI→Composto | 8+2 | 1 por TV + 2 reserva |
| Painel arcade (joystick + 2-3 botões) | 2 | Kit arcade USB |
| Caixas de som | 2-4 | 1 par por monolito, P2/USB do laptop |
| Frame/estrutura metálica | 2 | Suporte pras 4 TVs empilhadas, serralheria sob medida |
| Réguas de energia | 4 | 4 TVs + laptop + conversores por monolito |
| Cabos HDMI | 12 | Laptop→controller, controller→conversores |
| Cabos RCA | 10 | Conversores→CRTs |

### CRTs — direção estética
- Preferência declarada: **tela curva + gabinete preto** (ref: Sony Trinitron KV-20M10)
- Top pick: **Sony Trinitron Curved Black (KV-27V42/S42)** ou modelo brasileiro equivalente
- Scraper rodando (szt-scraping-tool, campaign crt-totem)
- **Pendência:** confirmar modelo final e iniciar compra (precisa de 8, comprar 10 pra margem)

---

## 10. Cronograma

| Marco | Data | Status |
|-------|------|--------|
| Spec v2 fechado | 01/04/2026 | ✅ Este documento |
| CyberRun adaptado (nível 1) | até 20/04 | 🔧 Minhoso com spec |
| Orquestrador + transições | até 20/04 | 🔧 Dev |
| Game 2 — Nave | até 05/05 | ❌ |
| Game 3 — Corrida (Rock'n'Roll Racing) | até 20/05 | ❌ |
| Game 4 — Luta (Street Fighter) | até 01/06 | ❌ |
| Integração 4 games + orquestrador | até 08/06 | ❌ |
| CRTs compradas e testadas | até 15/05 | ❌ |
| Estrutura metálica | até 01/06 | ❌ |
| Montagem e teste no Farol | até 17/06 | ❌ |
| **Abertura** | **19/06/2026** | 🗓️ 79 dias |

---

## 11. Decisões Pendentes

- [ ] Timer/ranking: overlay no game ou display dedicado no topo?
- [ ] O que as TVs inativas mostram enquanto jogador está em outro nível?
- [ ] Modelo final de CRT — confirmar e iniciar compra (8+2 reserva)
- [ ] Video wall controller: qual modelo? Confirmar compatibilidade com o da Beleza Astral
- [ ] Conversores HDMI→Composto: qual modelo? Testar lag e qualidade de imagem
- [ ] Estrutura metálica: briefing pro serralheiro
- [ ] Diretrizes visuais dos 6 personagens (cada integrante define o seu)

---

*Spec revisado pelo szt.link em 01/04/2026.*
*Proposta original: Antonio Curti. Protótipo nível 1: Minhoso (CyberRun). Briefing técnico: Felipe + szt.link.*
