# Importador CPS EC

Pega el contenido de Code.gs en el proyecto de Apps Script que ejecuta el importador CPS.

Ejecuta únicamente `importarArchivo_CPS_EC()`. Toda la lógica está contenida dentro de esa función.

La función busca el correo con asunto `2026 CPS EC`, descarga enlaces CSV, XLS, XLSX o ZIP, agrega solo filas nuevas de A:CN, usa CO1 para la fecha y hora de última actualización y mueve el correo a papelera únicamente si terminó correctamente.

La hoja técnica oculta se llama `_Control Importaciones CPS EC`. En la primera ejecución puede crear el índice histórico. Si el registro indica que falta continuar, ejecuta la misma función otra vez. No necesitas ejecutar una función de inicialización.

Antes de usar Excel, habilita **Servicios avanzados de Google** > **Drive API** dentro del proyecto de Apps Script.
