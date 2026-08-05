// Importación de módulos SDK de Firebase v10+ (modo CDN ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración con tus claves reales de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDeN3tM31wjUozZk42xkGPu-dgXNNL_0ws",
    authDomain: "finanzas-familiares-6ca5b.firebaseapp.com",
    projectId: "finanzas-familiares-6ca5b",
    storageBucket: "finanzas-familiares-6ca5b.firebasestorage.app",
    messagingSenderId: "342235863775",
    appId: "1:342235863775:web:b6845b73e0c6c146ede76a",
    measurementId: "G-WC8KWTJFPM"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy 
};
