import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// --- CONFIGURAÇÃO API TMDB ---
const API_KEY = 'efe4cf2c1021597fbb2171bda02231f4';
const BASE_IMG = 'https://image.tmdb.org/t/p/w500';

// --- FUNÇÃO DE BUSCA AUTOMÁTICA COM DETALHES DE SÉRIE ---
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
    } catch (e) { console.error("Erro TMDB:", e); }
    return null;
}

// --- FUNÇÃO PARA RETOMAR SÉRIE (NOVA TEMPORADA) ---
window.retomarSerie = async function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    if (confirm(`Iniciar nova temporada de "${item.nome}"? As notas atuais serão limpas.`)) {
        const dadosReset = {
            ...item,
            status: 'assistindo',
            notaArthur: null,
            notaDay: null,
            comentarioArthur: null,
            comentarioDay: null,
            comentario: "",
            ultimaAtualizacao: new Date().getTime()
        };
        await updateItem(id, dadosReset);
        data = await getData();
        render();
    }
};

window.navegar = function(pagina) {
    paginaAtual = pagina;
    render();
};

async function iniciarApp() {
    try {
        data = await getData();
        render();
    } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
    }
}

window.selecionarPerfil = function(nome) {
    perfilAtivo = nome.toLowerCase();
    const modalPerfis = document.getElementById('modal-perfil');
    if (modalPerfis) modalPerfis.style.display = 'none';
    const letraElemento = document.getElementById('letra-perfil');
    if (letraElemento) {
        letraElemento.innerText = nome.charAt(0).toUpperCase();
    }
    const menu = document.getElementById('dropdownPerfil');
    if (menu) {
        menu.classList.remove('show-menu');
    }
    const titulo = document.getElementById('titulo-app');
    if (titulo) titulo.innerHTML = `CINE PIPOCA`;
    console.log("Sistema: Perfil alterado para " + perfilAtivo);
    render();
};

window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    const deveMostrarNotas = (status === "assistido" || status === "avaliacao");
    document.getElementById("campos-finalizacao").style.display = deveMostrarNotas ? "block" : "none";
};

