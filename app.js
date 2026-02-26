import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// --- FUNÇÕES DE PERFIL ---
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

async function iniciarApp() {
    data = await getData();
    render();
}

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
    } else {
        document.getElementById("modal-title").innerText = "Adicionar Novo";
        document.getElementById("dono").value = "casal";
    }
    window.toggleSerieFields();
};

window.fecharModal = function() { document.getElementById("modal").style.display = "none"; };

function limparModal() {
    const ids = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comA", "comD"];
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
        notas: { arthur: document.getElementById("notaA")?.value || null, daiane: document.getElementById("notaD")?.value || null },
        comentarios: { arthur: document.getElementById("comA")?.value || "", daiane: document.getElementById("comD")?.value || "" }
    };
    id ? await updateItem(id, itemDados) : await addItem(itemDados);
    window.fecharModal();
    data = await getData();
    render();
};

window.excluirItem = async function(id) {
    if (confirm("Tem certeza que deseja excluir?")) {
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
    const filtrados = data.filter(i => (i.dono === perfilAtivo || i.dono === 'casal' || !i.dono) && i.nome.toLowerCase().includes(busca));

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const finalizados = filtrados.filter(i => i.status === "assistido");
        const quero = filtrados.filter(i => i.status === "quero");
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        const sugestoes = data.filter(i => i.dono === outro && !escondidos.includes(i.firebaseId));

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<div class="secao-sugestoes"><h3>💡 Sugestões de ${outro === 'day' ? 'Daiane' : 'Arthur'}</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div></div>` : ''}
            ${quero.length ? `<h3>⭐ Minha Lista</h3><div class="carrossel">${renderCards(quero)}</div>` : ''}
            ${finalizados.length ? `<h3>✅ Já Finalizados</h3><div class="carrossel">${renderCards(finalizados)}</div>` : ''}
        `;
    } else {
        const target = paginaAtual === "series" ? "series" : paginaAtual === "filmes" ? "filmes" : "queroList";
        const lista = filtrados.filter(i => paginaAtual === "series" ? i.tipo === "serie" : (paginaAtual === "filmes" ? i.tipo === "filme" : i.status === "quero"));
        document.getElementById(target).innerHTML = `<div class="grid-comum">${renderCards(lista)}</div>`;
    }
};

function renderCards(lista) {
    if (lista.length === 0) return `<p style="padding:20px; opacity:0.5;">Nenhum item.</p>`;
    return lista.map(item => `
        <div class="card ${item.status === 'assistido' ? 'card-finalizado' : ''}">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Poster'">
            <div class="info">
                <b>${item.nome}</b>
                <div style="display: flex; gap: 5px; margin-top: 10px; width: 100%;">
                    <button class="btn-primary" onclick="window.finalizarItem('${item.firebaseId}')" style="flex:1; padding:5px;">✅</button>
                    <button class="btn-danger" onclick="window.excluirItem('${item.firebaseId}')" style="flex:1; padding:5px;">Excluir</button>
                </div>
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card card-sugestao">
            <img src="${item.imagem}" style="filter: brightness(0.4);">
            <div class="overlay-sugestao" style="position:absolute; top:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px; text-align:center;">
                <p style="font-size:11px; font-weight:bold;">Ver "${item.nome}"?</p>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.darMatch('${item.firebaseId}')" style="background:none; border:none; font-size:20px; cursor:pointer;">🍿</button>
                    <button onclick="window.darBlock('${item.firebaseId}')" style="background:none; border:none; font-size:20px; cursor:pointer;">🚫</button>
                </div>
            </div>
        </div>`).join("");
}

// --- DADO (APENAS FILMES) ---
window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return alert("Sem filmes 'Quero Assistir' do Casal!");
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    document.getElementById('container-sorteado').innerHTML = `
        <img src="${sorteado.imagem}" style="width:100%;">
        <div class="info-sorteio-viva">
            <h2 style="font-size:1.1rem;">${sorteado.nome}</h2>
            <button class="btn-primary" onclick="window.começarVer('${sorteado.firebaseId}')">Bora Assistir!</button>
            <button class="btn-primary" onclick="window.sortearFilme()" style="background:#1f2937; margin-top:10px;">Sortear Outro</button>
            <p onclick="window.fecharSorteio()" style="margin-top:15px; cursor:pointer; font-size:12px; color:#94a3b8;">Fechar</p>
        </div>`;
    document.getElementById('modal-sorteio').style.display = 'flex';
};

window.fecharSorteio = () => { document.getElementById('modal-sorteio').style.display = 'none'; };
window.começarVer = async (id) => { await updateItem(id, { status: 'assistindo' }); data = await getData(); render(); fecharSorteio(); };
window.darMatch = async (id) => { await updateItem(id, { dono: 'casal' }); data = await getData(); render(); };
window.darBlock = (id) => { 
    let esc = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
    esc.push(id); localStorage.setItem('escondidos_' + perfilAtivo, JSON.stringify(esc)); render();
};
window.finalizarItem = (id) => { window.abrirModal(id); setTimeout(() => { document.getElementById("status").value = "assistido"; window.toggleSerieFields(); }, 100); };

// --- DRAG DADO ---
document.addEventListener('DOMContentLoaded', () => {
    const d = document.getElementById('dado-flutuante');
    if(!d) return;
    let off = [0,0], down = false;
    const s = (x,y) => { down = true; off = [d.offsetLeft - x, d.offsetTop - y]; d.style.transition = 'none'; };
    const m = (x,y) => { if(!down) return; d.style.left = (x+off[0])+'px'; d.style.top = (y+off[1])+'px'; d.style.right='auto'; d.style.bottom='auto'; };
    d.onmousedown = e => s(e.clientX, e.clientY);
    document.onmousemove = e => m(e.clientX, e.clientY);
    document.onmouseup = () => down = false;
    d.ontouchstart = e => s(e.touches[0].clientX, e.touches[0].clientY);
    document.ontouchmove = e => m(e.touches[0].clientX, e.touches[0].clientY);
    document.ontouchend = () => down = false;
});

iniciarApp();
