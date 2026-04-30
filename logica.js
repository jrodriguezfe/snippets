// API
// Si el backend corre en la misma máquina, podrías usar "http://localhost:8000/api"
// Asegúrate de que esta IP sea accesible desde tu navegador.
const API_BASE = "https://api-g4.senaticttc.com/api";

async function fetchJSON(endpoint){
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`);
        if(!res.ok){
            console.error(`API error ${res.status} ${endpoint}`);
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error('Error de red o conexión con la API:', endpoint, e);
        return null;
    }
}

// =========================
// KPIs
// =========================
function actualizarKPIs(data){
    const stats = data.stats_globales || {};

    // Velocidad global (usando promedio real de BD)
    const elVelocidad = document.getElementById("kpiVelocidad");
    if (elVelocidad) elVelocidad.textContent = stats.vel_avg ? Number(stats.vel_avg).toFixed(2) + " km/h" : "--";

    // Mejor corredor
    if(data.top_puntaje && data.top_puntaje.length){
        let best = data.top_puntaje[0];
        const elMejorCorredor = document.getElementById("kpiMejorCorredor");
        if (elMejorCorredor) elMejorCorredor.textContent = best.conductor;
        
        const elMejorPuntaje = document.getElementById("kpiMejorPuntaje");
        if (elMejorPuntaje) elMejorPuntaje.textContent = Number(best.puntaje_total).toFixed(2) + " pts";
    }

    // Temperatura global (usando promedio real de BD)
    const elTemperatura = document.getElementById("kpiTemperatura");
    if (elTemperatura) elTemperatura.textContent = stats.temp_avg ? Number(stats.temp_avg).toFixed(2) + " °C" : "--";

    // Tiempo total
    const totalTiempo = data.tiempo_total ? data.tiempo_total.reduce((acc,t)=>acc + Number(t.tiempo_total),0) : 0;
    const elTiempoTotal = document.getElementById("kpiTiempoTotal");
    if (elTiempoTotal) elTiempoTotal.textContent = totalTiempo.toFixed(0) + " s";
}

// =========================
// GRAFICOS
// =========================

const chartInstances = {};

function drawBar(canvas, data, label, nameKey, valKey, color = '#3b82f6'){
    const el = document.getElementById(canvas);
    if(!el){
        console.warn('Canvas not found:', canvas);
        return;
    }

    if (typeof Chart === 'undefined') {
        console.error('Error: La librería Chart.js no está cargada en el HTML.');
        return;
    }

    const ctx = el.getContext("2d");
    const labels = Array.isArray(data) ? data.map(x=>x[nameKey]) : [];
    const values = Array.isArray(data) ? data.map(x=>x[valKey]) : [];

    // Actualizar el gráfico existente en lugar de destruirlo (mejora radicalmente el rendimiento)
    if (chartInstances[canvas]) {
        chartInstances[canvas].data.labels = labels;
        chartInstances[canvas].data.datasets[0].data = values;
        chartInstances[canvas].update();
        return;
    }

    try{
        chartInstances[canvas] = new Chart(ctx,{
            type:'bar',
            data:{
                labels:labels,
                datasets:[{
                    label:label,
                    data:values,
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        })
    }catch(e){
        console.error('Chart render error for', canvas, e);
    }
}

// =========================
// DASHBOARD
// =========================

async function cargarDashboard(){
    const data = await fetchJSON("dashboard_resumen");
    
    console.log("Datos recibidos de la API:", data);

    if(!data || (Array.isArray(data) && data.length === 0) || Object.keys(data).length === 0) {
        console.error("No se pudieron cargar los datos o la respuesta está vacía.");
        const statusEl = document.getElementById('lastUpdate');
        if(statusEl) statusEl.textContent = "Error: Endpoint no encontrado (404) o sin datos";
        setTimeout(cargarDashboard, 5000); // Evita que se rompa el ciclo si la API se cae temporalmente
        return;
    }

    // Actualizar KPIs
    actualizarKPIs(data);

    // Dibujar Gráficos
    drawBar("chartTopVelocidades", data.top_velocidades, "Velocidad Prom.", "conductor", "velocidad_promedio");
    drawBar("chartTopPuntaje", data.top_puntaje, "Puntaje", "conductor", "puntaje_total");
    drawBar("chartTopTemperaturas", data.top_temperaturas, "Temperatura", "conductor", "temperatura_promedio");
    drawBar("chartTiempoTotal", data.tiempo_total, "Tiempo", "conductor", "tiempo_total");
    drawBar("chartInfracciones", data.infracciones, "Infracciones", "conductor", "paso_rojo_total");
    drawBar("chartDetuvoCorrecto", data.detuvo_correcto, "Detuvo Correcto", "conductor", "detuvo_correcto_total");
    drawBar("chartAcelerarAmbar", data.acelerar_ambar, "Acelerar Ámbar", "conductor", "acelero_ambar_total", '#f59e0b');
    drawBar("chartFrenarAmbar", data.frenar_ambar, "Frenar Ámbar", "conductor", "freno_ambar_total", '#f59e0b');
    drawBar("chartColisionDerecha", data.colision_derecha, "Colisión Derecha", "conductor", "colision_derecha", '#ef4444');
    drawBar("chartColisionIzquierda", data.colision_izquierda, "Colisión Izquierda", "conductor", "colision_izquierda", '#ef4444');
    
    renderConteoJugadores(data.conteo_jugadores);
    
    // Renderizar Top 3 usando los mismos datos (ahorramos otra petición)
    renderTop3Infracciones(data.infracciones ? data.infracciones.slice(0, 3) : []);

    // Actualizar timestamp de última carga
    const now = new Date().toLocaleTimeString();
    const statusEl = document.getElementById('lastUpdate');
    if(statusEl) statusEl.textContent = `Actualizado: ${now}`;

    // Llamar de nuevo después de 5 segundos de finalizada la petición actual
    setTimeout(cargarDashboard, 5000);
}

function renderTop3Infracciones(list){
    const el = document.getElementById('top3Infracciones');
    if(!el) return;
    if(!list || list.length === 0){
        el.innerHTML = '<li class="text-gray-400">No hay datos</li>';
        return;
    }
    el.innerHTML = list.map(item => `
        <li class="flex justify-between">
            <span>${item.conductor}</span>
            <span class="font-semibold text-kpi-red">${item.paso_rojo_total}</span>
        </li>
    `).join('');
}

function renderConteoJugadores(list){
    const el = document.getElementById('conteoJugadores');
    if(!el) return;
    if(!list || list.length === 0){
        el.innerHTML = '<li class="text-gray-400">No hay datos</li>';
        return;
    }
    el.innerHTML = list.map(item => `
        <li class="flex justify-between border-b border-gray-100 py-1">
            <span>${item.conductor}</span>
            <span class="font-bold text-blue-600">${item.total} registros</span>
        </li>
    `).join('');
}

cargarDashboard();