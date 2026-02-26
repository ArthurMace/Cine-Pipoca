import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

async function iniciarApp() {
    data = await getData();
    render();
}

// --- CONTROLE DE PERFIL ---
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

// --- LÓGICA DO MODAL (ESTA FUNÇÃO TINHA SUMIDO) ---
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    
    // Mostra campos de série apenas se for série
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    
    // Mostra notas apenas se já foi assistido
    const camposFinalizacao = document.getElementById("campos-finalizacao");
    if (camposFinalizacao) {
        camposFinalizacao.style.display = (status === "assistido") ? "block" : "none";
    }
};

window.abrirModal = function(id = null) {
    limparModal();
    document.getElementById("modal").style.display = "flex"; // Garantindo o flex para centralizar
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
        if(item.notaArthur) document.getElementById("notaA").value = item.notaArthur;
        if(item.notaDay) document.getElementById("notaD").value = item.notaDay;
    }
    window.toggleSerieFields();
};

window.fecharModal = function() { document.getElementById("modal").style.display = "none"; };

function limparModal() {
    const ids = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD"];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; });
    document.getElementById("modal-title").innerText = "Adicionar Novo";
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
        notaArthur: document.getElementById("notaA")?.value || null,
        notaDay: document.getElementById("notaD")?.value || null
    };
    
    if (id) {
        await updateItem(id, itemDados);
    } else {
        await addItem(itemDados);
    }
    
    window.fecharModal();
    data = await getData();
    render();
};

window.excluirItem = async function(id) {
    if (confirm("Certeza que quer apagar esse filme/série?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
};

// --- RENDERIZAÇÃO ---
window.render = function() {
    if (!perfilAtivo) return;
    
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const containerAtual = document.getElementById("page-" + paginaAtual);
    if (containerAtual) containerAtual.style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    const filtrados = data.filter(i => (i.dono === perfilAtivo || i.dono === 'casal') && i.nome.toLowerCase().includes(busca));

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        
        // Tinder: Sugestões do outro perfil que ainda não foram dadas Match/Block
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        const sugestoes = data.filter(i => i.dono === outro && i.status === 'quero' && !escondidos.includes(i.firebaseId));

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<h3>💡 Tinder de Filmes (De: ${outro === 'day' ? 'Day' : 'Arthur'})</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div>` : ''}
            <h3>⭐ Minha Lista</h3><div class="grid-comum">${renderCards(quero)}</div>
        `;
    } else {
        const target = paginaAtual === "series" ? "series" : paginaAtual === "filmes" ? "filmes" : "queroList";
        const lista = filtrados.filter(i => paginaAtual === "series" ? i.tipo === "serie" : (paginaAtual === "filmes" ? i.tipo === "filme" : i.status === "quero"));
        const element = document.getElementById(target);
        if (element) element.innerHTML = `<div class="grid-comum">${renderCards(lista)}</div>`;
    }
};

function renderCards(lista) {
    return lista.map(item => `
        <div class="card">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Cine+Pipoca'">
            <div class="info">
                <b>${item.nome}</b>
                <button onclick="window.excluirItem('${item.firebaseId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Excluir</button>
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="border: 2px solid #3b82f6;">
            <img src="${item.imagem}" style="filter: brightness(0.3);">
            <div class="info" style="opacity:1; background:transparent;">
                <p style="font-weight:bold;">Bora ver, ${perfilAtivo === 'arthur' ? 'Arthur' : 'Day'}?</p>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.darMatch('${item.firebaseId}')" style="background:none; border:none; font-size:30px; cursor:pointer;">🍿</button>
                    <button onclick="window.darBlock('${item.firebaseId}')" style="background:none; border:none; font-size:30px; cursor:pointer;">🚫</button>
                </div>
            </div>
        </div>`).join("");
}

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

window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return alert("Adicione filmes para o Casal na lista 'Quero Assistir'!");
    
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    
    const modalSorteio = document.getElementById("modal-sorteio");
    const container = document.getElementById("container-sorteado");
    
    container.innerHTML = `
        <h2 style="color:#3b82f6;">O escolhido é:</h2>
        <img src="${sorteado.imagem}" style="width:200px; border-radius:15px; margin: 15px 0;">
        <h3>${sorteado.nome}</h3>
    `;
    modalSorteio.style.display = "flex";
};

iniciarApp();
