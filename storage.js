const API_URL = "https://api.npoint.io/599c72fcba5f910e8401";

async function getData() {
    try {
        // O "?t=" + Date.now() força o celular a buscar dados novos, não os salvos no histórico
        const response = await fetch(API_URL + "?t=" + Date.now());
        const json = await response.json();
        return Array.isArray(json) ? json : [];
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        return [];
    }
}

async function saveData(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Falha ao salvar');
    } catch (e) {
        console.error("Erro ao salvar:", e);
        alert("Erro de sincronização! Verifique a internet.");
    }
}
