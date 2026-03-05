import { getData, addItem, updateItem, deleteItem } from "./storage.js";

// --- ESTADO GLOBAL ---
let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

const API_KEY = 'efe4cf2c1021597fbb2171bda02231f4';
const BASE_IMG = 'https://image.tmdb.org/t/p/w500';

// --- BUSCA AUTOMÁTICA TMDB ---
async function buscarNoTMDB(nome) {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(nome)}`;
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        if (dados.results && dados.results.length > 0) {
            const item = dados.results[0];
            return {
                titulo: item.title || item.name,
                imagem: item.poster_path ? BASE_IMG + item.poster_path : null,
                sinopse: item.overview || "Sem sinopse disponível.",
                banner: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                tipo: item.media_type === 'tv' ? 'serie' : 'filme'
            };
        }
    } catch (e) { console.error("Erro TMDB:", e); }
    return null;
}

// --- FUNÇÕES DE NAVEGAÇÃO E PERFIL (Chamadas no HTML) ---
window.navegar = function(pagina) {
    paginaAtual = pagina;
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const target = document.getElementById("page-" + pagina);
    if (target) target.style.display = "block";
    window.render();
};

window.selecionarPerfil = function(nome) {
    perfilAtivo = nome.toLowerCase();
    document.getElementById('modal-perfil').style.display = 'none';
    document.getElementById('letra-perfil').innerText = nome.charAt(0).toUpperCase();
    const menu = document.getElementById('dropdownPerfil');
    if (menu) menu.classList.remove('show-menu');
    window.render();
};

window.resetarPerfil = function() {
    document.getElementById('modal-perfil').style.display = 'flex';
};

window.toggleMenuPerfil = function() {
    document.getElementById('dropdownPerfil').classList.toggle('show-menu');
};

// --- GESTÃO DO MODAL DE ADICIONAR/EDITAR ---
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    const mostrarNotas = (status === "assistido" || status === "avaliacao");
    document.getElementById("campos-finalizacao").style.display = mostrarNotas ? "block" : "none";
};

window.abrirModal = function(id = null) {
    limparCamposModal();
    document.getElementById("modal").style.display = "flex";
    if (id && id !== 'add') {
        const item = data.find(i => i.firebaseId === id);
        if (item) {
            document.getElementById("modal-title").innerText = "Editar " + (item.nome || "");
            document.getElementById("item-id-hidden").value = id;
            document.getElementById("nome").value = item.nome || "";
            document.getElementById("imagem").value = item.imagem || "";
            document.getElementById("tipo").value = item.tipo || "filme";
            document.getElementById("status").value = item.status || "quero";
            document.getElementById("dono").value = item.dono || "casal";
            document.getElementById("temporada").value = item.temporada || "";
            document.getElementById("episodio").value = item.episodio || "";
            document.getElementById("notaA").value = item.notaArthur || "";
            document.getElementById("notaD").value = item.notaDay || "";
            document.getElementById("comentario").value = item.comentario || "";
        }
    } else {
        document.getElementById("modal-title").innerText = "Adicionar Novo";
    }
    window.toggleSerieFields();
};

window.fecharModal = function() {
    document.getElementById("modal").style.display = "none";
};

function limparCamposModal() {
    ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comentario"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// --- OPERAÇÕES FIREBASE (ADICIONAR/EDITAR/EXCLUIR) ---
window.adicionar = async function() {
    const id = document.getElementById("item-id-hidden").value;
    let nome = document.getElementById("nome").value;
    let imagem = document.getElementById("imagem").value;
    let extrasAuto = {};

    if (!id && !imagem && nome) {
        const dadosTMDB = await buscarNoTMDB(nome);
        if (dadosTMDB) {
            nome = dadosTMDB.titulo;
            imagem = dadosTMDB.imagem;
            extrasAuto = { sinopse: dadosTMDB.sinopse, banner: dadosTMDB.banner };
        }
    }

    const itemDados = {
        nome, imagem,
        tipo: document.getElementById("tipo").value,
        status: document.getElementById("status").value,
        dono: document.getElementById("dono").value,
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notaArthur: document.getElementById("notaA").value || null,
        notaDay: document.getElementById("notaD").value || null,
        comentario: document.getElementById("comentario").value || "",
        ultimaAtualizacao: Date.now(),
        ...extrasAuto
    };

    if (id) {
        await updateItem(id, itemDados);
    } else {
        await addItem(itemDados);
    }
    
    window.fecharModal();
    data = await getData();
    window.render();
};

window.excluirItem = async function(id) {
    if (confirm("Deseja excluir permanentemente?")) {
        await deleteItem(id);
        data = await getData();
        window.render();
    }
};

// --- SORTEIO E SINOPSE ---
window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return alert("Nenhum filme do casal disponível para sorteio.");
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    window.verSinopse(sorteado.firebaseId);
};

window.verSinopse = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    const modalSorteio = document.getElementById("modal-sorteio");
    const container = document.getElementById("container-sorteado");
    
    modalSorteio.style.display = "flex";
    container.innerHTML = `
        <div style="background: url('${item.banner || ''}') center/cover; border-radius:15px; overflow:hidden;">
            <div style="background:rgba(15, 23, 42, 0.95); padding:30px; backdrop-filter:blur(5px);">
                <h2 style="color:#3b82f6; margin-bottom:15px;">${item.nome}</h2>
                <p style="text-align:left; font-size:14px; line-height:1.6; color:#cbd5e1; max-height:250px; overflow-y:auto;">${item.sinopse || "Sem sinopse."}</p>
                <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                    <button class="btn-primary" onclick="window.abrirModal('${item.firebaseId}'); document.getElementById('modal-sorteio').style.display='none'">Editar</button>
                    <button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
                </div>
            </div>
        </div>`;
};

// --- AVALIAÇÃO INDIVIDUAL ---
window.finalizarRapido = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    document.getElementById("aval-id-hidden").value = id;
    document.getElementById("aval-titulo").innerText = `Avaliar: ${item.nome}`;
    document.getElementById("modal-avaliacao").style.display = "flex";
};

window.salvarNotaIndividual = async function() {
    const id = document.getElementById("aval-id-hidden").value;
    const nota = document.getElementById("aval-nota").value;
    const coment = document.getElementById("aval-comentario").value;
    const item = data.find(i => i.firebaseId === id);
    
    if (perfilAtivo === 'arthur') {
        item.notaArthur = nota;
        item.comentarioArthur = coment;
    } else {
        item.notaDay = nota;
        item.comentarioDay = coment;
    }

    // Se ambos votaram, finaliza o status
    if (item.notaArthur && item.notaDay) {
        item.status = 'assistido';
        item.comentario = `A: ${item.comentarioArthur || ""} | D: ${item.comentarioDay || ""}`;
    } else {
        item.status = 'avaliacao';
    }

    await updateItem(id, item);
    document.getElementById("modal-avaliacao").style.display = "none";
    data = await getData();
    window.render();
};

// --- RENDERIZAÇÃO ---
function renderCards(lista) {
    if (lista.length === 0) return `<p style="color:gray; padding:20px; text-align:center; width:100%;">Nenhum item encontrado.</p>`;
    return lista.map(item => {
        const jaAssistido = item.status === 'assistido';
        const votou = (perfilAtivo === 'arthur' && item.notaArthur) || (perfilAtivo === 'day' && item.notaDay);
        
        return `
        <div class="card ${jaAssistido ? 'card-finalizado' : ''}" onclick="window.verSinopse('${item.firebaseId}')">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="event.stopPropagation(); window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Imagem'">
            ${jaAssistido ? '<div class="tarja-finalizado">FINALIZADO</div>' : ''}
            <div class="info">
                <b style="display:block; margin-bottom:5px;">${item.nome}</b>
                ${item.tipo === 'serie' ? `<p style="font-size:11px; color:#94a3b8;">T${item.temporada || 1} • E${item.episodio || 1}</p>` : ''}
                
                <div style="margin-top:8px; border-top:1px solid #334155; padding-top:5px; font-size:11px;">
                    <span>🤵‍♂️ ${'🍿'.repeat(item.notaArthur || 0)}</span><br>
                    <span>👰‍♀️ ${'🍿'.repeat(item.notaDay || 0)}</span>
                </div>

                ${!jaAssistido && !votou ? `
                    <button class="btn-primary" style="font-size:10px; padding:6px; margin-top:10px; width:100%;" 
                        onclick="event.stopPropagation(); window.finalizarRapido('${item.firebaseId}')">
                        ${item.status === 'quero' ? '📺 Assistir' : '⭐ Dar Nota'}
                    </button>` : ''}

                <button onclick="event.stopPropagation(); window.excluirItem('${item.firebaseId}')" 
                    style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:none; padding:5px 0; width:100%; border-radius:5px; cursor:pointer; font-size:9px; margin-top:8px; font-weight:bold;">
                    EXCLUIR
                </button>
            </div>
        </div>`;
    }).join("");
}

window.render = function() {
    if (!perfilAtivo) return;
    const busca = document.getElementById("busca").value.toLowerCase();
    const filtrados = data.filter(i => (i.nome || "").toLowerCase().includes(busca) && (i.dono === perfilAtivo || i.dono === 'casal'));

    // HOME: Carrosséis específicos por status
    const containerHome = document.getElementById("home");
    if (paginaAtual === "home" && containerHome) {
        containerHome.innerHTML = `
            <h3 class="section-title">📺 Assistindo Agora</h3>
            <div class="carrossel-estilizado">${renderCards(filtrados.filter(i => i.status === "assistindo"))}</div>
            <h3 class="section-title">⏳ Esperando Notas</h3>
            <div class="carrossel-estilizado">${renderCards(filtrados.filter(i => i.status === "avaliacao"))}</div>
            <h3 class="section-title">⭐ Quero Ver</h3>
            <div class="carrossel-estilizado">${renderCards(filtrados.filter(i => i.status === "quero"))}</div>
            <h3 class="section-title">✅ Já Assistidos</h3>
            <div class="carrossel-estilizado">${renderCards(filtrados.filter(i => i.status === "assistido"))}</div>`;
    }

    // PÁGINAS ESPECÍFICAS: Séries, Filmes, Quero
    const containerSeries = document.getElementById("series");
    if (paginaAtual === "series" && containerSeries) {
        containerSeries.innerHTML = renderCards(filtrados.filter(i => i.tipo === "serie"));
    }

    const containerFilmes = document.getElementById("filmes");
    if (paginaAtual === "filmes" && containerFilmes) {
        containerFilmes.innerHTML = renderCards(filtrados.filter(i => i.tipo === "filme"));
    }

    const containerQuero = document.getElementById("queroList");
    if (paginaAtual === "quero" && containerQuero) {
        containerQuero.innerHTML = renderCards(filtrados.filter(i => i.status === "quero"));
    }
};

async function init() {
    data = await getData();
    window.render();
}
init();
