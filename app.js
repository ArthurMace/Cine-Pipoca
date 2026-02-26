import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// FUNÇÕES DE PERFIL
window.selecionarPerfil = function(nome) {
    perfilAtivo = nome;
    document.getElementById('modal-perfil').style.display = 'none';
    const emoji = nome === 'arthur' ? '🤵‍♂️' : '👰‍♀️';
    document.getElementById('titulo-app').innerHTML = `🎬 Cine Pipoca - ${emoji}`;
    render();
}

window.resetarPerfil = function() {
    perfilAtivo = null;
    document.getElementById('modal-perfil').style.display = 'flex';
}

async function iniciarApp() {
    data = await getData();
}

function navegar(pagina) {
    paginaAtual = pagina;
    render();
}

function atualizarCamposModal() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    document.getElementById("campos-finalizacao").style.display = (status === "assistido") ? "block" : "none";
}

function abrirModal(id = null) {
    limparModal();
    document.getElementById("modal").style.display = "block";
    if (id && id !== 'add') {
        const item = data.find(i => i.firebaseId === id);
        document.getElementById("modal-title").innerText = "Editar Item";
        document.getElementById("item-id-hidden").value = id;
        document.getElementById("nome").value = item.nome;
        document.getElementById("imagem").value = item.imagem;
        document.getElementById("tipo").value = item.tipo;
        document.getElementById("status").value = item.status;
        document.getElementById("dono").value = item.dono || "casal";
        document.getElementById("temporada").value = item.temporada || "";
        document.getElementById("episodio").value = item.episodio || "";
        document.getElementById("notaA").value = item.notas?.arthur || "";
        document.getElementById("notaD").value = item.notas?.daiane || "";
        document.getElementById("comA").value = item.comentarios?.arthur || "";
        document.getElementById("comD").value = item.comentarios?.daiane || "";
    } else {
        document.getElementById("modal-title").innerText = "Adicionar Novo";
        document.getElementById("dono").value = "casal";
    }
    atualizarCamposModal();
}

function fecharModal() { document.getElementById("modal").style.display = "none"; }

function limparModal() {
    const ids = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comA", "comD"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
}

async function adicionar() {
    const id = document.getElementById("item-id-hidden").value;
    const itemDados = {
        nome: document.getElementById("nome").value,
        imagem: document.getElementById("imagem").value,
        tipo: document.getElementById("tipo").value,
        status: document.getElementById("status").value,
        dono: document.getElementById("dono").value,
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notas: { arthur: document.getElementById("notaA").value || null, daiane: document.getElementById("notaD").value || null },
        comentarios: { arthur: document.getElementById("comA").value || "", daiane: document.getElementById("comD").value || "" }
    };
    id ? await updateItem(id, itemDados) : await addItem(itemDados);
    fecharModal();
    data = await getData();
    render();
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
}

function render() {
    if (!perfilAtivo) return;

    const containers = {
        home: document.getElementById("home"),
        series: document.getElementById("series"),
        filmes: document.getElementById("filmes"),
        quero: document.getElementById("queroList")
    };

    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + paginaAtual).style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    
    // FILTRO DE PERFIL
    const filtrados = data.filter(i => {
        const pertence = (i.dono === perfilAtivo || i.dono === 'casal' || !i.dono);
        return pertence && i.nome.toLowerCase().includes(busca);
    });

