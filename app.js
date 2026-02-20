let data = [];
let paginaAtual = 'home';

// Inicialização: Busca na nuvem assim que o site abre
async function iniciarApp() {
    data = await getData();
    render();
}

function navegar(pagina) {
    paginaAtual = pagina;
    render();
}

function abrirModal(modo = 'add') {
    const modal = document.getElementById('modal');
    const titulo = document.getElementById('modal-title');
    const btnSalvar = document.getElementById('btn-salvar');
    const btnFinalizar = document.getElementById('btn-finalizar');
    const camposFinalizacao = document.getElementById('campos-finalizacao');
    const serieFields = document.getElementById('serie-fields');
    const camposCadastro = document.querySelectorAll('#nome, #imagem, #tipo, #status');

    modal.style.display = 'block';

    if (modo === 'finalizar') {
        titulo.innerText = 'Finalizar Filme/Série';
        btnSalvar.style.display = 'none';
        btnFinalizar.style.display = 'block';
        camposFinalizacao.style.display = 'block';
        serieFields.style.display = 'none';
        camposCadastro.forEach(el => el.style.display = 'none');
    } else {
        titulo.innerText = 'Adicionar Novo';
        btnSalvar.style.display = 'block';
        btnFinalizar.style.display = 'none';
        camposCadastro.forEach(el => el.style.display = 'block');
        toggleSerieFields();
    }
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
    document.querySelectorAll('.modal-content input, .modal-content select').forEach(el => el.value = '');
}

function toggleSerieFields() {
    const tipo = document.getElementById('tipo').value;
    const fields = document.getElementById('serie-fields');
    if (fields) fields.style.display = tipo === 'serie' ? 'flex' : 'none';
}

async function adicionar() {
    const nome = document.getElementById('nome').value;
    const imagem = document.getElementById('imagem').value;
    const tipo = document.getElementById('tipo').value;
    const status = document.getElementById('status').value;

    if (!nome || !imagem) return alert('Preencha nome e imagem!');

    const novoItem = {
        id: Date.now(),
        nome,
        imagem,
        tipo,
        status,
        notas: { arthur: 0, daiane: 0 },
        comentarios: { arthur: '', daiane: '' },
        temporada: tipo === 'serie' ? document.getElementById('temporada').value : null,
        episodio: tipo === 'serie' ? document.getElementById('episodio').value : null
    };

    data.push(novoItem);
    await saveData(data); // Envia para o npoint
    
    navegar(status === 'quero' ? 'quero' : (tipo === 'filme' ? 'filmes' : 'series'));
    fecharModal();
}

async function confirmarFinalizacao() {
    const id = document.getElementById('item-id-hidden').value;
    const item = data.find(x => x.id == id);
    if (item) {
        item.status = 'assistido';
        item.notas = {
            arthur: parseFloat(document.getElementById('notaA').value) || 0,
            daiane: parseFloat(document.getElementById('notaD').value) || 0
        };
        await saveData(data); // Atualiza na nuvem
        render();
        fecharModal();
    }
}

function render() {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const container = document.getElementById('page-' + paginaAtual);
    if (container) container.style.display = 'block';

    const listaDiv = document.getElementById(paginaAtual === 'home' ? 'home' : (paginaAtual === 'quero' ? 'queroList' : paginaAtual));
    if (!listaDiv) return;

    const filtered = data.filter(i => {
        if (paginaAtual === 'home') return i.status === 'assistindo';
        if (paginaAtual === 'quero') return i.status === 'quero';
        return i.tipo === (paginaAtual === 'filmes' ? 'filme' : 'serie') && i.status !== 'quero';
    });

    listaDiv.innerHTML = `<div class="grid">${filtered.map(item => `
        <div class="card">
            <img src="${item.imagem}">
            <div class="info">
                <b>${item.nome}</b><br>
                ${item.status === 'assistindo' ? `<button class="btn-primary" onclick="finish(${item.id})">Finalizar</button>` : ''}
            </div>
        </div>
    `).join('')}</div>`;
}

// Inicia o processo
iniciarApp();
