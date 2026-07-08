# Campos Materiales - Convocatoria Estudiantil

Este proyecto es una aplicación web full-stack para gestionar las inscripciones a la exposición "Campos Materiales".

## Despliegue en Railway

Para desplegar este proyecto en Railway de manera correcta, sigue estos pasos:

1. **Crear el proyecto en Railway**:
   - Conecta tu repositorio de GitHub o usa el CLI de Railway.
   - Railway detectará automáticamente que es un proyecto Node.js.

2. **Configurar el volumen persistente (Importante para SQLite)**:
   Como la aplicación usa SQLite para almacenar los registros de inscripción, necesitas un volumen para que los datos no se borren en cada despliegue.
   - Ve a la pestaña **Variables** en Railway.
   - Añade una nueva variable: `DB_PATH` con el valor `/data/database.sqlite`
   - Ve a la pestaña **Volumes**.
   - Haz clic en **Create Volume**.
   - Configura el **Mount Path** como `/data`.

3. **Configurar las credenciales (Opcional)**:
   - Puedes configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` en las **Variables** si decides activar el envío de correos.

4. **Desplegar**:
   - Railway ejecutará `npm install`, luego `npm run build` y finalmente iniciará la aplicación con `npm start`.

## Scripts

- `npm run dev`: Inicia el servidor de desarrollo en el puerto 3000.
- `npm run build`: Compila la aplicación de React y el servidor Express.
- `npm start`: Inicia el servidor compilado para producción.
