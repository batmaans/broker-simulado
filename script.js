// ==========================================
// VARIÁVEIS GLOBAIS E ESTADO
// ==========================================
let grafico;
let currentUserData = null;

// Formatador de Moeda BRL
const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

let ativosIniciais = [
  { nome: "PETR4", preco: 30, icon: "🛢️", historico: [] },
  { nome: "VALE3", preco: 60, icon: "⛏️", historico: [] },
  { nome: "ITUB4", preco: 28, icon: "🏦", historico: [] },
  { nome: "BBDC4", preco: 15, icon: "💳", historico: [] },
  { nome: "ABEV3", preco: 13, icon: "🍺", historico: [] },
  { nome: "WEGE3", preco: 40, icon: "⚙️", historico: [] },
  { nome: "MGLU3", preco: 5, icon: "🛍️", historico: [] }
];
let ativos = JSON.parse(JSON.stringify(ativosIniciais));

// ==========================================
// INICIALIZAÇÃO DE ROTAS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.login-body')) {
        initLogin();
    } else if (document.querySelector('.dashboard-body')) {
        initDashboard();
    }
});

// ==========================================
// FUNÇÕES DE DADOS (LOCALSTORAGE)
// ==========================================
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || {};
}

function saveAllUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getUser() {
    if (!currentUserData) {
        const username = sessionStorage.getItem('currentUser');
        currentUserData = getAllUsers()[username];
    }
    return currentUserData;
}

function saveUsers() {
    const username = sessionStorage.getItem('currentUser');
    if (username && currentUserData) {
        const all = getAllUsers();
        all[username] = currentUserData;
        saveAllUsers(all);
    }
}

// ==========================================
// LÓGICA DO LOGIN (login.html)
// ==========================================
function initLogin() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.target));
    });
    document.getElementById('btn-do-login').addEventListener('click', doLogin);
    document.getElementById('btn-do-register').addEventListener('click', doRegister);
    document.getElementById('link-to-register').addEventListener('click', () => switchTab('register'));
    document.getElementById('link-to-login').addEventListener('click', () => switchTab('login'));

    document.getElementById('login-pass').addEventListener('keydown', (e) => { if(e.key === 'Enter') doLogin(); });
    document.getElementById('reg-pass').addEventListener('keydown', (e) => { if(e.key === 'Enter') doRegister(); });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.target === tab));
    document.getElementById('panel-login').classList.toggle('active', tab === 'login');
    document.getElementById('panel-register').classList.toggle('active', tab === 'register');
    ['msg-login', 'msg-register'].forEach(id => {
        const el = document.getElementById(id); el.textContent = ''; el.className = 'msg';
    });
}

function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = `msg visible ${type}`;
}

function doLogin() {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    if (!u || !p) return showMsg('msg-login', 'Preencha usuário e senha.', 'err');
    const users = getAllUsers();
    if (users[u] && users[u].senha === p) {
        sessionStorage.setItem('currentUser', u);
        window.location.href = 'index.html';
    } else {
        showMsg('msg-login', 'Usuário ou senha incorretos.', 'err');
    }
}

function doRegister() {
    const u = document.getElementById('reg-user').value.trim();
    const p = document.getElementById('reg-pass').value;
    if (!u || !p) return showMsg('msg-register', 'Preencha todos os campos.', 'err');
    if (p.length < 6) return showMsg('msg-register', 'Mínimo de 6 caracteres.', 'err');
    
    const users = getAllUsers();
    if (users[u]) return showMsg('msg-register', 'Esse usuário já existe.', 'err');
    
    users[u] = { senha: p, saldo: 10000, saldoInicial: 10000, carteira: {}, historico: [] };
    saveAllUsers(users);
    showMsg('msg-register', '✔ Conta criada! Faça seu login.', 'ok');
    setTimeout(() => {
        document.getElementById('login-user').value = u;
        document.getElementById('login-pass').value = '';
        switchTab('login');
    }, 1200);
}

// ==========================================
// LÓGICA DO DASHBOARD (index.html)
// ==========================================
function initDashboard() {
    const username = sessionStorage.getItem('currentUser');
    if (!username) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userDisplay').innerText = username;
    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Inicia os gráficos com o primeiro ativo
    ativos.forEach(a => a.historico.push(a.preco)); 
    mostrarGrafico(0);

    renderAtivos();
    atualizarTudo();

    setInterval(() => {
        atualizarPrecos();
        calcularPatrimonio();
        atualizarIndicadorMercado();
    }, 2000);
}

function atualizarSaldo() {
    const el = document.getElementById("saldo");
    if (el) el.innerText = formatMoney(getUser().saldo);
}

