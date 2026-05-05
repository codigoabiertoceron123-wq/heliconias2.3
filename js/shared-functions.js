// ============================================
// FUNCIONES COMPARTIDAS PARA ELEMENTOS
// ============================================

// Función para insertar en la posición del cursor
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
        const insertedNode = range.insertNode(fragment);
        
        // Obtener el último nodo insertado
        if (fragment.lastChild) {
            // Crear un nuevo rango después del elemento insertado
            const newRange = document.createRange();
            newRange.setStartAfter(fragment.lastChild);
            newRange.collapse(true);
            
            // Mover la selección al nuevo rango
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    } else {
        // Si no hay selección, insertar al final
        insertAtEnd(html);
    }
}

// Función para insertar al final del contenido
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
        activeContent.appendChild(tempTemp.firstChild);
    }
    
    // Mover el cursor al final
    const range = document.createRange();
    range.selectNodeContents(activeContent);
    range.collapse(false);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

// Exportar funciones globales
window.insertAtCursor = insertAtCursor;
window.insertAtEnd = insertAtEnd;