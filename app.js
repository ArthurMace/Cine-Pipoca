import { getData, saveData } from "./storage.js";

let data = [];
let paginaAtual = 'home';

// -------------------- INICIAR --------------------
async function iniciarApp() {
    data = await getData();
    render();
}

// -------------------- NAVEGAÇÃO --------------------
function navegar(pagina) {
    paginaAtual = pagina;
    render();
}

// -------------------- MODAL --------------------
function abrirModal(modo = 'add', id = null) {
    const modal = document.getElementById('modal');
    modal.style.display = 'block';

    if (modo === 'finalizar' && id) {
        document.getElementById('modal-title').innerText = 'Finalizar Filme/Série';
        document.getElementById('btn-salvar').style.display = 'none';
        document.getElementById('btn-finalizar').style.display = 'block';
        document.getElementById('campos-finalizacao').style.display = 'block';
        document.getElementById('item-id-hidden').value = id;
    } else {
        document.getElementById('modal-title').innerText = 'Adicionar Novo';
        document.getElementById('btn-salvar').style.display = 'block';
        document.getElementById('btn-finalizar').style.display = 'none';
        document.getElementById('campos-finalizacao').style.display = 'none';
    }
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
}

// -------------------- ADICIONAR --------------------
async function adicionar() {
    const nome = document.getElementById('nome').value;
    const imagem = document.getElementById('imagem').value;
    const tipo = document.getElementById('tipo').value;
    const status = document.getElementById('status').value;

    if (!nome || !imagem) return alert('Preencha os campos!');

    const novoItem = {
        id: Date.now(),
        nome,
        imagem,
        tipo,
        status,
        notas: { arthur: 0, daiane: 0 },
        comentarios: { arthur: '', daiane: '' }
    };

    data.push(novoItem);
    await saveData(data);

    fecharModal();
    render();
}

// -------------------- FINALIZAR --------------------
async function confirmarFinalizacao() {
    const id = Number(document.getElementById('item-id-hidden').value);
    const item = data.find(x => x.id === id);

    if (item) {
        item.status = 'assistido';
        item.notas = {
            arthur: parseFloat(document.getElementById('notaA').value) || 0,
            daiane: parseFloat(document.getElementById('notaD').value) || 0
        };

        await saveData(data);
        render();
        fecharModal();
    }
}

// -------------------- EXCLUIR --------------------
async function excluirItem(id) {
    const confirmar = confirm("Deseja realmente excluir?");
    if (!confirmar) return;

    data = data.filter(item => item.id !== id);
    await saveData(data);
    render();
}

// -------------------- RENDER --------------------
function render() {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

    const container = document.getElementById('page-' + paginaAtual);
    if (container) container.style.display = 'block';

    const listaDiv = document.getElementById(
        paginaAtual === 'home'
            ? 'home'
            : (paginaAtual === 'quero'
                ? 'queroList'
                : paginaAtual)
    );

    if (!listaDiv) return;

    const busca = document.getElementById("busca").value.toLowerCase();

    const filtered = data.filter(i => {
        const matchBusca = i.nome.toLowerCase().includes(busca);

        if (paginaAtual === 'home')
            return i.status === 'assistindo' && matchBusca;

        if (paginaAtual === 'quero')
            return i.status === 'quero' && matchBusca;

        return i.tipo === (paginaAtual === 'filmes' ? 'filme' : 'serie')
            && i.status !== 'quero'
            && matchBusca;
    });

    listaDiv.innerHTML = `
        <div class="grid">
            ${filtered.map(item => `
                <div class="card ${item.status === 'assistido' ? 'assistido' : ''}">
                    <img src="${item.imagem}">
                    <div class="info">
                        <b>${item.nome}</b><br>

                        ${item.status === 'assistindo'
                            ? `<button class="btn-primary" onclick="abrirModal('finalizar', ${item.id})">Finalizar</button>`
                            : ''}

                        <button class="btn-danger" onclick="excluirItem(${item.id})">
                            Excluir
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// -------------------- EXPOR GLOBAL --------------------
window.navegar = navegar;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.adicionar = adicionar;
window.confirmarFinalizacao = confirmarFinalizacao;
window.excluirItem = excluirItem;
window.render = render;

// -------------------- START --------------------
iniciarApp();
