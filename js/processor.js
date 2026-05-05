class DataProcessor {
    constructor() {
        this.datosVisitantes = [];
        this.datosSimulados = {};
    }

    procesarDatosCompletos(participantes) {
        console.log('Procesando datos completos de participantes...');
        this.datosVisitantes = participantes;

        const totalParticipantes = participantes.length;
        const idsReservasUnicas = [...new Set(participantes
            .filter(p => p.id_reserva)
            .map(p => p.id_reserva))];
        
        const reservasUnicas = idsReservasUnicas.length;
        const reservasConfirmadas = [...new Set(participantes
            .filter(p => p.reservas && p.reservas.estado === 'confirmada')
            .map(p => p.id_reserva))].length;
            
        const participantesPromedio = reservasUnicas > 0 ? totalParticipantes / reservasUnicas : 0;
        const satisfaccionPromedio = 4.2;

        // Actualizar estadísticas
        this.actualizarEstadisticas(
            totalParticipantes, 
            reservasUnicas, 
            participantesPromedio, 
            satisfaccionPromedio
        );

        // Procesar datos por categorías
        this.procesarDatosPorCategorias(participantes);
    }

    actualizarEstadisticas(totalVisitantes, totalReservas, participantesPromedio, satisfaccionPromedio) {
        document.getElementById('total-visitantes').textContent = totalVisitantes.toLocaleString();
        document.getElementById('total-reservas').textContent = totalReservas.toLocaleString();
        document.getElementById('participantes-promedio').textContent = participantesPromedio.toFixed(1);
        document.getElementById('satisfaccion-promedio').textContent = satisfaccionPromedio.toFixed(1) + '/5';
    }

    procesarDatosPorCategorias(participantes) {
        // Implementación de procesamiento por categorías
        const tipoReserva = { 'individual': 0, 'grupal': 0 };
        const estado = { 'confirmada': 0, 'pendiente': 0, 'cancelada': 0 };
        const actividad = {};
        const institucion = {};
        const temporada = { 'Alta': 0, 'Media': 0, 'Baja': 0 };
        const satisfaccion = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        const intereses = {};

        // Procesar cada participante
        participantes.forEach(participante => {
            const reserva = participante.reservas;
            if (!reserva) return;

            // Procesar tipo de reserva
            if (reserva.tipo_reserva && tipoReserva.hasOwnProperty(reserva.tipo_reserva)) {
                tipoReserva[reserva.tipo_reserva]++;
            }

            // ... resto del procesamiento
        });

        // Preparar datos para gráficas
        this.prepararDatosParaGraficas(
            tipoReserva, estado, actividad, institucion, 
            temporada, satisfaccion, intereses, participantes
        );
    }

    prepararDatosParaGraficas(tipoReserva, estado, actividad, institucion, temporada, satisfaccion, intereses, participantes) {
        const datosTiempo = this.procesarDatosPorTiempo(participantes);

        this.datosSimulados = {
            tipo_reserva: {
                labels: Object.keys(tipoReserva),
                values: Object.values(tipoReserva)
            },
            estado: {
                labels: Object.keys(estado),
                values: Object.values(estado)
            },
            // ... resto de categorías
            fecha: datosTiempo.fecha,
            mes: datosTiempo.mes,
            anio: datosTiempo.anio
        };
    }

    procesarDatosPorTiempo(participantes) {
        // Implementación de procesamiento por tiempo
        const visitasPorFecha = { 'individual': {}, 'grupal': {}, 'total': {} };
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const visitasPorMes = { 'individual': {}, 'grupal': {}, 'total': {} };
        const visitasPorAnio = { 'individual': {}, 'grupal': {}, 'total': {} };

        // Inicializar y procesar datos
        // ... (implementación existente)

        return {
            fecha: {
                labels: Object.keys(visitasPorFecha.total).slice(0, 10),
                individual: Object.values(visitasPorFecha.individual).slice(0, 10),
                grupal: Object.values(visitasPorFecha.grupal).slice(0, 10),
                total: Object.values(visitasPorFecha.total).slice(0, 10)
            },
            mes: {
                labels: Object.keys(visitasPorMes.total),
                individual: Object.values(visitasPorMes.individual),
                grupal: Object.values(visitasPorMes.grupal),
                total: Object.values(visitasPorMes.total)
            },
            anio: {
                labels: Object.keys(visitasPorAnio.total).sort((a, b) => parseInt(a) - parseInt(b)),
                individual: Object.keys(visitasPorAnio.total).sort((a, b) => parseInt(a) - parseInt(b)).map(anio => visitasPorAnio.individual[anio] || 0),
                grupal: Object.keys(visitasPorAnio.total).sort((a, b) => parseInt(a) - parseInt(b)).map(anio => visitasPorAnio.grupal[anio] || 0),
                total: Object.keys(visitasPorAnio.total).sort((a, b) => parseInt(a) - parseInt(b)).map(anio => visitasPorAnio.total[anio] || 0)
            }
        };
    }

    determinarTemporada(fecha) {
        const mes = new Date(fecha).getMonth() + 1;
        
        if (mes === 12 || mes === 1 || mes === 2) {
            return 'Alta';
        } else if (mes === 6 || mes === 7) {
            return 'Media';
        } else {
            return 'Baja';
        }
    }

    mostrarDatosDemo() {
        // Implementación de datos de demostración
        console.log('Mostrando datos de demostración');
        
        this.datosSimulados = {
            tipo_reserva: {
                labels: ['Individual', 'Grupal'],
                values: [65, 35]
            },
            // ... resto de datos de demostración
        };

        // Actualizar estadísticas de demostración
        this.actualizarEstadisticas(850, 145, 5.9, 4.2);
        uiManager.mostrarDatos();
    }
}

const dataProcessor = new DataProcessor();