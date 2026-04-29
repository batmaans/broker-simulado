// ==========================================
// VARIÁVEIS GLOBAIS E ESTADO
// ==========================================
let grafico; //let global para o gráfico, para poder atualizar os dados dinamicamente
let currentUserData = null; // Cache do usuário logado para evitar leituras repetidas do localStorage (atualizado via saveUsers e saveUser)

const formatMoney = (value) => // Formatação de moeda brasileira
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); // Ex: formatMoney(1234.56) => "R$ 1.234,56"

// ─── TOKEN DA API DE MERCADO REAL ─────────────────────────
// Obtido gratuitamente em: https://brapi.dev
const BRAPI_TOKEN = "qGDLJb954uzwMSF7qnzYt2";

let ativosIniciais = [ // Lista de ativos disponíveis no mercado simulado
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
    return JSON.parse(localStorage.getItem('users')) || {}; //json.parse para converter string de volta para objeto, e fallback para {} caso não exista nada no localStorage ainda.
}

function saveAllUsers(users) {
    localStorage.setItem('users', JSON.stringify(users)); //json.stringify para converter objeto em string para armazenar no localStorage, que só aceita strings. O nome 'users' é a chave sob a qual os dados serão salvos.
}

function getUsername() {
    return sessionStorage.getItem('currentUser'); //sessionStorage é usado para armazenar o nome do usuário logado durante a sessão. Ele é limpo quando a aba ou navegador é fechado, ao contrário do localStorage que persiste mesmo após fechar o navegador.
}

function getUser() {
    // No dashboard usamos cache para performance; no perfil sempre lemos fresco
    if (document.querySelector('.profile-body')) {
        return getAllUsers()[getUsername()];
    }
    if (!currentUserData) {
        currentUserData = getAllUsers()[getUsername()];
    }
    return currentUserData; // Retorna os dados do usuário logado, usando cache para evitar leituras repetidas do localStorage. O cache é atualizado sempre que fazemos uma alteração via saveUsers ou saveUser.
}

function saveUsers() { // Usado após operações de compra/venda (atualiza via cache)
    // Usado no dashboard (atualiza via cache)
    const username = getUsername();
    if (username && currentUserData) {
        const all = getAllUsers();
        all[username] = currentUserData;
        saveAllUsers(all);
    }
}

