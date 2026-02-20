let data = [];
let paginaAtual = 'home';

// Inicialização Assíncrona
async function iniciarApp() {
    data = await getData();
    render();
}

function navegar(pagina) {
    paginaAtual = pagina;
    render();
}

// MODAL - ABRIR/FECHAR
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
        toggleRatingFields();
    }
}

function toggleSerieFields() {
    const tipo = document.getElementById('tipo').value;
    document.getElementById('serie-fields').style.display = tipo === 'serie' ? 'flex' : 'none';
}

function toggleRatingFields() {
    const status = document.getElementById('status').value;
    document.getElementById('campos-finalizacao').style.display = status === 'assistido' ? 'block' : 'none';
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
    document.querySelectorAll('.modal-content input, .modal-content select').forEach(el => el.value = '');
    document.getElementById('serie-fields').style.display = 'none';
    document.getElementById('campos-finalizacao').style.display = 'none';
}

// AÇÕES - ADICIONAR (Agora salva na nuvem)
async function adicionar() {
    const nome = document.getElementById('nome').value;
    const imagem = document.getElementById('imagem').value;
    const tipo = document.getElementById('tipo').value;
    const status = document.getElementById('status').value;
    const temporada = document.getElementById('temporada').value || 1;
    const episodio = document.getElementById('episodio').value || 1;

    if (!nome || !imagem) return alert('Preencha nome e imagem!');

    const novoItem = {
        id: Date.now(),
        nome,
        imagem,
        tipo,
        status,
        notas: { arthur: 0, daiane: 0 },
        comentarios: { arthur: '', daiane: '' },
        temporada: tipo === 'serie' ? temporada : null,
        episodio: tipo === 'serie' ? episodio : null
    };

    if (status === 'assistido') {
        novoItem.notas.arthur = parseFloat(document.getElementById('notaA').value.replace(',', '.')) || 0;
        novoItem.notas.daiane = parseFloat(document.getElementById('notaD').value.replace(',', '.')) || 0;
        novoItem.comentarios.arthur = document.getElementById('comA').value || '';
        novoItem.comentarios.daiane = document.getElementById('comD').value || '';
        novoItem.temporada = null;
        novoItem.episodio = null;
    }

    data.push(novoItem);
    await saveData(data); // Salva na nuvem
    
    if (status === 'quero') navegar('quero');
    else navegar(tipo === 'filme' ? 'filmes' : 'series');
    
    fecharModal();
}

function finish(id) {
    document.getElementById('item-id-hidden').value = id;
    abrirModal('finalizar');
}

async function confirmarFinalizacao() {
    const id = document.getElementById('item-id-hidden').value;
    const item = data.find(x => x.id == id);
    if (item) {
        item.status = 'assistido'; 
        item.notas = { 
            arthur: parseFloat(document.getElementById('notaA').value.replace(',', '.')) || 0, 
            daiane: parseFloat(document.getElementById('notaD').value.replace(',', '.')) || 0 
        };
        item.comentarios = {
            arthur: document.getElementById('comA').value || '',
            daiane: document.getElementById('comD').value || ''
        };
        item.temporada = null;
        item.episodio = null;
        
        await saveData(data); // Salva na nuvem
        render();
        fecharModal();
    }
}

async function editarProgresso(id) {
    const item = data.find(x => x.id === id);
    if (!item) return;

    const novaTemp = prompt(`Temporada atual de ${item.nome}:`, item.temporada);
    const novoEp = prompt(`Episódio atual de ${item.nome}:`, item.episodio);

    if (novaTemp !== null && novoEp !== null) {
        item.temporada = novaTemp;
        item.episodio = novoEp;
        await saveData(data); // Salva na nuvem
        render();
    }
}

async function start(id){
    const i = data.find(x => x.id === id);
    if(i){
        i.status = 'assistindo';
        await saveData(data); // Salva na nuvem
        navegar(i.tipo === 'filme' ? 'filmes' : 'series');
    }
}

