import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// Função para selecionar perfil no início
function selecionarPerfil(nome) {
    perfilAtivo = nome;
    
    // Esconde o modal de perfil
    document.getElementById('modal-perfil').style.display = 'none';
    
    // Mostra o conteúdo do site (caso estivesse escondido)
    document.querySelector('header').style.opacity = "1";
    document.querySelector('main').style.opacity = "1";
    document.querySelector('.search-box').style.opacity = "1";
    
    // Atualiza o título com o emoji e o nome
    const emoji = nome === 'arthur' ? '🤵‍♂️' : '👰‍♀️';
    document.getElementById('titulo-app').innerHTML = `🎬 Cine Pipoca - ${emoji}`;
    
    render();
}

// NOVA FUNÇÃO: Para voltar à tela de seleção
function resetarPerfil() {
    perfilAtivo = null;
    // Mostra o modal novamente
    document.getElementById('modal-perfil').style.display = 'flex';
    
    // Opcional: esconde o fundo para focar só nos perfis
    document.querySelector('header').style.opacity = "0";
    document.querySelector('main').style.opacity = "0";
    document.querySelector('.search-box').style.opacity = "0";
}

// Exponha a função para o HTML
window.resetarPerfil = resetarPerfil;

function atualizarCamposModal() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    document.getElementById("campos-finalizacao").style.display = (status === "assistido") ? "block" : "none";
}

function abrirModal(id = null) {
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
        document.getElementById("dono").value = item.dono || "casal"; // Carrega o dono atual
        document.getElementById("temporada").value = item.temporada || "";
        document.getElementById("episodio").value = item.episodio || "";
        document.getElementById("notaA").value = item.notas?.arthur || "";
        document.getElementById("notaD").value = item.notas?.daiane || "";
        document.getElementById("comA").value = item.comentarios?.arthur || "";
        document.getElementById("comD").value = item.comentarios?.daiane || "";
    } else {
        document.getElementById("modal-title").innerText = "Adicionar Novo";
        document.getElementById("dono").value = "casal"; // Padrão para novos
    }
    atualizarCamposModal();
}

function fecharModal() { document.getElementById("modal").style.display = "none"; }

function limparModal() {
    const ids = ["item-id-hidden", "nome", "imagem", "temporada", "episodio", "notaA", "notaD", "comA", "comD"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
}

async function adicionar() {
    const id = document.getElementById("item-id-hidden").value;
    const itemDados = {
        nome: document.getElementById("nome").value,
        imagem: document.getElementById("imagem").value,
        tipo: document.getElementById("tipo").value,
        status: document.getElementById("status").value,
        dono: document.getElementById("dono").value, // SALVANDO O DONO
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notas: { arthur: document.getElementById("notaA").value || null, daiane: document.getElementById("notaD").value || null },
        comentarios: { arthur: document.getElementById("comA").value || "", daiane: document.getElementById("comD").value || "" }
    };
    id ? await updateItem(id, itemDados) : await addItem(itemDados);
    fecharModal();
    // Recarregar dados para refletir as mudanças
    data = await getData();
    render();
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir?")) {
        await deleteItem(id);
        data = await getData();
        render();
    }
}

function render() {
    if (!perfilAtivo) return; // Não renderiza nada se não escolheu perfil

    const containers = {
        home: document.getElementById("home"),
        series: document.getElementById("series"),
        filmes: document.getElementById("filmes"),
        quero: document.getElementById("queroList")
    };

    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + paginaAtual).style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    
    // FILTRO DE PERFIL + BUSCA
    const filtrados = data.filter(i => {
        const pertenceAoPerfil = (i.dono === perfilAtivo || i.dono === 'casal' || !i.dono);
        const combinaBusca = i.nome.toLowerCase().includes(busca);
        return pertenceAoPerfil && combinaBusca;
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
                ${estaFinalizado ? `
                    <div style="font-size:10px; color:#3b82f6; font-weight:bold; margin-bottom: 5px;">
                        ⭐ A:${item.notas?.arthur || '-'} | D:${item.notas?.daiane || '-'}
                    </div>
                ` : ''}
                <div style="display: ${estaFinalizado ? 'none' : 'flex'}; gap: 5px; margin-top: 8px; width: 90%; justify-content: center;">
                    <button onclick="finalizarItem('${item.firebaseId}')" style="background:#10b981; border:none; color:white; border-radius:4px; flex:1; cursor:pointer; padding:8px; font-size: 14px; display: flex; align-items: center; justify-content: center;">✅</button>
                    <button class="btn-danger" onclick="excluirItem('${item.firebaseId}')" style="flex:1; margin-top:0; padding:8px; display: flex; align-items: center; justify-content: center;">Excluir</button>
                </div>
            </div>
        </div>
        `;
    }).join("");
}

// Funções globais
window.selecionarPerfil = selecionarPerfil;
window.finalizarItem = function(id) {
    const item = data.find(i => i.firebaseId === id);
    if (item) {
        abrirModal(id); 
        const selectStatus = document.getElementById("status");
        if(selectStatus) {
            selectStatus.value = "assistido";
            atualizarCamposModal();
        }
        document.getElementById("modal-title").innerText = "Finalizar: " + item.nome;
    }
}
window.navegar = navegar;
window.abrirModal = abrirModal;
window.abrirEdicao = (id) => abrirModal(id);
window.fecharModal = fecharModal;
window.adicionar = adicionar; 
window.excluirItem = excluir;
window.toggleSerieFields = atualizarCamposModal;
window.toggleRatingFields = atualizarCamposModal;
window.render = render;

iniciarApp();

