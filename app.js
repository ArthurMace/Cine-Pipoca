import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let paginaAtual = "home";

// ---------------- INICIAR ----------------
async function iniciarApp() {
  data = await getData();
  render();
}

// ---------------- NAVEGAÇÃO ----------------
function navegar(pagina) {
  paginaAtual = pagina;
  render();
}

// ---------------- CAMPOS SÉRIE ----------------
function toggleSerieFields() {
  const tipo = document.getElementById("tipo").value;
  document.getElementById("serie-fields").style.display =
    tipo === "serie" ? "flex" : "none";
}

// ---------------- MODAL ----------------
function abrirModal() {
  limparModal();
  document.getElementById("modal").style.display = "block";
  toggleSerieFields();
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

function limparModal() {
  document.getElementById("nome").value = "";
  document.getElementById("imagem").value = "";
  document.getElementById("temporada").value = "";
  document.getElementById("episodio").value = "";
  document.getElementById("item-id-hidden").value = "";
}

// ---------------- ADICIONAR / EDITAR ----------------
async function adicionar() {
  const idEdicao = document.getElementById("item-id-hidden").value;

  const nome = document.getElementById("nome").value;
  const imagem = document.getElementById("imagem").value;
  const tipo = document.getElementById("tipo").value;
  const status = document.getElementById("status").value;
  const temporada = document.getElementById("temporada").value || null;
  const episodio = document.getElementById("episodio").value || null;

  if (idEdicao) {
    const item = data.find(i => i.firebaseId === idEdicao);

    item.nome = nome;
    item.imagem = imagem;
    item.tipo = tipo;
    item.status = status;
    item.temporada = temporada;
    item.episodio = episodio;

    await updateItem(idEdicao, item);
  } else {
    const novo = {
      nome,
      imagem,
      tipo,
      status,
      temporada,
      episodio,
      notas: {},
      comentarios: {}
    };

    const firebaseId = await addItem(novo);
    novo.firebaseId = firebaseId;
    data.push(novo);
  }

  fecharModal();
  render();
}

// ---------------- ABRIR EDIÇÃO ----------------
function abrirEdicao(id) {
  const item = data.find(i => i.firebaseId === id);

  document.getElementById("modal").style.display = "block";

  document.getElementById("nome").value = item.nome;
  document.getElementById("imagem").value = item.imagem;
  document.getElementById("tipo").value = item.tipo;
  document.getElementById("status").value = item.status;
  document.getElementById("temporada").value = item.temporada || "";
  document.getElementById("episodio").value = item.episodio || "";
  document.getElementById("item-id-hidden").value = id;

  toggleSerieFields();
}

// ---------------- EXCLUIR ----------------
async function excluirItem(id) {
  if (!confirm("Deseja excluir?")) return;

  await deleteItem(id);
  data = data.filter(i => i.firebaseId !== id);
  render();
}

// ---------------- RENDER ----------------
function render() {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById("page-" + paginaAtual).style.display = "block";

  const lista = document.getElementById(
    paginaAtual === "home"
      ? "home"
      : paginaAtual === "quero"
      ? "queroList"
      : paginaAtual
  );

  const busca = document.getElementById("busca").value.toLowerCase();

  const filtrado = data.filter(i => {
    const match = i.nome.toLowerCase().includes(busca);

    if (paginaAtual === "home") return match;
    if (paginaAtual === "quero") return i.status === "quero" && match;
    if (paginaAtual === "series") return i.tipo === "serie" && match;
    if (paginaAtual === "filmes") return i.tipo === "filme" && match;

    return match;
  });

  lista.innerHTML = filtrado.map(item => `
    <div class="card ${item.status === "assistido" ? "assistido" : ""}">
      
      ${item.tipo === "serie" ? `
        <button class="btn-edit" onclick="abrirEdicao('${item.firebaseId}')">
          ✏
        </button>
      ` : ""}

      <img src="${item.imagem}">

      <div class="info">
        <b>${item.nome}</b><br>

        ${item.tipo === "serie" ? `
          <small>Temp ${item.temporada || 1} • Ep ${item.episodio || 1}</small><br>
        ` : ""}

        <button class="btn-danger" onclick="excluirItem('${item.firebaseId}')">
          Excluir
        </button>
      </div>
    </div>
  `).join("");
}

// ---------------- GLOBAL ----------------
window.navegar = navegar;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.adicionar = adicionar;
window.abrirEdicao = abrirEdicao;
window.excluirItem = excluirItem;
window.toggleSerieFields = toggleSerieFields;
window.render = render;

iniciarApp();
