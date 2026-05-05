// Función para inicializar la aplicación
function inicializarAplicacion() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    cargarDatosGeneros();
}

// Esperar a que todo el DOM y los scripts estén cargados
if (document.readyState === 'loading') {
    // El documento aún se está cargando
    document.addEventListener('DOMContentLoaded', function() {
        // Pequeño delay para asegurar que todos los scripts estén cargados
        setTimeout(inicializarAplicacion, 100);
    });
} else {
    // El documento ya está cargado
    setTimeout(inicializarAplicacion, 100);
}

// Funciones de descarga
function descargarPNG() {
    const link = document.createElement("a");
    link.download = `grafica_${tipoActual}.png`;
    link.href = document.getElementById("chartAmpliado").toDataURL("image/png");
    link.click();
}

function descargarExcel() {
    const datos = datosSimulados[tipoActual];
    
    if (tipoActual === 'fecha' && datos.type === 'grouped') {
        const wb = XLSX.utils.book_new();
        
        const excelData = [
            ['Fecha', 'Género', 'Total de Visitantes']
        ];
        
        datos.labels.forEach((fecha, fechaIndex) => {
            datos.datasets.forEach(dataset => {
                const valor = dataset.data[fechaIndex] || 0;
                if (valor > 0) {
                    excelData.push([
                        formatearFecha(fecha),
                        dataset.label,
                        valor
                    ]);
                }
            });
        });
        
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Datos por Fecha y Género");
        XLSX.writeFile(wb, `datos_fecha_genero.xlsx`);
    } else {
        const labelsFormateados = tipoActual === 'genero' ? datos.labels.map(formatearGenero) : datos.labels;
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([
            [obtenerEtiquetaDescriptiva(tipoActual), "Total de Visitantes"],
            ...labelsFormateados.map((l, i) => [l, datos.values[i]]),
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Datos");
        XLSX.writeFile(wb, `datos_${tipoActual}.xlsx`);
    }
}

function descargarExcelTabla(tipo) {
    let tableId = 'tabla-genero-contenido';
    if(tipo === 'fecha') tableId = 'tabla-fecha-contenido';
    if(tipo === 'mes') tableId = 'tabla-mes-contenido';
    if(tipo === 'dia') tableId = 'tabla-dia-contenido';
    if(tipo === 'anio') tableId = 'tabla-anio-contenido';
    if(tipo === 'intereses') tableId = 'tabla-intereses-contenido';

    const table = document.getElementById(tableId);
    if(!table) return;

    const wb = XLSX.utils.table_to_book(table, {sheet:'Datos'});
    XLSX.writeFile(wb, `estadisticas_${tipo}.xlsx`);
}

function descargarGraficoPrincipal() {
    const link = document.createElement("a");
    link.download = "grafica_principal.png";
    link.href = document.getElementById("chartBar").toDataURL("image/png");
    link.click();
}