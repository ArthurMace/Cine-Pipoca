import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// --- CONFIGURAÇÃO API TMDB ---
const API_KEY = 'efe4cf2c1021597fbb2171bda02231f4';
const BASE_IMG = 'https://image.tmdb.org/t/p/w500';

// --- FUNÇÃO DE BUSCA AUTOMÁTICA (COM TOTAIS) ---
async function buscarNoTMDB(nome) {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(nome)}`;
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        if (dados.results && dados.results.length > 0) {
            const item = dados.results[0]; 
            let extras = { temporadas: null, episodios: null };

            // Busca detalhada se for série para pegar totais
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
    if (letraElemento) letraElemento.innerText = nome.charAt(0).toUpperCase();
    const menu = document.getElementById('dropdownPerfil');
    if (menu) menu.classList.remove('show-menu');
    const titulo = document.getElementById('titulo-app');
    if (titulo) titulo.innerHTML = `CINE PIPOCA`;
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

window.fecharModal = function() { document.getElementById("modal").style.display = "none"; };

function limparModal() {
    const campos = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comentario"];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
    document.getElementById("modal-title").innerText = "Adicionar Novo";
}

window.toggleMenuPerfil = function() {
    const menu = document.getElementById('dropdownPerfil');
    if (menu) menu.classList.toggle('show-menu');
};

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
    
    if (id) { await updateItem(id, itemDados); } 
    else { await addItem(itemDados); }
    
    window.fecharModal();
    data = await getData();
    render();
};

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
        dadosAtualizados.comentario = `A: ${dadosAtualizados.comentarioArthur || ""} | D: ${dadosAtualizados.comentarioDay || ""}`;
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
        return (i.nome || "").toLowerCase().includes(busca) && donoMatch;
    });

    const montarSecao = (titulo, conteudo, cor = "#94a3b8") => {
        if (!conteudo || conteudo.includes("Vazio.")) return "";
        const idSetas = "scroll-" + Math.random().toString(36).substr(2, 5);
        return `<h3 class="section-title" style="color: ${cor}; padding: 0 5%;">${titulo}</h3>
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
        const nomeOutro = outroPerfil.charAt(0).toUpperCase() + outroPerfil.slice(1);
        const escondidos = JSON.parse(localStorage.getItem('esc_' + perfilAtivo)) || [];
        const sugestoes = (paginaAtual === "home") ? data.filter(i => i.dono === outroPerfil && i.status === 'quero' && !escondidos.includes(i.firebaseId)) : [];

        const targetDiv = document.getElementById(paginaAtual) || document.getElementById("page-" + paginaAtual);
        if(targetDiv) {
            targetDiv.innerHTML = `
                ${montarSecao("📺 Continuando...", renderCards(assistindo))}
                ${montarSecao("⏳ Aguardando Notas", renderCards(aguardando), "#fbbf24")}
                ${paginaAtual === "home" ? montarSecao(`💡 Sugerido por ${nomeOutro}`, renderSugestoes(sugestoes)) : ""}
                ${montarSecao("⭐ Nossa Lista (Juntos)", renderCards(queroCasal))}
                ${montarSecao(`👤 Minha Lista`, renderCards(queroPessoal), "#3b82f6")}
                ${montarSecao("✅ Já Assistidos", renderCards(jaAssistidos))}
            `;
        }
    }
};

function renderPipocas(nota) {
    let pipocas = "";
    for (let i = 1; i <= 5; i++) {
        pipocas += `<span style="filter: ${i <= nota ? 'grayscale(0)' : 'grayscale(1) opacity(0.3)'}; font-size: 12px;">🍿</span>`;
    }
    return pipocas;
}

