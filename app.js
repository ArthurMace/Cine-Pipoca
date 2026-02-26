import { getData, addItem, updateItem, deleteItem } from "./storage.js";

let data = [];
let perfilAtivo = null;
let paginaAtual = "home";

async function iniciarApp() {
    data = await getData();
    render();
}

window.selecionarPerfil = function(nome) {
    perfilAtivo = nome;
    document.getElementById('modal-perfil').style.display = 'none';
    render();
};

window.render = function() {
    if (!perfilAtivo) return;
    const busca = document.getElementById("busca").value.toLowerCase();
    
    // Filtro principal: Dono do perfil ativo ou Casal
    const filtrados = data.filter(i => (i.dono === perfilAtivo || i.dono === 'casal') && i.nome.toLowerCase().includes(busca));

    if (paginaAtual === "home") {
        const assistindo = filtrados.filter(i => i.status === "assistindo");
        const quero = filtrados.filter(i => i.status === "quero");
        
        // Lógica do Tinder (Sugestões do outro)
        const outro = perfilAtivo === 'arthur' ? 'day' : 'arthur';
        const sugestoes = data.filter(i => i.dono === outro);

        document.getElementById("home").innerHTML = `
            <h3>📺 Continuando...</h3>
            <div class="carrossel">${renderCards(assistindo)}</div>
            <h3>💡 Tinder de Filmes (De: ${outro})</h3>
            <div class="carrossel">${renderSugestoes(sugestoes)}</div>
            <h3>⭐ Minha Lista</h3>
            <div class="grid-comum">${renderCards(quero)}</div>
        `;
    }
    // Adicione as outras páginas (series/filmes) conforme necessário...
};

function renderCards(lista) {
    return lista.map(item => `
        <div class="card">
            <div class="perfil-tag">${item.dono === 'arthur' ? '🤵‍♂️' : (item.dono === 'day' ? '👰‍♀️' : '🍿')}</div>
            <button class="btn-edit" onclick="window.abrirModal('${item.firebaseId}')">✏️</button>
            <img src="${item.imagem}">
            <div class="info">
                <b>${item.nome}</b>
                <button onclick="window.excluirItem('${item.firebaseId}')">Excluir</button>
            </div>
        </div>`).join("");
}

function renderSugestoes(lista) {
    return lista.map(item => `
        <div class="card" style="border: 1px solid #3b82f6;">
            <img src="${item.imagem}" style="filter: brightness(0.5);">
            <div class="info" style="opacity: 1; background: transparent;">
                <p>Dar Match?</p>
                <button onclick="window.darMatch('${item.firebaseId}')">🍿 Sim!</button>
            </div>
        </div>`).join("");
}

// SORTEIO (Somente Filmes do Casal)
window.sortearFilme = function() {
    const opcoes = data.filter(i => i.tipo === 'filme' && i.status === 'quero' && i.dono === 'casal');
    if (opcoes.length === 0) return alert("Nenhum filme do Casal na lista 'Quero'!");
    
    const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
    // Exibe o sorteado no modal...
    alert("Sorteado: " + sorteado.nome);
};

window.darMatch = async (id) => {
    await updateItem(id, { dono: 'casal' });
    data = await getData();
    render();
};

iniciarApp();
