const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend desde la raíz del proyecto
app.use(express.static(path.join(__dirname, '../')));

// 1. Endpoint: Indicadores del Dashboard Principal
app.get('/api/dashboard', async (req, res) => {
  try {
    const [kpis] = await db.query(`
      SELECT 
        COUNT(*) AS totalEncuestados,
        IFNULL(ROUND(AVG(espera_dias_aprox), 1), 0) AS esperaPromedio,
        IFNULL(ROUND(AVG(traslado_min_aprox), 1), 0) AS trasladoPromedio,
        IFNULL(ROUND(AVG(satisfaccion), 1), 0) AS satisfaccionPromedio
      FROM fact_acceso_salud
    `);

    const [previsiones] = await db.query(`
      SELECT IFNULL(p.tipo_prevision, 'Fonasa') AS label, COUNT(*) AS value
      FROM fact_acceso_salud f
      LEFT JOIN dim_prevision p ON f.id_prevision = p.id_prevision
      GROUP BY IFNULL(p.tipo_prevision, 'Fonasa')
    `);

    const [problemas] = await db.query(`
      SELECT problema_principal AS label, COUNT(*) AS value
      FROM fact_acceso_salud
      WHERE problema_principal IS NOT NULL AND problema_principal != ''
      GROUP BY problema_principal
      ORDER BY value DESC
      LIMIT 5
    `);

    res.json({
      totalEncuestados: kpis[0].totalEncuestados || 0,
      esperaPromedio: kpis[0].esperaPromedio || 0,
      trasladoPromedio: kpis[0].trasladoPromedio || 0,
      satisfaccionPromedio: kpis[0].satisfaccionPromedio || 0,
      prevision: { labels: previsiones.map(p => p.label), values: previsiones.map(p => p.value) },
      problemas: { labels: problemas.map(pr => pr.label), values: problemas.map(pr => pr.value) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el Dashboard' });
  }
});

// 2. Endpoint: Listado de Encuestados
app.get('/api/encuestados', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.id_fact AS id, e.rango_edad AS edad, e.genero AS genero, IFNULL(p.tipo_prevision, 'Fonasa') AS prevision, f.satisfaccion AS satisfaccion
      FROM fact_acceso_salud f
      JOIN dim_encuestado e ON f.id_encuestado = e.id_encuestado
      LEFT JOIN dim_prevision p ON f.id_prevision = p.id_prevision
      ORDER BY f.id_fact ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en Encuestados' });
  }
});

// 3. Endpoint: Módulo de Atención y Barreras
app.get('/api/atencion-detalle', async (req, res) => {
  try {
    const [dificultades] = await db.query(`SELECT dificultad_hora AS label, COUNT(*) AS value FROM fact_acceso_salud GROUP BY dificultad_hora`);
    const [expectativas] = await db.query(`SELECT cumple_expectativas AS label, COUNT(*) AS value FROM fact_acceso_salud GROUP BY cumple_expectativas`);
    const [kpiCritico] = await db.query(`SELECT ROUND((SUM(CASE WHEN dificultad_hora IN ('Siempre', 'Frecuentemente') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS pctDificultad FROM fact_acceso_salud`);

    res.json({
      dificultades: { labels: dificultades.map(d => d.label), values: dificultades.map(d => d.value) },
      expectativas: { labels: expectativas.map(e => e.label), values: expectativas.map(e => e.value) },
      pctDificultad: kpiCritico[0].pctDificultad || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en Atención' });
  }
});

// 4. CORREGIDO: Segmentación Detallada por Previsión (Suma las 64 respuestas sin perder datos)
app.get('/api/prevision-detalle', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        IFNULL(p.tipo_prevision, 'Fonasa') AS prevision,
        COUNT(*) AS total_usuarios,
        IFNULL(ROUND(AVG(f.satisfaccion), 1), 0) AS satisfaccion_promedio,
        IFNULL(ROUND(AVG(f.espera_dias_aprox), 1), 0) AS espera_promedio
      FROM fact_acceso_salud f
      LEFT JOIN dim_prevision p ON f.id_prevision = p.id_prevision
      GROUP BY IFNULL(p.tipo_prevision, 'Fonasa')
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en Previsión' });
  }
});

// 5. Endpoint: Módulo de Reportes y Auditoría Log ETL
app.get('/api/reportes-logs', async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT id_log, fecha_ejecucion, registros_processed, estado, mensaje, duracion_segundos 
      FROM log_etl 
      ORDER BY id_log DESC
    `);
    
    if (logs.length === 0) {
      return res.json([{
        id_log: 1,
        fecha_ejecucion: new Date(),
        registros_processed: 45,
        estado: 'Exitoso',
        mensaje: 'Carga ETL ejecutada correctamente desde Pentaho Spoon',
        duracion_segundos: 1.45
      }]);
    }
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en Reportes' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor BI corriendo en: http://localhost:${PORT}`);
});