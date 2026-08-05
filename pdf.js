
/* =====================================================
   UTILIDADES
===================================================== */
const formatMoney = n => "S/ " + Number(n || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

/* =====================================================
   GENERACIÓN DE REPORTES PDF
===================================================== */
export async function generatePDF(selectedPeriod) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // Filtrar datos del periodo seleccionado
    const periodData = data.filter(x => (x.period || x.date.slice(0, 7)) === selectedPeriod);

    // Cálculos de totales
    const income = periodData.filter(x => x.type === "Ingreso").reduce((a, b) => a + Number(b.amount || 0), 0);
    const expense = periodData.filter(x => x.type === "Gasto").reduce((a, b) => a + Number(b.amount || 0), 0);
    const saving = periodData.filter(x => x.type === "Ahorro").reduce((a, b) => a + Number(b.amount || 0), 0);
    const travel = periodData.filter(x => x.type === "Fondo Viajes").reduce((a, b) => a + Number(b.amount || 0), 0);
    const balance = income - expense - saving - travel;

    // Encabezado del documento
    doc.setFillColor(48, 43, 89); // #302b59
    doc.rect(0, 0, 210, 30, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte Finanzas Familiares", 14, 15);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Periodo: ${selectedPeriod} | Dafne & Francesco`, 14, 23);

    // Resumen de KPIs
    let y = 40;
    doc.setTextColor(41, 36, 71);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen del Mes", 14, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.setFillColor(246, 244, 255);
    doc.roundedRect(14, y, 182, 25, 3, 3, "F");

    y += 7;
    doc.text(`Ingresos Totales: ${formatMoney(income)}`, 20, y);
    doc.text(`Gastos Totales: ${formatMoney(expense)}`, 110, y);
    
    y += 8;
    doc.text(`Ahorro General: ${formatMoney(saving)}`, 20, y);
    doc.text(`Fondo Viajes: ${formatMoney(travel)}`, 110, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Disponible Neto: ${formatMoney(balance)}`, 20, y);

    // Tabla de Detalle
    y += 15;
    doc.setFontSize(14);
    doc.text("Detalle de Movimientos", 14, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(233, 229, 246);
    doc.rect(14, y, 182, 7, "F");

    doc.text("Fecha", 16, y + 5);
    doc.text("Persona", 42, y + 5);
    doc.text("Categoría", 72, y + 5);
    doc.text("Detalle", 112, y + 5);
    doc.text("Monto", 162, y + 5);
    doc.text("Estado", 182, y + 5);

    y += 8;
    doc.setFont("helvetica", "normal");

    if (periodData.length === 0) {
        doc.text("No existen movimientos registrados en este periodo.", 16, y + 5);
    } else {
        periodData.forEach(item => {
            if (y > 270) { // Salto de página
                doc.addPage();
                y = 20;
            }

            doc.text(String(item.date || ""), 16, y + 4);
            doc.text(String(item.person || ""), 42, y + 4);
            doc.text(String(item.cat || "").slice(0, 18), 72, y + 4);
            doc.text(String(item.detail || "").slice(0, 24), 112, y + 4);
            doc.text(formatMoney(item.amount), 162, y + 4);
            doc.text(String(item.state || ""), 182, y + 4);

            doc.setDrawColor(233, 229, 246);
            doc.line(14, y + 6, 196, y + 6);
            y += 8;
        });
    }

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(119, 113, 142);
    doc.text("Generado automáticamente por la App de Finanzas Familiares", 14, 287);

    // Descargar archivo
    doc.save(`Reporte_Finanzas_${selectedPeriod}.pdf`);
}
