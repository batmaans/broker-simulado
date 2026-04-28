// ==========================================
// VARIÁVEIS GLOBAIS E ESTADO
// ==========================================
let grafico;
let currentUserData = null;

const formatMoney = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// ─── TOKEN DA API DE MERCADO REAL ─────────────────────────
// Obtido gratuitamente em: https://brapi.dev
const BRAPI_TOKEN = "qGDLJb954uzwMSF7qnzYt2";

let ativosIniciais = [
  { nome: "PETR4", preco: 30, icon: "🛢️", historico: [] },
  { nome: "VALE3", preco: 60, icon: "⛏️", historico: [] },
  { nome: "ITUB4", preco: 28, icon: "🏦", historico: [] },
  { nome: "BBDC4", preco: 15, icon: "💳", historico: [] },
  { nome: "ABEV3", preco: 13, icon: "🍺", historico: [] },
  { nome: "WEGE3", preco: 40, icon: "⚙️", historico: [] },
  { nome: "MGLU3", preco: 5,  icon: "🛍️", historico: [] }
];
let ativos = JSON.parse(JSON.stringify(ativosIniciais));

// ==========================================
// ROTEAMENTO — detecta qual página está ativa
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if      (document.querySelector('.login-body'))     initLogin();
    else if (document.querySelector('.dashboard-body')) initDashboard();
    else if (document.querySelector('.profile-body'))   initProfile();
});

// ==========================================
// HELPERS DE DADOS (LOCALSTORAGE)
// ==========================================
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || {};
}

function saveAllUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getUsername() {
    return sessionStorage.getItem('currentUser');
}

function getUser() {
    // No dashboard usamos cache para performance; no perfil sempre lemos fresco
    if (document.querySelector('.profile-body')) {
        return getAllUsers()[getUsername()];
    }
    if (!currentUserData) {
        currentUserData = getAllUsers()[getUsername()];
    }
    return currentUserData;
}

function saveUsers() {
    // Usado no dashboard (atualiza via cache)
    const username = getUsername();
    if (username && currentUserData) {
        const all = getAllUsers();
        all[username] = currentUserData;
        saveAllUsers(all);
    }
}

function saveUser(data) {
    // Usado no perfil (salva objeto direto)
    const all = getAllUsers();
    all[getUsername()] = data;
    saveAllUsers(all);
    currentUserData = data;
}

