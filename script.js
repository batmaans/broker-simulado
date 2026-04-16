let saldo = 10000;

let ativos = [
  { nome: "PETR4", preco: 30, variacao: 0 },
  { nome: "VALE3", preco: 60, variacao: 0 },
  { nome: "ITUB4", preco: 28, variacao: 0 },
  { nome: "DOLAR", preco: 5.2, variacao: 0 }
];

let carteira = {};

// Atualizar saldo
function atualizarSaldo() {
  document.getElementById("saldo").innerText = saldo.toFixed(2);
}

// Renderizar ativos
function renderAtivos() {
  const container = document.getElementById("ativos");
  container.innerHTML = "";

  ativos.forEach((ativo, index) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const variacaoClass = ativo.variacao >= 0 ? "up" : "down";
    const sinal = ativo.variacao >= 0 ? "+" : "";

    card.innerHTML = `
      <div class="nome">${ativo.nome}</div>
      <div class="preco">R$ ${ativo.preco.toFixed(2)}</div>
      <div class="variacao ${variacaoClass}">
        ${sinal}${ativo.variacao.toFixed(2)}
      </div>

      <button class="buy" onclick="comprar(${index})">Comprar</button>
      <button class="sell" onclick="vender(${index})">Vender</button>
    `;

    container.appendChild(card);
  });
}

// Comprar
function comprar(index) {
  let ativo = ativos[index];

  if (saldo >= ativo.preco) {
    saldo -= ativo.preco;

    if (!carteira[ativo.nome]) {
      carteira[ativo.nome] = 0;
    }

    carteira[ativo.nome]++;

    atualizarSaldo();
    renderCarteira();
  } else {
    alert("Saldo insuficiente!");
  }
}

// Vender
function vender(index) {
  let ativo = ativos[index];

  if (carteira[ativo.nome] > 0) {
    saldo += ativo.preco;
    carteira[ativo.nome]--;

    atualizarSaldo();
    renderCarteira();
  } else {
    alert("Você não possui esse ativo!");
  }
}

// Renderizar carteira
function renderCarteira() {
  const container = document.getElementById("carteira");
  container.innerHTML = "";

  for (let nome in carteira) {
    if (carteira[nome] > 0) {
      const div = document.createElement("div");
      div.classList.add("carteira-item");

      div.innerText = `${nome}: ${carteira[nome]} ações`;

      container.appendChild(div);
    }
  }
}

// Atualizar preços
function atualizarPrecos() {
  ativos.forEach(ativo => {
    let variacao = (Math.random() - 0.5) * 2;
    ativo.preco += variacao;
    ativo.variacao = variacao;

    if (ativo.preco < 1) ativo.preco = 1;
  });

  renderAtivos();
}

// Loop de atualização
setInterval(atualizarPrecos, 2000);

// Inicialização
atualizarSaldo();
renderAtivos();
renderCarteira();