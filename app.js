import { getData, addItem, updateItem, deleteItem } from "./storage.js";

// --- ESTADO GLOBAL DO APP ---
let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// --- CONFIGURAÇÃO API TMDB (BUSCA AUTOMÁTICA) ---
const API_KEY = 'efe4cf2c1021597fbb2171bda02231f4';
const BASE_IMG = 'https://image.tmdb.org/t/p/w500';

/**
 * Busca dados no TMDB caso o usuário não forneça imagem.
 * Retorna título, imagem, sinopse, banner e contagem de temporadas/episódios.
 */
async function buscarNoTMDB(nome) {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(nome)}`;
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        if (dados.results && dados.results.length > 0) {
            const item = dados.results[0];
            let extras = { temporadas: null, episodios: null };

            if (item.media_type === 'tv') {
                const urlDetalhes = `https://api.themoviedb.org/3/tv/${item.id}?api_key=${API_KEY}&language=pt-BR`;
                const resDet = await fetch(urlDetalhes);
                const det = await resDet.json();
                extras.temporadas = det.number_of_seasons;
                extras.episodios = det.number_of_episodes;
            }

            return {
                titulo: item.title || item.name,
                imagem: item.poster_path ? BASE_IMG + item.poster_path : null,
                sinopse: item.overview || "Sem sinopse disponível.",
                banner: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                tipo: item.media_type === 'tv' ? 'serie' : 'filme',
                totalSeasons: extras.temporadas,
                totalEpisodes: extras.episodios
            };
        }
    } catch (e) { 
        console.error("Erro ao buscar no TMDB:", e); 
    }
    return null;
}

// --- CONTROLE DE NAVEGAÇÃO ---
window.navegar = function(pagina) {
    paginaAtual = pagina;
    // Oculta todas as páginas do seu HTML
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    
    // Mostra a página solicitada
    const containerPagina = document.getElementById("page-" + pagina);
    if (containerPagina) {
        containerPagina.style.display = "block";
    }
    render();
};

// --- GESTÃO DE PERFIL ---
window.selecionarPerfil = function(nome) {
    perfilAtivo = nome.toLowerCase();
    
    // Fecha o modal inicial de perfil
    const modalPerfil = document.getElementById('modal-perfil');
    if (modalPerfil) modalPerfil.style.display = 'none';
    
    // Atualiza a letra na bolinha do header (ID: letra-perfil)
    const letra = document.getElementById('letra-perfil');
    if (letra) letra.innerText = nome.charAt(0).toUpperCase();
    
    // Fecha o dropdown se estiver aberto
    const menu = document.getElementById('dropdownPerfil');
    if (menu) menu.classList.remove('show-menu');
    
    render();
};

window.resetarPerfil = function() {
    const modalPerfil = document.getElementById('modal-perfil');
    if (modalPerfil) modalPerfil.style.display = 'flex';
};

window.toggleMenuPerfil = function() {
    const menu = document.getElementById('dropdownPerfil');
    if (menu) menu.classList.toggle('show-menu');
};

// --- LÓGICA DO MODAL DE CADASTRO ---
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    
    // Mostra campos de Temp/Ep se for série (ID: serie-fields)
    const serieFields = document.getElementById("serie-fields");
    if (serieFields) serieFields.style.display = (tipo === "serie") ? "flex" : "none";
    
    // Mostra notas se o status for Avaliação ou Assistido (ID: campos-finalizacao)
    const camposFinalizacao = document.getElementById("campos-finalizacao");
    const deveMostrarNotas = (status === "assistido" || status === "avaliacao");
    if (camposFinalizacao) camposFinalizacao.style.display = deveMostrarNotas ? "block" : "none";
};

window.abrirModal = function(id = null) {
    limparModal();
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
    }
    window.toggleSerieFields();
};

window.fecharModal = function() {
    document.getElementById("modal").style.display = "none";
};

function limparModal() {
    const ids = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comentario"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    document.getElementById("modal-title").innerText = "Adicionar Novo";
    document.getElementById("tipo").value = "filme";
    document.getElementById("status").value = "quero";
}

