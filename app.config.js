/**
 * Configuración dinámica de Expo: parte de `app.json` y solo añade una cosa.
 *
 * La demo web publicada en GitHub Pages no vive en la raíz del dominio, sino bajo
 * `/gestor_empleados/`. Esa ruta base se pasa por la variable `DEMO_BASE_URL` al
 * construir la demo (`.github/workflows/demo.yml`). Sin la variable —el móvil, EAS,
 * `npm run web` en local— la configuración es exactamente la de `app.json`.
 */
module.exports = ({ config }) => {
  const rutaBase = process.env.DEMO_BASE_URL;
  if (!rutaBase) return config;
  return {
    ...config,
    experiments: { ...config.experiments, baseUrl: rutaBase },
  };
};
