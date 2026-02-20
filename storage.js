const API_URL = "https://api.npoint.io/599c72fcba5f910e8401";

async function getData() {
    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        return Array.isArray(json) ? json : [];
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        return [];
    }
}

async function saveData(data) {
    try {
        await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        alert("Erro ao salvar na nuvem!");
    }
}
