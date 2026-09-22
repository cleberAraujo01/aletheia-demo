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

Os dois arquivos abaixo foram gerados por `aletheia init`, sem edição à mão:

- `.aletheia/jornada.json` — as rotas públicas descobertas num browser real.
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
