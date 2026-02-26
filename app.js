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
        window.toggleSerieFields();
    }
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

window.excluirItem = async function(id) {
    if (confirm("Deseja excluir?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
};

window.render = function() {
    if (!perfilAtivo) return;
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + paginaAtual).style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    const filtrados = data.filter(i => (i.dono === perfilAtivo || i.dono === 'casal') && i.nome.toLowerCase().includes(busca));

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const sugestoes = data.filter(i => i.dono === outro && i.status === 'quero');

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<h3>💡 Tinder de Filmes (Sugestões de ${outro === 'day' ? 'Day' : 'Arthur'})</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div>` : ''}
            <h3>⭐ Minha Lista</h3><div class="grid-comum">${renderCards(quero)}</div>
        `;
    } else {
        const target = paginaAtual === "series" ? "series" : paginaAtual === "filmes" ? "filmes" : "queroList";
        const lista = filtrados.filter(i => paginaAtual === "series" ? i.tipo === "serie" : (paginaAtual === "filmes" ? i.tipo === "filme" : i.status === "quero"));
        document.getElementById(target).innerHTML = `<div class="grid-comum">${renderCards(lista)}</div>`;
    }
};

function renderCards(lista) {
    return lista.map(item => `
        <div class="card">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Poster'">
            <div class="info">
                <b>${item.nome}</b>
                <button onclick="window.excluirItem('${item.firebaseId}')" style="color:red; background:none; border:none; cursor:pointer; margin-top:10px;">Excluir</button>
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="border: 1px solid #3b82f6;">
            <img src="${item.imagem}" style="filter: brightness(0.35);">
            <div class="info" style="opacity: 1; background: transparent;">
                <p>Match com ${perfilAtivo === 'arthur' ? 'Day' : 'Arthur'}?</p>
                <button onclick="window.darMatch('${item.firebaseId}')" style="background:none; border:none; font-size:28px; cursor:pointer;">🍿</button>
            </div>
        </div>`).join("");
}

window.darMatch = async (id) => {
    await updateItem(id, { dono: 'casal' });
    data = await getData();
    render();
};

window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return alert("Sem filmes do Casal!");
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    document.getElementById("modal-sorteio").style.display = "flex";
    document.getElementById("nome-sorteado").innerText = sorteado.nome;
    document.getElementById("img-sorteada").innerHTML = `<img src="${sorteado.imagem}" style="width:200px; border-radius:10px;">`;
};

iniciarApp();
