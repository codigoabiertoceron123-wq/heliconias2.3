// export-manager.js - Compatible con el modal moderno
class ExportManager {
    constructor() {
        console.log('📤 ExportManager inicializado');
    }

    descargarPNG() {
        try {
            const modal = document.getElementById("chartModal");
            if (!modal || !modal.classList.contains('show')) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No hay gráfica activa',
                    text: 'Por favor, abre una gráfica en el modal primero',
                    confirmButtonColor: '#10b981'
                });
                return;
            }

            const canvas = document.getElementById("chartAmpliado");
            if (!canvas) {
                throw new Error('No se encontró el canvas de la gráfica');
            }

            const link = document.createElement('a');
            link.download = `grafica_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            Swal.fire({
                icon: 'success',
                title: 'Gráfica descargada',
                text: 'La imagen PNG se ha descargado correctamente',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Error descargando PNG:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo descargar la gráfica: ' + error.message,
                confirmButtonColor: '#e74c3c'
            });
        }
    }

    descargarExcel() {
        try {
            const modal = document.getElementById("chartModal");
            if (!modal || !modal.classList.contains('show')) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No hay datos activos',
                    text: 'Por favor, abre una gráfica en el modal primero',
                    confirmButtonColor: '#10b981'
                });
                return;
            }

            const tbody = document.querySelector("#tablaDatos tbody");
            if (!tbody || tbody.children.length === 0) {
                throw new Error('No hay datos en la tabla para exportar');
            }

            // Obtener datos de la tabla
            const rows = [];
            const headers = [];
            
            // Obtener encabezados
            const thead = document.querySelector("#tablaDatos thead tr");
            if (thead) {
                const thElements = thead.querySelectorAll('th');
                thElements.forEach(th => headers.push(th.textContent));
            } else {
                headers.push('Categoría', 'Cantidad', 'Porcentaje');
            }

            rows.push(headers);

            // Obtener filas de datos
            const trElements = tbody.querySelectorAll('tr');
            trElements.forEach(tr => {
                const row = [];
                const tdElements = tr.querySelectorAll('td');
                tdElements.forEach(td => {
                    // Limpiar el texto (remover HTML interno si existe)
                    let text = td.textContent || td.innerText;
                    // Remover caracteres especiales y espacios extra
                    text = text.replace(/\s+/g, ' ').trim();
                    row.push(text);
                });
                if (row.length > 0) {
                    rows.push(row);
                }
            });

            // Crear libro de Excel
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Datos");

            // Descargar archivo
            const fecha = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `datos_grafica_${fecha}.xlsx`);

            Swal.fire({
                icon: 'success',
                title: 'Excel descargado',
                text: 'Los datos se han exportado correctamente a Excel',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Error descargando Excel:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo exportar a Excel: ' + error.message,
                confirmButtonColor: '#e74c3c'
            });
        }
    }
}

// Crear instancia global
const exportManager = new ExportManager();

// Funciones globales para los botones del modal
function descargarPNG() {
    exportManager.descargarPNG();
}

function descargarExcel() {
    exportManager.descargarExcel();
}