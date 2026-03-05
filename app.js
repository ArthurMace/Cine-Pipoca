import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// --- ACRÉSCIMO 1: CONFIGURAÇÃO API TMDB ---
const API_KEY = 'efe4cf2c1021597fbb2171bda02231f4';
const BASE_IMG = 'https://image.tmdb.org/t/p/w500';

// --- ACRÉSCIMO 2: FUNÇÃO DE BUSCA AUTOMÁTICA ---
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

// --- AJUSTE 1: FUNÇÃO DE NAVEGAÇÃO QUE FALTAVA ---
window.navegar = function(pagina) {
    paginaAtual = pagina;
    render();
};

// INICIALIZAÇÃO DO APP
async function iniciarApp() {
    try {
        data = await getData();
        render();
    } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
    }
}

// GESTÃO DE PERFIS - CORREÇÃO DE SEGURANÇA
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

// CONTROLE DE CAMPOS DO MODAL
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    
    const deveMostrarNotas = (status === "assistido" || status === "avaliacao");
    document.getElementById("campos-finalizacao").style.display = deveMostrarNotas ? "block" : "none";
};

// ABRIR E FECHAR MODAL
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

// Função para abrir/fechar o menu de bolinhas
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

// SALVAR NO FIREBASE - ACRESCENTADO BUSCA AUTOMÁTICA
window.adicionar = async function() {
    const id = document.getElementById("item-id-hidden").value;
    let nomeInput = document.getElementById("nome").value;
    let imagemInput = document.getElementById("imagem").value;
    let tipoInput = document.getElementById("tipo").value;
    let sinopseAuto = "";
    let bannerAuto = "";

    // ACRÉSCIMO: Se não houver imagem, busca no TMDB automaticamente
    if (!id && !imagemInput) {
        const dadosTMDB = await buscarNoTMDB(nomeInput);
        if (dadosTMDB) {
            nomeInput = dadosTMDB.titulo;
            imagemInput = dadosTMDB.imagem;
            tipoInput = dadosTMDB.tipo;
            sinopseAuto = dadosTMDB.sinopse;
            bannerAuto = dadosTMDB.banner;
        }
    }

    const itemDados = {
        nome: nomeInput,
        imagem: imagemInput,
        tipo: tipoInput,
        sinopse: sinopseAuto,
        banner: bannerAuto,
        status: document.getElementById("status").value,
        dono: document.getElementById("dono").value,
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notaArthur: document.getElementById("notaA").value || null,
        notaDay: document.getElementById("notaD").value || null,
        comentario: document.getElementById("comentario").value || "",
        ultimaAtualizacao: new Date().getTime()
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

// FINALIZAÇÃO RÁPIDA
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

// RENDERIZAÇÃO PRINCIPAL
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

// --- ACRÉSCIMO 3: GERADOR DE PIPOCAS ---
function renderPipocas(nota) {
    let pipocas = "";
    for (let i = 1; i <= 5; i++) {
        pipocas += `<span style="filter: ${i <= nota ? 'grayscale(0)' : 'grayscale(1) opacity(0.3)'}; font-size: 14px;">🍿</span>`;
    }
    return pipocas;
}

function renderCards(lista) {
    if (lista.length === 0) return `<p style="color:gray; padding:20px;">Vazio.</p>`;
    return lista.map(item => {
        const jaAssistido = item.status === 'assistido';
        const emAvaliacao = item.status === 'avaliacao';
        
        let textoBotao = "Finalizar ✅";
        if (item.tipo === 'serie' && item.status === 'quero') textoBotao = "Assistir 📺";

        let avisoFalta = "";
        let podeVotar = !jaAssistido; 

        if (emAvaliacao) {
            if (perfilAtivo === 'arthur') {
                if (item.notaArthur) {
                    avisoFalta = "<span style='color:#94a3b8;'>Aguardando nota da Day 👰‍♀️</span>";
                    podeVotar = false;
                } else {
                    avisoFalta = "<span style='color:#fbbf24;'>Falta sua nota! 🤵‍♂️</span>";
                    podeVotar = true;
                }
            } else if (perfilAtivo === 'day') {
                if (item.notaDay) {
                    avisoFalta = "<span style='color:#94a3b8;'>Aguardando nota do Arthur 🤵‍♂️</span>";
                    podeVotar = false;
                } else {
                    avisoFalta = "<span style='color:#fbbf24;'>Falta sua nota! 👰‍♀️</span>";
                    podeVotar = true;
                }
            }
        }

        return `
        <div class="card ${jaAssistido ? 'card-finalizado' : ''}" 
             onclick="${item.sinopse ? `window.verSinopse('${item.firebaseId}')` : ''}"
             style="${jaAssistido ? 'border: 1px solid rgba(59, 130, 246, 0.5);' : ''} ${emAvaliacao ? 'border: 1px solid #fbbf24;' : ''} cursor:pointer; position: relative;">
            
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            
            ${jaAssistido ? `
                <div onclick="event.stopPropagation(); window.ressuscitar('${item.firebaseId}')" 
                     title="Assistir novamente"
                     style="position: absolute; top: 10px; left: 10px; background: rgba(15, 23, 42, 0.9); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10; border: 1px solid #3b82f6; font-size: 14px; cursor: pointer;">
                     🔄
                </div>
            ` : ''}

            ${!jaAssistido ? `<button class="btn-edit" onclick="event.stopPropagation(); window.abrirModal('${item.firebaseId}')">✏️</button>` : ''}
            
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Imagem'">
            
            ${jaAssistido ? `<div class="tarja-finalizado"></div>` : ''}
            
            <div class="info">
                <b style="font-size:14px; display: block; margin-top: 10px;">${item.nome}</b>
                ${item.tipo === 'serie' ? `<p style="font-size:11px;">T${item.temporada || '1'} | E${item.episodio || '1'}</p>` : ''}
                <p style="font-size:10px; margin-top:5px;">${avisoFalta}</p>
                
                ${podeVotar ? `
                    <button onclick="event.stopPropagation(); window.finalizarRapido('${item.firebaseId}')" 
                            style="background:#10b981; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:10px; margin: 10px 0; font-weight:bold;">
                        ${emAvaliacao ? 'Dar minha nota ⭐' : textoBotao}
                    </button>
                ` : ''}

                ${!jaAssistido ? `<button onclick="event.stopPropagation(); window.excluirItem('${item.firebaseId}')" style="margin-top:10px; background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:10px;">Excluir</button>` : ''}
                
                ${jaAssistido ? `
                    <div style="margin-top:5px; border-top:1px solid rgba(255,255,255,0.2); padding-top:5px; text-align:center;">
                        <p style="font-size:10px; color:#fbbf24;">🤵‍♂️ ${renderPipocas(item.notaArthur)}</p>
                        <p style="font-size:10px; color:#fbbf24;">👰‍♀️ ${renderPipocas(item.notaDay)}</p>
                        <p style="font-size:10px; font-style:italic; color:#94a3b8; margin-top:5px; white-space: normal; word-wrap: break-word; line-height: 1.2;">"${item.comentario || 'Sem comentário.'}"</p>
                        
                        <button onclick="event.stopPropagation(); window.excluirItem('${item.firebaseId}')" style="margin-top:8px; background:none; color:#ef4444; border:none; cursor:pointer; font-size:9px; text-decoration:underline; opacity: 0.6;">Excluir Permanentemente</button>
                    </div>
                ` : ''}
            </div>
        </div>`;
    }).join("");
}
// --- ACRÉSCIMO 4: MODAL DE SINOPSE AO CLICAR NO CARD ---
window.verSinopse = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;

    // Se o seu HTML ainda não tiver o modal de sinopse, ele pode ser o mesmo do sorteio adaptado
    const container = document.getElementById("container-sorteado");
    document.getElementById("modal-sorteio").style.display = "flex";

    container.innerHTML = `
        <div style="background-image: url('${item.banner || ''}'); background-size: cover; background-position: center; border-radius: 12px; margin-bottom: 15px;">
            <div style="background: rgba(0,0,0,0.7); padding: 20px; border-radius: 12px;">
                <h2 style="color:#3b82f6; margin:0;">${item.nome}</h2>
                <p style="color:#f1f5f9; font-size:13px; margin-top:15px; line-height:1.5; text-align:left;">${item.sinopse || 'Sinopse não cadastrada.'}</p>
                <button class="btn-cancel" style="margin-top:20px;" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
            </div>
        </div>`;
};

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="border: 2px solid #3b82f6;">
            <img src="${item.imagem}" style="filter: brightness(0.4);">
            <div class="info" style="opacity: 1; background: transparent;">
                <p style="font-weight:bold; color:white; margin-top: 10px;">${item.nome}</p>
                <div style="display:flex; gap:15px; margin-top:10px;">
                    <button onclick="window.darMatch('${item.firebaseId}')" style="background:none; border:none; font-size:30px; cursor:pointer;">🍿</button>
                    <button onclick="window.darBlock('${item.firebaseId}')" style="background:none; border:none; font-size:30px; cursor:pointer;">🚫</button>
                </div>
            </div>
        </div>`).join("");
}

// TINDER ACTIONS
window.darMatch = async (id) => {
    const item = data.find(i => i.firebaseId === id);
    if(item) {
        await updateItem(id, { ...item, dono: 'casal' });
        data = await getData();
        render();
    }
};

window.darBlock = (id) => {
    let escondidos = JSON.parse(localStorage.getItem('esc_' + perfilAtivo)) || [];
    escondidos.push(id);
    localStorage.setItem('esc_' + perfilAtivo, JSON.stringify(escondidos));
    render();
};

// SORTEIO DE FILMES
window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    const container = document.getElementById("container-sorteado");
    document.getElementById("modal-sorteio").style.display = "flex";

    if (opcoes.length === 0) {
        container.innerHTML = `<div style="padding: 20px;"><h2 style="color: #ef4444;">Ops! 🍿</h2><p style="color: #94a3b8;">Não há filmes do Casal.</p><button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button></div>`;
        return;
    }

    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    container.innerHTML = `
        <h2 style="color:#3b82f6;">O escolhido foi:</h2>
        <img src="${sorteado.imagem}" style="width:100%; max-width:180px; border-radius:12px; margin: 15px 0; border: 2px solid #3b82f6;">
        <h3 style="color:white; margin:0; margin-top: 10px;">${sorteado.nome}</h3>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
            <button class="btn-primary" onclick="window.finalizarRapido('${sorteado.firebaseId}')">Assistir este! ✅</button>
            <button class="btn-cancel" onclick="window.sortearFilme()">Sortear outro 🎲</button>
            <button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
        </div>`;
};
window.ressuscitar = async function(id) {
    if (!confirm("Deseja mover este item de volta para 'Quero Assistir'?")) return;
    
    const item = data.find(i => i.firebaseId === id);
    if (item) {
        item.status = 'quero'; // Altera o status
        item.notaArthur = null; // Limpa as notas antigas
        item.notaDay = null;
        item.comentario = "";
        
        await updateItem(id, item); // Salva no Firebase
        data = await getData();     // Atualiza a lista local
        window.render();            // Renderiza a tela novamente
    }
};
iniciarApp();
