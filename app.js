let data = [];
let paginaAtual = 'home';

// Inicialização: Espera a nuvem antes de mostrar qualquer coisa
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
    modal.style.display = 'block';
    if (modo === 'finalizar') {
        document.getElementById('modal-title').innerText = 'Finalizar Filme/Série';
        document.getElementById('btn-salvar').style.display = 'none';
        document.getElementById('btn-finalizar').style.display = 'block';
        document.getElementById('campos-finalizacao').style.display = 'block';
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

// ADICIONAR: Agora ele espera a confirmação da nuvem
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
    
    // ESPERA SALVAR NA NUVEM ANTES DE CONTINUAR
    await saveData(data); 
    
    fecharModal();
    render();
    if (status === 'quero') navegar('quero');
    else navegar(tipo === 'filme' ? 'filmes' : 'series');
}

// FINALIZAR: Também espera a nuvem
async function confirmarFinalizacao() {
    const id = document.getElementById('item-id-hidden').value;
    const item = data.find(x => x.id == id);
    if (item) {
        item.status = 'assistido';
        item.notas = {
            arthur: parseFloat(document.getElementById('notaA').value) || 0,
            daiane: parseFloat(document.getElementById('notaD').value) || 0
        };
        
        await saveData(data); // Espera atualizar na nuvem
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

// Inicia o App buscando dados da nuvem
iniciarApp();
