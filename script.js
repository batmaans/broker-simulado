let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;
let grafico;

// AÇÕES
let ativos = [
  { nome: "PETR4", preco: 30, icon: "🛢️", historico: [] },
  { nome: "VALE3", preco: 60, icon: "⛏️", historico: [] },
  { nome: "ITUB4", preco: 28, icon: "🏦", historico: [] },
  { nome: "BBDC4", preco: 15, icon: "💳", historico: [] },
  { nome: "ABEV3", preco: 13, icon: "🍺", historico: [] },
  { nome: "WEGE3", preco: 40, icon: "⚙️", historico: [] },
  { nome: "MGLU3", preco: 5, icon: "🛍️", historico: [] }
];

// LOGIN

function register() {
  let u = username.value;
  let p = password.value;

  if (!u || !p) return;

  if (users[u]) {
    loginMsg.innerText = "Usuário já existe!";
    return;
  }

  users[u] = {
    senha: p,
    saldo: 10000,
    saldoInicial: 10000,
    carteira: {},
    historico: []
  };

  saveUsers();
  loginMsg.innerText = "Usuário criado!";
}

function login() {
  let u = username.value;
  let p = password.value;

  if (users[u] && users[u].senha === p) {
    currentUser = u;

    loginScreen.style.display = "none";
    app.style.display = "block";

    userDisplay.innerText = u;

    atualizarTudo();
    renderAtivos();
  } else {
    loginMsg.innerText = "Login inválido!";
  }
}

function logout() {
  currentUser = null;
  loginScreen.style.display = "flex";
  app.style.display = "none";
}

function getUser() {
  return users[currentUser];
}

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

// SALDO

function atualizarSaldo() {
  saldo.innerText = getUser().saldo.toFixed(2);
}

function calcularPatrimonio() {
  let user = getUser();
  let total = user.saldo;

  ativos.forEach(a => {
    if (user.carteira[a.nome]) {
      total += user.carteira[a.nome] * a.preco;
    }
  });

  patrimonio.innerText = total.toFixed(2);

  let lucro = total - user.saldoInicial;
  let perc = (lucro / user.saldoInicial) * 100;

  rentabilidade.innerText = perc.toFixed(2) + "%";
  rentabilidade.className = perc >= 0 ? "positivo" : "negativo";
}

// ATIVOS

function renderAtivos() {
  let div = document.getElementById("ativos");
  div.innerHTML = "";

  ativos.forEach((a, i) => {
    div.innerHTML += `
      <div>
        ${a.icon} ${a.nome} - R$ 
        <span id="preco${i}">${a.preco.toFixed(2)}</span>

        <input type="number" id="qtd${i}" placeholder="Qtd" style="width:60px;">

        <button class="btn-buy" onclick="comprar(${i})">Comprar</button>
        <button class="btn-sell" onclick="vender(${i})">Vender</button>
        <button onclick="mostrarGrafico(${i})">📈</button>
      </div>
    `;
  });
}

// ATUALIZA SÓ PREÇO (SEM APAGAR INPUT)

function atualizarPrecosNaTela() {
  ativos.forEach((a, i) => {
    let el = document.getElementById(`preco${i}`);
    if (el) el.innerText = a.preco.toFixed(2);
  });
}

// COMPRA/VENDA

function comprar(i) {
  let user = getUser();
  let a = ativos[i];
  let qtd = parseInt(document.getElementById(`qtd${i}`).value) || 1;

  let custo = qtd * a.preco;

  if (user.saldo >= custo) {
    user.saldo -= custo;
    user.carteira[a.nome] = (user.carteira[a.nome] || 0) + qtd;

    user.historico.push(`🟢 Compra ${qtd} ${a.nome}`);

    saveUsers();
    atualizarTudo();
  }
}

function vender(i) {
  let user = getUser();
  let a = ativos[i];
  let qtd = parseInt(document.getElementById(`qtd${i}`).value) || 1;

  if (user.carteira[a.nome] >= qtd) {
    user.saldo += qtd * a.preco;
    user.carteira[a.nome] -= qtd;

    user.historico.push(`🔴 Venda ${qtd} ${a.nome}`);

    saveUsers();
    atualizarTudo();
  }
}

// RENDER

function renderCarteira() {
  carteira.innerHTML = "";

  let user = getUser();

  for (let a in user.carteira) {
    if (user.carteira[a] > 0) {
      carteira.innerHTML += `<div>${a}: ${user.carteira[a]}</div>`;
    }
  }
}

function renderHistorico() {
  historico.innerHTML =
    getUser().historico.map(h => `<div>${h}</div>`).join("");
}

// MERCADO

function atualizarPrecos() {
  let tendencia = getTendencia();

  ativos.forEach(a => {
    let variacao = (Math.random() - 0.5 + tendencia) * 2;

    a.preco += variacao;

    if (a.preco < 1) a.preco = 1;

    a.historico.push(a.preco);
  });

  atualizarPrecosNaTela();
}

// GRÁFICO

function mostrarGrafico(i) {
  let a = ativos[i];

  if (grafico) grafico.destroy();

  let canvas = document.getElementById("grafico");
  if (!canvas) return;

  grafico = new Chart(canvas, {
    type: 'line',
    data: {
      labels: a.historico.map((_, i) => i),
      datasets: [{
        label: a.nome,
        data: a.historico,
        borderWidth: 2
      }]
    }
  });
}

// LOOP

function atualizarTudo() {
  atualizarSaldo();
  calcularPatrimonio();
  renderCarteira();
  renderHistorico();
}

function getTendencia() {
  let modo = document.getElementById("modoMercado").value;

  if (modo === "bull") return 0.3;
  if (modo === "bear") return -0.3;
  if (modo === "lateral") return 0;

  // 🎲 ALEATÓRIO (mais volatilidade e sem direção)
  if (modo === "aleatorio") {
    return (Math.random() - 0.5) * 1.2;
  }

  return 0;
}

function atualizarIndicadorMercado() {
  let modo = document.getElementById("modoMercado").value;
  let el = document.getElementById("modoAtual");

  if (!el) return;

  if (modo === "bull") {
    el.innerText = "📈 Mercado em Alta";
    el.className = "positivo";
  } else if (modo === "bear") {
    el.innerText = "📉 Mercado em Baixa";
    el.className = "negativo";
  } else {
    el.innerText = "➡️ Mercado Lateral";
    el.className = "";
  }
}


setInterval(() => {
  atualizarPrecos();
  calcularPatrimonio();
  atualizarIndicadorMercado();
}, 2000);