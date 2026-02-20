const API_URL = "https://api.npoint.io/COLOQUE_SEU_ID_AQUI";

async function getData() {
    try {
        const response = await fetch(API_URL);
        return await response.json();
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        return [];
    }
}

async function saveData(data) {
    try {
        await fetch(API_URL, {
            method: 'POST', // ou 'PUT' dependendo do serviço
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        alert("Erro ao salvar na nuvem!");
    }
}
