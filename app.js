import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";

// Inicia o App
async function iniciarApp() {
    data = await getData();
    render();
}

// Navegação entre abas
function navegar(pagina) {
    paginaAtual = pagina;
    render();
}

// OBS: Controla o que aparece no Modal dependendo do que o usuário escolhe
function atualizarCamposModal() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;

    // Mostra Temporada/Episódio se for Série
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";

    // Mostra Notas de Arthur/Daiane apenas se o status for "Já Assisti"
    document.getElementById("campos-finalizacao").style.display = (status === "assistido") ? "block" : "none";
}

function abrirModal(id = null) {
    limparModal();
    const modal = document.getElementById("modal");
    modal.style.display = "block";

    if (id) {
        // Modo Edição
        const item = data.find(i => i.firebaseId === id);
        document.getElementById("modal-title").innerText = "Editar Item";
        document.getElementById("item-id-hidden").value = id;
        document.getElementById("nome").value = item.nome;
        document.getElementById("imagem").value = item.imagem;
        document.getElementById("tipo").value = item.tipo;
        document.getElementById("status").value = item.status;
        document.getElementById("temporada").value = item.temporada || "";
        document.getElementById("episodio").value = item.episodio || "";
        document.getElementById("notaA").value = item.notas?.arthur || "";
        document.getElementById("notaD").value = item.notas?.daiane || "";
        document.getElementById("comA").value = item.comentarios?.arthur || "";
        document.getElementById("comD").value = item.comentarios?.daiane || "";
    } else {
        document.getElementById("modal-title").innerText = "Adicionar Novo";
    }
    atualizarCamposModal();
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

function limparModal() {
    document.getElementById("item-id-hidden").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("imagem").value = "";
    document.getElementById("temporada").value = "";
    document.getElementById("episodio").value = "";
    document.getElementById("notaA").value = "";
    document.getElementById("notaD").value = "";
    document.getElementById("comA").value = "";
    document.getElementById("comD").value = "";
}

async function salvar() {
    const id = document.getElementById("item-id-hidden").value;
    const itemDados = {
        nome: document.getElementById("nome").value,
        imagem: document.getElementById("imagem").value,
        tipo: document.getElementById("tipo").value,
        status: document.getElementById("status").value,
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notas: {
            arthur: document.getElementById("notaA").value || null,
            daiane: document.getElementById("notaD").value || null
        },
        comentarios: {
            arthur: document.getElementById("comA").value || "",
            daiane: document.getElementById("comD").value || ""
        }
    };

    if (id) {
        await updateItem(id, itemDados);
    } else {
        await addItem(itemDados);
    }

    fecharModal();
    iniciarApp(); // Recarrega dados da nuvem
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir?")) {
        await deleteItem(id);
        iniciarApp();
    }
}

// OBS: Função central de desenho da tela
function render() {
    const containerHome = document.getElementById("home");
    const containerSeries = document.getElementById("series");
    const containerFilmes = document.getElementById("filmes");
    const containerQuero = document.getElementById("queroList");

    // Esconde todas as páginas
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + paginaAtual).style.display = "block";

    const busca = document.getElementById("busca").value.toLowerCase();
    const filtrados = data.filter(i => i.nome.toLowerCase().includes(busca));

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const finalizados = filtrados.filter(i => i.status === "assistido");

        containerHome.innerHTML = `
            <h3>📺 Continuando...</h3>
            <div class="grid">${renderCards(assistindo)}</div>
            <h3>✅ Finalizados</h3>
            <div class="grid">${renderCards(finalizados)}</div>
        `;
    } else if (paginaAtual === "series") {
        containerSeries.innerHTML = renderCards(filtrados.filter(i => i.tipo === "serie"));
    } else if (paginaAtual === "filmes") {
        containerFilmes.innerHTML = renderCards(filtrados.filter(i => i.tipo === "filme"));
    } else if (paginaAtual === "quero") {
        containerQuero.innerHTML = renderCards(filtrados.filter(i => i.status === "quero"));
    }
}

function renderCards(lista) {
    if (lista.length === 0) return `<p style="padding:2rem; opacity:0.5;">Nenhum item encontrado.</p>`;
    
    return lista.map(item => `
        <div class="card ${item.status === 'assistido' ? 'assistido' : ''}">
            <button class="btn-edit" onclick="abrirEdicao('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}" onerror="this.src='https://via.placeholder.com/200x300?text=Sem+Poster'">
            <div class="info">
                <b>${item.nome}</b>
                ${item.tipo === 'serie' ? `<small>T${item.temporada || 1} | Ep${item.episodio || 1}</small>` : ''}
                ${item.status === 'assistido' ? `
                    <div class="nota-tag">A: ${item.notas?.arthur || '-'} | D: ${item.notas?.daiane || '-'}</div>
                ` : ''}
                <button class="btn-danger" onclick="excluirItem('${item.firebaseId}')">Remover</button>
            </div>
        </div>
    `).join("");
}

// Exportando funções para o HTML
window.navegar = navegar;
window.abrirModal = () => abrirModal();
window.abrirEdicao = (id) => abrirModal(id);
window.fecharModal = fecharModal;
window.adicionar = salvar;
window.excluirItem = excluir;
window.toggleSerieFields = atualizarCamposModal;
window.toggleRatingFields = atualizarCamposModal;
window.render = render;

iniciarApp();