if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const finalizados = filtrados.filter(i => i.status === "assistido");
        const quero = filtrados.filter(i => i.status === "quero");

        // NOVA LÓGICA: Sugestões do outro perfil (Tinder de Filmes)
        const outroPerfil = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        
        const sugestoesOutro = data.filter(i => 
            i.dono === outroPerfil && 
            !escondidos.includes(i.firebaseId)
        );

        containers.home.innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            
            ${sugestoesOutro.length ? `
                <div class="secao-sugestoes">
                    <h3>💡 Sugestões de ${outroPerfil === 'day' ? 'Daiane' : 'Arthur'}</h3>
                    <div class="carrossel">${renderSugestoes(sugestoesOutro)}</div>
                </div>
            ` : ''}

            ${quero.length ? `<h3>⭐ Minha Lista</h3><div class="carrossel">${renderCards(quero)}</div>` : ''}
            ${finalizados.length ? `<h3>✅ Já Finalizados</h3><div class="carrossel">${renderCards(finalizados)}</div>` : ''}
        `;
    } else {
        // ESSA PARTE É PARA AS ABAS: SÉRIES, FILMES E QUERO ASSISTIR
        const divAlvo = paginaAtual === "series" ? containers.series : paginaAtual === "filmes" ? containers.filmes : containers.quero;
        const listaAbas = filtrados.filter(i => {
            if (paginaAtual === "series") return i.tipo === "serie";
            if (paginaAtual === "filmes") return i.tipo === "filme";
            return i.status === "quero";
        });
        divAlvo.innerHTML = `<div class="grid-comum">${renderCards(listaAbas)}</div>`;
    }

function renderCards(lista) {
    if (lista.length === 0) return `<p style="padding:20px; opacity:0.5;">Nenhum item.</p>`;
    return lista.map(item => {
        const estaFinalizado = item.status === 'assistido';
        const emojiDono = item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿');
        return `
        <div class="card ${estaFinalizado ? 'card-finalizado' : ''}">
            <div class="perfil-tag">${emojiDono}</div>
            ${!estaFinalizado ? `<button class="btn-edit" onclick="abrirEdicao('${item.firebaseId}')">✏️</button>` : ''}
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Poster'">
            <div class="info">
                <b>${item.nome}</b>
                ${item.tipo === 'serie' ? `<div class="temp-badge">T${item.temporada || '1'} • E${item.episodio || '1'}</div>` : ''}
                ${estaFinalizado ? `<div style="font-size:10px; color:#3b82f6;">⭐ A:${item.notas?.arthur || '-'} | D:${item.notas?.daiane || '-'}</div>` : ''}
                <div style="display: ${estaFinalizado ? 'none' : 'flex'}; gap: 5px; margin-top: 8px;">
                    <button onclick="finalizarItem('${item.firebaseId}')" style="background:#10b981; border:none; color:white; border-radius:4px; padding:8px;">✅</button>
                    <button class="btn-danger" onclick="excluirItem('${item.firebaseId}')" style="padding:8px; background:#ef4444; border:none; color:white; border-radius:4px;">Excluir</button>
                </div>
            </div>
        </div>`;
    }).join("");
}

// MAPEAMENTO GLOBAL (PARA OS BOTÕES DO HTML FUNCIONAREM)
window.navegar = navegar;
window.abrirModal = abrirModal;
window.abrirEdicao = (id) => abrirModal(id);
window.fecharModal = fecharModal;
window.adicionar = adicionar; 
window.excluirItem = excluir;
window.toggleSerieFields = atualizarCamposModal;
window.toggleRatingFields = atualizarCamposModal;
window.render = render;
window.finalizarItem = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (item) {
        abrirModal(id); 
        document.getElementById("status").value = "assistido";
        atualizarCamposModal();
    }
}
// Função para aceitar ver junto (Vira Casal)
window.darMatch = async function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (item) {
        item.dono = 'casal';
        await updateItem(id, { dono: 'casal' });
        data = await getData();
        render();
    }
}

// Função para recusar (Soma da vista da pessoa atual)
window.darBlock = async function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (item) {
        // Criamos uma lista de 'escondidos' no localStorage para não precisar mexer no Firebase agora
        let escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        escondidos.push(id);
        localStorage.setItem('escondidos_' + perfilAtivo, JSON.stringify(escondidos));
        render();
    }
}
function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card card-sugestao">
            <img src="${item.imagem}">
            <div class="overlay-sugestao">
                <p class="pergunta-sugestao">Ver com ${perfilAtivo === 'arthur' ? 'a Day' : 'o Arthur'}?</p>
                <div class="botoes-sugestao">
                    <button class="btn-match" onclick="darMatch('${item.firebaseId}')" title="Bora ver!">🍿</button>
                    <button class="btn-match" onclick="darBlock('${item.firebaseId}')" title="Não quero">🚫</button>
                </div>
            </div>
        </div>
    `).join("");
}

iniciarApp();

