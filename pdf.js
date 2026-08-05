import { data } from "./database.js";

const formatMoney = n => "S/ " + Number(n || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export function generatePDF(selectedPeriod) {
    // 1. Validar jsPDF
    const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDF) {
        alert("La librería jsPDF no está disponible.");
        return;
    }

    const doc = new jsPDF();

    // 2. Banner Superior Morado Oscuro (#2C2656)
    doc.setFillColor(44, 38, 86);
    doc.rect(0, 0, 210, 28, "F");

    // Título Principal (Blanco)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Reporte Finanzas Familiares", 14, 13);

    // Subtítulo con Periodo y Nombres
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(215, 215, 225);
    doc.text(`Periodo: ${selectedPeriod} | Dafne & Francesco`, 14, 21);

    // 3. Sección: Resumen del Mes
    let y = 38;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(44, 38, 86);
    doc.text("Resumen del Mes", 14, y);

    // Cálculos de Totales
    const currentData = data.filter(x => (x.period || (x.date && x.date.slice(0, 7))) === selectedPeriod);
    const income = currentData.filter(x => x.type === "Ingreso").reduce((a, b) => a + Number(b.amount || 0), 0);
    const expense = currentData.filter(x => x.type === "Gasto").reduce((a, b) => a + Number(b.amount || 0), 0);
    const saving = currentData.filter(x => x.type === "Ahorro").reduce((a, b) => a + Number(b.amount || 0), 0);
    const travel = currentData.filter(x => x.type === "Fondo Viajes").reduce((a, b) => a + Number(b.amount || 0), 0);
    const available = income - expense - saving - travel;

    // Caja de Resumen Con Fondo Suave y Bordes Redondeados (#F5F5FC)
    y += 6;
    doc.setFillColor(245, 245, 252);
    doc.roundedRect(14, y, 182, 26, 3, 3, "F");

    // Valores dentro de la caja
    doc.setFontSize(9.5);

    // Columna Izquierda
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 80);
    doc.text(`Ingresos Totales: ${formatMoney(income)}`, 20, y + 8);
    doc.text(`Ahorro General: ${formatMoney(saving)}`, 20, y + 15);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(44, 38, 86);
    doc.text(`Disponible Neto: ${formatMoney(available)}`, 20, y + 22);

    // Columna Derecha
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 80);
    doc.text(`Gastos Totales: ${formatMoney(expense)}`, 110, y + 8);
    doc.text(`Fondo Viajes: ${formatMoney(travel)}`, 110, y + 15);

    // 4. Sección: Detalle de Movimientos
    y += 36;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(44, 38, 86);
    doc.text("Detalle de Movimientos", 14, y);

    // Filas con Fecha del Movimiento, Fecha de Registro y Hora
    const tableRows = currentData.map(x => [
        x.date || "-",
        x.createdDate || x.createdAt || x.date || "-",
        x.time || x.hora || "—",
        x.person || "-",
        x.cat || "-",
        x.detail || "-",
        formatMoney(x.amount),
        x.state || "PAGADO"
    ]);

    // Ejecutar autoTable garantizando la compatibilidad del plugin
    const autoTable = doc.autoTable || (window.jspdf ? window.jspdf.autoTable : null);
    
    if (typeof autoTable === "function") {
        autoTable.call(doc, {
            startY: y + 4,
            head: [["Fecha", "F. Registro", "Hora", "Persona", "Categoría", "Detalle", "Monto", "Estado"]],
            body: tableRows,
            theme: "plain",
            styles: {
                fontSize: 8,
                textColor: [50, 50, 60],
                cellPadding: 2.5
            },
            headStyles: {
                fillColor: [235, 235, 245],
                textColor: [44, 38, 86],
                fontStyle: "bold"
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 22 },
                2: { cellWidth: 16 },
                3: { cellWidth: 20 },
                4: { cellWidth: 24 },
                5: { cellWidth: 42 },
                6: { cellWidth: 20, halign: "right" },
                7: { cellWidth: 18, halign: "right" }
            }
        });
    }

    // Guardar archivo
    doc.save(`reporte_finanzas_${selectedPeriod}.pdf`);
}
