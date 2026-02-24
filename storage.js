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
  apiKey: "AIzaSyAkygtSvwxw0GWhhVmZdvqFR5JLlh3egBc",
  authDomain: "cinepipocaad.firebaseapp.com",
  projectId: "cinepipocaad",
  storageBucket: "cinepipocaad.firebasestorage.app",
  messagingSenderId: "325784065807",
  appId: "1:325784065807:web:0c60cde889ca9b7a65507a"
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


