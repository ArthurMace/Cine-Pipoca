// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// CONFIGURAÇÃO DO SEU FIREBASE
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID"
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
  const snapshot = await getDocs(filmesCollection);

  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, "filmes", d.id));
  }

  for (const item of data) {
    await addDoc(filmesCollection, item);
  }
}

// 🔥 EXPORTANDO O DB PARA USAR NO APP
export { db };