function saveUser(data) { // Usado para salvar mudanças feitas no perfil (atualiza direto, sem cache)
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
function initLogin() { // Configura os listeners dos botões e links da página de login/cadastro
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

function switchTab(tab) { // Alterna entre as abas de login e cadastro
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

function switchPanel(panel) { // Alterna para o painel de "esqueci minha senha" ou volta para login
    ['panel-login', 'panel-register', 'panel-forgot'].forEach(id =>
        document.getElementById(id).classList.remove('active')
    );
    document.getElementById(`panel-${panel}`).classList.add('active');

    if (panel === 'forgot') { // Configura o painel de "esqueci minha senha" para o estado inicial
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

function doLogin() { // Verifica as credenciais do usuário e, se corretas, salva o nome do usuário na sessionStorage e redireciona para o dashboard
    const u = document.getElementById('login-user').value.trim(); //const u para pegar o valor do campo de usuário, usando trim() para remover espaços extras no início ou fim. O ID 'login-user' é o campo de input onde o usuário digita seu nome de usuário.
    const p = document.getElementById('login-pass').value; //const p para pegar o valor do campo de senha. O ID 'login-pass' é o campo de input onde o usuário digita sua senha. Não usamos trim() aqui porque senhas podem ter espaços no início ou fim, e isso pode ser intencional.
    if (!u || !p) return showMsg('msg-login', 'Preencha usuário e senha.', 'err'); // Se o usuário ou senha estiverem vazios, exibe uma mensagem de erro e retorna sem continuar o processo de login.
    const users = getAllUsers();
    if (users[u] && users[u].senha === p) {
        sessionStorage.setItem('currentUser', u);
        window.location.href = 'index.html'; // Redireciona para o dashboard após login bem-sucedido
    } else {
        showMsg('msg-login', 'Usuário ou senha incorretos.', 'err'); // Se as credenciais estiverem incorretas, exibe uma mensagem de erro. O processo de login é interrompido e o usuário permanece na página de login.
    }
}

function doRegister() { // Coleta os dados do formulário de registro, valida as entradas, verifica se o usuário já existe e, se tudo estiver correto, cria uma nova conta e redireciona para o login
    const u = document.getElementById('reg-user').value.trim();
    const p = document.getElementById('reg-pass').value;
    const q = document.getElementById('reg-question').value;
    const a = document.getElementById('reg-answer').value.trim();

    if (!u || !p) return showMsg('msg-register', 'Preencha usuário e senha.', 'err'); // Se o usuário ou senha estiverem vazios, exibe uma mensagem de erro e retorna sem continuar o processo de registro.
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
        segurança: { pergunta: q, resposta: a.toLowerCase() } // Armazenamos a resposta em minúsculas para facilitar a comparação na recuperação de senha, tornando a resposta case-insensitive. O campo 'segurança' é um objeto que contém a pergunta de segurança escolhida pelo usuário e a resposta correspondente, que será usada para verificar a identidade do usuário caso ele esqueça sua senha.
    };
    saveAllUsers(users); // Salva o novo usuário no localStorage. A função saveAllUsers é responsável por converter o objeto de usuários em uma string JSON e armazená-lo no localStorage sob a chave 'users'.
    showMsg('msg-register', '✔ Conta criada! Faça seu login.', 'ok'); // Exibe uma mensagem de sucesso indicando que a conta foi criada. O usuário é então instruído a fazer login com suas novas credenciais.
    setTimeout(() => {
        document.getElementById('login-user').value = u;
        document.getElementById('login-pass').value = '';
        switchTab('login');
    }, 1200); //1200 milissegundos (1.2 segundos) após mostrar a mensagem de sucesso, o formulário de login é preenchido com o nome de usuário recém-criado e a senha é limpa. Em seguida, a aba de login é ativada para que o usuário possa facilmente fazer login com suas novas credenciais.
}

// ── ESQUECI MINHA SENHA ──────────────────────────────────
function forgotStep1() {
    const u = document.getElementById('forgot-user').value.trim();
    if (!u) return showMsg('msg-forgot-step1', 'Informe seu nome de usuário.', 'err');
    // Verifica se o usuário existe e se tem pergunta de segurança configurada

    const users = getAllUsers();
    const user  = users[u];
    if (!user) return showMsg('msg-forgot-step1', 'Usuário não encontrado.', 'err');
    if (!user.segurança) return showMsg('msg-forgot-step1', 'Esta conta não possui pergunta de segurança cadastrada.', 'err');
    // Exibe a pergunta de segurança e mostra o segundo passo do processo de recuperação de senha

    document.getElementById('forgot-question-text').textContent = user.segurança.pergunta;
    document.getElementById('forgot-step1').style.display = 'none';
    document.getElementById('forgot-step2').style.display = 'flex';
    ['forgot-answer', 'forgot-newpass', 'forgot-confirm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('msg-forgot-step2').textContent = '';
    document.getElementById('msg-forgot-step2').className = 'msg';
}// O primeiro passo do processo de recuperação de senha. Ele coleta o nome de usuário, verifica se ele existe e se tem uma pergunta de segurança configurada. Se tudo estiver correto, exibe a pergunta de segurança e mostra o segundo passo do processo.

function forgotStep2() {
    const u       = document.getElementById('forgot-user').value.trim();
    const answer  = document.getElementById('forgot-answer').value.trim().toLowerCase();
    const newPass = document.getElementById('forgot-newpass').value;
    const confirm = document.getElementById('forgot-confirm').value;

    if (!answer)            return showMsg('msg-forgot-step2', 'Responda à pergunta de segurança.', 'err');
    if (newPass.length < 6) return showMsg('msg-forgot-step2', 'A nova senha precisa ter pelo menos 6 caracteres.', 'err');
    if (newPass !== confirm) return showMsg('msg-forgot-step2', 'As senhas não coincidem.', 'err');
    // Verifica a resposta da pergunta de segurança e, se correta, redefine a senha do usuário

    const users = getAllUsers();
    const user  = users[u];
    if (user.segurança.resposta !== answer)
        return showMsg('msg-forgot-step2', 'Resposta incorreta. Tente novamente.', 'err');
    // Se a resposta estiver incorreta, exbie uma mensagem de erro.

    user.senha = newPass;
    saveAllUsers(users);
    showMsg('msg-forgot-step2', '✔ Senha redefinida com sucesso!', 'ok');
    setTimeout(() => {
        document.getElementById('login-user').value = u;
        document.getElementById('login-pass').value = '';
        switchPanel('login');
    }, 1500);
}   //Se estiver correta, redefine a senha do usuário, salva as mudanças e redireciona para o login

// ==========================================
// DASHBOARD (index.html)
// ==========================================
let realMarketInterval = null;

function initDashboard() { // Configura a dashboard, verificando se o usuário está logado, atualizando o display do nome de usuário, configurando os listeners dos botões e iniciando a simulação de mercado
    const username = getUsername();
    if (!username) { window.location.href = 'login.html'; return; }

    document.getElementById('userDisplay').innerText = username;
    atualizarAvatarTopbar(); // Atualiza o avatar na topbar para refletir o perfil do usuário logado. Ele busca os dados do usuário usando getUser() e, se um avatar estiver definido, exibe-o; caso contrário, exibe um ícone genérico de usuário. Essa função é chamada durante a inicialização da dashboard e também sempre que os dados do usuário são atualizados para garantir que a exibição do avatar esteja sempre sincronizada com os dados do perfil.

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    ativos.forEach(a => a.historico.push(a.preco));
    mostrarGrafico(0);
    renderAtivos();
    atualizarTudo();// Atualiza o saldo, patrimônio, carteira, histórico e avatar do usuário. Essa função é chamada durante a inicialização da dashboard para garantir que todas as informações exibidas estejam corretas e atualizadas com os dados do usuário logado. Ela é responsável por sincronizar a interface do usuário com o estado atual dos dados do usuário, garantindo uma experiência consistente e responsiva.

    setInterval(() => {
        if (document.getElementById('modoMercado').value !== 'real') {
            atualizarPrecos();
            calcularPatrimonio();
        }
    }, 2000);
    // A cada 2 segundos, verifica o modo do mercado. Se não estiver no modo "real", atualiza os preços dos ativos e recalcula o patrimônio do usuário. Isso mantém a simulação de mercado ativa e os dados do usuário atualizados em tempo real, proporcionando uma experiência dinâmica mesmo quando não se está usando dados reais do mercado.

    // Listener do seletor de mercado. Um listener é um mecanismo que aguarda por um evento específico (neste caso, a mudança de valor do seletor de mercado) e executa uma função em resposta a esse evento. Aqui, quando o usuário seleciona um modo de mercado diferente, o listener verifica qual modo foi selecionado e chama a função correspondente para iniciar ou parar a simulação do mercado real. Isso permite que o usuário alterne entre os modos de simulação e mercado real de forma interativa, com a interface respondendo imediatamente às suas escolhas.
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
} // Atualiza o display do saldo do usuário na dashboard. Ele busca os dados do usuário usando getUser() e, se o elemento de saldo existir na página, atualiza seu texto para mostrar o saldo formatado como moeda brasileira. Essa função é chamada sempre que há uma mudança no saldo do usuário, como após uma compra ou venda, para garantir que a informação exibida esteja sempre correta e atualizada.

function calcularPatrimonio() {
    const user = getUser();
    let total = user.saldo;
    ativos.forEach(a => {
        if (user.carteira[a.nome]) total += user.carteira[a.nome] * a.preco;
    });
    // Calcula o patrimônio total do usuário somando o saldo disponível com o valor de mercado dos ativos que ele possui em carteira. Para cada ativo, verifica quantas unidades o usuário possui (user.carteira[a.nome]) e multiplica pela cotação atual do ativo (a.preco), adicionando ao total. Depois, atualiza o display do patrimônio na dashboard e calcula a rentabilidade percentual em relação ao saldo inicial do usuário, exibindo-a com formatação adequada e cor indicativa de lucro ou prejuízo.
    document.getElementById("patrimonio").innerText = formatMoney(total);
    const lucro = total - user.saldoInicial;
    const perc  = (lucro / user.saldoInicial) * 100;
    const rentEl = document.getElementById("rentabilidade");
    rentEl.innerText = (perc >= 0 ? "+" : "") + perc.toFixed(2) + "%";
    rentEl.className = "kpi-value " + (perc >= 0 ? "text-success" : "text-danger");
}   // patrimonio é o valor total dos ativos do usuário somado ao seu saldo disponível. Ele é calculado para mostrar o valor total que o usuário possui, considerando tanto o dinheiro em caixa quanto o valor de mercado dos ativos que ele detém. O patrimônio é uma métrica importante para os investidores, pois reflete a riqueza total do indivíduo em um determinado momento.

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
    }); // Renderiza a lista de ativos disponíveis para negociação na dashboard. Para cada ativo, cria um elemento HTML que exibe o nome, ícone e preço atual do ativo, além de um campo para o usuário inserir a quantidade desejada e botões para comprar, vender ou visualizar o gráfico de preços do ativo. O ID de cada preço é dinâmico (preco${i}) para permitir atualizações individuais dos preços na interface quando eles mudarem. Essa função é chamada durante a inicialização da dashboard para mostrar os ativos disponíveis e também pode ser chamada novamente se a lista de ativos for alterada dinamicamente no futuro.
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
    }); // Atualiza os preços dos ativos exibidos na tela. Para cada ativo, busca o elemento de preço correspondente usando seu ID dinâmico (preco${i}) e atualiza seu texto para mostrar o novo preço formatado. Além disso, aplica uma breve animação de cor para indicar se o preço subiu ou desceu em relação ao último valor, usando as cores definidas nas variáveis CSS (--accent para alta e --danger para baixa). Essa função é chamada sempre que os preços dos ativos são atualizados, seja pela simulação ou pelo mercado real, para garantir que a interface do usuário reflita os valores mais recentes.
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
}; // Realiza a compra de um ativo. Ele coleta os dados do usuário, o ativo selecionado e a quantidade desejada, calcula o custo total da compra e verifica se o usuário tem saldo suficiente. Se tiver, deduz o custo do saldo do usuário, adiciona a quantidade comprada à carteira do usuário, registra a operação no histórico e atualiza a interface. Se o saldo for insuficiente, exibe um alerta informando o usuário.

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
}; // Realiza a venda de um ativo. Ele coleta os dados do usuário, o ativo selecionado e a quantidade desejada, verifica se o usuário tem a quantidade suficiente em sua carteira e, se tiver, atualiza o saldo do usuário, remove a quantidade vendida da carteira e registra a operação no histórico. Se a quantidade for insuficiente, exibe um alerta informando o usuário.

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
    }); //essa função renderCarteira é responsável por exibir os ativos que o usuário possui em sua carteira na dashboard. Ela percorre a lista de ativos disponíveis e verifica quantas unidades de cada ativo o usuário possui (user.carteira[a.nome]). Se o usuário tiver mais de 0 unidades de um ativo, a função adiciona uma linha à tabela da carteira exibindo o nome do ativo, a quantidade e o valor total daquele ativo com base no preço atual. Se o usuário não possuir nenhum ativo, a função exibe uma mensagem indicando que a carteira está vazia.
    if (!temAtivos)
        tbody.innerHTML = `<tr><td colspan="3" class="text-muted" style="text-align:center">Sua carteira está vazia.</td></tr>`;
} // se nenhum ativo for encontrado na carteira do usuário, a função exibe uma linha única na tabela indicando que a carteira está vazia, usando uma mensagem centralizada e estilizada com a classe "text-muted" para indicar que não há ativos para mostrar.

