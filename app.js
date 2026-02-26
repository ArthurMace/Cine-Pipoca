import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// INICIALIZAÇÃO DO APP
async function iniciarApp() {
    try {
        data = await getData();
        render();
    } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
    }
}

// GESTÃO DE PERFIS
window.selecionarPerfil = function(nome) {
    perfilAtivo = nome;
    document.getElementById('modal-perfil').style.display = 'none';
    const emoji = (nome === 'arthur') ? '🤵‍♂️' : '👰‍♀️';
    document.getElementById('titulo-app').innerHTML = `🎬 Cine Pipoca - ${emoji}`;
    render();
};

window.resetarPerfil = function() {
    perfilAtivo = null;
    document.getElementById('modal-perfil').style.display = 'flex';
};

window.navegar = function(p) {
    paginaAtual = p;
    render();
};

// CONTROLE DE CAMPOS DO MODAL
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    
    // Mostra temporada/episódio se for série (Mantido original)
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    
    // Mostra notas/comentário se o status for 'Já Assisti' OU 'Aguardando Notas'
    // Adicionei o (status === "avaliacao") para o modal abrir os campos de nota também nesse caso.
    const deveMostrarNotas = (status === "assistido" || status === "avaliacao");
    document.getElementById("campos-finalizacao").style.display = deveMostrarNotas ? "block" : "none";
};;
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

// SALVAR NO FIREBASE
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

// FINALIZAÇÃO RÁPIDA (Check verde no card)
window.finalizarRapido = async function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (!item) return;
    
    const nA = prompt(`Nota do Arthur (1 a 5) para "${item.nome}":`, "5");
    const nD = prompt(`Nota da Day (1 a 5) para "${item.nome}":`, "5");
    const coment = prompt(`O que acharam do filme?`, "Muito bom!");

    if (nA !== null && nD !== null) {
        const dadosAtualizados = {
            ...item,
            status: 'assistido',
            notaArthur: nA,
            notaDay: nD,
            comentario: coment,
            ultimaAtualizacao: new Date().getTime()
        };
        await updateItem(id, dadosAtualizados);
        data = await getData();
        render();
    }
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
    const pag = document.getElementById("page-" + paginaAtual);
    if(pag) pag.style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    
    // Filtro Geral (Respeita o Perfil Ativo ou Casal)
    const filtrados = data.filter(i => {
        const donoMatch = (i.dono === perfilAtivo || i.dono === 'casal');
        const nomeMatch = (i.nome || "").toLowerCase().includes(busca);
        return donoMatch && nomeMatch;
    });

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        const jaAssistidos = filtrados.filter(i => i.status === "assistido"); // RECUPERADO
        
        const outroPerfil = (perfilAtivo === 'arthur') ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('esc_' + perfilAtivo)) || [];
        const sugestoes = data.filter(i => i.dono === outroPerfil && i.status === 'quero' && !escondidos.includes(i.firebaseId));

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3 class="section-title">📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<h3 class="section-title">💡 Tinder (Sugestões de ${outroPerfil})</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div>` : ''}
            <h3 class="section-title">⭐ Nossa Lista</h3><div class="grid-comum">${renderCards(quero)}</div>
            ${jaAssistidos.length ? `<h3 class="section-title">✅ Já Assistidos</h3><div class="carrossel">${renderCards(jaAssistidos)}</div>` : ''}
        `;
    } else {
        let listaFinal = [];
        let targetId = "";
        
        if (paginaAtual === "series") {
            listaFinal = filtrados.filter(i => i.tipo === "serie");
            targetId = "series";
        } else if (paginaAtual === "filmes") {
            listaFinal = filtrados.filter(i => i.tipo === "filme");
            targetId = "filmes";
        } else if (paginaAtual === "quero") {
            listaFinal = filtrados.filter(i => i.status === "quero");
            targetId = "queroList";
        }
        
        document.getElementById(targetId).innerHTML = `<div class="grid-comum">${renderCards(listaFinal)}</div>`;
    }
};

function renderCards(lista) {
    if (lista.length === 0) return `<p style="color:gray; padding:20px;">Vazio.</p>`;
    return lista.map(item => {
        const jaAssistido = item.status === 'assistido';
        
        // --- ADICIONADO: Lógica para mudar o texto do botão ---
        let textoBotao = "Finalizar ✅";
        if (item.tipo === 'serie' && item.status === 'quero') {
            textoBotao = "Assistir 📺";
        }
        // -----------------------------------------------------

        return `
        <div class="card" style="${jaAssistido ? 'border: 1px solid rgba(59, 130, 246, 0.5);' : ''}">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            
            ${!jaAssistido ? `<button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>` : ''}
            
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Imagem'">
            
            ${jaAssistido ? `<div class="tarja-finalizado"></div>` : ''}
            
            <div class="info">
                <b style="font-size:14px;">${item.nome}</b>
                ${item.tipo === 'serie' ? `<p style="font-size:11px;">T${item.temporada || '1'} | E${item.episodio || '1'}</p>` : ''}
                
                ${!jaAssistido ? `
                    <button onclick="window.finalizarRapido('${item.firebaseId}')" 
                            style="background:#10b981; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:10px; margin: 10px 0; font-weight:bold;">
                        ${textoBotao}
                    </button>
                    <button onclick="window.excluirItem('${item.firebaseId}')" style="margin-top:10px; background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:10px;">Excluir</button>
                ` : ''}

                ${jaAssistido ? `
                    <div style="margin-top:5px; border-top:1px solid rgba(255,255,255,0.2); padding-top:5px; text-align:center;">
                        <p style="font-size:11px; color:#fbbf24;">🤵‍♂️ A: ${item.notaArthur || '-'} | 👰‍♀️ D: ${item.notaDay || '-'}</p>
                        <p style="font-size:10px; font-style:italic; color:#94a3b8; margin-top:5px;">"${item.comentario || 'Sem comentário.'}"</p>
                    </div>
                ` : ''}
            </div>
        </div>`;
    }).join("");
}
function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="border: 2px solid #3b82f6;">
            <img src="${item.imagem}" style="filter: brightness(0.4);">
            <div class="info" style="opacity: 1; background: transparent;">
                <p style="font-weight:bold; color:white;">${item.nome}</p>
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
        container.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="color: #ef4444;">Ops! 🍿</h2>
                <p style="color: #94a3b8;">Não há filmes do Casal em "Quero Assistir".</p>
                <button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
            </div>`;
        return;
    }

    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    container.innerHTML = `
        <h2 style="color:#3b82f6;">O escolhido foi:</h2>
        <img src="${sorteado.imagem}" style="width:100%; max-width:180px; border-radius:12px; margin: 15px 0; border: 2px solid #3b82f6;">
        <h3 style="color:white; margin:0;">${sorteado.nome}</h3>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
            <button class="btn-primary" onclick="window.finalizarRapido('${sorteado.firebaseId}')">Assistir este! ✅</button>
            <button class="btn-cancel" onclick="window.sortearFilme()">Sortear outro 🎲</button>
            <button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
        </div>`;
};

// DISPARA O APP
iniciarApp();