window.abrirModal = function(id = null) {
    limparModal();
    document.getElementById("modal").style.display = "flex";
    if (id && id !== 'add') {
        const item = data.find(i => i.firebaseId === id);
        if (item) {
            document.getElementById("modal-title").innerText = "Editar " + (item.nome || "Item");
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
    const campos = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comentario"];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
    document.getElementById("modal-title").innerText = "Adicionar Novo";
    document.getElementById("tipo").value = "filme";
    document.getElementById("status").value = "quero";
    document.getElementById("dono").value = "casal";
}

window.toggleMenuPerfil = function() {
    const menu = document.getElementById('dropdownPerfil');
    if (menu) {
        menu.classList.toggle('show-menu');
    }
};

window.addEventListener('click', function(e) {
    const menu = document.getElementById('dropdownPerfil');
    const btn = document.querySelector('.perfil-bolinha-btn');
    if (menu && menu.classList.contains('show-menu')) {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show-menu');
        }
    }
});

window.adicionar = async function() {
    const id = document.getElementById("item-id-hidden").value;
    let nomeInput = document.getElementById("nome").value;
    let imagemInput = document.getElementById("imagem").value;
    let tipoInput = document.getElementById("tipo").value;
    let extrasAuto = {};

    if (!id && !imagemInput) {
        const dadosTMDB = await buscarNoTMDB(nomeInput);
        if (dadosTMDB) {
            nomeInput = dadosTMDB.titulo;
            imagemInput = dadosTMDB.imagem;
            tipoInput = dadosTMDB.tipo;
            extrasAuto = {
                sinopse: dadosTMDB.sinopse,
                banner: dadosTMDB.banner,
                totalSeasons: dadosTMDB.totalSeasons,
                totalEpisodes: dadosTMDB.totalEpisodes
            };
        }
    }

    const itemDados = {
        nome: nomeInput,
        imagem: imagemInput,
        tipo: tipoInput,
        status: document.getElementById("status").value,
        dono: document.getElementById("dono").value,
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notaArthur: document.getElementById("notaA").value || null,
        notaDay: document.getElementById("notaD").value || null,
        comentario: document.getElementById("comentario").value || "",
        ultimaAtualizacao: new Date().getTime(),
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

window.finalizarRapido = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    document.getElementById("aval-id-hidden").value = id;
    document.getElementById("aval-titulo").innerText = `Nota de ${perfilAtivo === 'arthur' ? 'Arthur' : 'Day'}`;
    document.getElementById("aval-nota").value = "5";
    document.getElementById("aval-comentario").value = "";
    document.getElementById("modal-avaliacao").style.display = "flex";
};

window.salvarNotaIndividual = async function() {
    const id = document.getElementById("aval-id-hidden").value;
    const nota = document.getElementById("aval-nota").value;
    const coment = document.getElementById("aval-comentario").value;
    const item = data.find(i => i.firebaseId === id);
    let dadosAtualizados = { ...item };

    if (perfilAtivo === 'arthur') {
        dadosAtualizados.notaArthur = nota;
        dadosAtualizados.comentarioArthur = coment;
    } else {
        dadosAtualizados.notaDay = nota;
        dadosAtualizados.comentarioDay = coment;
    }

    if (dadosAtualizados.notaArthur && dadosAtualizados.notaDay) {
        dadosAtualizados.status = 'assistido';
        const cA = dadosAtualizados.comentarioArthur || "";
        const cD = dadosAtualizados.comentarioDay || "";
        dadosAtualizados.comentario = `A: ${cA} | D: ${cD}`;
    } else {
        dadosAtualizados.status = 'avaliacao';
    }

    await updateItem(id, dadosAtualizados);
    document.getElementById("modal-avaliacao").style.display = "none";
    data = await getData();
    render();
};

window.excluirItem = async function(id) {
    if (confirm("Deseja realmente remover este item?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
};

window.render = function() {
    if (!perfilAtivo) return;
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const containerPagina = document.getElementById("page-" + paginaAtual);
    if(containerPagina) containerPagina.style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    const filtrados = data.filter(i => {
        const donoMatch = (i.dono === perfilAtivo || i.dono === 'casal');
        const nomeMatch = (i.nome || "").toLowerCase().includes(busca);
        return donoMatch && nomeMatch;
    });

    const montarSecao = (titulo, conteudo, cor = "#94a3b8") => {
        if (!conteudo || conteudo.includes("Vazio.")) return "";
        const idSetas = "scroll-" + Math.random().toString(36).substr(2, 5);
        return `
            <h3 class="section-title" style="color: ${cor}; padding: 0 5%;">${titulo}</h3>
            <div class="carrossel-container">
                <button class="seta-carrossel seta-esq" onclick="document.getElementById('${idSetas}').scrollLeft -= 400">❮</button>
                <div class="carrossel" id="${idSetas}">${conteudo}</div>
                <button class="seta-carrossel seta-dir" onclick="document.getElementById('${idSetas}').scrollLeft += 400">❯</button>
            </div>`;
    };

    if (paginaAtual === "home" || paginaAtual === "series" || paginaAtual === "filmes") {
        let listaBase = filtrados;
        if (paginaAtual === "series") listaBase = filtrados.filter(i => i.tipo === "serie");
        if (paginaAtual === "filmes") listaBase = filtrados.filter(i => i.tipo === "filme");

        const assistindo = listaBase.filter(i => i.status === "assistindo");
        const queroCasal = listaBase.filter(i => i.status === "quero" && i.dono === "casal");
        const queroPessoal = listaBase.filter(i => i.status === "quero" && i.dono === perfilAtivo);
        const aguardando = listaBase.filter(i => i.status === "avaliacao");
        const jaAssistidos = listaBase.filter(i => i.status === "assistido"); 
        
        const outroPerfil = (perfilAtivo === 'arthur') ? 'day' : 'arthur';
        const nomeOutroFormatado = outroPerfil.charAt(0).toUpperCase() + outroPerfil.slice(1);
        const escondidos = JSON.parse(localStorage.getItem('esc_' + perfilAtivo)) || [];
        const sugestoes = (paginaAtual === "home") ? data.filter(i => i.dono === outroPerfil && i.status === 'quero' && !escondidos.includes(i.firebaseId)) : [];

        const targetDiv = document.getElementById(paginaAtual) || document.getElementById("page-" + paginaAtual);
        if(targetDiv) {
            targetDiv.innerHTML = `
                ${montarSecao("📺 Continuando...", renderCards(assistindo))}
                ${montarSecao("⏳ Aguardando Notas", renderCards(aguardando), "#fbbf24")}
                ${paginaAtual === "home" ? montarSecao(`💡 Sugerido por ${nomeOutroFormatado}`, renderSugestoes(sugestoes)) : ""}
                ${montarSecao("⭐ Nossa Lista (Juntos)", renderCards(queroCasal))}
                ${montarSecao(`👤 Minha Lista (${perfilAtivo.charAt(0).toUpperCase() + perfilAtivo.slice(1)})`, renderCards(queroPessoal), "#3b82f6")}
                ${montarSecao("✅ Já Assistidos", renderCards(jaAssistidos))}
            `;
        }
    } else if (paginaAtual === "quero") {
        const listaFinal = filtrados.filter(i => i.status === "quero");
        const container = document.getElementById("queroList");
        if (container) {
            container.innerHTML = `<div class="grid-comum">${renderCards(listaFinal)}</div>`;
        }
    }
};

function renderPipocas(nota) {
    let pipocas = "";
    for (let i = 1; i <= 5; i++) {
        pipocas += `<span style="filter: ${i <= nota ? 'grayscale(0)' : 'grayscale(1) opacity(0.3