function renderHistorico() {
    const histDiv = document.getElementById("historico");
    const user    = getUser();
    if (!user.historico.length) {
        histDiv.innerHTML = `<div class="text-muted" style="text-align:center;margin-top:20px">Nenhuma operação realizada.</div>`;
        return;
    } //renderiza o histórico de operações do usuário na dashboard. Ele verifica se o usuário tem algum registro de operações (compra ou venda) em seu histórico. Se não houver nenhum registro, exibe uma mensagem indicando que nenhuma operação foi realizada. Caso contrário, percorre o histórico do usuário e cria um elemento HTML para cada operação, formatando a informação de acordo com o tipo de operação (compra
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
} // Atualiza os preços dos ativos de forma simulada. Ele calcula uma variação aleatória para cada ativo, influenciada por uma tendência geral do mercado (obtida pela função getTendencia), e atualiza o preço do ativo com essa variação. O preço mínimo é limitado a 1 para evitar valores negativos ou zero. Depois de atualizar os preços, a função chama atualizarPrecosNaTela para refletir as mudanças na interface e também atualiza o gráfico se ele estiver sendo exibido para o ativo que teve seu preço alterado.

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
}; // Exibe um gráfico de linha com o histórico de preços de um ativo específico usando a biblioteca Chart.js. Quando o usuário clica no botão para ver o gráfico de um ativo, essa função é chamada com o índice do ativo selecionado. Ela atualiza o título do gráfico para mostrar o nome e ícone do ativo, destrói qualquer gráfico existente para evitar sobreposição, e cria um novo gráfico com os dados históricos de preços do ativo. O gráfico é estilizado para ser responsivo e visualmente integrado à interface da dashboard.

