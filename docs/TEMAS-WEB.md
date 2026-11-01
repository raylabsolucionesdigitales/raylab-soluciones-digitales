# Modos claro y oscuro de Raylab

Implementado localmente el 31 de octubre de 2026.

- `sites/raylab/dist/js/theme.js`: carga antes de las hojas de estilo, consulta el tema del dispositivo y guarda la selección en `localStorage` (`raylab-theme`). Si el almacenamiento está bloqueado, el selector sigue funcionando durante la visita. Sin una elección guardada sigue los cambios del sistema.
- `sites/raylab/dist/css/theme.css`: colores claros, contraste y selector de sol/luna. El tema oscuro conserva los estilos anteriores. No modifica la lógica de animaciones ni WhatsApp.
- Selector accesible con teclado, etiqueta del siguiente modo y estado `aria-pressed` para el modo oscuro.
- Integrado en inicio, privacidad, eliminación de datos y página 404. No modifica el panel administrativo local.
- `tools/web/package-hosting.py` incluye los dos archivos nuevos en el ZIP público.

## Verificación

`tools/web/check-theme.py` comprueba en Chrome sin interfaz: tema del sistema, selección persistente después de recargar y navegar a privacidad, ambos temas en anchos de 320/390/768/1440 píxeles, ausencia de desbordamiento horizontal, controles de cabecera sin superposición, menú móvil y controles del panel ilustrativo. Sin errores JavaScript detectados. Se revisaron capturas de inicio móvil/escritorio, servicios y contacto claros. No se probó en dispositivos físicos iPhone/Android.

## Publicación

Revisión visual del mismo día: fondo lavanda con mayor presencia, superficies blancas con sombras violetas, botones y filtros activos más intensos, titular claro más compacto y panel empresarial ilustrativo exclusivo del modo claro en la escena Odoo. Los números del panel están identificados como datos demo; no representan resultados de Raylab. El modo oscuro conserva su panel anterior.

Revisión posterior según la referencia de dos temas: `reference.css` y `reference.js` establecen una composición compartida (titular de dos líneas en escritorio, botones apilados, beneficios, panel empresarial y tarjeta flotante de tareas). Ambos modos usan la misma geometría. La escena sigue cambiando mediante los controles; los datos son ilustrativos. Servicios pasa inmediatamente después del inicio y muestra cuatro tarjetas compactas, con características conservadas en «Ver detalles». El resto del contenido permanece disponible más abajo. Se comprobó igualdad de tamaños entre temas, navegación y ausencia de desbordamiento en 320/390/768/1440 píxeles con Chrome emulado; no equivale a prueba física en iPhone.

Afinado adicional: panel completo con identidad de Raylab, navegación lateral, avatar ilustrativo, tres métricas de ejemplo, gráfico, indicador de crecimiento y tarjetas laterales de progreso y nuevos clientes. Se añadieron iconos a las pestañas y marco de teléfono a las tareas. Los datos monetarios, porcentajes y clientes del gráfico son simulados y se identifican como ejemplo dentro del panel. No constituyen resultados reales de la agencia. Se ajustaron los límites de las tarjetas flotantes para evitar desplazamiento horizontal sin recortar el documento. Las capturas locales se guardan en `output/raylab/raylab-light-1440.png`, `raylab-dark-1440.png` y sus variantes de 390 píxeles.

El cambio está en los archivos locales. Para verlo en la web pública, subir `output/raylab/raylab-web-hosting.zip` como nuevo despliegue de producción de Cloudflare Pages. En BanaHosting, extraer el contenido público dentro de la carpeta web correspondiente. No subir este ZIP al Worker del agente.

Vistas por servicio (31/10/2026): service-previews.js y service-previews.css muestran Odoo con un panel de gestion, Webs con una landing ilustrativa, Sistemas con inventario y Microapps con un cotizador. Cada escena tiene una tarjeta movil diferente. Conservan ambos temas y el cambio manual/automatico. Son ejemplos visuales, no aplicaciones funcionales. Verificacion en Chrome: cuatro escenas en tres anchos (1440, 390 y 320) y ambos temas, ademas de persistencia del tema, menu movil y paginas legales. En movil se reserva espacio debajo del panel para no cubrir sus textos.
Movimiento con mouse: reference.js aplica traslacion suavizada e inclinacion leve a los dos paneles del inicio. Sigue la direccion del cursor, regresa al centro al salir y se desactiva en pantallas de 760 px o menos y dispositivos sin mouse preciso. No altera las pestañas ni la rotacion automatica. Comprobacion: python tools/web/check-pointer.py.
01/11/2026, develop: light-contrast.css refuerza los bordes de tarjetas y formularios en el tema claro. El diagrama de integraciones usa marco violeta de 2 px, bloques con contorno de 1.5 px y conexiones de 2 px. Las reglas se limitan a data-theme=light. Comprobado con check-theme.py en ambos temas y 320/390/768/1440 px.
01/11/2026: contrast.css sustituye a light-contrast.css y se comparte entre inicio, privacidad, eliminacion de datos y 404. Unifica contornos y separadores visibles en ambos temas, incluidas FAQ, formulario, tarjetas y pie. Conserva el tratamiento especial del diagrama. Verificacion de temas y tamanos completada.
