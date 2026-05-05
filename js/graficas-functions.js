// ============================================
// FUNCIONES PARA GRÁFICOS - chart-functions.js
// ============================================

function showChartModal() {
    Swal.fire({
        title: '<div style="display: flex; align-items: center; gap: 10px;"><i class="fas fa-chart-bar" style="color: #9b59b6;"></i><span>Crear Gráfico</span></div>',
        html: `
            <div class="custom-modal-content">
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-chart-pie"></i>
                        Tipo de Gráfico
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                        <button type="button" class="chart-type-btn active" data-type="bar" 
                                style="padding: 15px; border: 2px solid #9b59b6; border-radius: 8px; background: #f8f9fa; cursor: pointer; text-align: center; transition: all 0.3s;">
                            <i class="fas fa-chart-bar" style="display: block; font-size: 1.5rem; color: #9b59b6; margin-bottom: 8px;"></i>
                            <span style="font-size: 0.85rem; font-weight: 500;">Barras</span>
                        </button>
                        
                        <button type="button" class="chart-type-btn" data-type="pie" 
                                style="padding: 15px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa; cursor: pointer; text-align: center; transition: all 0.3s;">
                            <i class="fas fa-chart-pie" style="display: block; font-size: 1.5rem; color: #7f8c8d; margin-bottom: 8px;"></i>
                            <span style="font-size: 0.85rem; font-weight: 500;">Circular</span>
                        </button>
                        
                        <button type="button" class="chart-type-btn" data-type="line" 
                                style="padding: 15px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa; cursor: pointer; text-align: center; transition: all 0.3s;">
                            <i class="fas fa-chart-line" style="display: block; font-size: 1.5rem; color: #7f8c8d; margin-bottom: 8px;"></i>
                            <span style="font-size: 0.85rem; font-weight: 500;">Líneas</span>
                        </button>
                        
                        <button type="button" class="chart-type-btn" data-type="doughnut" 
                                style="padding: 15px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa; cursor: pointer; text-align: center; transition: all 0.3s;">
                            <i class="fas fa-chart-area" style="display: block; font-size: 1.5rem; color: #7f8c8d; margin-bottom: 8px;"></i>
                            <span style="font-size: 0.85rem; font-weight: 500;">Dona</span>
                        </button>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-database"></i>
                        Datos del Gráfico
                    </div>
                    
                    <div class="modal-input-group">
                        <label class="modal-input-label">Título del Gráfico</label>
                        <input type="text" id="chart-title" class="modal-input" 
                               placeholder="Ej: Ventas Mensuales 2024" value="Mi Gráfico">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div class="modal-input-group">
                            <label class="modal-input-label">Valores (separados por comas)</label>
                            <input type="text" id="chart-data" class="modal-input" 
                                   placeholder="Ej: 30,50,70,40,60" value="30,50,70,40,60">
                        </div>
                        
                        <div class="modal-input-group">
                            <label class="modal-input-label">Etiquetas (separadas por comas)</label>
                            <input type="text" id="chart-labels" class="modal-input" 
                                   placeholder="Ej: Ene,Feb,Mar,Abr,May" value="Ene,Feb,Mar,Abr,May">
                        </div>
                    </div>
                    
                    <div class="modal-input-group">
                        <label class="modal-input-label">Descripción (Opcional)</label>
                        <textarea id="chart-description" class="modal-input" 
                                  placeholder="Breve descripción del gráfico..." 
                                  rows="2"></textarea>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-paint-brush"></i>
                        Personalización
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="modal-input-group">
                            <label class="modal-input-label">Paleta de Colores</label>
                            <select id="chart-colors" class="modal-select">
                                <option value="vibrant" selected>Vibrante</option>
                                <option value="pastel">Pastel</option>
                                <option value="monochrome">Monocromático</option>
                                <option value="green">Verde</option>
                                <option value="blue">Azul</option>
                            </select>
                        </div>
                        
                        <div class="modal-input-group">
                            <label class="modal-input-label">Tamaño del Gráfico</label>
                            <select id="chart-size" class="modal-select">
                                <option value="small">Pequeño</option>
                                <option value="medium" selected>Mediano</option>
                                <option value="large">Grande</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">
                        <i class="fas fa-eye"></i>
                        Vista Previa
                    </div>
                    
                    <div class="preview-container">
                        <div class="preview-title">Previsualización</div>
                        <div class="preview-content" id="chart-preview" style="min-height: 150px;">
                            <div style="text-align: center; color: #7f8c8d;">
                                <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                <span>El gráfico aparecerá aquí</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-plus"></i> Insertar Gráfico',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#9b59b6',
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'custom-modal',
            header: 'custom-modal-header',
            title: 'custom-modal-title',
            htmlContainer: 'custom-modal-content',
            confirmButton: 'custom-confirm-btn',
            cancelButton: 'custom-cancel-btn'
        },
        width: 600,
        showLoaderOnConfirm: false,
        preConfirm: () => {
            const activeBtn = document.querySelector('.chart-type-btn.active');
            const chartType = activeBtn.dataset.type;
            const title = document.getElementById('chart-title').value.trim();
            const dataStr = document.getElementById('chart-data').value.trim();
            const labelsStr = document.getElementById('chart-labels').value.trim();
            const description = document.getElementById('chart-description').value.trim();
            const colors = document.getElementById('chart-colors').value;
            const size = document.getElementById('chart-size').value;
            
            // Validar datos
            if (!title) {
                Swal.showValidationMessage('Por favor, ingresa un título para el gráfico');
                return false;
            }
            
            if (!dataStr || !labelsStr) {
                Swal.showValidationMessage('Por favor, ingresa datos y etiquetas válidos');
                return false;
            }
            
            const data = dataStr.split(',').map(d => parseFloat(d.trim()) || 0);
            const labels = labelsStr.split(',').map(l => l.trim());
            
            if (data.length === 0 || labels.length === 0 || data.length !== labels.length) {
                Swal.showValidationMessage('El número de valores debe coincidir con el número de etiquetas');
                return false;
            }
            
            return {
                type: chartType,
                title,
                data,
                labels,
                description,
                colors,
                size
            };
        },
        didOpen: () => {
            // Configurar botones de tipo de gráfico
            const buttons = document.querySelectorAll('.chart-type-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    buttons.forEach(b => {
                        b.style.borderColor = '#ddd';
                        b.querySelector('i').style.color = '#7f8c8d';
                    });
                    this.style.borderColor = '#9b59b6';
                    this.querySelector('i').style.color = '#9b59b6';
                    buttons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    updateChartPreview();
                });
            });
            
            // Actualizar vista previa cuando cambien los valores
            const updateChartPreview = () => {
                const activeBtn = document.querySelector('.chart-type-btn.active');
                const chartType = activeBtn.dataset.type;
                const title = document.getElementById('chart-title').value.trim();
                const dataStr = document.getElementById('chart-data').value.trim();
                const labelsStr = document.getElementById('chart-labels').value.trim();
                const colors = document.getElementById('chart-colors').value;
                
                if (dataStr && labelsStr) {
                    const data = dataStr.split(',').map(d => parseFloat(d.trim()) || 0);
                    const labels = labelsStr.split(',').map(l => l.trim());
                    generateChartPreview(chartType, title, data, labels, colors);
                }
            };
            
            // Agregar listeners para actualizar la vista previa
            ['chart-title', 'chart-data', 'chart-labels', 'chart-colors'].forEach(id => {
                document.getElementById(id).addEventListener('input', updateChartPreview);
            });
            
            // Generar vista previa inicial
            updateChartPreview();
        }
    }).then((result) => {
        if (result.isConfirmed) {
            insertChart(result.value);
        }
    });
}

function generateChartPreview(type, title, data, labels, colorPalette) {
    const preview = document.getElementById('chart-preview');
    
    // Obtener colores según la paleta seleccionada
    const colors = getChartColors(colorPalette, data.length);
    
    // Limpiar el preview
    preview.innerHTML = '';
    
    // Crear contenedor para el gráfico preview
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '150px';
    container.style.position = 'relative';
    
    if (type === 'bar') {
        // Gráfico de barras preview
        const maxValue = Math.max(...data);
        const barWidth = 20;
        const spacing = 15;
        
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * 100;
            const bar = document.createElement('div');
            bar.style.position = 'absolute';
            bar.style.bottom = '20px';
            bar.style.left = `${index * (barWidth + spacing) + 10}px`;
            bar.style.width = `${barWidth}px`;
            bar.style.height = `${barHeight}px`;
            bar.style.backgroundColor = colors[index];
            bar.style.borderRadius = '3px 3px 0 0';
            preview.appendChild(bar);
            
            // Etiqueta
            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.bottom = '0';
            label.style.left = `${index * (barWidth + spacing) + 10}px`;
            label.style.width = `${barWidth}px`;
            label.style.textAlign = 'center';
            label.style.fontSize = '9px';
            label.style.color = '#7f8c8d';
            label.textContent = labels[index]?.substring(0, 3) || '';
            preview.appendChild(label);
        });
        
        // Título del preview
        const titleDiv = document.createElement('div');
        titleDiv.style.textAlign = 'center';
        titleDiv.style.fontSize = '11px';
        titleDiv.style.fontWeight = '600';
        titleDiv.style.color = '#2c3e50';
        titleDiv.style.marginBottom = '10px';
        titleDiv.textContent = title.substring(0, 30) + (title.length > 30 ? '...' : '');
        preview.prepend(titleDiv);
        
    } else if (type === 'pie' || type === 'doughnut') {
        // Gráfico circular preview
        const total = data.reduce((a, b) => a + b, 0);
        let currentAngle = 0;
        
        // Crear un canvas simple para el gráfico circular
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        
        const ctx = canvas.getContext('2d');
        
        // Dibujar el gráfico circular
        data.forEach((value, index) => {
            const angle = (value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(60, 60);
            ctx.arc(60, 60, 50, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            
            currentAngle += angle;
        });
        
        // Agujero central para gráfico de dona
        if (type === 'doughnut') {
            ctx.beginPath();
            ctx.arc(60, 60, 25, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
        }
        
        preview.appendChild(canvas);
        
        // Título
        const titleDiv = document.createElement('div');
        titleDiv.style.textAlign = 'center';
        titleDiv.style.fontSize = '11px';
        titleDiv.style.fontWeight = '600';
        titleDiv.style.color = '#2c3e50';
        titleDiv.style.marginTop = '5px';
        titleDiv.textContent = title.substring(0, 30) + (title.length > 30 ? '...' : '');
        preview.appendChild(titleDiv);
        
    } else if (type === 'line') {
        // Gráfico de líneas preview
        const maxValue = Math.max(...data);
        
        // Crear canvas para el gráfico de líneas
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 100;
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        
        const ctx = canvas.getContext('2d');
        
        // Dibujar línea
        ctx.beginPath();
        ctx.strokeStyle = colors[0];
        ctx.lineWidth = 2;
        
        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * 160 + 10;
            const y = 80 - (value / maxValue) * 60;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Dibujar puntos
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = colors[0];
            ctx.fill();
        });
        
        ctx.stroke();
        
        preview.appendChild(canvas);
        
        // Título
        const titleDiv = document.createElement('div');
        titleDiv.style.textAlign = 'center';
        titleDiv.style.fontSize = '11px';
        titleDiv.style.fontWeight = '600';
        titleDiv.style.color = '#2c3e50';
        titleDiv.style.marginTop = '5px';
        titleDiv.textContent = title.substring(0, 30) + (title.length > 30 ? '...' : '');
        preview.appendChild(titleDiv);
    }
}

function getChartColors(palette, count) {
    switch (palette) {
        case 'vibrant':
            return ['#27ae60', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#d35400', '#34495e'];
        case 'pastel':
            return ['#a3e4d7', '#f1948a', '#bb8fce', '#f7dc6f', '#85c1e9', '#f8c471', '#aed6f1', '#d7bde2'];
        case 'monochrome':
            return Array(count).fill('#2e7d32').map((color, i) => {
                const opacity = 0.3 + (i * 0.7 / count);
                return `rgba(46, 125, 50, ${opacity})`;
            });
        case 'green':
            return ['#2e7d32', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9'];
        case 'blue':
            return ['#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5', '#64b5f6'];
        default:
            return ['#27ae60', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    }
}

function insertChart(chartData) {
    const chartId = 'chart-' + Date.now();
    
    // Obtener colores según la paleta seleccionada
    const colors = getChartColors(chartData.colors, chartData.data.length);
    
    // Determinar tamaño del contenedor
    let containerWidth = '600px';
    switch (chartData.size) {
        case 'small': containerWidth = '400px'; break;
        case 'medium': containerWidth = '600px'; break;
        case 'large': containerWidth = '800px'; break;
    }
    
    // Crear HTML del gráfico
    const chartHTML = `
        <div class="element-container" id="${chartId}" style="width: ${containerWidth}; max-width: 100%;">
            <div class="element-controls">
                <button class="element-btn btn-move" title="Mover gráfico">
                    <i class="fas fa-arrows-alt"></i>
                </button>
                <button class="element-btn btn-resize" title="Redimensionar">
                    <i class="fas fa-expand-alt"></i>
                </button>
                <button class="element-btn btn-delete" onclick="deleteElement('${chartId}')" title="Eliminar gráfico">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="chart-wrapper">
                <div class="chart-title">${chartData.title}</div>
                
                ${chartData.description ? `<div style="text-align: center; color: #7f8c8d; margin-bottom: 15px; font-size: 0.9rem;">${chartData.description}</div>` : ''}
                
                <div class="chart-content">
                    ${generateChartHTML(chartData.type, chartData.data, chartData.labels, colors)}
                </div>
                
                <div class="chart-legend">
                    ${generateChartLegend(chartData.labels, colors)}
                </div>
            </div>
        </div>
    `;
    
    // Insertar en la posición actual del cursor
    insertAtCursor(chartHTML);
    
    // Hacer el gráfico arrastrable y redimensionable
    setTimeout(() => {
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            makeElementDraggable(chartElement);
            makeElementResizable(chartElement);
        }
    }, 100);
}

function generateChartHTML(type, data, labels, colors) {
    const maxValue = Math.max(...data);
    const total = data.reduce((a, b) => a + b, 0);
    
    if (type === 'bar') {
        // Gráfico de barras
        let barsHTML = '<div style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding: 0 20px;">';
        
        data.forEach((value, index) => {
            const height = (value / maxValue) * 180;
            barsHTML += `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1; margin: 0 5px;">
                    <div style="width: 80%; height: ${height}px; background: ${colors[index]}; 
                         border-radius: 4px 4px 0 0; position: relative;">
                        <div style="position: absolute; top: -25px; left: 0; right: 0; text-align: center; 
                             font-weight: 600; color: #2c3e50; font-size: 0.9rem;">${value}</div>
                    </div>
                    <div style="margin-top: 10px; font-weight: 500; color: #555; font-size: 0.85rem; 
                         text-align: center; word-break: break-word; max-width: 100%;">${labels[index]}</div>
                </div>
            `;
        });
        
        barsHTML += '</div>';
        return barsHTML;
        
    } else if (type === 'pie' || type === 'doughnut') {
        // Gráfico circular
        let currentAngle = 0;
        let pieHTML = '<div style="position: relative; width: 200px; height: 200px; margin: 0 auto;">';
        
        // Crear el gráfico circular con SVG
        pieHTML += '<svg width="200" height="200" viewBox="0 0 200 200">';
        
        const centerX = 100;
        const centerY = 100;
        const radius = type === 'doughnut' ? 80 : 90;
        const innerRadius = type === 'doughnut' ? 40 : 0;
        
        data.forEach((value, index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            const endAngle = currentAngle + angle;
            
            // Convertir ángulos a radianes
            const startRad = (currentAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            // Calcular puntos para el arco
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);
            
            const x1_inner = centerX + innerRadius * Math.cos(startRad);
            const y1_inner = centerY + innerRadius * Math.sin(startRad);
            const x2_inner = centerX + innerRadius * Math.cos(endRad);
            const y2_inner = centerY + innerRadius * Math.sin(endRad);
            
            // Crear el path para el segmento
            const largeArc = angle > 180 ? 1 : 0;
            
            let pathData = '';
            if (type === 'doughnut') {
                pathData = `
                    M ${x1_inner} ${y1_inner}
                    L ${x1} ${y1}
                    A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                    L ${x2_inner} ${y2_inner}
                    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1_inner} ${y1_inner}
                    Z
                `;
            } else {
                pathData = `
                    M ${centerX} ${centerY}
                    L ${x1} ${y1}
                    A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                    Z
                `;
            }
            
            pieHTML += `
                <path d="${pathData}" fill="${colors[index]}" stroke="white" stroke-width="2"/>
                <text x="${centerX + (radius + 20) * Math.cos((currentAngle + angle/2 - 90) * Math.PI/180)}" 
                      y="${centerY + (radius + 20) * Math.sin((currentAngle + angle/2 - 90) * Math.PI/180)}"
                      text-anchor="middle" alignment-baseline="middle"
                      font-size="10" fill="#555">${percentage.toFixed(1)}%</text>
            `;
            
            currentAngle = endAngle;
        });
        
        pieHTML += '</svg></div>';
        return pieHTML;
        
    } else if (type === 'line') {
        // Gráfico de líneas
        let lineHTML = '<div style="position: relative; height: 200px; padding: 20px;">';
        
        // Eje Y
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * i;
            lineHTML += `
                <div style="position: absolute; left: 0; bottom: ${(i / 5) * 100}%; 
                     transform: translateY(50%); font-size: 0.8rem; color: #7f8c8d; padding-right: 10px; text-align: right; width: 40px;">
                    ${Math.round(value)}
                </div>
            `;
        }
        
        // Contenedor para la línea
        lineHTML += '<div style="margin-left: 50px; position: relative; height: 100%;">';
        
        // Dibujar la línea
        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = (value / maxValue) * 100;
            
            // Punto
            lineHTML += `
                <div style="position: absolute; left: ${x}%; bottom: ${y}%; transform: translate(-50%, 50%); 
                     width: 12px; height: 12px; background: ${colors[0]}; border-radius: 50%; border: 2px solid white;
                     box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            `;
            
            // Valor encima del punto
            lineHTML += `
                <div style="position: absolute; left: ${x}%; bottom: ${y}%; transform: translate(-50%, -30px); 
                     font-size: 0.8rem; font-weight: 600; color: #2c3e50; text-align: center;">
                    ${value}
                </div>
            `;
            
            // Línea entre puntos
            if (index > 0) {
                const prevX = ((index - 1) / (data.length - 1)) * 100;
                const prevY = (data[index - 1] / maxValue) * 100;
                lineHTML += `
                    <div style="position: absolute; left: ${prevX}%; bottom: ${prevY}%; 
                         width: ${Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2))}%; 
                         height: 3px; background: ${colors[0]}; border-radius: 1.5px;
                         transform-origin: 0 0; 
                         transform: rotate(${Math.atan2(y - prevY, x - prevX)}rad);"></div>
                `;
            }
        });
        
        // Etiquetas del eje X
        lineHTML += '<div style="position: absolute; left: 0; right: 0; top: 100%; display: flex; justify-content: space-between; margin-top: 10px;">';
        labels.forEach(label => {
            lineHTML += `<div style="font-size: 0.8rem; color: #555; text-align: center; flex: 1;">${label}</div>`;
        });
        lineHTML += '</div>';
        
        lineHTML += '</div></div>';
        return lineHTML;
    }
    
    return '<div style="text-align: center; color: #7f8c8d; padding: 40px;">No se pudo generar el gráfico</div>';
}

function generateChartLegend(labels, colors) {
    let legendHTML = '';
    labels.forEach((label, index) => {
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${colors[index % colors.length]};"></div>
                <span>${label}</span>
            </div>
        `;
    });
    return legendHTML;
}