function atualizarTudo() {
    atualizarSaldo();
    calcularPatrimonio();
    renderCarteira();
    renderHistorico();
    atualizarAvatarTopbar();
} // Atualiza todas as informações exibidas na dashboard, incluindo saldo, patrimônio, carteira, histórico e avatar. Essa função é chamada sempre que há uma mudança significativa nos dados do usuário, como após uma compra ou venda, para garantir que a interface do usuário esteja sempre sincronizada com o estado atual dos dados do usuário.

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
// MERCADO REAL — brapi.dev (gratuito e limitado, requer token)
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
} // a api bravi.dev tem uma limitacao, por isso foi usada apenas uma acao (PETR4) para demonstracao. A funcao setStatusMercado é responsável por exibir o status da conexão com a API do mercado real na interface da dashboard. Ela busca um elemento específico na página (um span dentro do header do painel) e atualiza seu texto e cor para refletir o status atual, como "atualizando...", "erro de conexão" ou o horário da última atualização bem-sucedida. Se o elemento de status ainda não existir, a função cria um novo span para exibir as informações.

async function buscarPrecosReais() {
    if (!BRAPI_TOKEN || BRAPI_TOKEN === 'qGDLJb954uzwMSF7qnzYt2') {
        setStatusMercado('\u26a0 configure o token em script.js', 'var(--danger)');
        console.warn('Mercado Real: insira seu token brapi.dev na constante BRAPI_TOKEN no topo do script.js');
        pararMercadoReal();
        document.getElementById('modoMercado').value = 'lateral';
        return;
    }

    const tickers = ativos[0].nome;
    const url = `https://brapi.dev/api/quote/${tickers}?interval=1d&currency=BRL&token=${BRAPI_TOKEN}`;

    setStatusMercado('\u27f3 atualizando...', 'var(--text-muted)');
    // A função buscarPrecosReais é responsável por buscar os preços reais dos ativos usando a API do brapi.dev. Ela verifica se o token de acesso está configurado corretamente e, em seguida, faz uma requisição para a API para obter os dados de cotação do ativo especificado. Durante o processo de busca, ela atualiza o status na interface para indicar que os dados estão sendo atualizados. Se a requisição for bem-sucedida, ela atualiza os preços dos ativos na interface e recalcula o patrimônio do usuário. Se houver um erro durante a requisição, ela exibe uma mensagem de erro no status e para a atualização automática do mercado real.

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
} // Inicia a simulação do mercado real. Ele chama a função buscarPrecosReais para obter os preços atuais dos ativos e, em seguida, configura um intervalo para chamar essa função a cada 60 segundos, garantindo que os preços sejam atualizados regularmente. O ID do intervalo é armazenado na variável realMarketInterval para que possa ser facilmente cancelado quando o usuário optar por sair do modo de mercado real.

