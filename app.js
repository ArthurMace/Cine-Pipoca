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
  document.getElementById("modal").style.display = "block";
  toggleSerieFields();
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// ---------------- ADICIONAR ----------------
async function adicionar() {
  const nome = document.getElementById("nome").value;
  const imagem = document.getElementById("imagem").value;
  const tipo = document.getElementById("tipo").value;
  const status = document.getElementById("status").value;
  const temporada = document.getElementById("temporada").value || null;
  const episodio = document.getElementById("episodio").value || null;

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

  fecharModal();
  render();
}

// ---------------- EDITAR PROGRESSO ----------------
async function editarProgresso(id) {
  const item = data.find(i => i.firebaseId === id);

  const novaTemp = prompt("Nova Temporada:", item.temporada || 1);
  const novoEp = prompt("Novo Episódio:", item.episodio || 1);

  if (!novaTemp || !novoEp) return;

  item.temporada = novaTemp;
  item.episodio = novoEp;

  await updateItem(item.firebaseId, {
    temporada: novaTemp,
    episodio: novoEp
  });

  render();
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
    <div class="card">
      <img src="${item.imagem}">
      <div class="info">
        <b>${item.nome}</b><br>

        ${item.tipo === "serie" ? `
          <small>Temp ${item.temporada || 1} • Ep ${item.episodio || 1}</small><br>
          <button onclick="editarProgresso('${item.firebaseId}')">✏ Atualizar</button>
        ` : ""}

        <button onclick="excluirItem('${item.firebaseId}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

// ---------------- GLOBAL ----------------
window.navegar = navegar;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.adicionar = adicionar;
window.editarProgresso = editarProgresso;
window.excluirItem = excluirItem;
window.toggleSerieFields = toggleSerieFields;
window.render = render;

iniciarApp();
