import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";
let perfilAtivo = null;

// INICIALIZAÇÃO
async function iniciarApp() {
    try {
        data = await getData();
        render();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// GESTÃO DE PERFIS (A função que tinha parado de funcionar)
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

window.navegar = function(p) {
    paginaAtual = p;
    render();
};

// MODAL E CAMPOS
window.toggleSerieFields = function() {
    const tipo = document.getElementById("tipo").value;
    const status = document.getElementById("status").value;
    document.getElementById("serie-fields").style.display = (tipo === "serie") ? "flex" : "none";
    document.getElementById("campos-finalizacao").style.display = (status === "assistido") ? "block" : "none";
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
}

// SALVAR
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
    
    id ? await updateItem(id, itemDados) : await addItem(itemDados);
    window.fecharModal();
    data = await getData();
    render();
};

// FINALIZAÇÃO RÁPIDA (O atalho que você pediu)
window.finalizarRapido = async function(id) {
    const item = data.find(i => i