function pararMercadoReal() {
    clearInterval(realMarketInterval);
    realMarketInterval = null;
    const span = document.getElementById('market-status-label');
    if (span) span.remove();
} // Para a simulação do mercado real. Ele cancela o intervalo configurado para atualizar os preços dos ativos, impedindo que a função buscarPrecosReais seja chamada novamente. Além disso, remove o elemento de status do mercado real da interface para indicar que o modo de mercado real foi desativado. Essa função é chamada quando o usuário seleciona um modo de mercado diferente ou quando há um erro na conexão com a API do mercado real.

// ==========================================
// PERFIL (profile.html)
// ==========================================
const EMOJIS = ['👤','🦊','🐻','🐼','🦁','🐯','🦋','🐉','🚀','💎','🔥','⚡','🌙','🎯','🤖','💕','⚠️','🦇'];

let modalAcao = null;

const MODAL_CONFIG = {
    reset: {
        title: '🔄 Resetar Saldo',
        subtitle: 'Isso irá redefinir seu saldo para R$ 10.000,00 (o padrão de entrada). Sua carteira e histórico serão mantidos.',
        btnLabel: 'Resetar Saldo',
        btnClass: 'btn-neutral'
    }, // O objeto MODAL_CONFIG é uma configuração para diferentes ações que podem ser realizadas no perfil do usuário, como resetar o saldo, limpar o histórico, resetar a conta completa ou excluir a conta. Cada ação tem um título, uma descrição (subtitle), um rótulo para o botão de confirmação (btnLabel) e uma classe CSS para estilizar o botão (btnClass). Essa configuração é usada para exibir um modal de confirmação personalizado para cada ação, garantindo que o usuário esteja ciente das consequências de cada escolha antes de confirmar a ação.
    clearHistory: {
        title: '🗑️ Limpar Histórico',
        subtitle: 'Todo o histórico de ordens será apagado permanentemente. Essa ação não pode ser desfeita.',
        btnLabel: 'Limpar Histórico',
        btnClass: 'btn-danger'
    }, // A ação de limpar o histórico remove todas as entradas do histórico de operações do usuário, mas mantém o saldo e a carteira intactos. É uma opção para os usuários que desejam começar com um histórico limpo sem afetar seu progresso financeiro atual.
    resetFull: {
        title: '💣 Resetar Conta Completa',
        subtitle: 'Isso irá zerar todo o seu progresso: saldo, carteira e histórico serão reiniciados ao estado inicial. Não pode ser desfeito.',
        btnLabel: 'Resetar Tudo',
        btnClass: 'btn-danger'
    }, // A ação de resetar a conta completa reinicia todo o progresso do usuário, zerando o saldo, a carteira e o histórico. É uma opção para os usuários que desejam começar do zero.
    deleteAccount: {
        title: '🗑️ Excluir Conta',
        subtitle: 'Sua conta e todos os dados serão excluídos permanentemente. Você será redirecionado para o login.',
        btnLabel: 'Excluir Conta',
        btnClass: 'btn-danger'
    } // A ação de excluir a conta remove completamente os dados do usuário, incluindo saldo, carteira e histórico, e redireciona o usuário para a página de login. É uma opção para os usuários que desejam encerrar sua participação na plataforma e remover seus dados pessoais.
};