// showMsg inteligente: preserva a classe base do elemento (msg ou p-msg)
function showMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    const baseClass = el.classList.contains('p-msg') ? 'p-msg' : 'msg';
    el.textContent = text;
    el.className = `${baseClass} visible ${type}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = baseClass; }, 3500);
}

// ==========================================
// LOGIN (login.html)
// ==========================================
function initLogin() {
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.target))
    );
    document.getElementById('btn-do-login').addEventListener('click', doLogin);
    document.getElementById('btn-do-register').addEventListener('click', doRegister);
    document.getElementById('link-to-register').addEventListener('click', () => switchTab('register'));
    document.getElementById('link-to-login').addEventListener('click', () => switchTab('login'));
    document.getElementById('link-to-forgot').addEventListener('click', () => switchPanel('forgot'));
    document.getElementById('link-back-to-login').addEventListener('click', () => switchPanel('login'));

    document.getElementById('login-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    document.getElementById('reg-pass').addEventListener('keydown',   (e) => { if (e.key === 'Enter') doRegister(); });

    document.getElementById('btn-forgot-step1').addEventListener('click', forgotStep1);
    document.getElementById('forgot-user').addEventListener('keydown', (e) => { if (e.key === 'Enter') forgotStep1(); });
    document.getElementById('btn-forgot-step2').addEventListener('click', forgotStep2);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.target === tab)
    );
    document.getElementById('mainTabs').style.display = '';
    document.getElementById('panel-login').classList.toggle('active', tab === 'login');
    document.getElementById('panel-register').classList.toggle('active', tab === 'register');
    document.getElementById('panel-forgot').classList.remove('active');
    ['msg-login', 'msg-register'].forEach(id => {
        const el = document.getElementById(id);
        el.textContent = ''; el.className = 'msg';
    });
}

function switchPanel(panel) {
    ['panel-login', 'panel-register', 'panel-forgot'].forEach(id =>
        document.getElementById(id).classList.remove('active')
    );
    document.getElementById(`panel-${panel}`).classList.add('active');

    if (panel === 'forgot') {
        document.getElementById('mainTabs').style.display = 'none';
        document.getElementById('forgot-step1').style.display = '';
        document.getElementById('forgot-step2').style.display = 'none';
        document.getElementById('forgot-user').value = '';
        document.getElementById('msg-forgot-step1').textContent = '';
        document.getElementById('msg-forgot-step1').className = 'msg';
    } else {
        document.getElementById('mainTabs').style.display = '';
        document.querySelectorAll('.tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.target === panel)
        );
    }
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
    const q = document.getElementById('reg-question').value;
    const a = document.getElementById('reg-answer').value.trim();

    if (!u || !p) return showMsg('msg-register', 'Preencha usuário e senha.', 'err');
    if (p.length < 6) return showMsg('msg-register', 'Mínimo de 6 caracteres na senha.', 'err');
    if (!q) return showMsg('msg-register', 'Escolha uma pergunta de segurança.', 'err');
    if (!a) return showMsg('msg-register', 'Responda à pergunta de segurança.', 'err');

    const users = getAllUsers();
    if (users[u]) return showMsg('msg-register', 'Esse usuário já existe.', 'err');

    users[u] = {
        senha: p,
        saldo: 10000,
        saldoInicial: 10000,
        carteira: {},
        historico: [],
        avatar: '👤',
        segurança: { pergunta: q, resposta: a.toLowerCase() }
    };
    saveAllUsers(users);
    showMsg('msg-register', '✔ Conta criada! Faça seu login.', 'ok');
    setTimeout(() => {
        document.getElementById('login-user').value = u;
        document.getElementById('login-pass').value = '';
        switchTab('login');
    }, 1200);
}

// ── ESQUECI MINHA SENHA ──────────────────────────────────
function forgotStep1() {
    const u = document.getElementById('forgot-user').value.trim();
    if (!u) return showMsg('msg-forgot-step1', 'Informe seu nome de usuário.', 'err');

    const users = getAllUsers();
    const user  = users[u];
    if (!user) return showMsg('msg-forgot-step1', 'Usuário não encontrado.', 'err');
    if (!user.segurança) return showMsg('msg-forgot-step1', 'Esta conta não possui pergunta de segurança cadastrada.', 'err');

    document.getElementById('forgot-question-text').textContent = user.segurança.pergunta;
    document.getElementById('forgot-step1').style.display = 'none';
    document.getElementById('forgot-step2').style.display = 'flex';
    ['forgot-answer', 'forgot-newpass', 'forgot-confirm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('msg-forgot-step2').textContent = '';
    document.getElementById('msg-forgot-step2').className = 'msg';
}

function forgotStep2() {
    const u       = document.getElementById('forgot-user').value.trim();
    const answer  = document.getElementById('forgot-answer').value.trim().toLowerCase();
    const newPass = document.getElementById('forgot-newpass').value;
    const confirm = document.getElementById('forgot-confirm').value;

    if (!answer)            return showMsg('msg-forgot-step2', 'Responda à pergunta de segurança.', 'err');
    if (newPass.length < 6) return showMsg('msg-forgot-step2', 'A nova senha precisa ter pelo menos 6 caracteres.', 'err');
    if (newPass !== confirm) return showMsg('msg-forgot-step2', 'As senhas não coincidem.', 'err');

    const users = getAllUsers();
    const user  = users[u];
    if (user.segurança.resposta !== answer)
        return showMsg('msg-forgot-step2', 'Resposta incorreta. Tente novamente.', 'err');

    user.senha = newPass;
    saveAllUsers(users);
    showMsg('msg-forgot-step2', '✔ Senha redefinida com sucesso!', 'ok');
    setTimeout(() => {
        document.getElementById('login-user').value = u;
        document.getElementById('login-pass').value = '';
        switchPanel('login');
    }, 1500);
}

// ==========================================
// DASHBOARD (index.html)
// ==========================================
let realMarketInterval = null;

function initDashboard() {
    const username = getUsername();
    if (!username) { window.location.href = 'login.html'; return; }

    document.getElementById('userDisplay').innerText = username;
    atualizarAvatarTopbar();

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    ativos.forEach(a => a.historico.push(a.preco));
    mostrarGrafico(0);
    renderAtivos();
    atualizarTudo();

    // Simulacao roda sempre, mas ignora quando modo for "real"
    setInterval(() => {
        if (document.getElementById('modoMercado').value !== 'real') {
            atualizarPrecos();
            calcularPatrimonio();
        }
    }, 2000);

    // Listener do seletor de mercado
    document.getElementById('modoMercado').addEventListener('change', (e) => {
        if (e.target.value === 'real') {
            iniciarMercadoReal();
        } else {
            pararMercadoReal();
        }
    });
}

function atualizarAvatarTopbar() {
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        const user = getAllUsers()[getUsername()]; // sempre fresco para refletir mudança no perfil
        avatarEl.textContent = (user && user.avatar) ? user.avatar : '👤';
    }
}

function atualizarSaldo() {
    const el = document.getElementById("saldo");
    if (el) el.innerText = formatMoney(getUser().saldo);
}

function calcularPatrimonio() {
    const user = getUser();
    let total = user.saldo;
    ativos.forEach(a => {
        if (user.carteira[a.nome]) total += user.carteira[a.nome] * a.preco;
    });
    document.getElementById("patrimonio").innerText = formatMoney(total);
    const lucro = total - user.saldoInicial;
    const perc  = (lucro / user.saldoInicial) * 100;
    const rentEl = document.getElementById("rentabilidade");
    rentEl.innerText = (perc >= 0 ? "+" : "") + perc.toFixed(2) + "%";
    rentEl.className = "kpi-value " + (perc >= 0 ? "text-success" : "text-danger");
}

function renderAtivos() {
    const div = document.getElementById("ativos");
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
                    <button class="btn-buy"  onclick="comprar(${i})">C</button>
                    <button class="btn-sell" onclick="vender(${i})">V</button>
                    <button class="btn-icon" onclick="mostrarGrafico(${i})" title="Ver Gráfico">📈</button>
                </div>
            </div>`;
    });
}

