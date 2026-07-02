// =================================================================
// CONFIGURACIÓN DE CONEXIÓN
// =================================================================
// Mientras pruebes en tu PC, déjalo en 'localhost'. 
// Cuando tu compañera se conecte a tu PC, cambia 'localhost' por tu IP (Ej: '192.168.1.50')
const IP_SERVIDOR = 'localhost'; 
const URL_API = `http://${IP_SERVIDOR}:3000/api/dashboard`;

// Variables globales para destruir los gráficos previos si se vuelve a cargar la función
let chartPrevision = null;
let chartProblemas = null;

// =================================================================
// FUNCIÓN PRINCIPAL: CARGAR ELEMENTOS EN EL HTML
// =================================================================
function cargarDashboard(data) {
  // 1. Renderizar KPIs en las Cards principales
  document.getElementById("totalEncuestados").textContent = data.totalEncuestados;
  document.getElementById("esperaPromedio").textContent = data.esperaPromedio + " días";
  document.getElementById("trasladoPromedio").textContent = data.trasladoPromedio + " min";
  document.getElementById("satisfaccionPromedio").textContent = data.satisfaccionPromedio + "/10";

  // 2. Renderizar el estado del SLA
  const estadoSLA = document.getElementById("estadoSLA");
  if (estadoSLA) {
    estadoSLA.textContent = "SLA: " + data.sla.toUpperCase();
    estadoSLA.className = "sla " + data.sla;
  }

  // 3. Gráfico de Barras: Distribución por Previsión
  if (chartPrevision) chartPrevision.destroy(); // Limpia el gráfico anterior si existe
  chartPrevision = new Chart(document.getElementById("graficoPrevision"), {
    type: "bar",
    data: {
      labels: data.prevision.labels,
      datasets: [{
        label: "Cantidad de personas",
        data: data.prevision.values,
        backgroundColor: "#3b82f6",
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // 4. Gráfico de Torta/Pie: Principales Problemas
  if (chartProblemas) chartProblemas.destroy(); // Limpia el gráfico anterior si existe
  chartProblemas = new Chart(document.getElementById("graficoProblemas"), {
    type: "pie",
    data: {
      labels: data.problemas.labels,
      datasets: [{
        data: data.problemas.values,
        backgroundColor: [
          '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'
        ]
      }]
    },
    options: {
      responsive: true
    }
  });

  // 5. Tabla Resumen de Calidad de Datos
  const tabla = document.getElementById("tablaCalidad");
  if (tabla) {
    tabla.innerHTML = "";
    data.calidad.forEach(item => {
      // Determinar la clase de CSS según el estado de completitud
      const statusClass = item.estado.toLowerCase() === 'verde' ? 'ok' : 'warning';
      
      tabla.innerHTML += `
        <tr>
          <td>${item.campo}</td>
          <td>${item.completitud}</td>
          <td><span class="status ${statusClass}">${item.estado}</span></td>
        </tr>
      `;
    });
  }
}

// =================================================================
// LLAMADA EN LÍNEA AL BACKEND (AJAX / FETCH)
// =================================================================
async function obtenerDatosDelServidor() {
  try {
    console.log(`Intentando conectar a: ${URL_API}`);
    const respuesta = await fetch(URL_API);
    
    if (!respuesta.ok) {
      throw new Error('La API respondió con un error de servidor.');
    }
    
    const datosReales = await respuesta.json();
    console.log('Datos recibidos con éxito de MySQL:', datosReales);
    
    // Inyectamos los datos reales traídos desde Node.js en tu función del Dashboard
    cargarDashboard(datosReales);
    
  } catch (error) {
    console.error('Error crítico al conectar con el backend:', error);
    // Mensaje amigable en el HTML por si el servidor de Node está apagado
    document.getElementById("totalEncuestados").textContent = "Error";
  }
}

// Ejecutar la consulta automáticamente al abrir la página web
obtenerDatosDelServidor();