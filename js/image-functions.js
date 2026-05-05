// ============================================
// FUNCIONES PARA IMÁGENES - image-functions.js (CORREGIDO)
// ============================================

function showImageModal() {
    Swal.fire({
        title: '<div style="display: flex; align-items: center; gap: 10px;"><i class="fas fa-image" style="color: #3498db;"></i><span>Insertar Imagen</span></div>',
        html: `
            <div class="custom-modal-content">
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-upload"></i>
                        Seleccionar Imagen
                    </div>
                    
                    <div class="modal-input-group">
                        <label class="modal-input-label">Subir desde tu computadora</label>
                        <div style="border: 2px dashed #ddd; border-radius: 8px; padding: 25px; text-align: center; cursor: pointer;"
                             onclick="document.getElementById('file-upload').click()"
                             ondrop="handleDrop(event)"
                             ondragover="handleDragOver(event)"
                             id="drop-zone">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #3498db; margin-bottom: 10px;"></i>
                            <div style="font-weight: 500; color: #555; margin-bottom: 5px;">Arrastra y suelta una imagen</div>
                            <div style="font-size: 0.9rem; color: #7f8c8d; margin-bottom: 15px;">o haz clic para seleccionar</div>
                            <div style="font-size: 0.8rem; color: #95a5a6;">Formatos soportados: JPG, PNG, GIF</div>
                            <input type="file" id="file-upload" accept="image/*" style="display: none;" onchange="handleFileSelect(event)">
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 15px 0; color: #7f8c8d; font-size: 0.9rem;">ó</div>
                    
                    <div class="modal-input-group">
                        <label class="modal-input-label">Usar una URL de imagen</label>
                        <input type="url" id="image-url" class="modal-input" 
                               placeholder="https://ejemplo.com/imagen.jpg">
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-crop-alt"></i>
                        Ajustes de la Imagen
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="modal-input-group">
                            <label class="modal-input-label">Tamaño</label>
                            <select id="image-size" class="modal-select">
                                <option value="small">Pequeño (300px)</option>
                                <option value="medium" selected>Mediano (500px)</option>
                                <option value="large">Grande (700px)</option>
                                <option value="full">Ancho completo</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>
                        
                        <div class="modal-input-group" id="custom-size-container" style="display: none;">
                            <label class="modal-input-label">Ancho personalizado (px)</label>
                            <input type="number" id="custom-width" class="modal-input" 
                                   placeholder="Ej: 600" min="100" max="1200" value="600">
                        </div>
                        
                        <div class="modal-input-group">
                            <label class="modal-input-label">Alineación</label>
                            <select id="image-align" class="modal-select">
                                <option value="center" selected>Centrado</option>
                                <option value="left">Izquierda</option>
                                <option value="right">Derecha</option>
                            </select>
                        </div>
                        
                        <div class="modal-input-group">
                            <label class="modal-input-label">Bordes</label>
                            <select id="image-border" class="modal-select">
                                <option value="none" selected>Sin borde</option>
                                <option value="light">Borde ligero</option>
                                <option value="shadow">Con sombra</option>
                                <option value="rounded">Bordes redondeados</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-font"></i>
                        Pie de Foto (Opcional)
                    </div>
                    
                    <div class="modal-input-group">
                        <input type="text" id="image-caption" class="modal-input" 
                               placeholder="Descripción de la imagen...">
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-eye"></i>
                        Vista Previa
                    </div>
                    
                    <div class="preview-container">
                        <div class="preview-title">Previsualización</div>
                        <div class="preview-content" id="image-preview">
                            <div style="text-align: center; color: #7f8c8d;">
                                <i class="fas fa-image" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                <span>La imagen aparecerá aquí</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-plus"></i> Insertar Imagen',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'custom-modal',
            header: 'custom-modal-header',
            title: 'custom-modal-title',
            htmlContainer: 'custom-modal-content',
            confirmButton: 'custom-confirm-btn',
            cancelButton: 'custom-cancel-btn'
        },
        width: 550,
        showLoaderOnConfirm: false,
        preConfirm: () => {
            const fileInput = document.getElementById('file-upload');
            const urlInput = document.getElementById('image-url').value;
            const size = document.getElementById('image-size').value;
            const customWidth = document.getElementById('custom-width').value;
            const align = document.getElementById('image-align').value;
            const border = document.getElementById('image-border').value;
            const caption = document.getElementById('image-caption').value;
            
            let imageSrc = urlInput;
            
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        resolve({
                            src: e.target.result,
                            size,
                            customWidth: parseInt(customWidth) || 600,
                            align,
                            border,
                            caption,
                            isFile: true
                        });
                    };
                    reader.readAsDataURL(file);
                });
            } else if (urlInput) {
                return {
                    src: urlInput,
                    size,
                    customWidth: parseInt(customWidth) || 600,
                    align,
                    border,
                    caption,
                    isFile: false
                };
            } else {
                Swal.showValidationMessage('Por favor, selecciona una imagen o ingresa una URL');
                return false;
            }
        },
        didOpen: () => {
            // Mostrar/ocultar tamaño personalizado
            document.getElementById('image-size').addEventListener('change', function() {
                const customContainer = document.getElementById('custom-size-container');
                customContainer.style.display = this.value === 'custom' ? 'block' : 'none';
            });
            
            // Actualizar vista previa
            const updatePreview = () => {
                const fileInput = document.getElementById('file-upload');
                const urlInput = document.getElementById('image-url').value;
                
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        updateImagePreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                } else if (urlInput) {
                    updateImagePreview(urlInput);
                }
            };
            
            document.getElementById('file-upload').addEventListener('change', updatePreview);
            document.getElementById('image-url').addEventListener('input', updatePreview);
            document.getElementById('image-size').addEventListener('change', updatePreview);
            document.getElementById('image-align').addEventListener('change', updatePreview);
            document.getElementById('image-border').addEventListener('change', updatePreview);
            
            // Configurar drag and drop
            window.handleDrop = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dropZone = document.getElementById('drop-zone');
                dropZone.style.borderColor = '#3498db';
                dropZone.style.background = '#f8f9fa';
                
                if (e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        document.getElementById('file-upload').files = e.dataTransfer.files;
                        updatePreview();
                    }
                }
            };
            
            window.handleDragOver = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const dropZone = document.getElementById('drop-zone');
                dropZone.style.borderColor = '#3498db';
                dropZone.style.background = '#f8f9fa';
            };
            
            window.handleFileSelect = function(e) {
                updatePreview();
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            insertImageModal(result.value);
        }
    });
}

function updateImagePreview(src) {
    const preview = document.getElementById('image-preview');
    const size = document.getElementById('image-size').value;
    const align = document.getElementById('image-align').value;
    const border = document.getElementById('image-border').value;
    const customWidth = document.getElementById('custom-width').value;
    const caption = document.getElementById('image-caption').value;
    
    let width = '300px';
    switch (size) {
        case 'small': width = '300px'; break;
        case 'medium': width = '500px'; break;
        case 'large': width = '700px'; break;
        case 'custom': width = (parseInt(customWidth) || 600) + 'px'; break;
        case 'full': width = '100%'; break;
    }
    
    let borderStyle = '';
    switch (border) {
        case 'light': borderStyle = 'border: 1px solid #ddd;'; break;
        case 'shadow': borderStyle = 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none;'; break;
        case 'rounded': borderStyle = 'border-radius: 12px; border: 1px solid #ddd;'; break;
        default: borderStyle = 'border: none;';
    }
    
    let alignStyle = '';
    switch (align) {
        case 'left': alignStyle = 'float: left; margin-right: 15px;'; break;
        case 'right': alignStyle = 'float: right; margin-left: 15px;'; break;
        default: alignStyle = 'display: block; margin: 0 auto;';
    }
    
    preview.innerHTML = `
        <div style="text-align: ${align === 'center' ? 'center' : 'left'};">
            <img src="${src}" 
                 style="max-width: 100%; height: auto; ${borderStyle} ${alignStyle} width: ${width};"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
            <div style="display: none; background: #fff3cd; color: #856404; padding: 10px; border-radius: 5px; margin-top: 10px;">
                <i class="fas fa-exclamation-triangle"></i> No se pudo cargar la imagen
            </div>
            ${caption ? `<div style="margin-top: 10px; font-style: italic; color: #7f8c8d; font-size: 0.9rem; text-align: center;">${caption}</div>` : ''}
        </div>
    `;
}

// FUNCIÓN ACTUALIZADA: Usar el sistema del editor
function insertImageModal(imageData) {
    const imageId = 'image-' + Date.now();
    
    // Determinar el tamaño
    let width = '';
    switch (imageData.size) {
        case 'small': width = '300px'; break;
        case 'medium': width = '500px'; break;
        case 'large': width = '700px'; break;
        case 'custom': width = imageData.customWidth + 'px'; break;
        case 'full': width = '100%'; break;
    }
    
    // Determinar estilo de borde
    let borderStyle = '';
    switch (imageData.border) {
        case 'light': borderStyle = 'border: 1px solid #ddd;'; break;
        case 'shadow': borderStyle = 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none;'; break;
        case 'rounded': borderStyle = 'border-radius: 12px; border: 1px solid #ddd;'; break;
        default: borderStyle = 'border: none;';
    }
    
    // Determinar alineación
    let alignStyle = '';
    let containerStyle = '';
    switch (imageData.align) {
        case 'left': 
            alignStyle = 'float: left; margin-right: 20px; margin-bottom: 10px;';
            containerStyle = 'text-align: left;';
            break;
        case 'right': 
            alignStyle = 'float: right; margin-left: 20px; margin-bottom: 10px;';
            containerStyle = 'text-align: right;';
            break;
        default: 
            alignStyle = 'display: block; margin: 0 auto;';
            containerStyle = 'text-align: center;';
    }
    
    // Crear HTML de la imagen CORREGIDO
    const imageHTML = `
        <div class="image-element-container" 
             data-image-id="${imageId}"
             style="position: relative; ${containerStyle} margin: 20px 0; ${imageData.size === 'full' ? 'width: 100%;' : ''}">
            <img src="${imageData.src}" 
                 style="max-width: 100%; height: auto; ${borderStyle} ${width !== '100%' ? 'width: ' + width + ';' : ''} ${alignStyle}"
                 alt="${imageData.caption || 'Imagen'}">
            ${imageData.caption ? `<div class="image-caption" style="font-style: italic; color: #666; margin-top: 8px; text-align: center;">${imageData.caption}</div>` : ''}
        </div>
    `;
    
    // Usar el sistema de inserción del editor principal
    executeOnActiveContent(() => {
        document.execCommand('insertHTML', false, imageHTML);
    });
    
    // Volver al modo escritura
    switchToWritingMode();
}

// FUNCIONES AUXILIARES PARA DRAG AND DROP (SIMPLIFICADAS)
function insertAtCursor(html) {
    // Esta función ya no es necesaria, usamos executeOnActiveContent
    console.warn('insertAtCursor está deprecado. Usar executeOnActiveContent en su lugar.');
}

// Exportar funciones globales
window.showImageModal = showImageModal;
window.insertImageModal = insertImageModal;
window.deleteElement = deleteElement;