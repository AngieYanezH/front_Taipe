const URL_API = '/api/dashboard';

let chartPrevisionInstance = null;
let chartProblemasInstance = null;
let chartDificultadInstance = null;
let chartExpectativasInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarDashboard();
  configurarNavegacion();
});

function cargarDashboard() {
  fetch(URL_API)
    .then(response => response.json())
    .then(data => {
      document.getElementById('total-encuestados').innerText = data.totalEncuestados;
      document.getElementById('espera-promedio').innerText = `${data.esperaPromedio} días`;
      document.getElementById('traslado-promedio').innerText = `${data.trasladoPromedio} min`;
      document.getElementById('satisfaccion-promedio').innerText = `${data.satisfaccionPromedio} / 5`;

      const ctxPrevision = document.getElementById('chartPrevision').getContext('2d');
      if (chartPrevisionInstance) { chartPrevisionInstance.destroy(); }
      chartPrevisionInstance = new Chart(ctxPrevision, {
        type: 'doughnut',
        data: {
          labels: data.prevision.labels,
          datasets: [{ data: data.prevision.values, backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });

      const ctxProblemas = document.getElementById('chartProblemas').getContext('2d');
      if (chartProblemasInstance) { chartProblemasInstance.destroy(); }
      chartProblemasInstance = new Chart(ctxProblemas, {
        type: 'bar',
        data: {
          labels: data.problemas.labels,
          datasets: [{ label: 'Cantidad de Reportes', data: data.problemas.values, backgroundColor: '#1e3a8a' }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          scales: { x: { beginAtZero: true }, y: { ticks: { callback: function(value) {
            const label = this.getLabelForValue(value);
            return label.length > 30 ? label.substr(0, 30) + '...' : label;
          }}}}
        },
        options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }
      });
    });
}

function configurarNavegacion() {
  const itemsMenu = document.querySelectorAll('.sidebar ul li');
  const vistas = {
    0: document.getElementById('dashboard-view'),
    1: document.getElementById('encuestados-view'),
    2: document.getElementById('prevision-view'),
    3: document.getElementById('atencion-view'),
    4: document.getElementById('reportes-view')
  };

  function mostrarVista(indexSelect) {
    itemsMenu.forEach((li, idx) => {
      li.classList.toggle('active', idx === indexSelect);
      if (vistas[idx]) vistas[idx].style.display = idx === indexSelect ? 'block' : 'none';
    });
  }

  // MENÚ 0: DASHBOARD
  itemsMenu[0].addEventListener('click', () => { mostrarVista(0); cargarDashboard(); });

  // MENÚ 1: LISTADO ENCUESTADOS
  itemsMenu[1].addEventListener('click', () => {
    mostrarVista(1);
    fetch('/api/encuestados').then(res => res.json()).then(data => {
      const tbody = document.getElementById('tabla-encuestados-body');
      tbody.innerHTML = '';
      data.forEach((item, i) => {
        tbody.innerHTML += `<tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td>${item.id}</td><td>${item.edad}</td><td>${item.genero}</td><td>${item.prevision}</td><td style="font-weight:bold; color:#1e3a8a;">${item.satisfaccion} / 5</td>
        </tr>`;
      });
    });
  });

  // MENÚ 2: ANÁLISIS DE PREVISIÓN
  itemsMenu[2].addEventListener('click', () => {
    mostrarVista(2);
    fetch('/api/prevision-detalle').then(res => res.json()).then(data => {
      const contenedor = document.getElementById('cards-prevision-dinamicas');
      contenedor.innerHTML = '';
      data.forEach(item => {
        contenedor.innerHTML += `
          <div class="card" style="border-left-color: #10b981;">
            <h3 style="color:#1e3a8a;">${item.prevision}</h3>
            <div class="value" style="font-size:24px; margin: 10px 0;">${item.total_usuarios} Respuestas</div>
            <p style="font-size:14px; color:#475569;">Satisfacción Promedio: <b>${item.satisfaccion_promedio} / 5</b></p>
            <p style="font-size:14px; color:#475569;">Espera Promedio: <b>${item.espera_promedio} días</b></p>
          </div>`;
      });
    });
  });

  // MENÚ 3: CALIDAD ATENCIÓN
  itemsMenu[3].addEventListener('click', () => {
    mostrarVista(3);
    fetch('/api/atencion-detalle').then(res => res.json()).then(data => {
      document.getElementById('kpi-atencion-critica').innerText = `${data.pctDificultad}%`;

      const ctxDif = document.getElementById('chartDificultadHora').getContext('2d');
      if (chartDificultadInstance) { chartDificultadInstance.destroy(); }
      chartDificultadInstance = new Chart(ctxDif, {
        type: 'pie', data: { labels: data.dificultades.labels, datasets: [{ data: data.dificultades.values, backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'] }] }
      });

      const ctxExp = document.getElementById('chartExpectativas').getContext('2d');
      if (chartExpectativasInstance) { chartExpectativasInstance.destroy(); }
      chartExpectativasInstance = new Chart(ctxExp, {
        type: 'bar', data: { labels: data.expectativas.labels, datasets: [{ data: data.expectativas.values, backgroundColor: '#8b5cf6' }] },
        options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
      });
    });
  });

  // MENÚ 4: REPORTES Y AUDITORÍA
  itemsMenu[4].addEventListener('click', () => {
    mostrarVista(4);
    fetch('/api/reportes-logs').then(res => res.json()).then(data => {
      const tbody = document.getElementById('tabla-logs-body');
      tbody.innerHTML = '';
      data.forEach((item, i) => {
        const dateStr = new Date(item.fecha_ejecucion).toLocaleString();
        tbody.innerHTML += `<tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td><b>#${item.id_log}</b></td>
          <td>${dateStr}</td>
          <td>${item.registros_processed} filas</td>
          <td style="color:#10b981; font-weight:bold;">${item.estado}</td>
          <td style="font-style:italic; color:#64748b;">${item.mensaje}</td>
          <td>${item.duracion_segundos}s</td>
        </tr>`;
      });
    });
  });
}