// --- OPERAÇÕES NO FIREBASE ---
window.adicionar = async function() {
    const id = document.getElementById("item-id-hidden").value;
    let nome = document.getElementById("nome").value;
    let imagem = document.getElementById("imagem").value;
    let extrasAuto = {};

    // Se for novo e não tiver imagem, busca no TMDB
    if (!id && !imagem && nome) {
        const dadosTMDB = await buscarNoTMDB(nome);
        if (dadosTMDB) {
            nome = dadosTMDB.titulo;
            imagem = dadosTMDB.imagem;
            extrasAuto = {
                sinopse: dadosTMDB.sinopse,
                banner: dadosTMDB.banner,
                totalSeasons: dadosTMDB.totalSeasons,
                totalEpisodes: dadosTMDB.totalEpisodes
            };
        }
    }

    const itemDados = {
        nome: nome,
        imagem: imagem,
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
    render();
};

// --- AVALIAÇÃO INDIVIDUAL ---
window.finalizarRapido = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    document.getElementById("aval-id-hidden").value = id;
    document.getElementById("aval-titulo").innerText = `Nota de ${perfilAtivo === 'arthur' ? 'Arthur' : 'Day'}`;
    document.getElementById("modal-avaliacao").style.display = "flex";
};

window.salvarNotaIndividual = async function() {
    const id = document.getElementById("aval-id-hidden").value;
    const nota = document.getElementById("aval-nota").value;
    const coment = document.getElementById("aval-comentario").value;
    const item = data.find(i => i.firebaseId === id);
    
    let dadosAtt = { ...item };
    if (perfilAtivo === 'arthur') {
        dadosAtt.notaArthur = nota;
        dadosAtt.comentarioArthur = coment;
    } else {
        dadosAtt.notaDay = nota;
        dadosAtt.comentarioDay = coment;
    }

    // Se ambos votaram, finaliza o item
    if (dadosAtt.notaArthur && dadosAtt.notaDay) {
        dadosAtt.status = 'assistido';
        dadosAtt.comentario = `A: ${dadosAtt.comentarioArthur || ""} | D: ${dadosAtt.comentarioDay || ""}`;
    } else {
        dadosAtt.status = 'avaliacao';
    }

    await updateItem(id, dadosAtt);
    document.getElementById("modal-avaliacao").style.display = "none";
    data = await getData();
    render();
};

// --- RENDERIZAÇÃO DOS CARDS (Fiel ao seu CSS) ---
function renderCards(lista) {
    if (lista.length === 0) return `<p style="color:gray; padding:20px;">Vazio.</p>`;
    
    return lista.map(item => {
        const jaAssistido = item.status === 'assistido';
        const emAvaliacao = item.status === 'avaliacao';
        const votou = (perfilAtivo === 'arthur' && item.notaArthur) || (perfilAtivo === 'day' && item.notaDay);

        return `
        <div class="card ${jaAssistido ? 'card-finalizado' : ''}" onclick="window.verSinopse('${item.firebaseId}')">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="event.stopPropagation(); window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Imagem'">
            
            ${jaAssistido ? '<div class="tarja-finalizado"></div>' : ''}
            
            <div class="info">
                <b>${item.nome}</b>
                ${item.tipo === 'serie' ? `<p>T${item.temporada || 1} | E${item.episodio || 1}</p>` : ''}
                
                ${!jaAssistido && !votou ? `
                    <button class="btn-primary" style="font-size:10px; padding:5px; margin-top:10px;" 
                        onclick="event.stopPropagation(); ${item.status === 'quero' ? `window.abrirModal('${item.firebaseId}')` : `window.finalizarRapido('${item.firebaseId}')`}">
                        ${item.status === 'quero' ? 'Assistir 📺' : 'Dar Nota ⭐'}
                    </button>
                ` : ''}

                ${emAvaliacao && votou ? `<p style="color:#fbbf24; font-size:9px; margin-top:10px;">Aguardando o outro... ⏳</p>` : ''}

                ${jaAssistido ? `
                    <div style="margin-top:10px; border-top:1px solid #334155; padding-top:5px;">
                        <p>🤵‍♂️ ${'🍿'.repeat(item.notaArthur || 0)}</p>
                        <p>👰‍♀️ ${'🍿'.repeat(item.notaDay || 0)}</p>
                        <p style="font-style:italic; font-size:9px; color:#94a3b8; margin-top:5px;">${item.comentario || ""}</p>
                    </div>
                ` : ''}

                <button onclick="event.stopPropagation(); window.excluirItem('${item.firebaseId}')" 
                    style="background:rgba(239, 68, 68, 0.2); color:#ef4444; border:none; padding:4px 8px; border-radius:5px; cursor:pointer; font-size:9px; margin-top:10px;">
                    Excluir
                </button>
            </div>
        </div>`;
    }).join("");
}