function calcularPatrimonio() {
    let user = getUser();
    let total = user.saldo;
    ativos.forEach(a => {
        if (user.carteira[a.nome]) {
            total += user.carteira[a.nome] * a.preco;
        }
    });
    
    document.getElementById("patrimonio").innerText = formatMoney(total);
    
    let lucro = total - user.saldoInicial;
    let perc = (lucro / user.saldoInicial) * 100;
    const rentEl = document.getElementById("rentabilidade");
    rentEl.innerText = (perc >= 0 ? "+" : "") + perc.toFixed(2) + "%";
    rentEl.className = "kpi-value " + (perc >= 0 ? "text-success" : "text-danger");
}

function renderAtivos() {
    let div = document.getElementById("ativos");
    div.innerHTML = "";
    ativos.forEach((a, i) => {
        div.innerHTML += `
            <div class="ativo-item">
                <div class="ativo-header">
                    <span class="ativo-nome">${a.icon} ${a.nome}</span>
                    <span class="ativo-preco" id="preco${i}">${formatMoney(a.preco)}</span>
                </div>
                <div class="ativo-actions">
                    <input type="number" id="qtd${i}" placeholder="Qtd" min="1" value="1">
                    <button class="btn-buy" onclick="comprar(${i})">C</button>
                    <button class="btn-sell" onclick="vender(${i})">V</button>
                    <button class="btn-icon" onclick="mostrarGrafico(${i})" title="Ver Gráfico">📈</button>
                </div>
            </div>
        `;
    });
}

function atualizarPrecosNaTela() {
    ativos.forEach((a, i) => {
        let el = document.getElementById(`preco${i}`);
        if (el) {
            el.innerText = formatMoney(a.preco);
            // Efeito visual sutil de piscar
            el.style.color = 'var(--text)';
            setTimeout(() => {
                let tendencia = a.historico[a.historico.length - 1] > a.historico[a.historico.length - 2];
                el.style.color = tendencia ? 'var(--accent)' : 'var(--danger)';
            }, 100);
        }
    });
}

window.comprar = function(i) {
    let user = getUser();
    let a = ativos[i];
    let inputEl = document.getElementById(`qtd${i}`);
    let qtd = parseInt(inputEl.value) || 1;
    let custo = qtd * a.preco;
    
    if (user.saldo >= custo) {
        user.saldo -= custo;
        user.carteira[a.nome] = (user.carteira[a.nome] || 0) + qtd;
        
        const dataStr = new Date().toLocaleTimeString('pt-BR');
        user.historico.unshift({ tipo: 'compra', txt: `[${dataStr}] COMPRA: ${qtd}x ${a.nome} por ${formatMoney(a.preco)}`});
        
        saveUsers();
        atualizarTudo();
    } else {
        alert("Saldo insuficiente para esta operação.");
    }
};

window.vender = function(i) {
    let user = getUser();
    let a = ativos[i];
    let inputEl = document.getElementById(`qtd${i}`);
    let qtd = parseInt(inputEl.value) || 1;
    
    if (user.carteira[a.nome] >= qtd) {
        user.saldo += qtd * a.preco;
        user.carteira[a.nome] -= qtd;
        
        const dataStr = new Date().toLocaleTimeString('pt-BR');
        user.historico.unshift({ tipo: 'venda', txt: `[${dataStr}] VENDA: ${qtd}x ${a.nome} por ${formatMoney(a.preco)}`});
        
        saveUsers();
        atualizarTudo();
    } else {
        alert("Você não possui essa quantidade de ações para vender.");
    }
};

function renderCarteira() {
    const carteiraTbody = document.getElementById("carteira");
    carteiraTbody.innerHTML = "";
    let user = getUser();
    let temAtivos = false;

    ativos.forEach(a => {
        let qtd = user.carteira[a.nome] || 0;
        if (qtd > 0) {
            temAtivos = true;
            let valorAtual = qtd * a.preco;
            carteiraTbody.innerHTML += `
                <tr>
                    <td><strong>${a.nome}</strong></td>
                    <td class="font-mono">${qtd}</td>
                    <td class="font-mono text-success">${formatMoney(valorAtual)}</td>
                </tr>
            `;
        }
    });

    if (!temAtivos) {
        carteiraTbody.innerHTML = `<tr><td colspan="3" class="text-muted" style="text-align: center;">Sua carteira está vazia.</td></tr>`;
    }
}

