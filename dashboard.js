import { 
    data, 
    cats, 
    types, 
    people, 
    states, 
    initDataListener, 
    addMovement, 
    updateMovementState, 
    deleteMovement 
} from "./database.js";

import { drawCharts } from "./charts.js";
import { generatePDF } from "./pdf.js";

/* =====================================================
   ESTADO DE LA INTERFAZ
===================================================== */
let selectedPeriod = new Date().toISOString().slice(0, 7);
let selPerson = "Dafne";
let selType = "Gasto";
let selCat = "Comida";
let selState = "PAGADO";

/* =====================================================
   UTILIDADES
===================================================== */
const formatMoney = n => "S/ " + Number(n || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function calculateSum(arr, conditionFn) {
    return arr.reduce((acc, x) => acc + (conditionFn(x) ? Number(x.amount || 0) : 0), 0);
}

function escapeHTML(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[c]));
}

function showToast(message) {
    const toastEl = document.getElementById("toast");
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2500);
}

/* =====================================================
   LISTAS Y MESES
===================================================== */
function getUniquePeriods() {
    let set = new Set();
    data.forEach(x => {
        if (x.period) set.add(x.period);
        else if (x.date) set.add(x.date.slice(0, 7));
    });
    set.add(selectedPeriod);
    return [...set].sort();
}

function getUniqueMonths() {
    let set = new Set();
    data.forEach(x => {
        if (x.period) set.add(x.period);
        if (x.date) set.add(x.date.slice(0, 7));
    });
    set.add(selectedPeriod);
    return [...set].sort().reverse();
}

/* =====================================================
   RENDER CHOICES (SELECCIONADORES INTERACTIVOS)
===================================================== */
function renderChoices(containerId, optionsObj, currentVal, setterFn) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = Object.entries(optionsObj).map(([key, val]) => `
        <button type="button" class="choice ${key === currentVal ? "active" : ""}" data-key="${key}">
            <span>${val[0]}</span>
            ${val[1]}
        </button>
    `).join("");

    container.querySelectorAll(".choice").forEach(btn => {
        btn.onclick = () => {
            setterFn(btn.dataset.key);
            renderAll();
        };
    });
}

/* =====================================================
   RENDER PRINCIPAL DE LA APLICACIÓN
===================================================== */
export function renderAll() {
    // 1. Selector de Meses
    const monthSelect = document.getElementById("month");
    const monthList = getUniqueMonths();
    monthSelect.innerHTML = monthList.map(m => `
        <option value="${m}">
            ${new Date(m + "-15").toLocaleDateString("es-PE", { month: "long", year: "numeric" }).toUpperCase()}
        </option>
    `).join("");
    monthSelect.value = selectedPeriod;

    // 2. Selector de Periodos (Formulario)
    const periodSelect = document.getElementById("period");
    const periodList = getUniquePeriods();
    periodSelect.innerHTML = periodList.map(p => `
        <option value="${p}">
            ${new Date(p + "-15").toLocaleDateString("es-PE", { month: "long", year: "numeric" }).toUpperCase()}
        </option>
    `).join("");
    periodSelect.value = selectedPeriod;

    // 3. Filtrar Datos del Periodo
    const currentData = data.filter(x => (x.period || (x.date && x.date.slice(0, 7))) === selectedPeriod);

    // 4. Totales
    const income = calculateSum(currentData, x => x.type === "Ingreso");
    const expense = calculateSum(currentData, x => x.type === "Gasto");
    const saving = calculateSum(currentData, x => x.type === "Ahorro");
    const travel = calculateSum(currentData, x => x.type === "Fondo Viajes");
    const available = income - expense - saving - travel;

    // Actualizar KPIs
    document.getElementById("income").textContent = formatMoney(income);
    document.getElementById("expense").textContent = formatMoney(expense);
    document.getElementById("saving").textContent = formatMoney(saving);
    document.getElementById("travel").textContent = formatMoney(travel);

    // 5. Barra de Energía
    const pct = income ? Math.max(0, Math.min(1, available / income)) : 0;
    const energyBar = document.getElementById("energyBar");
    const energyText = document.getElementById("energyText");
    if (energyBar) energyBar.style.width = (pct * 100) + "%";
    if (energyText) energyText.textContent = `🔋 ${formatMoney(available)} disponibles • ${(pct * 100).toFixed(0)}% de energía`;

    // 6. Disponibilidad Individual
    [["dafneAvail", "Dafne"], ["franAvail", "Francesco"]].forEach(([elemId, personName]) => {
        const pData = currentData.filter(x => x.person === personName);
        const pIncome = calculateSum(pData, x => x.type === "Ingreso");
        const pExpenses = calculateSum(pData, x => ["Gasto", "Ahorro", "Fondo Viajes"].includes(x.type));
        document.getElementById(elemId).textContent = formatMoney(pIncome - pExpenses);
    });

    // 7. Acumulados Globales
    const globalSaving = calculateSum(data, x => x.type === "Ahorro");
    const globalTravel = calculateSum(data, x => x.type === "Fondo Viajes");
    const travelGoal = 5000;
    const travelPct = Math.min(1, globalTravel / travelGoal);

    document.getElementById("globalSaving").textContent = formatMoney(globalSaving);
    document.getElementById("globalTravel").textContent = `${formatMoney(globalTravel)} / ${formatMoney(travelGoal)}`;
    document.getElementById("travelPct").textContent = `${(travelPct * 100).toFixed(0)}% completado`;
    const travelBar = document.getElementById("travelBar");
    if (travelBar) travelBar.style.width = (travelPct * 100) + "%";

    // 8. Opciones del Formulario
    renderChoices("personChoices", people, selPerson, k => selPerson = k);
    renderChoices("typeChoices", types, selType, k => selType = k);
    renderChoices("catChoices", cats, selCat, k => selCat = k);
    renderChoices("stateChoices", states, selState, k => selState = k);

    // 9. Fecha por Defecto
    const dateInput = document.getElementById("date");
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }

    // 10. Actualizar Gráficos y Tabla
    drawCharts(currentData);
    renderTable();
}