function initProfile() {
    const username = getUsername();
    if (!username || !getAllUsers()[username]) {
        window.location.href = 'login.html';
        return;
    } // Verifica se o usuário está logado e se os dados do usuário existem. Se não, redireciona para a página de login. Essa verificação é importante para garantir que apenas usuários autenticados possam acessar a página de perfil e que os dados necessários para exibir as informações do perfil estejam disponíveis. Se o usuário não estiver logado ou se os dados do usuário não existirem, ele é redirecionado para a página de login para que possa autenticar-se antes de acessar o perfil.

    carregarPagina();

    document.getElementById('modalConfirmBtn').addEventListener('click', executarAcaoModal);
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharModal();
    }); // Configura os listeners para o botão de confirmação do modal e para o clique fora do conteúdo do modal. O primeiro listener chama a função executarAcaoModal quando o botão de confirmação é clicado, permitindo que a ação selecionada seja executada. O segundo listener fecha o modal quando o usuário clica fora do conteúdo do modal, proporcionando uma maneira fácil e intuitiva de sair do modal sem precisar clicar no botão de fechar. Esses listeners são essenciais para a funcionalidade do modal de confirmação, garantindo que as ações sejam executadas corretamente e que os usuários possam interagir com o modal de forma eficiente.
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
} // Renderiza o seletor de emojis para o avatar do usuário. Ele percorre a lista de emojis definidos na constante EMOJIS e cria um botão para cada emoji, aplicando estilos para destacar o emoji atualmente selecionado (o avatar salvo do usuário). Cada botão tem um listener de clique que chama a função selecionarAvatar com o emoji correspondente, permitindo que o usuário escolha seu avatar de forma interativa. Essa função é chamada durante a inicialização da página de perfil e sempre que os dados do usuário são atualizados para garantir que o seletor de emojis reflita corretamente o avatar atual do usuário.

