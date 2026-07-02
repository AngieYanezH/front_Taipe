const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors()); // Permite que tu frontend se conecte al backend
app.use(express.json());

app.get('/api/dashboard', async (req, res) => {
  try {
    // 1. KPI Generales: Total, Espera, Traslado y Satisfacción Promedio
    const [kpis] = await db.query(`
      SELECT 
        COUNT(*) AS totalEncuestados,
        IFNULL(ROUND(AVG(espera_dias_aprox), 1), 0) AS esperaPromedio,
        IFNULL(ROUND(AVG(traslado_min_aprox), 1), 0) AS trasladoPromedio,
        IFNULL(ROUND(AVG(satisfaccion), 1), 0) AS satisfaccionPromedio
      FROM fact_acceso_salud
    `);

    // 2. Gráfico Distribución por Previsión
    const [previsiones] = await db.query(`
      SELECT p.tipo_prevision AS label, COUNT(*) AS value
      FROM fact_acceso_salud f
      JOIN dim_prevision p ON f.id_prevision = p.id_prevision
      GROUP BY p.tipo_prevision
    `);

    // 3. Gráfico Principales Problemas
    const [problemas] = await db.query(`
      SELECT problema_principal AS label, COUNT(*) AS value
      FROM fact_acceso_salud
      WHERE problema_principal IS NOT NULL AND problema_principal != ''
      GROUP BY problema_principal
      ORDER BY value DESC
      LIMIT 5
    `);

    // Estructurar la respuesta exactamente igual a como la espera tu app.js
    const dashboardData = {
      totalEncuestados: kpis[0].totalEncuestados || 0,
      esperaPromedio: kpis[0].esperaPromedio || 0,
      trasladoPromedio: kpis[0].trasladoPromedio || 0,
      satisfaccionPromedio: kpis[0].satisfaccionPromedio || 0,
      sla: kpis[0].satisfaccionPromedio >= 5 ? "verde" : "amarillo",
      
      prevision: {
        labels: previsiones.map(p => p.label),
        values: previsiones.map(p => p.value)
      },
      problemas: {
        labels: problemas.map(pr => pr.label),
        values: problemas.map(pr => pr.value)
      },
      // Dejamos la calidad simulada estructuralmente para que tu tabla no se rompa
      calidad: [
        { campo: "tipo_prevision", completitud: "100%", estado: "Verde" },
        { campo: "satisfaccion", completitud: "100%", estado: "Verde" },
        { campo: "tiempo_espera", completitud: "100%", estado: "Verde" },
        { campo: "traslado", completitud: "100%", estado: "Verde" }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Salud BI corriendo en http://localhost:${PORT}`);
});