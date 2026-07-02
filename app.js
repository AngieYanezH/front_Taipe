const datosMock = {
  totalEncuestados: 35,
  esperaPromedio: 18,
  trasladoPromedio: 25,
  satisfaccionPromedio: 6.8,
  sla: "verde",

  prevision: {
    labels: ["FONASA A", "FONASA B", "FONASA C", "FONASA D", "ISAPRE"],
    values: [8, 10, 7, 6, 4]
  },

  problemas: {
    labels: ["Tiempo de espera", "Falta de especialistas", "Costos", "Lejanía", "Mala atención"],
    values: [14, 9, 5, 4, 3]
  },

  calidad: [
    { campo: "tipo_prevision", completitud: "100%", estado: "Verde" },
    { campo: "satisfaccion", completitud: "97%", estado: "Verde" },
    { campo: "tiempo_espera", completitud: "94%", estado: "Amarillo" },
    { campo: "traslado", completitud: "97%", estado: "Verde" }
  ]
};

function cargarDashboard(data) {
  document.getElementById("totalEncuestados").textContent = data.totalEncuestados;
  document.getElementById("esperaPromedio").textContent = data.esperaPromedio + " días";
  document.getElementById("trasladoPromedio").textContent = data.trasladoPromedio + " min";
  document.getElementById("satisfaccionPromedio").textContent = data.satisfaccionPromedio + "/10";

  const estadoSLA = document.getElementById("estadoSLA");
  estadoSLA.textContent = "SLA: " + data.sla.toUpperCase();
  estadoSLA.className = "sla " + data.sla;

  new Chart(document.getElementById("graficoPrevision"), {
    type: "bar",
    data: {
      labels: data.prevision.labels,
      datasets: [{
        label: "Cantidad de personas",
        data: data.prevision.values
      }]
    }
  });

  new Chart(document.getElementById("graficoProblemas"), {
    type: "pie",
    data: {
      labels: data.problemas.labels,
      datasets: [{
        data: data.problemas.values
      }]
    }
  });

  const tabla = document.getElementById("tablaCalidad");
  tabla.innerHTML = "";

  data.calidad.forEach(item => {
    tabla.innerHTML += `
      <tr>
        <td>${item.campo}</td>
        <td>${item.completitud}</td>
        <td>${item.estado}</td>
      </tr>
    `;
  });
}

cargarDashboard(datosMock);