window.selecionarAvatar = function(emoji) {
    const user  = getAllUsers()[getUsername()];
    user.avatar = emoji;
    saveUser(user);
    document.getElementById('avatarEmoji').textContent = emoji;
    renderEmojiPicker();
    showMsg('msg-config', `✔ Avatar atualizado para ${emoji}`, 'ok');
}; // Permite que o usuário selecione um emoji como avatar. Quando um emoji é selecionado, essa função é chamada com o emoji escolhido, atualiza os dados do usuário para salvar o novo avatar, atualiza a exibição do avatar na interface e re-renderiza o seletor de emojis para refletir a nova seleção. Além disso, exibe uma mensagem de confirmação para informar ao usuário que o avatar foi atualizado com sucesso.

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
}; // Permite que o usuário adicione ou remova um valor do saldo. Ele coleta o valor inserido pelo usuário, verifica se é válido e, dependendo do tipo de operação (adição ou remoção), atualiza o saldo do usuário de acordo. Se a operação for bem-sucedida, exibe uma mensagem de confirmação; se houver um erro (como valor inválido ou saldo insuficiente), exibe uma mensagem de erro. Após a atualização do saldo, a função salva os dados do usuário e recarrega a página para refletir as mudanças.

window.alterarSenha = function() {
    const atual   = document.getElementById('senhaAtual').value;
    const nova    = document.getElementById('senhaNova').value;
    const confirm = document.getElementById('senhaConfirm').value;
    const user    = getAllUsers()[getUsername()];
    // Permite que o usuário altere sua senha. Ele coleta a senha atual, a nova senha e a confirmação da nova senha inseridas pelo usuário, e realiza uma série de validações para garantir que a alteração seja segura e correta. As validações incluem verificar se todos os campos foram preenchidos, se a senha atual está correta, se a nova senha atende aos requisitos mínimos de comprimento e se a nova senha coincide com a confirmação. Se todas as validações passarem, a função atualiza a senha do usuário, salva os dados e exibe uma mensagem de sucesso. Caso contrário, exibe mensagens de erro específicas para cada tipo de falha na validação.
    if (!atual || !nova || !confirm) return showMsg('msg-senha', '⚠ Preencha todos os campos.', 'err');
    if (user.senha !== atual)        return showMsg('msg-senha', '✖ Senha atual incorreta.', 'err');
    if (nova.length < 6)             return showMsg('msg-senha', '⚠ A nova senha precisa ter pelo menos 6 caracteres.', 'err');
    if (nova !== confirm)            return showMsg('msg-senha', '✖ As senhas não coincidem.', 'err');
    // Se todas as validações forem bem-sucedidas, a função atualiza a senha do usuário, salva os dados e exibe uma mensagem de sucesso. Caso contrário, exibe mensagens de erro específicas para cada tipo de falha na validação.
    user.senha = nova;
    saveUser(user);
    showMsg('msg-senha', '✔ Senha alterada com sucesso!', 'ok');
    ['senhaAtual', 'senhaNova', 'senhaConfirm'].forEach(id => document.getElementById(id).value = '');
};  // A função alterarSenha é responsável por permitir que o usuário altere sua senha. Ela coleta a senha atual, a nova senha e a confirmação da nova senha inseridas pelo usuário, e realiza uma série de validações para garantir que a alteração seja segura e correta. As validações incluem verificar se todos os campos foram preenchidos, se a senha atual está correta, se a nova senha atende aos requisitos mínimos de comprimento e se a nova senha coincide com a confirmação. Se todas as validações passarem, a função atualiza a senha do usuário, salva os dados e exibe uma mensagem de sucesso. Caso contrário, exibe mensagens de erro específicas para cada tipo de falha na validação.