// --- FUNÇÃO PRINCIPAL DE RENDER ---
window.render = function() {
    if (!perfilAtivo) return;

    const busca = document.getElementById("busca").value.toLowerCase();
    const filtrados = data.filter(i => {
        const matchBusca = (i.nome || "").toLowerCase().includes(busca);
        const matchDono = (i.dono === perfilAtivo || i.dono === 'casal');
        return matchBusca && matchDono;
    });

    if (paginaAtual === "home") {
        const container = document.getElementById("home");
        if (!container) return;

        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const avaliacao = filtrados.filter(i => i.status === "avaliacao");
        const quero = filtrados.filter(i => i.status === "quero");
        const assistidos = filtrados.filter(i => i.status === "assistido");

        container.innerHTML = `
            <h3 class="section-title">📺 Continuando...</h3>
            <div class="carrossel">${renderCards(assistindo)}</div>
            <h3 class="section-title">⏳ Aguardando Notas</h3>
            <div class="carrossel">${renderCards(avaliacao)}</div>
            <h3 class="section-title">⭐ Nossa Lista</h3>
            <div class="carrossel">${renderCards(quero)}</div>
            <h3 class="section-title">✅ Já Assistidos</h3>
            <div class="carrossel">${renderCards(assistidos)}</div>
        `;
    } else {
        const grids = { "series": "series", "filmes": "filmes", "quero": "queroList" };
        const idGrid = grids[paginaAtual];
        const container = document.getElementById(idGrid);
        
        let listaFinal = filtrados;
        if (paginaAtual === "series") listaFinal = filtrados.filter(i => i.tipo === "serie");
        if (paginaAtual === "filmes") listaFinal = filtrados.filter(i => i.tipo === "filme");
        if (paginaAtual === "quero") listaFinal = filtrados.filter(i => i.status === "quero");

        if (container) container.innerHTML = `<div class="grid-comum">${renderCards(listaFinal)}</div>`;
    }
};

// --- SINOPSE E SORTEIO ---
window.verSinopse = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    
    const modalSorteio = document.getElementById("modal-sorteio");
    const containerSorteado = document.getElementById("container-sorteado");
    
    if (modalSorteio && containerSorteado) {
        modalSorteio.style.display = "flex";
        containerSorteado.innerHTML = `
            <div style="background: url('${item.banner || ''}') center/cover; border-radius:15px; overflow:hidden;">
                <div style="background:rgba(15, 23, 42, 0.85); padding:30px; backdrop-filter:blur(5px);">
                    <h2 style="color:#3b82f6; margin-bottom:15px;">${item.nome}</h2>
                    <p style="text-align:left; font-size:14px; line-height:1.6; max-height:300px; overflow-y:auto;">${item.sinopse || "Sem sinopse disponível."}</p>
                    <button class="btn-cancel" style="margin-top:20px; width:100%;" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
                </div>
            </div>
        `;
    }
};

window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) {
        alert("Nenhum filme na lista do casal para sortear!");
        return;
    }
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    window.verSinopse(sorteado.firebaseId);
};

window.excluirItem = async (id) => {
    if (confirm("Deseja realmente remover este item do acervo?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
};

// --- INICIALIZAÇÃO ---
async function init() {
    try {
        data = await getData();
        console.log("Sistema Cine Pipoca carregado com sucesso.");
    } catch (e) {
        console.error("Falha ao carregar dados iniciais:", e);
    }
}

init();
