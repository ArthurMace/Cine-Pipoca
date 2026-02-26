import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// Inicialização
async function iniciarApp() {
    data = await getData();
    render();
}

// --- GESTÃO DE PERFIS (FUNÇÃO QUE HAVIA SUMIDO) ---
window.selecionarPerfil = function(nome) {
    perfilAtivo = nome;
    document.getElementById('modal-perfil').style.display = 'none';
    const emoji = nome === 'arthur' ? '🤵‍♂️' : '👰‍♀️';
    document.getElementById('titulo-app').innerHTML = `🎬 Cine Pipoca - ${emoji}`;
    render();
};

window.resetarPerfil = function() {
    perfilAtivo = null;
    document.getElementById('modal-perfil').style.display = 'flex';
};

// --- NAVEGAÇÃO ---
window.navegar = function(pagina) {
    paginaAtual = pagina;
    render();
};

// --- LÓGICA DINÂMICA DO MODAL ---
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    
    // Mostra Temporada/Episódio apenas se for Série
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    
    // Mostra Notas apenas se o status for "Já Assisti"
    document.getElementById("campos-finalizacao").style.display = (status === "assistido") ? "block" : "none";
};

window.abrirModal = function(id = null) {
    limparModal();
    document.getElementById("modal").style.display = "flex";
    
    if (id && id !== 'add') {
        const item = data.find(i => i.firebaseId === id);
        document.getElementById("modal-title").innerText = "Editar " + item.nome;
        document.getElementById("item-id-hidden").value = id;
        document.getElementById("nome").value = item.nome;
        document.getElementById("imagem").value = item.imagem;
        document.getElementById("tipo").value = item.tipo;
        document.getElementById("status").value = item.status;
        document.getElementById("dono").value = item.dono || "casal";
        document.getElementById("temporada").value = item.temporada || "";
        document.getElementById("episodio").value = item.episodio || "";
        document.getElementById("notaA").value = item.notaArthur || "";
        document.getElementById("notaD").value = item.notaDay || "";
    }
    window.toggleSerieFields();
};

window.fecharModal = function() { document.getElementById("modal").style.display = "none"; };

function limparModal() {
    const ids = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD"];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; });
    document.getElementById("modal-title").innerText = "Adicionar Novo";
}

// --- CRUD CONECTADO AO STORAGE.JS ---
window.adicionar = async function() {
    const id = document.getElementById("item-id-hidden").value;
    const itemDados = {
        nome: document.getElementById("nome").value,
        imagem: document.getElementById("imagem").value,
        tipo: document.getElementById("tipo").value,
        status: document.getElementById("status").value,
        dono: document.getElementById("dono").value,
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notaArthur: document.getElementById("notaA").value || null,
        notaDay: document.getElementById("notaD").value || null,
        dataRegistro: new Date().getTime()
    };
    
    if (id) {
        await updateItem(id, itemDados);
    } else {
        await addItem(itemDados);
    }
    
    window.fecharModal();
    data = await getData(); // Atualiza a lista local
    render();
};

window.excluirItem = async function(id) {
    if (confirm("Tem certeza que deseja remover este item?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
};

// --- RENDERIZAÇÃO COMPLETA (TINDER + LISTAS) ---
window.render = function() {
    if (!perfilAtivo) return;
    
    // Controla visibilidade das páginas
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const pag = document.getElementById("page-" + paginaAtual);
    if(pag) pag.style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    
    // Filtro principal por dono e busca
    const filtrados = data.filter(i => 
        (i.dono === perfilAtivo || i.dono === 'casal') && 
        i.nome.toLowerCase().includes(busca)
    );

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        
        // --- LÓGICA DO TINDER (RESTAURADA) ---
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        const sugestoes = data.filter(i => 
            i.dono === outro && 
            i.status === 'quero' && 
            !escondidos.includes(i.firebaseId)
        );

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<h3>💡 Match de Filmes (De: ${outro})</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div>` : ''}
            <h3>⭐ Minha Lista</h3><div class="grid-comum">${renderCards(quero)}</div>
        `;
    } else {
        const target = paginaAtual === "series" ? "series" : paginaAtual === "filmes" ? "filmes" : "queroList";
        let listaFinal;
        if (paginaAtual === "series") listaFinal = filtrados.filter(i => i.tipo === "serie");
        else if (paginaAtual === "filmes") listaFinal = filtrados.filter(i => i.tipo === "filme");
        else listaFinal = filtrados.filter(i => i.status === "quero");

        const container = document.getElementById(target);
        if(container) container.innerHTML = `<div class="grid-comum">${renderCards(listaFinal)}</div>`;
    }
};

function renderCards(lista) {
    return lista.map(item => `
        <div class="card">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/150x225?text=Sem+Foto'">
            <div class="info">
                <b>${item.nome}</b>
                ${item.tipo === 'serie' && item.temporada ? `<p>T${item.temporada} | E${item.episodio}</p>` : ''}
                <button onclick="window.excluirItem('${item.firebaseId}')" class="btn-del">Remover</button>
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card tinder-card">
            <img src="${item.imagem}">
            <div class="info-tinder">
                <p>${item.nome}</p>
                <div class="tinder-btns">
                    <button onclick="window.darMatch('${item.firebaseId}')">🍿</button>
                    <button onclick="window.darBlock('${item.firebaseId}')">🚫</button>
                </div>
            </div>
        </div>`).join("");
}

// --- FUNÇÕES DO TINDER ---
window.darMatch = async (id) => {
    await updateItem(id, { dono: 'casal' });
    data = await getData();
    render();
};

window.darBlock = (id) => {
    let esc = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
    esc.push(id);
    localStorage.setItem('escondidos_' + perfilAtivo, JSON.stringify(esc));
    render();
};

// --- SORTEIO (RESTAURADO) ---
window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return alert("Nenhum filme do casal na lista 'Quero Assistir'!");
    
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    const modalSorteio = document.getElementById("modal-sorteio");
    const container = document.getElementById("container-sorteado");
    
    container.innerHTML = `
        <h2 style="color:#3b82f6;">O escolhido foi:</h2>
        <img src="${sorteado.imagem}" style="width:200px; border-radius:15px; margin: 15px 0;">
        <h3>${sorteado.nome}</h3>
    `;
    modalSorteio.style.display = "flex";
};

iniciarApp();
