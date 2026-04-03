# GUIA MINHOSO — Totem CRT

> Como integrar seu jogo no totem sem mudar nada do seu workflow.

---

## Como funciona

O Totem CRT é 4 TVs físicas em torre. Cada TV é um jogo diferente.
**Seu CyberRun é a TV1 — a de baixo, onde o jogador começa.**

A arquitetura é simples: cada jogo roda num **iframe** independente.
O totem coordena via mensagens (postMessage). **Você não precisa saber nada sobre isso.**

---

## Seu workflow — sem mudanças

1. Continue desenvolvendo `CyberRun_v5_walker_sprite.html` como sempre
2. Teste direto no browser com `serve.bat` ou `serve.ps1`
3. Quando quiser integrar no totem: rode o build script (veja abaixo)

**O adapter block no final do seu script não interfere em nada quando você testa standalone.**
Ele só ativa quando o jogo está dentro do iframe do totem.

---

## O que o adapter faz (automático)

Quando seu jogo está no totem:

| Comportamento standalone | Comportamento no totem |
|--------------------------|------------------------|
| GAME OVER → tela de morte | Morte → respawn instantâneo (sem vidas) |
| Vitória → overlay "MISSÃO CONCLUÍDA" | Vitória → próximo jogo começa |
| Teclado direto | Input forwarded pelo orquestrador |
| Inicia com botão START | Inicia quando o totem manda |
| Modo idle = tela de menu | Modo idle = cenário scrollando (attract) |

---

## Como integrar depois de atualizar o jogo

```bash
# Na pasta do projeto totem-crt:
node scripts/build-cyberrun.js
```

Esse script:
1. Pega seu HTML mais recente de `minhoso-dev/CYBERRUN/CyberRun_v5_walker_sprite.html`
2. Adiciona o adapter block no final
3. Gera `app/games/cyberrun/index.html`
4. Pronto — o totem já usa a nova versão

---

## Como testar no totem (localmente)

```bash
# Na pasta app/:
npx serve . -p 3000
# Abre http://192.168.15.146:3000 no browser
# ENTER ou botão START pra jogar
```

O dev mode mostra as 4 TVs em grid 2×2 no browser.
Seu jogo aparece no canto inferior direito (TV1).

---

## O que o totem precisa do seu jogo

Só uma coisa: **quando o jogador embarcar na nave, o jogo termina.**

O adapter já faz isso automaticamente — quando `showWin()` é chamada no seu código,
ele notifica o totem e o próximo jogo começa.

Você não precisa mudar nada no seu `showWin`. O adapter sobrescreve a função
apenas em contexto de iframe.

---

## Se quiser adicionar comportamentos customizados no totem

O adapter recebe estas mensagens:
```js
{ totem: 'active' }  // Totem ativou seu jogo — começa a jogar
{ totem: 'idle' }    // Seu jogo está em background — modo attract
{ totem: 'input', keys: { left, right, up, buttonA } }  // Input do controle
```

E envia estas:
```js
{ game: 'ready' }                        // Jogo carregou
{ game: 'complete', score: N, time: T }  // Jogador ganhou
```

Se quiser customizar algo, edite o bloco `// TOTEM CRT ADAPTER` no final do seu HTML.

---

## Dúvidas

Fala com Felipe ou abre uma issue no repo `sztlink/totem-crt`.
