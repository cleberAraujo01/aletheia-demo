# aletheia-demo — ambiente de validação do ALETHEIA

Loja estática pequena, sem framework e sem build, feita para validar de ponta
a ponta o fluxo do [ALETHEIA](https://github.com/cleberAraujo01/ALETHEIA):
**PR aberto → preview publicado → comentário com o veredito no próprio PR**.

## O que tem

| Rota | O que é | Regra de negócio quebrável |
|---|---|---|
| `/` | início | — |
| `/catalogo` | produtos de `data/produtos.json` | preço, desconto, estoque, item sumido |
| `/produto?id=…` | detalhe de um produto | preço com desconto, estoque |
| `/carrinho` | itens do `localStorage` | total |
| `/sobre` | texto | link quebrado |
| `/contato` | formulário | validação |

Tudo é estático: a Vercel publica a pasta como está (`vercel.json` com
`cleanUrls`), e cada PR ganha um preview.

## Como o ALETHEIA entra

A jornada nasceu de `aletheia init` e evoluiu à mão:

- `.aletheia/jornada-inicial.json` — as rotas públicas descobertas num browser
  real, como o `init` escreveu (sem edição).
- `.aletheia/jornada.json` — a jornada em uso, com ações: adiciona dois
  produtos ao carrinho (um deles duas vezes), confere o carrinho com total,
  envia o formulário de contato. Sete observações. Os botões ganharam
  `data-testid` para isso.
- `.github/workflows/aletheia.yml` — o gatilho `deployment_status` que invoca o
  shim do GitHub Actions e comenta no PR.

Se os previews estiverem atrás de Deployment Protection, o workflow espera o
secret `VERCEL_AUTOMATION_BYPASS_SECRET` (Settings → Deployment Protection →
Protection Bypass for Automation, na Vercel; Settings → Secrets → Actions, no
GitHub).

## Rodar localmente

```bash
npx serve . --no-clipboard      # ou qualquer servidor estático
```

## Registro de validação (2026-09-22)

Produção: https://aletheia-demo-tau.vercel.app. Vercel Authentication
desligada no projeto (loja pública; sem segredo no workflow).

| PR | Natureza | Veredito | Tempo PR → comentário |
|---|---|---|---|
| #1 | legítima: frase a mais em `/sobre` | 🟢 `UNDETERMINED_ONLY`, 3 deltas, 0 bloqueante | 58 s |
| #2 | D1: desconto 15% → 10% no JSON | 🔴 bloqueia — `descontoPercentual` na rede | 56 s |
| #3 | D2: produto removido do JSON | 🔴 bloqueia — item removido + 2 `href` trocados | 63 s |
| #4 | D3: link do rodapé → `/sobre-nos` | 🔴 bloqueia — `href` em 6 páginas, 1 grupo | 75 s |
| #5 | D4: checagem de estoque invertida | 🔴 bloqueia — 6 botões "Adicionar" removidos | 62 s |
| #6 | D5: total do carrinho ignora a quantidade | 🟢 `UNDETERMINED_ONLY` — **passou**: texto de dinheiro que muda é MEDIUM; o problema do oráculo, declarado | 67 s |

Os PRs de defeito ficam abertos como registro; não devem ser mesclados. O #6 é
um falso negativo declarado: a jornada com ações chega ao carrinho errado,
mas um total que muda de `R$ 382,26` para `R$ 271,84` é mudança de texto —
sem fonte de verdade para o valor (banco, contrato), a tela não decide.
Leitura completa em `docs/medicao-fase-1.md` §11 do ALETHEIA.