function atualizarPrecosNaTela() {
    ativos.forEach((a, i) => {
        const el = document.getElementById(`preco${i}`);
        if (el) {
            el.innerText = formatMoney(a.preco);
            el.style.color = 'var(--text)';
            setTimeout(() => {
                const subiu = a.historico[a.historico.length - 1] > a.historico[a.historico.length - 2];
                el.style.color = subiu ? 'var(--accent)' : 'var(--danger)';
            }, 100);
        }
    });
}

window.comprar = function(i) {
    const user  = getUser();
    const a     = ativos[i];
    const qtd   = parseInt(document.getElementById(`qtd${i}`).value) || 1;
    const custo = qtd * a.preco;
    if (user.saldo >= custo) {
        user.saldo -= custo;
        user.carteira[a.nome] = (user.carteira[a.nome] || 0) + qtd;
        const ts = new Date().toLocaleTimeString('pt-BR');
        user.historico.unshift({ tipo: 'compra', txt: `[${ts}] COMPRA: ${qtd}x ${a.nome} por ${formatMoney(a.preco)}` });
        saveUsers();
        atualizarTudo();
    } else {
        alert("Saldo insuficiente para esta operação.");
    }
};

window.vender = function(i) {
    const user = getUser();
    const a    = ativos[i];
    const qtd  = parseInt(document.getElementById(`qtd${i}`).value) || 1;
    if ((user.carteira[a.nome] || 0) >= qtd) {
        user.saldo += qtd * a.preco;
        user.carteira[a.nome] -= qtd;
        const ts = new Date().toLocaleTimeString('pt-BR');
        user.historico.unshift({ tipo: 'venda', txt: `[${ts}] VENDA: ${qtd}x ${a.nome} por ${formatMoney(a.preco)}` });
        saveUsers();
        atualizarTudo();
    } else {
        alert("Você não possui essa quantidade de ações para vender.");
    }
};

function renderCarteira() {
    const tbody = document.getElementById("carteira");
    tbody.innerHTML = "";
    const user = getUser();
    let temAtivos = false;
    ativos.forEach(a => {
        const qtd = user.carteira[a.nome] || 0;
        if (qtd > 0) {
            temAtivos = true;
            tbody.innerHTML += `
                <tr>
                    <td><strong>${a.nome}</strong></td>
                    <td class="font-mono">${qtd}</td>
                    <td class="font-mono text-success">${formatMoney(qtd * a.preco)}</td>
                </tr>`;
        }
    });
    if (!temAtivos)
        tbody.innerHTML = `<tr><td colspan="3" class="text-muted" style="text-align:center">Sua carteira está vazia.</td></tr>`;
}

