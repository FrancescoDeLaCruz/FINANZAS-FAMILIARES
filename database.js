import { 
    db, 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy 
} from "./firebase.js";

const COLLECTION_NAME = "finanzas_movimientos";
const LOCAL_KEY = "finanzas_dafne_francesco_v3";

// Estado global de datos en memoria
export let data = [];

/* =====================================================
   DICCIONARIOS CONSTANTES
===================================================== */
export const cats = {
    "Sueldo": ["💼", "Sueldo"],
    "Casa/Alquiler": ["🏠", "Casa/Alquiler"],
    "Comida": ["🍕", "Comida"],
    "Bancos/Servicios": ["💡", "Bancos/Servicios"],
    "Colegio": ["🎒", "Colegio"],
    "Movilidad": ["🚗", "Movilidad"],
    "Salidas": ["🎡", "Salidas"],
    "Gustos": ["🎁", "Gustos"],
    "Deudas Terceros": ["🤝", "Deudas Terceros"],
    "Compras Casa": ["🛒", "Compras Casa"],
    "Ahorro General": ["🐷", "Ahorro General"],
    "Fondo Viajes": ["✈️", "Fondo Viajes"]
};

export const types = {
    "Ingreso": ["💵", "Ingreso"],
    "Gasto": ["💸", "Gasto"],
    "Deuda": ["💳", "Deuda"],
    "Ahorro": ["🐷", "Ahorro"],
    "Fondo Viajes": ["✈️", "Fondo Viajes"]
};

export const people = {
    "Dafne": ["💗", "Dafne"],
    "Francesco": ["🦁", "Francesco"]
};

export const states = {
    "PAGADO": ["✅", "PAGADO"],
    "PENDIENTE": ["⏳", "PENDIENTE"]
};

/* =====================================================
   HELPER: HORA ACTUAL
===================================================== */
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

/* =====================================================
   ESCUCHAR CAMBIOS EN TIEMPO REAL (FIRESTORE)
===================================================== */
export function initDataListener(onDataChangedCallback) {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
        
        onSnapshot(q, (snapshot) => {
            data = snapshot.docs.map(docSnap => ({
                firestoreId: docSnap.id,
                ...docSnap.data()
            }));
            
            // Guardar copia local de respaldo
            localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
            
            if (onDataChangedCallback) onDataChangedCallback();
        }, (error) => {
            console.warn("Error en conexión Firestore, cargando fallback LocalStorage:", error);
            loadLocalStorageData();
            if (onDataChangedCallback) onDataChangedCallback();
        });
    } catch (e) {
        console.warn("Firestore no configurado aún. Usando LocalStorage.", e);
        loadLocalStorageData();
        if (onDataChangedCallback) onDataChangedCallback();
    }
}

function loadLocalStorageData() {
    const local = localStorage.getItem(LOCAL_KEY);
    data = local ? JSON.parse(local) : [];
}

/* =====================================================
   OPERACIONES CRUD
===================================================== */

// 1. AGREGAR REGISTRO (Guarda Fecha y Hora)
export async function addMovement(movement) {
    // Generar ID numérico único
    const newNumId = data.length ? Math.max(...data.map(x => Number(x.id) || 0)) + 1 : 1;
    
    // Asignar hora exacta si no viene provista
    const time = movement.time || getCurrentTime();

    const newRecord = { 
        ...movement, 
        id: newNumId,
        time: time,
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, COLLECTION_NAME), newRecord);
    } catch (e) {
        console.warn("Guardando localmente por falta de Firebase:", e);
        data.push(newRecord);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    }
}

// 2. CAMBIAR ESTADO (PAGADO / PENDIENTE)
export async function updateMovementState(firestoreId, numId, newState) {
    if (firestoreId) {
        try {
            const itemRef = doc(db, COLLECTION_NAME, firestoreId);
            await updateDoc(itemRef, { state: newState });
            return;
        } catch (e) {
            console.error("Error al actualizar en Firestore:", e);
        }
    }
    
    // Fallback local
    const item = data.find(x => x.id === numId || x.firestoreId === firestoreId);
    if (item) {
        item.state = newState;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    }
}

// 3. ELIMINAR REGISTRO
export async function deleteMovement(firestoreId, numId) {
    if (firestoreId) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, firestoreId));
            return;
        } catch (e) {
            console.error("Error al eliminar de Firestore:", e);
        }
    }

    // Fallback local
    data = data.filter(x => x.id !== numId && x.firestoreId !== firestoreId);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

// 4. REGISTRAR GASTOS FIJOS DEL MES
export async function addFixedExpenses(selectedPeriod, dateString) {
    const currentTime = getCurrentTime();
    const fixedList = [
        { detail: "🏠 Alquiler", amount: 150, budget: 150, cat: "Casa/Alquiler" },
        { detail: "🍕 Comida", amount: 200, budget: 200, cat: "Comida" },
        { detail: "🎒 Colegio", amount: 200, budget: 200, cat: "Colegio" }
    ];

    const peopleList = ["Dafne", "Francesco"];

    for (const person of peopleList) {
        for (const fixed of fixedList) {
            await addMovement({
                person: person,
                type: "Gasto",
                cat: fixed.cat,
                date: dateString,
                time: currentTime,
                period: selectedPeriod,
                detail: `${fixed.detail} (Gasto Fijo)`,
                amount: fixed.amount,
                budget: fixed.budget,
                state: "PENDIENTE"
            });
        }
    }
}
