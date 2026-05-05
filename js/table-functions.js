// ============================================
// FUNCIONES PARA TABLAS - table-functions.js
// ============================================

function showTableModal() {
    Swal.fire({
        title: '<div style="display: flex; align-items: center; gap: 10px;"><i class="fas fa-table" style="color: #2e7d32;"></i><span>Insertar Tabla</span></div>',
        html: `
            <div class="custom-modal-content">
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-ruler-combined"></i>
                        Dimensiones
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div class="modal-input-group">
                            <label class="modal-input-label">Filas</label>
                            <input type="number" id="table-rows" class="modal-input" 
                                   value="4" min="1" max="15" placeholder="Número de filas">
                        </div>
                        
                        <div class="modal-input-group">
                            <label class="modal-input-label">Columnas</label>
                            <input type="number" id="table-cols" class="modal-input" 
                                   value="4" min="1" max="10" placeholder="Número de columnas">
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-palette"></i>
                        Estilo de la Tabla
                    </div>
                    
                    <div class="modal-input-group">
                        <select id="table-style" class="modal-select">
                            <option value="basic">Estilo Básico</option>
                            <option value="striped">Filas Alternadas</option>
                            <option value="bordered">Con Bordes</option>
                            <option value="modern">Estilo Moderno</option>
                        </select>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-eye"></i>
                        Vista Previa
                    </div>
                    
                    <div class="preview-container">
                        <div class="preview-title">Previsualización</div>
                        <div class="preview-content" id="table-preview">
                            <div style="text-align: center; color: #7f8c8d;">
                                <i class="fas fa-table" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                <span>La tabla aparecerá aquí</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-plus"></i> Insertar Tabla',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#2e7d32',
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'custom-modal',
            header: 'custom-modal-header',
            title: 'custom-modal-title',
            htmlContainer: 'custom-modal-content',
            confirmButton: 'custom-confirm-btn',
            cancelButton: 'custom-cancel-btn'
        },
        width: 500,
        showLoaderOnConfirm: false,
        preConfirm: () => {
            const rows = parseInt(document.getElementById('table-rows').value) || 4;
            const cols = parseInt(document.getElementById('table-cols').value) || 4;
            const style = document.getElementById('table-style').value;
            
            if (rows < 1 || rows > 15 || cols < 1 || cols > 10) {
                Swal.showValidationMessage('Por favor, ingresa valores válidos (1-15 filas, 1-10 columnas)');
                return false;
            }
            
            return { rows, cols, style };
        },
        didOpen: () => {
            // Actualizar vista previa cuando cambien los valores
            const updatePreview = () => {
                const rows = parseInt(document.getElementById('table-rows').value) || 4;
                const cols = parseInt(document.getElementById('table-cols').value) || 4;
                const style = document.getElementById('table-style').value;
                updateTablePreview(rows, cols, style);
            };
            
            document.getElementById('table-rows').addEventListener('input', updatePreview);
            document.getElementById('table-cols').addEventListener('input', updatePreview);
            document.getElementById('table-style').addEventListener('change', updatePreview);
            
            // Generar vista previa inicial
            updatePreview();
        }
    }).then((result) => {
        if (result.isConfirmed) {
            insertTable(result.value.rows, result.value.cols, result.value.style);
        }
    });
}

function updateTablePreview(rows, cols, style) {
    const preview = document.getElementById('table-preview');
    
    // Crear tabla de vista previa pequeña
    let previewHTML = '<div style="font-size: 10px; overflow: auto; max-width: 100%;">';
    previewHTML += '<table style="border-collapse: collapse; width: 100%;">';
    
    for (let i = 0; i < Math.min(rows, 4); i++) {
        previewHTML += '<tr>';
        for (let j = 0; j < Math.min(cols, 6); j++) {
            let cellStyle = 'border: 1px solid #ddd; padding: 2px 4px; text-align: center; ';
            
            if (style === 'striped' && i % 2 === 0) {
                cellStyle += 'background: #f8f9fa;';
            } else if (style === 'bordered') {
                cellStyle += 'border: 2px solid #2e7d32; background: white;';
            } else if (style === 'modern') {
                if (i === 0) {
                    cellStyle += 'background: #2e7d32; color: white; font-weight: bold;';
                } else {
                    cellStyle += 'background: white;';
                }
            } else {
                cellStyle += 'background: white;';
            }
            
            previewHTML += `<td style="${cellStyle}">${i === 0 ? `Col ${j+1}` : 'Cel'}</td>`;
        }
        
        if (cols > 6) {
            previewHTML += `<td style="border: 1px dashed #ddd; padding: 2px 4px; color: #7f8c8d;">+${cols-6}</td>`;
        }
        previewHTML += '</tr>';
    }
    
    if (rows > 4) {
        previewHTML += '<tr><td colspan="' + Math.min(cols, 7) + '" style="border: 1px dashed #ddd; padding: 2px 4px; color: #7f8c8d; text-align: center;">+ ' + (rows-4) + ' filas más</td></tr>';
    }
    
    previewHTML += '</table></div>';
    previewHTML += `<div style="margin-top: 10px; font-size: 11px; color: #7f8c8d; text-align: center;">${rows} filas × ${cols} columnas</div>`;
    
    preview.innerHTML = previewHTML;
}

function insertTable(rows, cols, style) {
    const tableId = 'table-' + Date.now();
    
    // Crear tabla HTML
    let tableHTML = `
        <div class="element-container" id="${tableId}" style="width: 100%; max-width: 800px; margin: 20px auto;">
            <div class="element-controls">
                <button class="element-btn btn-move" title="Mover tabla">
                    <i class="fas fa-arrows-alt"></i>
                </button>
                <button class="element-btn btn-resize" title="Redimensionar">
                    <i class="fas fa-expand-alt"></i>
                </button>
                <button class="element-btn btn-delete" onclick="deleteElement('${tableId}')" title="Eliminar tabla">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <table class="custom-table" style="width: 100%;">
    `;
    
    // Aplicar estilos según selección
    if (style === 'modern') {
        tableHTML += 'style="border: none; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.08);"';
    } else if (style === 'bordered') {
        tableHTML += 'style="border: 2px solid #2e7d32; border-collapse: collapse;"';
    }
    
    tableHTML += '><thead><tr>';
    
    // Crear encabezados
    for (let i = 0; i < cols; i++) {
        let headerStyle = '';
        if (style === 'modern') {
            headerStyle = 'background: linear-gradient(135deg, #2e7d32, #4caf50); color: white;';
        } else if (style === 'striped' || style === 'basic') {
            headerStyle = 'background: #2e7d32; color: white;';
        } else if (style === 'bordered') {
            headerStyle = 'background: #e8f5e8; color: #2e7d32; border: 1px solid #2e7d32;';
        }
        
        tableHTML += `<th contenteditable="true" style="${headerStyle} padding: 12px 15px; font-weight: 600; text-align: left;">Columna ${i + 1}</th>`;
    }
    
    tableHTML += '</tr></thead><tbody>';
    
    // Crear filas de datos
    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            let cellStyle = '';
            if (style === 'striped' && i % 2 === 0) {
                cellStyle = 'background: #f8f9fa;';
            } else if (style === 'bordered') {
                cellStyle = 'border: 1px solid #2e7d32;';
            } else if (style === 'modern' && i % 2 === 0) {
                cellStyle = 'background: #f8f9fa;';
            }
            
            tableHTML += `<td contenteditable="true" style="${cellStyle} padding: 10px 15px; border: ${style === 'bordered' ? '1px solid #2e7d32' : '1px solid #e0e0e0'};">Dato ${i + 1}-${j + 1}</td>`;
        }
        tableHTML += '</tr>';
    }
    
    tableHTML += '</tbody></table></div>';
    
    // Insertar en la posición actual del cursor
    insertAtCursor(tableHTML);
    
    // Hacer la tabla arrastrable y redimensionable
    setTimeout(() => {
        const tableElement = document.getElementById(tableId);
        if (tableElement) {
            makeElementDraggable(tableElement);
            makeElementResizable(tableElement);
        }
    }, 100);
}

// Función auxiliar para insertar en la posición del cursor - VERSIÓN CORREGIDA
function insertAtCursor(html) {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Crear un fragmento de documento
        const fragment = document.createDocumentFragment();
        
        // Mover todos los nodos del div al fragmento
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        // Eliminar el contenido actual del rango
        range.deleteContents();
        
        // Insertar el fragmento
        range.insertNode(fragment);
        
        // Obtener el último nodo insertado
        const lastNode = fragment.lastChild;
        if (lastNode) {
            // Crear un nuevo rango después del elemento insertado
            const newRange = document.createRange();
            newRange.setStartAfter(lastNode);
            newRange.collapse(true);
            
            // Mover la selección al nuevo rango
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    } else {
        // Si no hay selección, insertar al final del contenido activo
        insertAtEnd(html);
    }
}

// Función alternativa para insertar al final
function insertAtEnd(html) {
    const activeContent = document.querySelector('.page-content[contenteditable="true"]:focus');
    if (!activeContent) {
        // Si no hay contenido activo, buscar el primero
        const firstContent = document.querySelector('.page-content[contenteditable="true"]');
        if (firstContent) {
            firstContent.focus();
            insertAtEnd(html);
        }
        return;
    }
    
    // Crear un div temporal para el contenido
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Agregar al final del contenido
    while (tempDiv.firstChild) {
        activeContent.appendChild(tempDiv.firstChild);
    }
    
    // Mover el cursor al final
    const range = document.createRange();
    range.selectNodeContents(activeContent);
    range.collapse(false);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Hacer scroll al final
    activeContent.scrollTop = activeContent.scrollHeight;
}

function deleteElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.remove();
    }
}

// Hacer elemento arrastrable
function makeElementDraggable(element) {
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    
    const dragBtn = element.querySelector('.btn-move');
    if (!dragBtn) return;
    
    dragBtn.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        offset.x = e.clientX - element.getBoundingClientRect().left;
        offset.y = e.clientY - element.getBoundingClientRect().top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const parentRect = element.parentElement.getBoundingClientRect();
        const newX = e.clientX - parentRect.left - offset.x;
        const newY = e.clientY - parentRect.top - offset.y;
        
        // Limitar movimiento dentro del contenedor
        const maxX = parentRect.width - element.offsetWidth;
        const maxY = parentRect.height - element.offsetHeight;
        
        element.style.position = 'absolute';
        element.style.left = Math.max(0, Math.min(maxX, newX)) + 'px';
        element.style.top = Math.max(0, Math.min(maxY, newY)) + 'px';
        element.style.margin = '0';
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

// Hacer elemento redimensionable
function makeElementResizable(element) {
    const resizeBtn = element.querySelector('.btn-resize');
    if (!resizeBtn) return;
    
    let isResizing = false;
    let startWidth, startHeight, startX, startY;
    
    resizeBtn.addEventListener('mousedown', startResize);
    
    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isResizing = true;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        startX = e.clientX;
        startY = e.clientY;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }
    
    function resize(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newWidth = Math.max(200, Math.min(800, startWidth + deltaX));
        const newHeight = Math.max(100, Math.min(400, startHeight + deltaY));
        
        element.style.width = newWidth + 'px';
        element.style.minHeight = newHeight + 'px';
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }
}

// Exportar funciones globales
window.showTableModal = showTableModal;
window.insertTable = insertTable;
window.deleteElement = deleteElement;