function renderHistorico() {
    const histDiv = document.getElementById("historico");
    let user = getUser();
    
    if (user.historico.length === 0) {
        histDiv.innerHTML = `<div class="text-muted" style="text-align: center; margin-top: 20px;">Nenhuma operação realizada.</div>`;
        return;
    }

    histDiv.innerHTML = user.historico.map(h => {
        // Suporte retroativo caso o histórico antigo fosse apenas string
        if (typeof h === 'string') return `<div class="history-item">${h}</div>`;
        return `<div class="history-item ${h.tipo}">${h.txt}</div>`;
    }).join("");
}

function atualizarPrecos() {
    let tendencia = getTendencia();
    ativos.forEach((a, i) => {
        let variacao = (Math.random() - 0.5 + tendencia) * 2;
        a.preco += variacao;
        if (a.preco < 1) a.preco = 1;
        a.historico.push(a.preco);
        
        // Mantém o histórico do gráfico num limite razoável para não pesar a memória
        if(a.historico.length > 50) a.historico.shift(); 
    });
    
    atualizarPrecosNaTela();
    
    // Atualiza o gráfico se estiver visível
    if (grafico && grafico.data.datasets[0].label) {
        let ativoAtual = ativos.find(a => a.nome === grafico.data.datasets[0].label);
        if (ativoAtual) {
            grafico.data.labels = ativoAtual.historico.map((_, i) => i);
            grafico.data.datasets[0].data = ativoAtual.historico;
            grafico.update('none'); // Update sem animação brusca
        }
    }
}

window.mostrarGrafico = function(i) {
    let a = ativos[i];
    document.getElementById('chart-title').innerText = `${a.icon} ${a.nome}`;
    
    if (grafico) grafico.destroy();
    
    let canvas = document.getElementById("grafico");
    if (!canvas) return;
    
    grafico = new Chart(canvas, {
        type: 'line',
        data: {
            labels: a.historico.map((_, index) => index),
            datasets: [{
                label: a.nome,
                data: a.historico,
                borderWidth: 2,
                borderColor: '#00c853',
                backgroundColor: 'rgba(0, 200, 83, 0.1)',
                fill: true,
                pointRadius: 0,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    position: 'right',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#888', font: { family: "'Share Tech Mono', monospace" } }
                }
            }
        }
    });
};

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
    if (modo === "aleatorio") return (Math.random() - 0.5) * 1.5;
    return 0;
}

function atualizarIndicadorMercado() {
    // Função para integridade com os requisitos.
}

// ==========================================
// INTEGRAÇÃO COM API DE MERCADO REAL
// ==========================================

const API_KEY = UX11H1HW5ZV54XCU; // Chave da Alpha Vantage

async function buscarPrecoReal(ticker) {
    // Para ações brasileiras na Alpha Vantage, usamos o sufixo .SAO
    const symbol = `${ticker}.SAO`; 
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${UX11H1HW5ZV54XCU}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // A API retorna o campo "05. price" dentro de "Global Quote"
        if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
            return parseFloat(data["Global Quote"]["05. price"]);
        }
        return null;
    } catch (error) {
        console.error(`Erro ao buscar ${ticker}:`, error);
        return null;
    }
}

// Função para atualizar todos os ativos com preços reais
async function atualizarMercadoReal() {
    console.log("Buscando cotações em tempo real...");
    
    for (let i = 0; i < ativos.length; i++) {
        const precoReal = await buscarPrecoReal(ativos[i].nome);
        
        if (precoReal) {
            ativos[i].preco = precoReal;
            ativos[i].historico.push(precoReal);
            if (ativos[i].historico.length > 50) ativos[i].historico.shift();
        }
        
        // Delay para evitar o limite de "5 requisições por minuto" da conta gratuita
        await new Promise(resolve => setTimeout(resolve, 12000)); 
    }
    
    atualizarPrecosNaTela();
    atualizarTudo();
}

// Modificar sua função de intervalo (setInterval) existente:
setInterval(() => {
    const modo = document.getElementById("modoMercado").value;
    
    if (modo === "real") {
        // No modo real, não fazemos o cálculo randômico. 
        // Idealmente, chamamos a API em um intervalo maior (ex: a cada 1 min)
        // para não esgotar a cota gratuita.
    } else {
        atualizarPrecos();
        calcularPatrimonio();
    }
}, 2000);

// Escutador para quando mudar para o modo Real
document.getElementById("modoMercado").addEventListener('change', (e) => {
    if (e.target.value === "real") {
        if (API_KEY === UX11H1HW5ZV54XCU) {
            alert("Por favor, configure sua API_KEY no script.js");
            e.target.value = "lateral";
            return;
        }
        atualizarMercadoReal();
        // Define um loop mais lento para o modo real (ex: a cada 5 min)
        window.realMarketInterval = setInterval(atualizarMercadoReal, 300000);
    } else {
        clearInterval(window.realMarketInterval);
    }
});