// RENDERIZAÇÃO
function render() {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const containerAtivo = document.getElementById('page-' + paginaAtual);
    if(containerAtivo) containerAtivo.style.display = 'block';

    const search = document.getElementById('busca')?.value?.toLowerCase() || '';
    const filtered = data.filter(i => i.nome.toLowerCase().includes(search));

    if (paginaAtual === 'home') renderHome(filtered);
    else if (paginaAtual === 'series') renderList('series', 'serie', filtered);
    else if (paginaAtual === 'filmes') renderList('filmes', 'filme', filtered);
    else if (paginaAtual === 'quero') renderQuero(filtered);
}

function renderHome(list){
    const h = document.getElementById('home');
    const assistindoFilmes = list.filter(i => i.status === 'assistindo' && i.tipo === 'filme');
    const assistindoSeries = list.filter(i => i.status === 'assistindo' && i.tipo === 'serie');
    const assistidos = list.filter(i => i.status === 'assistido');
    
    const calcMedia = (i) => (i.notas.arthur + i.notas.daiane) / 2;
    const topFilmes = [...assistidos].filter(i => i.tipo === 'filme').sort((a,b) => calcMedia(b) - calcMedia(a)).slice(0,10);
    const topSeries = [...assistidos].filter(i => i.tipo === 'serie').sort((a,b) => calcMedia(b) - calcMedia(a)).slice(0,10);
    
    h.innerHTML = `
        ${assistindoFilmes.length > 0 ? `<h3>Filmes que está vendo</h3><div class='home-section'>${assistindoFilmes.map(card).join('')}</div>` : ''}
        ${assistindoSeries.length > 0 ? `<h3>Séries que está vendo</h3><div class='home-section'>${assistindoSeries.map(card).join('')}</div>` : ''}
        ${topFilmes.length > 0 ? `<h3>Top 10 Filmes 🏆</h3><div class='home-section'>${topFilmes.map(card).join('')}</div>` : ''}
        ${topSeries.length > 0 ? `<h3>Top 10 Séries 🏆</h3><div class='home-section'>${topSeries.map(card).join('')}</div>` : ''}
        ${list.length === 0 ? '<p style="text-align:center; padding:2rem;">Nenhum item cadastrado ainda!</p>' : ''}
    `;
}

function renderList(id, tipo, list){
    const el = document.getElementById(id);
    const arr = list.filter(i => i.tipo === tipo && i.status !== 'quero');
    el.innerHTML = `<div class='grid'>${arr.map(card).join('')}</div>`;
}

function renderQuero(list){
    const el = document.getElementById('queroList');
    const arr = list.filter(i => i.status === 'quero');
    el.innerHTML = `<div class='grid'>${arr.map(cardQuero).join('')}</div>`;
}

function card(i){
    const classeAssistido = i.status === 'assistido' ? 'assistido' : '';
    let overlay = '';
    
    if (i.status === 'assistido') {
        overlay = `<div class="card-overlay">
            <div class="dual-rating">
                <span>🤵 Arthur: ${i.notas.arthur}/5</span>
                <p><i>"${i.comentarios.arthur}"</i></p>
            </div>
            <div class="dual-rating">
                <span>👰 Daiane: ${i.notas.daiane}/5</span>
                <p><i>"${i.comentarios.daiane}"</i></p>
            </div>
        </div>`;
    } else if (i.status === 'assistindo' && i.tipo === 'serie') {
        overlay = `<div class="card-overlay">
            <h4>Assistindo</h4>
            <p>T${i.temporada} | E${i.episodio}</p>
        </div>`;
    }

    const botaoEditar = i.tipo === 'serie' && i.status === 'assistindo' ? 
        `<button class="btn-edit" onclick="editarProgresso(${i.id})">✏️</button>` : '';

    return `<div class='card ${classeAssistido}'>
    ${botaoEditar}
    <img src='${i.imagem}' />
    ${overlay}
    <div class='info'><b>${i.nome}</b><br>
    ${i.status === 'assistindo' ? `<button class='btn-primary' onclick='finish(${i.id})'>Finalizar</button>` : ''}
    </div></div>`;
}

function cardQuero(i){
    return `<div class='card'>
    <img src='${i.imagem}' />
    <div class='info'><b>${i.nome}</b><br>
    <button class='btn-primary' onclick='start(${i.id})'>Começar</button></div></div>`;
}

// Inicia o App
iniciarApp();
