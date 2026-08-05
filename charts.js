import { data } from "./database.js";

// Instancias globales de gráficos para evitar duplicados al redibujar
let charts = {};

/* =====================================================
   UTILIDADES
===================================================== */
function destroyChart(key) {
    if (charts[key]) {
        charts[key].destroy();
    }
}

function calculateSum(arr, conditionFn) {
    return arr.reduce((acc, x) => acc + (conditionFn(x) ? Number(x.amount || 0) : 0), 0);
}

/* =====================================================
   DIBUJAR Y ACTUALIZAR GRÁFICOS
===================================================== */
export function drawCharts(periodData) {
    /* -------------------------------------------------
       1. DOUGHNUT CHART (Gastos por Categoría)
    ------------------------------------------------- */
    destroyChart("pie");

    const categories = [...new Set(
        periodData
            .filter(x => x.type === "Gasto")
            .map(x => x.cat)
    )];

    const pieCtx = document.getElementById("pie");
    if (pieCtx) {
        charts.pie = new Chart(pieCtx, {
            type: "doughnut",
            data: {
                labels: categories,
                datasets: [{
                    data: categories.map(c => 
                        calculateSum(periodData, x => x.type === "Gasto" && x.cat === c)
                    ),
                    backgroundColor: [
                        "#6254c9", "#e98dad", "#62b8e8", "#59ad45", 
                        "#e99a43", "#c84d5b", "#a6eb73", "#ffb3ba"
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }

    /* -------------------------------------------------
       2. BAR CHART (Gastos por Persona)
    ------------------------------------------------- */
    destroyChart("people");

    const peopleCtx = document.getElementById("peopleChart");
    if (peopleCtx) {
        charts.people = new Chart(peopleCtx, {
            type: "bar",
            data: {
                labels: ["Dafne 💗", "Francesco 🦁"],
                datasets: [{
                    label: "Gastos S/",
                    data: ["Dafne", "Francesco"].map(p => 
                        calculateSum(periodData, x => x.type === "Gasto" && x.person === p)
                    ),
                    backgroundColor: ["#e98dad", "#62b8e8"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    /* -------------------------------------------------
       3. LINE CHART (Evolución Histórica Global)
    ------------------------------------------------- */
    destroyChart("history");

    const monthPeriods = [...new Set(
        data.map(x => x.period || x.date.slice(0, 7))
    )].sort();

    const historyLabels = monthPeriods.map(m => 
        new Date(m + "-15").toLocaleDateString("es-PE", { month: "short", year: "numeric" })
    );

    const historyCtx = document.getElementById("history");
    if (historyCtx) {
        charts.history = new Chart(historyCtx, {
            type: "line",
            data: {
                labels: historyLabels,
                datasets: [
                    { label: "Ingreso", color: "#59ad45" },
                    { label: "Gasto", color: "#e99a43" },
                    { label: "Ahorro", color: "#6254c9" },
                    { label: "Fondo Viajes", color: "#62b8e8" }
                ].map(item => ({
                    label: item.label,
                    borderColor: item.color,
                    backgroundColor: item.color,
                    data: monthPeriods.map(mm => 
                        calculateSum(data, x => (x.period || x.date.slice(0, 7)) === mm && x.type === item.label)
                    ),
                    tension: 0.3
                }))
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}