window.abrirModal = function(acao) {
    modalAcao = acao;
    const cfg = MODAL_CONFIG[acao];
    document.getElementById('modalTitle').textContent    = cfg.title;
    document.getElementById('modalSubtitle').textContent = cfg.subtitle;
    const btn = document.getElementById('modalConfirmBtn');
    btn.textContent = cfg.btnLabel;
    btn.className   = cfg.btnClass;
    document.getElementById('confirmModal').classList.add('open');
};  // abrirModal é uma função que exibe um modal de confirmação para ações críticas no perfil do usuário, como resetar o saldo, limpar o histórico, resetar a conta completa ou excluir a conta. Quando chamada com um tipo de ação específico, a função configura o conteúdo do modal (título, subtítulo e rótulo do botão) com base na configuração definida em MODAL_CONFIG para aquela ação. Em seguida, adiciona a classe 'open' ao elemento do modal para torná-lo visível na interface. O tipo de ação selecionado é armazenado na variável modalAcao para que possa ser referenciado posteriormente quando o usuário confirmar a ação.

window.fecharModal = function() {
    document.getElementById('confirmModal').classList.remove('open');
    modalAcao = null;
};  // fecharModal é uma função que fecha o modal de confirmação. Ela remove a classe 'open' do elemento do modal, tornando-o invisível na interface, e redefine a variável modalAcao para null, indicando que nenhuma ação está atualmente selecionada para confirmação. Essa função é chamada quando o usuário clica fora do conteúdo do modal ou quando a ação é confirmada ou cancelada, garantindo que o modal seja fechado adequadamente após a interação do usuário.

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
}   // executarAcaoModal é uma função que executa a ação selecionada no modal de confirmação. Ela verifica o tipo de ação armazenada em modalAcao e realiza as operações correspondentes, como resetar o saldo, limpar o histórico, resetar a conta completa ou excluir a conta. Após executar a ação, a função fecha o modal e recarrega a página para refletir as alterações.