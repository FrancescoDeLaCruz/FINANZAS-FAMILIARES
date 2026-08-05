// Generación de reportes PDF usando jsPDF y autoTable
export function generarPDF(movimientos, resumen) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fechaActual = new Date();
    const periodo = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;

    // Encabezado
    doc.setFillColor(44, 43, 82); // Color oscuro
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Reporte Finanzas Familiares", 14, 16);

    doc.setFontSize(10);
    doc.text(`Periodo: ${periodo} | Dafne & Francesco`, 14, 24);

    // Sección: Resumen del Mes
    doc.setTextColor(44, 43, 82);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Resumen del Mes", 14, 42);

    // Cuadro de Resumen
    doc.setFillColor(245, 246, 250);
    doc.roundedRect(14, 47, 182, 35, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(50, 50, 50);

    doc.text(`Ingresos Totales: S/ ${resumen.ingresos.toFixed(2)}`, 20, 56);
    doc.text(`Gastos Totales: S/ ${resumen.gastos.toFixed(2)}`, 110, 56);

    doc.text(`Ahorro General: S/ ${resumen.ahorro.toFixed(2)}`, 20, 64);
    doc.text(`Fondo Viajes: S/ ${resumen.viajes.toFixed(2)}`, 110, 64);

    doc.setFont(undefined, 'bold');
    doc.text(`Disponible Neto: S/ ${resumen.disponible.toFixed(2)}`, 20, 74);

    // Sección: Detalle de Movimientos
    doc.setFontSize(14);
    doc.setTextColor(44, 43, 82);
    doc.text("Detalle de Movimientos", 14, 95);

    // Mapeo de datos para la tabla
    const filasTabla = movimientos.map(m => [
        m.fecha || '',
        m.persona || '',
        m.categoria || '',
        m.detalle || '',
        `S/ ${Number(m.monto || 0).toFixed(2)}`,
        (m.estado || '').toUpperCase()
    ]);

    // Generar Tabla
    doc.autoTable({
        startY: 100,
        head: [['Fecha', 'Persona', 'Categoría', 'Detalle', 'Monto', 'Estado']],
        body: filasTabla,
        headStyles: {
            fillColor: [230, 230, 245],
            textColor: [44, 43, 82],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [250, 250, 252]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            4: { halign: 'right' },
            5: { halign: 'center' }
        }
    });

    // Guardar archivo PDF
    doc.save(`Reporte_Finanzas_${periodo}.pdf`);
}
