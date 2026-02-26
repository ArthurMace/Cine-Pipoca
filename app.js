import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// Inicialização
async function iniciarApp() {
    data = await getData();
    render();
}

// --- PERFIL ---
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

// --- MODAL ---
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
    }
    window.toggleSerieFields();
};

window.fecharModal = function() { document.getElementById("modal").style.display = "none"; };

window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    document.getElementById("campos-finalizacao").style.display = (status === "assistido") ? "block" : "none";
};

function limparModal() {
    const ids = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comA", "comD"];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; });
    document.getElementById("modal-title").innerText = "Adicionar Novo";
    document.getElementById("dono").value = "casal";
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
        notas: { arthur: document.getElementById("notaA")?.value || null, daiane: document.getElementById("notaD")?.value || null },
        comentarios: { arthur: document.getElementById("comA")?.value || "", daiane: document.getElementById("comD")?.value || "" }
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

// --- RENDERIZAÇÃO ---
window.render = function() {
    if (!perfilAtivo) return;
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + paginaAtual).style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    const filtrados = data.filter(i => (i.dono === perfilAtivo || i.dono === 'casal') && i.nome.toLowerCase().includes(busca));

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        const finalizados = filtrados.filter(i => i.status === "assistido");
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        const sugestoes = data.filter(i => i.dono === outro && !escondidos.includes(i.firebaseId));

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3>📺 Assistindo Agora</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<h3>💡 De ${outro === 'day' ? 'Day' : 'Arthur'} para Você</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div>` : ''}
            ${quero.length ? `<h3>⭐ Nossa Lista</h3><div class="carrossel">${renderCards(quero)}</div>` : ''}
            ${finalizados.length ? `<h3>✅ Finalizados</h3><div class="carrossel">${renderCards(finalizados)}</div>` : ''}
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
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Poster'">
            <div class="info">
                <b style="font-size:12px;">${item.nome}</b>
                <button class="btn-primary" onclick="window.abrirModal('${item.firebaseId}')" style="font-size:10px; padding:5px;">Editar / Ver</button>
                <button onclick="window.excluirItem('${item.firebaseId}')" style="background:none; border:none; color:red; cursor:pointer; margin-top:5px; font-size:10px;">Excluir</button>
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="opacity: 0.8;">
            <img src="${item.imagem}" style="filter: grayscale(0.5);">
            <div class="info" style="opacity:1;">
                <p style="font-size:10px;">Bora ver?</p>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.darMatch('${item.firebaseId}')" style="background:none; border:none; font-size:20px; cursor:pointer;">🍿</button>
                    <button onclick="window.darBlock('${item.firebaseId}')" style="background:none; border:none; font-size:20px; cursor:pointer;">🚫</button>
                </div>
            </div>
        </div>`).join("");
}

// --- DADO (SORTEIO) ---
window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return alert("Adicione filmes para o 'Casal' na lista 'Quero Assistir' primeiro!");
    
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    document.getElementById('container-sorteado').innerHTML = `
        <img src="${sorteado.imagem}" style="width:100%; border-radius:15px 15px 0 0;">
        <div style="padding:15px; text-align:center; background:#1e293b; border-radius:0 0 15px 15px;">
            <h3>${sorteado.nome}</h3>
            <button class="btn-primary" onclick="window.fecharSorteio()">Fechar</button>
        </div>`;
    document.getElementById('modal-sorteio').style.display = 'flex';
};

window.fecharSorteio = () => { document.getElementById('modal-sorteio').style.display = 'none'; };
window.darMatch = async (id) => { await updateItem(id, { dono: 'casal' }); data = await getData(); render(); };
window.darBlock = (id) => { 
    let esc = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
    esc.push(id); localStorage.setItem('escondidos_' + perfilAtivo, JSON.stringify(esc)); render();
};

// Drag do Dado
document.addEventListener('DOMContentLoaded', () => {
    const d = document.getElementById('dado-flutuante');
    let down = false, off = [0,0];
    d.onmousedown = (e) => { down = true; off = [d.offsetLeft - e.clientX, d.offsetTop - e.clientY]; };
    document.onmousemove = (e) => { if(down) { d.style.left = (e.clientX + off[0]) + 'px'; d.style.top = (e.clientY + off[1]) + 'px'; d.style.bottom = 'auto'; d.style.right = 'auto'; } };
    document.onmouseup = () => down = false;
});

iniciarApp();
