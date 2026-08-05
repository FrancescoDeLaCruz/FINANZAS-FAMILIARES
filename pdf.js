import { data } from "./database.js";

const formatMoney = n => "S/ " + Number(n || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export function generatePDF(selectedPeriod) {
    // 1. Validar la disponibilidad de jsPDF (cargado desde CDN en index.html)
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        alert("La librería jsPDF no está disponible. Asegúrate de incluir los scripts en tu HTML.");
        return;
    }

    const doc = new jsPDF();

    // 2. Obtener la Fecha y Hora en tiempo real para el encabezado
    const now = new Date();
    const formattedDate = now.toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    const formattedTime = now.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    const dateCapitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    // 3. Filtrar los movimientos del periodo seleccionado
    const currentData = data.filter(x => (x.period || (x.date && x.date.slice(0, 7))) === selectedPeriod);

    // 4. Encabezado del PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte Financiero Familiar", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periodo: ${selectedPeriod}`, 14, 25);

    // Fecha y hora de generación
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generado el: ${dateCapitalized} a las ${formattedTime}`, 14, 31);

    doc.setDrawColor(200);
    doc.line(14, 34, 196, 34);

    // 5. Totales
    const income = currentData.filter(x => x.type === "Ingreso").reduce((a, b) => a + Number(b.amount || 0), 0);
    const expense = currentData.filter(x => x.type === "Gasto").reduce((a, b) => a + Number(b.amount || 0), 0);
    const saving = currentData.filter(x => x.type === "Ahorro").reduce((a, b) => a + Number(b.amount || 0), 0);
    const travel = currentData.filter(x => x.type === "Fondo Viajes").reduce((a, b) => a + Number(b.amount || 0), 0);
    const available = income - expense - saving - travel;

    // 6. Tabla Resumen (usando autoTable)
    if (typeof doc.autoTable === "function") {
        doc.autoTable({
            startY: 38,
            head: [["Ingresos Totales", "Gastos Totales", "Ahorro", "Fondo Viajes", "Disponible"]],
            body: [[
                formatMoney(income),
                formatMoney(expense),
                formatMoney(saving),
                formatMoney(travel),
                formatMoney(available)
            ]],
            theme: "grid",
            styles: { fontSize: 9, halign: "center" },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        // 7. Tabla Detallada con Hora
        const tableRows = currentData.map(x => [
            x.id || "-",
            x.date || "-",
            x.time || x.hora || "—",
            x.person || "-",
            x.type || "-",
            x.cat || "-",
            x.detail || "Sin detalle",
            formatMoney(x.amount),
            x.state || "PENDIENTE"
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [["ID", "Fecha", "Hora", "Persona", "Tipo", "Categoría", "Detalle", "Monto", "Estado"]],
            body: tableRows,
            theme: "striped",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 73, 94], textColor: 255 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 20 },
                2: { cellWidth: 18 },
                3: { cellWidth: 20 },
                4: { cellWidth: 18 },
                5: { cellWidth: 22 },
                6: { cellWidth: 44 },
                7: { cellWidth: 20, halign: "right" },
                8: { cellWidth: 20, halign: "center" }
            }
        });
    } else {
        // Fallback simple si autotable no está disponible
        let y = 45;
        doc.setFontSize(9);
        doc.setTextColor(0);
        currentData.forEach(x => {
            const timeStr = x.time || x.hora || "—";
            doc.text(`${x.date} ${timeStr} | ${x.person} | ${x.type} | ${x.cat}: ${formatMoney(x.amount)} (${x.state})`, 14, y);
            y += 6;
        });
    }

    // 8. Descarga del PDF
    doc.save(`reporte_finanzas_${selectedPeriod}.pdf`);
}