function renderHistorico() {
    const histDiv = document.getElementById("historico");
    const user    = getUser();
    if (!user.historico.length) {
        histDiv.innerHTML = `<div class="text-muted" style="text-align:center;margin-top:20px">Nenhuma operação realizada.</div>`;
        return;
    }
    histDiv.innerHTML = user.historico.map(h => {
        if (typeof h === 'string') return `<div class="history-item">${h}</div>`;
        return `<div class="history-item ${h.tipo}">${h.txt}</div>`;
    }).join("");
}

function atualizarPrecos() {
    const tendencia = getTendencia();
    ativos.forEach(a => {
        const variacao = (Math.random() - 0.5 + tendencia) * 2;
        a.preco += variacao;
        if (a.preco < 1) a.preco = 1;
        a.historico.push(a.preco);
        if (a.historico.length > 50) a.historico.shift();
    });
    atualizarPrecosNaTela();
    if (grafico && grafico.data.datasets[0].label) {
        const ativoAtual = ativos.find(a => a.nome === grafico.data.datasets[0].label);
        if (ativoAtual) {
            grafico.data.labels = ativoAtual.historico.map((_, i) => i);
            grafico.data.datasets[0].data = ativoAtual.historico;
            grafico.update('none');
        }
    }
}

window.mostrarGrafico = function(i) {
    const a = ativos[i];
    document.getElementById('chart-title').innerText = `${a.icon} ${a.nome}`;
    if (grafico) grafico.destroy();
    const canvas = document.getElementById("grafico");
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
                backgroundColor: 'rgba(0,200,83,0.1)',
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
    atualizarAvatarTopbar();
}

function getTendencia() {
    const el = document.getElementById("modoMercado");
    if (!el) return 0;
    const modo = el.value;
    if (modo === "bull")      return 0.3;
    if (modo === "bear")      return -0.3;
    if (modo === "lateral")   return 0;
    if (modo === "aleatorio") return (Math.random() - 0.5) * 1.5;
    return 0; // "real" — precos vem da API
}

// ==========================================
// MERCADO REAL — brapi.dev (gratuito, requer token)
// ==========================================

function setStatusMercado(texto, cor) {
    const el = document.querySelector('.panel-header h2');
    if (!el) return;
    const statusId = 'market-status-label';
    let span = document.getElementById(statusId);
    if (!span) {
        span = document.createElement('span');
        span.id = statusId;
        span.style.cssText = 'font-size:11px; font-weight:400; margin-left:8px; font-family:var(--mono);';
        el.appendChild(span);
    }
    span.textContent = texto;
    span.style.color = cor;
}

async function buscarPrecosReais() {
    if (!BRAPI_TOKEN || BRAPI_TOKEN === 'SEU_TOKEN_AQUI') {
        setStatusMercado('\u26a0 configure o token em script.js', 'var(--danger)');
        console.warn('Mercado Real: insira seu token brapi.dev na constante BRAPI_TOKEN no topo do script.js');
        pararMercadoReal();
        document.getElementById('modoMercado').value = 'lateral';
        return;
    }

    const tickers = ativos[0].nome;
    const url = `https://brapi.dev/api/quote/${tickers}?interval=1d&currency=BRL&token=${BRAPI_TOKEN}`;

    setStatusMercado('\u27f3 atualizando...', 'var(--text-muted)');

    try {
        const res  = await fetch(url);
        const data = await res.json();

        if (data.message) {
            setStatusMercado(`\u26a0 ${data.message}`, 'var(--danger)');
            console.error('Erro brapi.dev:', data.message);
            return;
        }

        if (!data.results || data.results.length === 0) {
            setStatusMercado('\u26a0 nenhum dado retornado', 'var(--danger)');
            return;
        }

        const result = data.results[0];
            if (result && result.regularMarketPrice) {
                ativos[0].preco = result.regularMarketPrice;
                 ativos[0].historico.push(ativos[0].preco);
            if (ativos[0].historico.length > 50) ativos[0].historico.shift();
        }

        atualizarPrecosNaTela();
        calcularPatrimonio();

        if (grafico && grafico.data.datasets[0].label) {
            const ativoAtual = ativos.find(a => a.nome === grafico.data.datasets[0].label);
            if (ativoAtual) {
                grafico.data.labels = ativoAtual.historico.map((_, i) => i);
                grafico.data.datasets[0].data = ativoAtual.historico;
                grafico.update('none');
            }
        }

        const agora = new Date().toLocaleTimeString('pt-BR');
        setStatusMercado(`\u2714 B3 \u00b7 ${agora}`, 'var(--accent)');

    } catch (err) {
        console.error('Erro ao buscar precos reais:', err);
        setStatusMercado('\u2716 erro de conexao', 'var(--danger)');
    }
}

