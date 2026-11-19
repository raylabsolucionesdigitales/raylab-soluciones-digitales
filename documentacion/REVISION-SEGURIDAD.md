# Raylab: revisión de seguridad y rendimiento

Fecha: 22 de octubre de 2026. Alcance: copia local de la web y ZIP preparado para Cloudflare Pages. No es una certificación, una auditoría externa exhaustiva ni una prueba de penetración del sitio en internet.

## Resultado

La web pública es estática y no contiene un backend, base de datos, cuentas de clientes ni pasarela de pagos. El formulario abre un enlace de WhatsApp con los datos preparados y el visitante decide enviarlos. El panel de servicios es un editor local; no ofrece autenticación ni permisos para modificar un servidor remoto.

Se revisaron las rutas de datos de servicios, importación/exportación del catálogo, microapp de tareas, enlaces de WhatsApp, dependencias externas, animaciones y contenido del paquete público. No se identificó una ruta de ejecución de código desde los textos de usuario en las funciones revisadas. Este resultado no garantiza ausencia de vulnerabilidades.

## Hallazgos y correcciones

| Hallazgo | Estado | Cambio |
| --- | --- | --- |
| Faltaba una política de seguridad HTTP específica para Pages | Corregido en el paquete; pendiente de validar en el dominio real | Nuevo `_headers` con CSP, protección contra incrustación en marcos, nosniff, no-referrer, restricciones de capacidades y HSTS. |
| El paquete excluía el administrador pero podía incluir otros archivos añadidos accidentalmente | Corregido | Lista cerrada de archivos públicos. Solo esos archivos se empaquetan; no incluye panel local, repositorio, respaldos ni informes. |
| Un catálogo podía acumular imágenes grandes y degradar la carga | Mitigado | Límite por imagen, límite agregado de 3 millones de caracteres de imágenes en el catálogo y presupuesto de 5 MiB para el paquete sin comprimir. Las imágenes están embebidas en el catálogo: un catálogo muy grande sigue siendo más lento y requeriría migrar a archivos de imagen separados. |

## Pruebas realizadas

- Texto con etiquetas HTML y atributos de eventos: tratado como texto en la microapp y vistas previas, sin crear elementos ejecutables.
- Validación del catálogo: rechazo de imágenes SVG, URLs JavaScript, identificadores duplicados, títulos vacíos e imágenes fuera de los límites.
- Exportación: escape de contenido que podría cerrar una etiqueta script y comprobación del ZIP exportado con CRC válido.
- WhatsApp: número internacional fijo, codificación de acentos y saltos de línea, y control de campos vacíos.
- Navegador con HTTP y CSP activa en un servidor local: bloqueo de script incrustado y de envío nativo de formulario a un destino no previsto. La navegación legítima a WhatsApp se verificó interceptando y cancelando la solicitud antes de contactar con ese servicio.
- Con CSP activa siguieron funcionando las tarjetas, filtros, escenas de portada y la microapp.
- Vista móvil de 390 px con CPU ralentizada cuatro veces mediante herramientas del navegador: sin excepciones JavaScript antes de las pruebas intencionadas ni desbordamiento horizontal. Es una simulación, no una medición en un teléfono físico.
- JavaScript público actual: 29 141 bytes sin comprimir, excluido el editor local. No se incluyeron imágenes de catálogo adicionales en esa medición.

## Límites de la política

La CSP restringe los scripts al propio origen y no permite scripts incrustados ni eval. Admite estilos en línea porque el diseño y las animaciones usan atributos y propiedades CSS dinámicas. Las fuentes de Google permanecen como dependencia externa autorizada; no se cargan librerías JavaScript de terceros.

El archivo `_headers` se interpreta al desplegar en Cloudflare Pages. Abrir `index.html` con file:// no aplica estas cabeceras; otro hosting necesita su configuración equivalente. CSP y otras cabeceras complementan la validación y no hacen imposible un ataque.

## Escalabilidad: qué se puede afirmar

La arquitectura permite servir archivos estáticos desde una CDN sin abrir una conexión a una base de datos por visitante. La cantidad de nodos de las partículas y las tareas de la demo están acotadas; los bucles de animación se suspenden fuera de vista o al pausar el movimiento. Las consultas a WhatsApp no se procesan en un servidor de Raylab.

No se ejecutó una prueba de carga real ni se determinó un máximo de usuarios simultáneos. La capacidad final depende del plan y límites del proveedor, la red y el tamaño del contenido. Las fuentes externas y las imágenes grandes también afectan la experiencia.

## Pendiente antes de dar producción por verificada

1. Subir el ZIP actualizado y comprobar las cabeceras, HTTPS y redirecciones en la URL final de Cloudflare.
2. Revisar la seguridad de la cuenta de Cloudflare: autenticación multifactor, permisos de colaboradores y protección de credenciales. No se ha inspeccionado esa cuenta.
3. Medir la carga desde la URL publicada y con el catálogo definitivo. No hay cifras verificadas de concurrencia ni disponibilidad.
4. Si se incorporan login, base de datos, pagos o administración remota, evaluar esa arquitectura por separado: necesitan validación en servidor, autenticación, permisos y controles propios.

Fuentes técnicas: https://developers.cloudflare.com/pages/configuration/headers/ y https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
