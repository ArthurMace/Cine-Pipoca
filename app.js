import { getData, saveData, db } from "./storage.js";
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const container = document.getElementById("lista");

// 🔥 FUNÇÃO PARA CARREGAR FILMES
async function carregarFilmes() {
  const filmes = await getData();
  container.innerHTML = "";

  filmes.forEach(filme => {
    container.innerHTML += `
      <div class="filme">
        <h3>${filme.titulo}</h3>
        ${filme.imagem ? `<img src="${filme.imagem}" width="150">` : ""}
        <br>
        <button onclick="deletarFilme('${filme.firebaseId}')">
          Excluir
        </button>
      </div>
      <hr>
    `;
  });
}

// 🔥 FUNÇÃO DE EXCLUIR
window.deletarFilme = async function(id) {
  const confirmar = confirm("Tem certeza que deseja excluir?");
  if (!confirmar) return;

  await deleteDoc(doc(db, "filmes", id));
  carregarFilmes(); // Atualiza sem recarregar página
};

// 🔥 CHAMA AO ABRIR O SITE
carregarFilmes();