function iniciarMercadoReal() {
    buscarPrecosReais();
    realMarketInterval = setInterval(buscarPrecosReais, 60000);
}

function pararMercadoReal() {
    clearInterval(realMarketInterval);
    realMarketInterval = null;
    const span = document.getElementById('market-status-label');
    if (span) span.remove();
}

// ==========================================
// PERFIL (profile.html)
// ==========================================
const EMOJIS = ['👤','🦊','🐻','🐼','🦁','🐯','🦋','🐉','🚀','💎','🔥','⚡','🌙','🎯','🤖'];

let modalAcao = null;

const MODAL_CONFIG = {
    reset: {
        title: '🔄 Resetar Saldo',
        subtitle: 'Isso irá redefinir seu saldo para R$ 10.000,00 (o padrão de entrada). Sua carteira e histórico serão mantidos.',
        btnLabel: 'Resetar Saldo',
        btnClass: 'btn-neutral'
    },
    clearHistory: {
        title: '🗑️ Limpar Histórico',
        subtitle: 'Todo o histórico de ordens será apagado permanentemente. Essa ação não pode ser desfeita.',
        btnLabel: 'Limpar Histórico',
        btnClass: 'btn-danger'
    },
    resetFull: {
        title: '💣 Resetar Conta Completa',
        subtitle: 'Isso irá zerar todo o seu progresso: saldo, carteira e histórico serão reiniciados ao estado inicial. Não pode ser desfeito.',
        btnLabel: 'Resetar Tudo',
        btnClass: 'btn-danger'
    },
    deleteAccount: {
        title: '🗑️ Excluir Conta',
        subtitle: 'Sua conta e todos os dados serão excluídos permanentemente. Você será redirecionado para o login.',
        btnLabel: 'Excluir Conta',
        btnClass: 'btn-danger'
    }
};

function initProfile() {
    const username = getUsername();
    if (!username || !getAllUsers()[username]) {
        window.location.href = 'login.html';
        return;
    }

    carregarPagina();

    document.getElementById('modalConfirmBtn').addEventListener('click', executarAcaoModal);
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharModal();
    });
}

function carregarPagina() {
    const username = getUsername();
    const user     = getAllUsers()[username]; // sempre lê fresco

    document.getElementById('userDisplay').textContent  = username;
    document.getElementById('heroUsername').textContent = username;
    document.getElementById('avatarEmoji').textContent  = user.avatar || '👤';

    const historico = user.historico || [];
    const compras   = historico.filter(h => h.tipo === 'compra' || (typeof h === 'string' && h.includes('COMPRA'))).length;
    const vendas    = historico.filter(h => h.tipo === 'venda'  || (typeof h === 'string' && h.includes('VENDA'))).length;
    const numAtivos = Object.values(user.carteira || {}).filter(q => q > 0).length;

    document.getElementById('heroSaldo').textContent  = formatMoney(user.saldo);
    document.getElementById('heroOps').textContent    = historico.length;
    document.getElementById('heroAtivos').textContent = numAtivos;

    const lucro   = user.saldo - user.saldoInicial;
    const perc    = (lucro / user.saldoInicial) * 100;
    const percStr = (perc >= 0 ? '+' : '') + perc.toFixed(2) + '%';

    document.getElementById('heroPatrimonio').textContent = formatMoney(user.saldo);
    const rentEl = document.getElementById('heroRentabilidade');
    rentEl.textContent = percStr;
    rentEl.className   = 'stat-pill-value ' + (perc >= 0 ? 'text-success' : 'text-danger');

    document.getElementById('statCompras').textContent = compras;
    document.getElementById('statVendas').textContent  = vendas;
    document.getElementById('statInicial').textContent = formatMoney(user.saldoInicial);

    const lucroEl = document.getElementById('statLucro');
    lucroEl.textContent = (lucro >= 0 ? '+' : '') + formatMoney(lucro);
    lucroEl.className   = 'stat-block-value ' + (lucro >= 0 ? 'text-success' : 'text-danger');

    const ratio = Math.min((user.saldo / user.saldoInicial) * 100, 200);
    const pct   = Math.max(0, Math.min(ratio, 100));
    document.getElementById('progressFill').style.width  = pct + '%';
    document.getElementById('progressLabel').textContent = ratio.toFixed(1) + '%';

    renderEmojiPicker();
}

