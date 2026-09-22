/* Loja de demonstração do ALETHEIA — sem framework, sem build.
 * O catálogo vem de /data/produtos.json (camada de REDE observável); o
 * carrinho vive em localStorage; o desconto é aplicado no cliente. Tudo o
 * que aqui é "regra de negócio" existe para poder ser quebrado num PR e
 * detectado pelo diff: preço, desconto, estoque, total. */
(function () {
  "use strict";

  const formatar = (centavos) =>
    (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const comDesconto = (centavos, percentual) => Math.round(centavos * (100 - percentual) / 100);

  async function catalogo() {
    const resposta = await fetch("/data/produtos.json", { cache: "no-store" });
    if (!resposta.ok) throw new Error("catálogo indisponível: " + resposta.status);
    return resposta.json();
  }

  function lerCarrinho() {
    try { return JSON.parse(localStorage.getItem("carrinho") || "{}"); } catch { return {}; }
  }
  function gravarCarrinho(c) { localStorage.setItem("carrinho", JSON.stringify(c)); atualizarContador(); }
  function atualizarContador() {
    const n = Object.values(lerCarrinho()).reduce((a, b) => a + b, 0);
    const el = document.querySelector("[data-carrinho-contador]");
    if (el) el.textContent = String(n);
  }

  function marcarPaginaAtual() {
    const atual = location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll("header nav a").forEach((a) => {
      const alvo = a.getAttribute("href").replace(/\/$/, "") || "/";
      if (alvo === atual) a.setAttribute("aria-current", "page");
    });
  }

  async function paginaCatalogo(raiz) {
    const dados = await catalogo();
    raiz.innerHTML = "";
    for (const p of dados.produtos) {
      const cartao = document.createElement("article");
      cartao.className = "cartao";
      cartao.dataset.produto = p.id;
      const preco = comDesconto(p.precoCentavos, dados.descontoPercentual);
      cartao.innerHTML =
        '<h3><a href="/produto?id=' + p.id + '">' + p.nome + "</a></h3>" +
        '<div class="categoria">' + p.categoria + "</div>" +
        '<div class="preco"><span class="preco-antigo">' + formatar(p.precoCentavos) + "</span>" + formatar(preco) + "</div>" +
        (p.estoque > 0
          ? '<button class="botao" data-adicionar="' + p.id + '">Adicionar ao carrinho</button>'
          : '<span class="esgotado">Esgotado</span>');
      raiz.appendChild(cartao);
    }
    raiz.addEventListener("click", (evento) => {
      const id = evento.target.getAttribute && evento.target.getAttribute("data-adicionar");
      if (!id) return;
      const c = lerCarrinho();
      c[id] = (c[id] || 0) + 1;
      gravarCarrinho(c);
      evento.target.textContent = "Adicionado";
    });
  }

  async function paginaProduto(raiz) {
    const id = new URLSearchParams(location.search).get("id") || "camisa-titular";
    const dados = await catalogo();
    const p = dados.produtos.find((x) => x.id === id);
    if (!p) { raiz.innerHTML = "<p>Produto não encontrado.</p>"; return; }
    const preco = comDesconto(p.precoCentavos, dados.descontoPercentual);
    document.title = p.nome + " — Loja Demo ALETHEIA";
    raiz.innerHTML =
      "<h1>" + p.nome + "</h1>" +
      '<p class="categoria">Categoria: ' + p.categoria + "</p>" +
      '<p class="preco">De <span class="preco-antigo">' + formatar(p.precoCentavos) + "</span> por " + formatar(preco) +
      " <small>(" + dados.descontoPercentual + "% de desconto)</small></p>" +
      "<p>Estoque: <span data-estoque>" + p.estoque + "</span> unidade(s)</p>" +
      (p.estoque > 0 ? '<button class="botao" data-adicionar="' + p.id + '">Adicionar ao carrinho</button>' : '<span class="esgotado">Esgotado</span>');
    const botao = raiz.querySelector("[data-adicionar]");
    if (botao) botao.addEventListener("click", () => {
      const c = lerCarrinho(); c[p.id] = (c[p.id] || 0) + 1; gravarCarrinho(c); botao.textContent = "Adicionado";
    });
  }

  async function paginaCarrinho(raiz) {
    const dados = await catalogo();
    const c = lerCarrinho();
    const itens = Object.entries(c).map(([id, qtd]) => ({ p: dados.produtos.find((x) => x.id === id), qtd })).filter((i) => i.p);
    if (itens.length === 0) { raiz.innerHTML = '<p>Seu carrinho está vazio. <a href="/catalogo">Ver catálogo</a>.</p>'; return; }
    let total = 0;
    const linhas = itens.map((i) => {
      const unit = comDesconto(i.p.precoCentavos, dados.descontoPercentual);
      const sub = unit * i.qtd; total += sub;
      return "<tr data-item=\"" + i.p.id + "\"><td>" + i.p.nome + '</td><td class="num">' + i.qtd + '</td><td class="num">' + formatar(unit) + '</td><td class="num">' + formatar(sub) + "</td></tr>";
    }).join("");
    raiz.innerHTML =
      '<table class="tabela"><thead><tr><th>Produto</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Subtotal</th></tr></thead><tbody>' + linhas +
      '</tbody><tfoot><tr><th colspan="3">Total</th><th class="num" data-total>' + formatar(total) + "</th></tr></tfoot></table>" +
      '<p><button class="botao" data-limpar>Esvaziar carrinho</button></p>';
    raiz.querySelector("[data-limpar]").addEventListener("click", () => { gravarCarrinho({}); paginaCarrinho(raiz); });
  }

  function paginaContato(form) {
    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const nome = form.querySelector("[name=nome]").value.trim();
      const aviso = form.querySelector("[data-aviso]");
      aviso.textContent = nome ? "Obrigado, " + nome + ". Respondemos em até 2 dias úteis." : "Informe seu nome.";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    marcarPaginaAtual();
    atualizarContador();
    const alvo = document.querySelector("[data-pagina]");
    if (!alvo) return;
    const tipo = alvo.getAttribute("data-pagina");
    const executar = { catalogo: paginaCatalogo, produto: paginaProduto, carrinho: paginaCarrinho }[tipo];
    if (executar) executar(alvo).catch((erro) => { alvo.innerHTML = "<p>Erro: " + erro.message + "</p>"; console.error(erro); });
    if (tipo === "contato") paginaContato(alvo);
  });
})();
