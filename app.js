import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// INICIALIZAÇÃO DO APP
async function iniciarApp() {
    try {
        data = await getData();
        console.log("Dados carregados:", data); // Para você ver no F12 se os dados chegaram
        render();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// GESTÃO DE PERFIS
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

// LÓGICA DO MODAL
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    const serieFields = document.getElementById("serie-fields");
    const camposFinal = document.getElementById("campos-finalizacao");
    
    if(serieFields) serieFields.style.display = (tipo === "serie") ? "flex" : "none";
    if(camposFinal) camposFinal.style.display = (status === "assistido") ? "block" : "none";
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
        }
    }
    window.toggleSerieFields();
};

window.fecharModal = function() { 
    document.getElementById("modal").style.display = "none"; 
};

function limparModal() {
    const campos = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD"];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
    document.getElementById("modal-title").innerText = "Adicionar Novo";
}

// SALVAR/EDITAR NO FIREBASE
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
        ultimaAtualizacao: new Date().getTime()
    };
    
    try {
        if (id) {
            await updateItem(id, itemDados);
        } else {
            await addItem(itemDados);
        }
        window.fecharModal();
        data = await getData();
        render();
    } catch (e) {
        alert("Erro ao salvar! Tente novamente.");
    }
};

window.excluirItem = async function(id) {
    if (confirm("Remover da nossa lista para sempre?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
};

// RENDERIZAÇÃO (Onde os filmes aparecem)
window.render = function() {
    if (!perfilAtivo) return;
    
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const pagAtiva = document.getElementById("page-" + paginaAtual);
    if(pagAtiva) pagAtiva.style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    
    // FILTRO COMPLETO: Mostra tudo do perfil atual + tudo do casal
    const filtrados = data.filter(i => {
        const donoMatch = (i.dono === perfilAtivo || i.dono === 'casal');
        const nomeMatch = i.nome ? i.nome.toLowerCase().includes(busca) : true;
        return donoMatch && nomeMatch;
    });

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        
        // Tinder
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const escondidos = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
        const sugestoes = data.filter(i => i.dono === outro && i.status === 'quero' && !escondidos.includes(i.firebaseId));

        document.getElementById("home").innerHTML = `
            ${assistindo.length ? `<h3>📺 Continuando...</h3><div class="carrossel">${renderCards(assistindo)}</div>` : ''}
            ${sugestoes.length ? `<h3>💡 Match de Filmes (Sugestões de ${outro})</h3><div class="carrossel">${renderSugestoes(sugestoes)}</div>` : ''}
            <h3>⭐ Nossa Lista Principal</h3><div class="grid-comum">${renderCards(quero)}</div>
        `;
    } else {
        const targetId = paginaAtual === "series" ? "series" : (paginaAtual === "filmes" ? "filmes" : "queroList");
        const listaPorTipo = filtrados.filter(i => {
            if (paginaAtual === "series") return i.tipo === "serie";
            if (paginaAtual === "filmes") return i.tipo === "filme";
            return i.status === "quero";
        });
        
        const container = document.getElementById(targetId);
        if(container) container.innerHTML = `<div class="grid-comum">${renderCards(listaPorTipo)}</div>`;
    }
};

function renderCards(lista) {
    if (lista.length === 0) return `<p style="color:gray; padding:20px;">Nenhum item aqui ainda.</p>`;
    return lista.map(item => `
        <div class="card">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Imagem'">
            <div class="info">
                <b style="font-size:14px;">${item.nome}</b>
                ${item.tipo === 'serie' ? `<p style="font-size:11px;">T${item.temporada || '1'} | E${item.episodio || '1'}</p>` : ''}
                ${item.status === 'assistido' ? `<p style="font-size:11px;">⭐ A:${item.notaArthur || '-'} | D:${item.notaDay || '-'}</p>` : ''}
                <button onclick="window.excluirItem('${item.firebaseId}')" style="margin-top:10px; background:red; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:10px;">Excluir</button>
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="border: 2px solid #3b82f6;">
            <img src="${item.imagem}" style="filter: brightness(0.4);">
            <div class="info" style="opacity: 1; background: transparent;">
                <p style="font-weight:bold;">${item.nome}</p>
                <div style="display:flex; gap:15px; margin-top:10px;">
                    <button onclick="window.darMatch('${item.firebaseId}')" style="background:none; border:none; font-size:30px; cursor:pointer;">🍿</button>
                    <button onclick="window.darBlock('${item.firebaseId}')" style="background:none; border:none; font-size:30px; cursor:pointer;">🚫</button>
                </div>
            </div>
        </div>`).join("");
}

// MATCH DO TINDER
window.darMatch = async (id) => {
    await updateItem(id, { dono: 'casal' });
    data = await getData();
    render();
};

window.darBlock = (id) => {
    let esc = JSON.parse(localStorage.getItem('escondidos_' + perfilAtivo)) || [];
    esc.push(id);
    localStorage.setItem('escondidos_' + perfilAtivo, JSON.stringify(esc));
    render();
};

// SORTEIO (CORRIGIDO PARA FILMES E DINÂMICO)
window.sortearFilme = function() {
    // Filtra filmes do casal que estão na lista "Quero Assistir"
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    
    const modalSorteio = document.getElementById("modal-sorteio");
    const container = document.getElementById("container-sorteado");

    // Mostra o modal primeiro
    modalSorteio.style.display = "flex";

    if (opcoes.length === 0) {
        // Em vez de alert, injeta o aviso direto no HTML do modal
        container.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="color: #ef4444;">Ops! 🍿</h2>
                <p style="color: #94a3b8; margin: 15px 0;">Não encontramos filmes do <b>Casal</b> na lista <b>"Quero Assistir"</b>.</p>
                <p style="font-size: 13px; color: gray;">Adicione novos filmes ou mude o dono para "Casal" para poder sortear.</p>
                <button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'" style="margin-top:20px; color: #3b82f6; font-weight: bold; cursor:pointer;">Entendido</button>
            </div>
        `;
        return;
    }

    // Se houver filmes, segue o sorteio normal
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    
    container.innerHTML = `
        <h2 style="color:#3b82f6;">O escolhido foi:</h2>
        <img src="${sorteado.imagem}" style="width:100%; max-width:200px; border-radius:15px; margin: 15px 0; border: 2px solid #3b82f6;">
        <h3 style="color:white;">${sorteado.nome}</h3>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            <button class="btn-primary" onclick="window.marcarAssistindoSorteado('${sorteado.firebaseId}')">Assistir este! ✅</button>
            <button class="btn-cancel" onclick="window.sortearFilme()">Sortear outro 🎲</button>
            <button class="btn-cancel" onclick="document.getElementById('modal-sorteio').style.display='none'">Fechar</button>
        </div>
    `;
};

window.marcarAssistindoSorteado = async (id) => {
    await updateItem(id, { status: 'assistindo' });
    document.getElementById("modal-sorteio").style.display = "none";
    data = await getData();
    render();
};

iniciarApp();

