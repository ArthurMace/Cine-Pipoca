import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

async function iniciarApp() {
    data = await getData();
}

// Expõe a função para o HTML
window.selecionarPerfil = function(nome) {
    perfilAtivo = nome;
    
    // Esconde a seleção e mostra o site
    document.getElementById('modal-perfil').style.display = 'none';
    document.getElementById('header-principal').style.opacity = "1";
    document.getElementById('conteudo-principal').style.opacity = "1";
    document.querySelector('.search-box').style.opacity = "1";
    
    const emoji = nome === 'arthur' ? '🤵‍♂️' : '👰‍♀️';
    document.getElementById('titulo-app').innerHTML = `🎬 Cine Pipoca - ${emoji}`;
    
    render();
}

window.resetarPerfil = function() {
    perfilAtivo = null;
    document.getElementById('modal-perfil').style.display = 'flex';
    document.getElementById('header-principal').style.opacity = "0";
    document.getElementById('conteudo-principal').style.opacity = "0";
    document.querySelector('.search-box').style.opacity = "0";
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
    
    const filtrados = data.filter(i => {
        const pertenceAoPerfil = (i.dono === perfilAtivo || i.dono === 'casal' || !i.dono);
        return pertenceAoPerfil && i.nome.toLowerCase().includes(busca);
    });

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const finalizados = filtrados.filter(i => i.status === "assistido");
        const quero = filtrados.filter(i => i.status === "quero");

        containers.home.innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${quero.length ? `<h3>⭐ Minha Lista</h3><div class="carrossel">${renderCards(quero)}</div>` : ''}
            ${finalizados.length ? `<h3>✅ Já Finalizados</h3><div class="carrossel">${renderCards(finalizados)}</div>` : ''}
        `;
    } else {
        const divAlvo = paginaAtual === "series" ? containers.series : paginaAtual === "filmes" ? containers.filmes : containers.quero;
        const listaAbas = filtrados.filter(i => {
            if (paginaAtual === "series") return i.tipo === "serie";
            if (paginaAtual === "filmes") return i.tipo === "filme";
            return i.status === "quero";
        });
        divAlvo.innerHTML = `<div class="grid-comum">${renderCards(listaAbas)}</div>`;
    }
}

// Mantendo suas outras funções (abrirModal, adicionar, renderCards, etc) idênticas às suas
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
                ${estaFinalizado ? `<div style="font-size:10px; color:#3b82f6; font-weight:bold;">⭐ A:${item.notas?.arthur || '-'} | D:${item.notas?.daiane || '-'}</div>` : ''}
                <div style="display: ${estaFinalizado ? 'none' : 'flex'}; gap: 5px; margin-top: 8px;">
                    <button onclick="finalizarItem('${item.firebaseId}')" style="background:#10b981; border:none; color:white; border-radius:4px; padding:8px;">✅</button>
                    <button onclick="excluirItem('${item.firebaseId}')" class="btn-danger" style="padding:8px;">Excluir</button>
                </div>
            </div>
        </div>`;
    }).join("");
}

// Funções globais obrigatórias
window.navegar = navegar;
window.abrirModal = abrirModal;
window.abrirEdicao = (id) => abrirModal(id);
window.fecharModal = fecharModal;
window.adicionar = adicionar; 
window.excluirItem = excluir;
window.render = render;
window.toggleSerieFields = atualizarCamposModal;
window.toggleRatingFields = atualizarCamposModal;

window.finalizarItem = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (item) {
        abrirModal(id); 
        document.getElementById("status").value = "assistido";
        atualizarCamposModal();
    }
}

iniciarApp();