function renderEmojiPicker() {
    const user      = getAllUsers()[getUsername()];
    const saved     = user.avatar || '👤';
    const container = document.getElementById('emojiPicker');
    container.innerHTML = EMOJIS.map(e => `
        <button onclick="selecionarAvatar('${e}')"
            style="
                font-size:22px;
                background:${e === saved ? 'var(--card)' : 'transparent'};
                border:1px solid ${e === saved ? 'var(--accent)' : 'var(--border)'};
                border-radius:8px; padding:6px 8px; cursor:pointer;
                transition:all 0.15s;
            "
            title="${e}">${e}</button>
    `).join('');
}

window.selecionarAvatar = function(emoji) {
    const user  = getAllUsers()[getUsername()];
    user.avatar = emoji;
    saveUser(user);
    document.getElementById('avatarEmoji').textContent = emoji;
    renderEmojiPicker();
    showMsg('msg-config', `✔ Avatar atualizado para ${emoji}`, 'ok');
};

window.alterarSaldo = function(tipo) {
    const raw  = parseFloat(document.getElementById('valorSaldo').value);
    if (!raw || raw <= 0) return showMsg('msg-saldo', '⚠ Insira um valor válido.', 'err');

    const user = getAllUsers()[getUsername()];
    if (tipo === 'add') {
        user.saldo += raw;
        showMsg('msg-saldo', `✔ ${formatMoney(raw)} adicionados ao saldo.`, 'ok');
    } else {
        if (raw > user.saldo) return showMsg('msg-saldo', '⚠ Saldo insuficiente para remover esse valor.', 'err');
        user.saldo -= raw;
        showMsg('msg-saldo', `✔ ${formatMoney(raw)} removidos do saldo.`, 'ok');
    }
    saveUser(user);
    document.getElementById('valorSaldo').value = '';
    carregarPagina();
};

window.alterarSenha = function() {
    const atual   = document.getElementById('senhaAtual').value;
    const nova    = document.getElementById('senhaNova').value;
    const confirm = document.getElementById('senhaConfirm').value;
    const user    = getAllUsers()[getUsername()];

    if (!atual || !nova || !confirm) return showMsg('msg-senha', '⚠ Preencha todos os campos.', 'err');
    if (user.senha !== atual)        return showMsg('msg-senha', '✖ Senha atual incorreta.', 'err');
    if (nova.length < 6)             return showMsg('msg-senha', '⚠ A nova senha precisa ter pelo menos 6 caracteres.', 'err');
    if (nova !== confirm)            return showMsg('msg-senha', '✖ As senhas não coincidem.', 'err');

    user.senha = nova;
    saveUser(user);
    showMsg('msg-senha', '✔ Senha alterada com sucesso!', 'ok');
    ['senhaAtual', 'senhaNova', 'senhaConfirm'].forEach(id => document.getElementById(id).value = '');
};

window.abrirModal = function(acao) {
    modalAcao = acao;
    const cfg = MODAL_CONFIG[acao];
    document.getElementById('modalTitle').textContent    = cfg.title;
    document.getElementById('modalSubtitle').textContent = cfg.subtitle;
    const btn = document.getElementById('modalConfirmBtn');
    btn.textContent = cfg.btnLabel;
    btn.className   = cfg.btnClass;
    document.getElementById('confirmModal').classList.add('open');
};

window.fecharModal = function() {
    document.getElementById('confirmModal').classList.remove('open');
    modalAcao = null;
};

function executarAcaoModal() {
    if (!modalAcao) return;
    const user = getAllUsers()[getUsername()];

    if (modalAcao === 'reset') {
        user.saldo = 10000;
        saveUser(user);
        showMsg('msg-saldo', '✔ Saldo resetado para R$ 10.000,00.', 'ok');
    } else if (modalAcao === 'clearHistory') {
        user.historico = [];
        saveUser(user);
        showMsg('msg-config', '✔ Histórico de ordens limpo.', 'ok');
    } else if (modalAcao === 'resetFull') {
        user.saldo        = 10000;
        user.saldoInicial = 10000;
        user.carteira     = {};
        user.historico    = [];
        saveUser(user);
        showMsg('msg-saldo', '✔ Conta resetada ao estado inicial.', 'ok');
    } else if (modalAcao === 'deleteAccount') {
        const all = getAllUsers();
        delete all[getUsername()];
        saveAllUsers(all);
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
        return;
    }

    fecharModal();
    carregarPagina();
}