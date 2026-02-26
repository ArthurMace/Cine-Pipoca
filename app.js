import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

async function iniciarApp() {
    data = await getData();
    render();
}

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

window.navegar = function(pagina) {
    paginaAtual = pagina;
    render();
};

window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    document.getElementById("campos-finalizacao").style.display = (status === "assistido") ? "block" : "none";
};

window.abrirModal = function(id = null) {
    limparModal();
    document.getElementById("modal").style.display = "flex";
    if (id && id !== 'add') {
        const item = data.find(i => i.firebaseId === id);
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
}

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
        notaDay: document.getElementById("notaD").value || null
    };
    id ? await updateItem(id, itemDados) : await addItem(itemDados);
    window.fecharModal();
    data = await getData();
    render();
};

window.render = function() {
    if (!perfilAtivo) return;
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + paginaAtual).style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    
    // FILTRO CORRIGIDO: Garante que apareça TUDO do Casal + Tudo do Perfil
    const filtrados = data.filter(i => 
        (i.dono === perfilAtivo || i.dono === 'casal') && 
        (i.nome && i.nome.toLowerCase().includes(busca))
    );

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        const sugestoes = data.filter(i => i.dono === outro && i.status === 'quero' && !escondidos.includes(i.firebaseId));

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando de onde paramos...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<h3>💡 Match de Filmes (Sugestões de ${outro})</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div>` : ''}
            <h3>⭐ Nossa Lista Principal</h3><div class="grid-comum">${renderCards(quero)}</div>
        `;
    } else {
        const target = paginaAtual === "series" ? "series" : paginaAtual === "filmes" ? "filmes" : "queroList";
        const lista = filtrados.filter(i => {
            if (paginaAtual === "series") return i.tipo === "serie";
            if (paginaAtual === "filmes") return i.tipo === "filme";
            return i.status === "quero";
        });
        document.getElementById(target).innerHTML = `<div class="grid-comum">${renderCards(lista)}</div>`;
    }
};

function renderCards(lista) {
    return lista.map(item => `
        <div class="card">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}">
            <div class="info">
                <b>${item.nome}</b>
                ${item.tipo === 'serie' ? `<p>T${item.temporada || '?'} | E${item.episodio || '?'}</p>` : ''}
                ${item.status === 'assistido' ? `<p>⭐ A:${item.notaArthur || '-'} | D:${item.notaDay || '-'}</p>` : ''}
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="border: 2px solid #3b82f6;">
            <img src="${item.imagem}" style="filter: brightness(0.4);">
            <div class="info" style="opacity: 1; background: transparent;">
                <p>${item.nome}</p>
                <div style="display:flex; gap:15px;">
                    <button onclick="window.darMatch('${item.firebaseId}')" style="background:none; border:none; font-size:28px; cursor:pointer;">🍿</button>
                    <button onclick="window.darBlock('${item.firebaseId}')" style="background:none; border:none; font-size:28px; cursor:pointer;">🚫</button>
                </div>
            </div>
        </div>`).join("");
}

window.darMatch = async (id) => { await updateItem(id, { dono: 'casal' }); data = await getData(); render(); };
window.darBlock = (id) => { 
    let esc = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
    esc.push(id); localStorage.setItem('escondidos_' + perfilAtivo, JSON.stringify(esc)); render();
};

// --- SORTEIO CORRIGIDO ---
window.sortearFilme = function() {
    // Agora filtra APENAS filmes que são do CASAL e que estão no QUERO ASSISTIR
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    
    if (opcoes.length === 0) return alert("Não achei filmes do casal na lista 'Quero Assistir'!");
    
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    
    document.getElementById("container-sorteado").innerHTML = `
        <h2 style="color:#3b82f6;">O que vamos ver?</h2>
        <img src="${sorteado.imagem}" style="width:100%; max-width:200px; border-radius:15px; margin: 15px 0;">
        <h3 style="color:white; margin-bottom:20px;">${sorteado.nome}</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
            <button class="btn-primary" onclick="window.marcarComoAssistindo('${sorteado.firebaseId}')">Assistir este!</button>
            <button class="btn-cancel" onclick="window.sortearFilme()">Sortear outro 🎲</button>
        </div>
    `;
    document.getElementById("modal-sorteio").style.display = "flex";
};

window.marcarComoAssistindo = async (id) => {
    await updateItem(id, { status: 'assistindo' });
    document.getElementById("modal-sorteio").style.display = "none";
    data = await getData();
    render();
};

iniciarApp();