/* =====================================================
   RENDER TABLA E HISTORIAL (CON COLUMNA HORA)
===================================================== */
export function renderTable() {
    const searchVal = (document.getElementById("search")?.value || "").toLowerCase();

    const filteredRows = data
        .filter(x => Object.values(x).join(" ").toLowerCase().includes(searchVal))
        .sort((a, b) => {
            const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
            if (dateCompare !== 0) return dateCompare;
            const timeA = a.time || a.hora || "";
            const timeB = b.time || b.hora || "";
            return timeB.localeCompare(timeA) || (b.id - a.id);
        });

    const tbody = document.getElementById("tbody");
    if (!tbody) return;

    if (filteredRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="empty">No encontramos movimientos.</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredRows.map(x => {
        const timeDisplay = x.time || x.hora || "—";
        return `
            <tr>
                <td>${x.id || "-"}</td>
                <td>${x.date || "-"}</td>
                <td><b>${timeDisplay}</b></td>
                <td>${x.period || (x.date ? x.date.slice(0, 7) : "-")}</td>
                <td>${people[x.person]?.[0] || ""} ${x.person}</td>
                <td>${types[x.type]?.[0] || "📦"} ${x.type}</td>
                <td>${cats[x.cat]?.[0] || "📦"} ${x.cat}</td>
                <td>${escapeHTML(x.detail)}</td>
                <td>${formatMoney(x.budget)}</td>
                <td>${formatMoney(x.amount)}</td>
                <td>
                    <span class="pill ${x.state === "PAGADO" ? "paid" : "pending"}">
                        ${x.state === "PAGADO" ? "✅ PAGADO" : "⏳ PENDIENTE"}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        ${x.state === "PENDIENTE"
                            ? `<button class="action-btn pay" data-fpid="${x.firestoreId}" data-id="${x.id}">✅ Pagar</button>`
                            : `<button class="action-btn unpay" data-fpid="${x.firestoreId}" data-id="${x.id}">⏳ Pendiente</button>`
                        }
                        <button class="action-btn danger" data-del-fpid="${x.firestoreId}" data-del-id="${x.id}">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    // Asignar Event Listeners a los botones de la tabla
    tbody.querySelectorAll(".pay").forEach(btn => {
        btn.onclick = async () => {
            await updateMovementState(btn.dataset.fpid, Number(btn.dataset.id), "PAGADO");
            showToast("✅ ¡Movimiento marcado como PAGADO!");
        };
    });

    tbody.querySelectorAll(".unpay").forEach(btn => {
        btn.onclick = async () => {
            await updateMovementState(btn.dataset.fpid, Number(btn.dataset.id), "PENDIENTE");
            showToast("⏳ Movimiento cambiado a PENDIENTE.");
        };
    });

    tbody.querySelectorAll("[data-del-id]").forEach(btn => {
        btn.onclick = async () => {
            if (confirm("¿Eliminar este movimiento?")) {
                await deleteMovement(btn.dataset.delFpid, Number(btn.dataset.delId));
                showToast("🗑️ Movimiento eliminado.");
            }
        };
    });
}

/* =====================================================
   INICIALIZACIÓN Y EVENT LISTENERS
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Escuchar Sincronización en Tiempo Real
    initDataListener(() => {
        renderAll();
    });

    // 2. Controles de Selección de Mes
    document.getElementById("month").onchange = (e) => {
        selectedPeriod = e.target.value;
        renderAll();
    };

    document.getElementById("prev").onclick = () => {
        const months = getUniqueMonths();
        const idx = months.indexOf(selectedPeriod);
        if (idx < months.length - 1) selectedPeriod = months[idx + 1];
        renderAll();
    };

    document.getElementById("next").onclick = () => {
        const months = getUniqueMonths();
        const idx = months.indexOf(selectedPeriod);
        if (idx > 0) selectedPeriod = months[idx - 1];
        renderAll();
    };

    // 3. Incrementos Rápidos de Monto
    document.querySelectorAll("[data-add]").forEach(btn => {
        btn.onclick = () => {
            const input = document.getElementById("amount");
            input.value = (Number(input.value) || 0) + Number(btn.dataset.add);
        };
    });

    // 4. Cambios de Fecha / Periodo
    document.getElementById("date").onchange = (e) => {
        if (e.target.value) {
            document.getElementById("period").value = e.target.value.slice(0, 7);
        }
    };

    document.getElementById("period").onchange = (e) => {
        selectedPeriod = e.target.value;
    };

    // 5. Guardar Nuevo Registro
    document.getElementById("save").onclick = async () => {
        const amount = Number(document.getElementById("amount").value);
        const budget = Number(document.getElementById("budget").value) || 0;
        const date = document.getElementById("date").value || new Date().toISOString().slice(0, 10);
        const period = document.getElementById("period").value || date.slice(0, 7);
        const detail = document.getElementById("detail").value.trim();

        if (!amount || amount <= 0) {
            showToast("💡 Escribe un monto mayor que S/ 0.");
            return;
        }

        await addMovement({
            date,
            period,
            person: selPerson,
            type: selType,
            cat: selCat,
            detail: detail || "Sin detalle",
            budget,
            amount,
            state: selState
        });

        // Limpiar campos
        document.getElementById("amount").value = "";
        document.getElementById("budget").value = "";
        document.getElementById("detail").value = "";

        selectedPeriod = period;
        showToast("🎉 ¡Movimiento guardado correctamente!");
    };

    // 6. Carga Automática de Gastos Fijos
    document.getElementById("fixed").onclick = async () => {
        const items = [
            ["Casa/Alquiler", "Alquiler familiar 50/50", 150],
            ["Comida", "Comida familiar 50/50", 200],
            ["Colegio", "Colegio - parte familiar", 100]
        ];

        let addedCount = 0;

        for (const [cat, detail, amt] of items) {
            for (const person of ["Dafne", "Francesco"]) {
                const exists = data.some(x => 
                    (x.period || (x.date && x.date.slice(0, 7))) === selectedPeriod &&
                    x.person === person &&
                    x.cat === cat &&
                    x.detail === detail
                );

                if (!exists) {
                    await addMovement({
                        date: selectedPeriod + "-01",
                        period: selectedPeriod,
                        person,
                        type: "Gasto",
                        cat,
                        detail,
                        budget: amt,
                        amount: amt,
                        state: "PENDIENTE"
                    });
                    addedCount++;
                }
            }
        }

        if (addedCount > 0) {
            showToast(`⚡ Se agregaron ${addedCount} gastos fijos en estado PENDIENTE.`);
        } else {
            showToast("ℹ️ Los gastos fijos de este mes ya estaban cargados.");
        }
    };

    // 7. Buscador
    document.getElementById("search").oninput = renderTable;

    // 8. Exportar CSV
    document.getElementById("csv").onclick = () => {
        const head = ["ID", "Fecha", "Hora", "Periodo", "Persona", "Tipo", "Categoría", "Detalle", "Presupuesto", "Monto Real", "Estado"];
        const lines = [
            head,
            ...data.map(x => [
                x.id,
                x.date,
                x.time || x.hora || "-",
                x.period || (x.date ? x.date.slice(0, 7) : "-"),
                x.person,
                x.type,
                x.cat,
                x.detail,
                x.budget,
                x.amount,
                x.state
            ])
        ].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(","));

        const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `historial_finanzas_${selectedPeriod}.csv`;
        link.click();
    };

    // 9. Generar Reporte PDF
    document.getElementById("pdf").onclick = () => {
        generatePDF(selectedPeriod);
    };
});
