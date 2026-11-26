# Mesa Jack

Mesa Jack organiza desayunos semanales y calcula qué ingredientes faltan para prepararlos. Permite comparar el desembolso por envases completos, publicar recetas en Comunidad y hacer pedidos a tiendas locales. Los pagos del prototipo se validan manualmente.

[Informe del proyecto](docs/Informe-Mesa-Jack.docx) · [Presentación PowerPoint](docs/Mesa-Jack-Premium.pptx) · [Guion de 20 minutos](docs/Guion-Mesa-Jack.md) · [Presentación para abrir localmente en el navegador](docs/Mesa-Jack-revision-final.html)

## Ejecutar en local

Con Docker Desktop activo y Docker Compose 2.24.4 o posterior, ejecuta estos comandos desde PowerShell. El ejemplo parte de una instalación nueva.

~~~powershell
git clone https://github.com/Aarooness/mesa-semanal-jack.git
cd mesa-semanal-jack
Copy-Item .env.example .env
docker compose -f compose.local.yaml up -d --build --wait
~~~

Abre [Mesa Jack en tu equipo](http://127.0.0.1:8734/#inicio). Para actualizar una instalación existente, conserva tu archivo `.env`, descarga los cambios con `git pull` y repite el comando de Compose. Los datos de la instalación Docker se guardan en `data/`. Para detenerla usa `docker compose -f compose.local.yaml stop`.

También puedes iniciar la aplicación con Node.js 22 o posterior mediante `node server.mjs`. Este modo guarda sus archivos de datos en la carpeta del proyecto salvo que configures `DATA_DIR`. En una instalación nueva con Node, `node create-admin.mjs` crea el administrador inicial y escribe sus credenciales en el archivo privado `.admin-inicial.txt`. Con el servidor activo, los scripts `demo-aurora.mjs` y `demo-mercado.mjs` cargan ejemplos de tiendas. Los datos personales de la instalación original se excluyen del repositorio.

## Qué se puede probar

| Apartado | Recorrido |
| --- | --- |
| Mi menú | Partir de una semana sugerida, reemplazar o mover desayunos, ajustar porciones y consultar la meta nutricional. |
| Comunidad | Publicar una preparación con foto, ingredientes y pasos. Abrir una ficha y consultar el perfil de su autor. |
| Compras | Reunir cantidades, descontar despensa y reservas, y comparar una cadena o la opción combinada. Los ingredientes sin precio aparecen atenuados. |
| Lista Premium | Revisar en la misma pantalla ofertas para los ingredientes pendientes. Priorizar las que mejoran el precio por gramo y el importe por envases completos. El resto conserva la lista base. |
| Tiendas y pedidos | Una cuenta gratuita puede comprar directamente en cada tienda. El comercio gestiona su catálogo y la entrega. Administración valida o rechaza el pago de demostración. |
| Extensiones | Desde `chrome://extensions`, activar el modo desarrollador y cargar por separado las carpetas `extensiones/leer-receta` e `extensiones/imprimir-receta`. Abrir una receta para escuchar los pasos o imprimir la ficha. |

## Cómo se organiza el código

- `public/` contiene las vistas y los recursos del navegador. El plan personal se guarda por cuenta en el almacenamiento local de ese navegador.
- `server.mjs` sirve la interfaz y recibe las solicitudes HTTP. `platform-api.mjs` gestiona cuentas, catálogos, suscripciones, moderación y pedidos. El servidor guarda la información compartida en archivos JSON.
- `public/premium.js` calcula las ofertas locales para la lista seleccionada. Las cotizaciones usan precios de catálogo y excluyen el transporte.
- `shopping-search.mjs` consulta fuentes externas cuando se configura `TAVILY_API_KEY` en `.env`. La comparación de los catálogos funciona independientemente de esa búsqueda.
- `Dockerfile`, `compose.yaml` y `compose.local.yaml` definen la imagen, el volumen persistente y la configuración local. El despliegue de demostración utiliza AWS EC2.

Para ejecutar las pruebas de la API desde la raíz del proyecto, usa `node --test platform.test.mjs`. Para revisar los permisos y decisiones de diseño, consulta los [casos de uso](CASOS-DE-USO.md), las [vistas y reglas](VISTAS-Y-REGLAS.md) y la [descripción de arquitectura](PRODUCTO-Y-ARQUITECTURA.md).
