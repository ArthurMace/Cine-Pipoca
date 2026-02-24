// Importações do Firebase (precisa ter o script no index.html)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// CONFIGURAÇÃO (cole a sua aqui)
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const filmesCollection = collection(db, "filmes");

export async function getData() {
  const snapshot = await getDocs(filmesCollection);
  return snapshot.docs.map(doc => ({
    firebaseId: doc.id,
    ...doc.data()
  }));
}

export async function saveData(data) {
  // Apaga tudo antes (simples e funciona para seu caso pequeno)
  const snapshot = await getDocs(filmesCollection);
  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, "filmes", d.id));
  }

  // Reinsere tudo atualizado
  for (const item of data) {
    await addDoc(filmesCollection, item);
  }
}
