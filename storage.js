import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_KEY",
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
  return snapshot.docs.map(d => ({
    firebaseId: d.id,
    ...d.data()
  }));
}

export async function addItem(item) {
  const docRef = await addDoc(filmesCollection, item);
  return docRef.id;
}

export async function updateItem(firebaseId, item) {
  const ref = doc(db, "filmes", firebaseId);
  await updateDoc(ref, item);
}

export async function deleteItem(firebaseId) {
  await deleteDoc(doc(db, "filmes", firebaseId));
}
