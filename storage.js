const API_URL = "https://api.npoint.io/a556175ca0859c41b8ea";

async function getData() {
    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        // Se o npoint estiver vazio, ele retorna um objeto. Garantimos que seja um Array.
        return Array.isArray(json) ? json : [];
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        return [];
    }
}

async function saveData(data) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.error("Erro ao salvar:", e);
        alert("Erro ao salvar na nuvem! Verifique sua conexão.");
    }
}
