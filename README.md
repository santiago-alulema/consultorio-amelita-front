# Consultorio Amelita - Frontend

Aplicación web del Consultorio Amelita con React + Vite + TypeScript + Mantine.

## Ejecutar

```bash
npm install
npm run dev
```

## Entornos

- `npm run dev` usa `.env.development` y conecta al backend local: `https://localhost:55001/api`.
- `npm run build` usa `.env.production` y conecta al servidor: `http://51.222.88.134:5001/api`.
- `npm run preview` permite revisar la compilación generada en `dist`.

El archivo `.env` queda reservado para variables comunes. Reinicia Vite después de modificar los archivos de entorno; para producción vuelve a ejecutar `npm run build`.

## Cambios de consultas

- Botón `Ver` en la tabla de consultas.
- Modal con todos los datos de la consulta.
- Desde el detalle se puede emitir una receta sin navegar manualmente.

## Cambios de recetas

- Botón `Ver` para visualizar la receta guardada.
- Botón `Imprimir` para descargar el PDF.
- Al guardar una receta aparece un modal para imprimirla inmediatamente.
- Botón `Configurar plantilla` para cambiar datos de cabecera/pie y subir una imagen PNG/JPG como plantilla de fondo del PDF.
"# consultorio-amelita-front" 