function renderCards(lista) {
    if (lista.length === 0) return `<p style="color:gray; padding:20px;">Vazio.</p>`;
    return lista.map(item => {
        const jaAssistido = item.status === 'assistido';
        const emAvaliacao = item.status === 'avaliacao';
        const emQuero = item.status === 'quero';
        
        let textoBotao = "Finalizar ✅";
        if (item.tipo === 'serie' && emQuero) textoBotao = "Assistir 📺";

        const votou = (perfilAtivo === 'arthur' && item.notaArthur) || (perfilAtivo === 'day' && item.notaDay);
        let avisoFalta = emAvaliacao ? (votou ? "<span style='color:#94a3b8;'>Aguardando parceiro...</span>" : "<span style='color:#fbbf24;'>Falta sua nota!</span>") : "";
        
        // CORREÇÃO: Se estiver em 'quero', o botão abre o modal para mudar o status para 'assistindo'
        let acaoBotao = emQuero ? `window.abrirModal('${item.firebaseId}')` : `window.finalizarRapido('${item.firebaseId}')`;
        let podeVotar = !jaAssistido && !votou;

        return `
        <div class="card ${jaAssistido ? 'card-finalizado' : ''}" onclick="window.verSinopse('${item.firebaseId}')">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="event.stopPropagation(); window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Imagem'">
            <div class="info">
                <b>${item.nome}</b>
                ${item.tipo === 'serie' ? `<p style="font-size:11px; color:#60a5fa;">T${item.temporada || '1'}/${item.totalSeasons || '?'} | E${item.episodio || '1'}/${item.totalEpisodes || '?'}</p>` : ''}
                <p style="font-size:10px;">${avisoFalta}</p>
                ${podeVotar ? `<button onclick="event.stopPropagation(); ${acaoBotao}" style="background:#10b981; color:white; border:none; padding:5px; border-radius:5px; cursor:pointer; font-size:10px; margin-top:5px;">${textoBotao}</button>` : ''}
                ${jaAssistido && item.tipo === 'serie' ? `<button onclick="event.stopPropagation(); window.retomarSerie('${item.firebaseId}')" style="background:#3b82f6; color:white; border:none; padding:5px; border-radius:5px; cursor:pointer; font-size:10px; margin-top:5px;">Nova Temporada 🔄</button>` : ''}
                ${jaAssistido ? `<div style="margin-top:5px;">🤵‍♂️ ${renderPipocas(item.notaArthur)}<br>👰‍♀️ ${renderPipocas(item.notaDay)}</div>` : ''}
            </div>
        </div>`;
    }).join("");
}

window.verSinopse = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    const container = document.getElementById("container-sorteado");
    document.getElementById("modal-sorteio").style.display = "flex";
    container.innerHTML = `
        <div style="background-image: url('${item.banner || ''}'); background-size: cover; padding: 20px; border-radius: 12px;">
            <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 12px;">
                <h2 style="color:#3b82f6;">${item.nome}</h2>
                <p style="color:white; font-size:13px; text-align:left;">${item.sinopse || 'Sem sinopse.'}</p>
                <button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
            </div>
        </div>`;
};

function renderSugestoes(lista) {
    return lista.map(item => `<div class="card" style="border: 1px solid #3b82f6;">
        <img src="${item.imagem}" style="filter: brightness(0.5);">
        <div class="info" style="opacity:1; background:transparent;">
            <p>${item.nome}</p>
            <button onclick="window.darMatch('${item.firebaseId}')">🍿</button>
            <button onclick="window.darBlock('${item.firebaseId}')">🚫</button>
        </div>
    </div>`).join("");
}

window.darMatch = async (id) => {
    const item = data.find(i => i.firebaseId === id);
    if(item) { await updateItem(id, { ...item, dono: 'casal' }); data = await getData(); render(); }
};

window.darBlock = (id) => {
    let escondidos = JSON.parse(localStorage.getItem('esc_' + perfilAtivo)) || [];
    escondidos.push(id);
    localStorage.setItem('esc_' + perfilAtivo, JSON.stringify(escondidos));
    render();
};

window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return;
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    const container = document.getElementById("container-sorteado");
    document.getElementById("modal-sorteio").style.display = "flex";
    container.innerHTML = `<h3>${sorteado.nome}</h3><img src="${sorteado.imagem}" style="width:150px;"><br><button class="btn-primary" onclick="window.finalizarRapido('${sorteado.firebaseId}')">Assistir</button><button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>`;
};

iniciarApp();
