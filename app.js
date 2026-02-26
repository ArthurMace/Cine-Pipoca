import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// FUNÇÕES DE PERFIL
window.selecionarPerfil = function(nome) {
    perfilAtivo = nome;
    const modal = document.getElementById('modal-perfil');
    if (modal) modal.style.display = 'none';
    
    const emoji = nome === 'arthur' ? '🤵‍♂️' : '👰‍♀️';
    const titulo = document.getElementById('titulo-app');
    if (titulo) titulo.innerHTML = `🎬 Cine Pipoca - ${emoji}`;
    
    render();
}

window.resetarPerfil = function() {
    perfilAtivo = null;
    const modal = document.getElementById('modal-perfil');
    if (modal) modal.style.display = 'flex';
}

async function iniciarApp() {
    data = await getData();
    // O app inicia mas aguarda a seleção de perfil no modal para renderizar
}

function navegar(pagina) {
    paginaAtual = pagina;
    render();
}

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
        document.getElementById("dono").value = item.dono || "casal";
        document.getElementById("temporada").value = item.temporada || "";
        document.getElementById("episodio").value = item.episodio || "";
        document.getElementById("notaA").value = item.notas?.arthur || "";
        document.getElementById("notaD").value = item.notas?.daiane || "";
        document.getElementById("comA").value = item.comentarios?.arthur || "";
        document.getElementById("comD").value = item.comentarios?.daiane || "";
    } else {
        document.getElementById("modal-title").innerText = "Adicionar Novo";
        document.getElementById("dono").value = "casal";
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
        dono: document.getElementById("dono").value,
        temporada: document.getElementById("temporada").value || null,
        episodio: document.getElementById("episodio").value || null,
        notas: { arthur: document.getElementById("notaA").value || null, daiane: document.getElementById("notaD").value || null },
        comentarios: { arthur: document.getElementById("comA").value || "", daiane: document.getElementById("comD").value || "" }
    };
    id ? await updateItem(id, itemDados) : await addItem(itemDados);
    fecharModal();
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
        const pertence = (i.dono === perfilAtivo || i.dono === 'casal' || !i.dono);
        return pertence && i.nome.toLowerCase().includes(busca);
    });

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const finalizados = filtrados.filter(i =>
