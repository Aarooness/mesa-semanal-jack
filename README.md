# Mesa Semanal

Prototipo local de planificación de desayunos. Requiere Node.js 22 o posterior. Desde esta carpeta ejecuta `node server.mjs` y abre http://127.0.0.1:8734. El servidor escucha solo en la interfaz local. No se necesitan paquetes npm.

Tres plantillas predefinidas permiten revisar la semana antes de aplicarla. También puedes crear un menú manual o usar una plantilla de la comunidad local.

## Alcance de los datos

- 27 ingredientes y cuatro comercios con cotizaciones de demostración, salvo la observación identificada de avena Quaker en Metro. Fotos de ingredientes de TheMealDB, almacenadas localmente en `public/fotos`. La quinua se pesa en seco. El peso de fruta corresponde a la porción comestible estimada.
- Los planes y compras personales se guardan en el almacenamiento del navegador, en el mismo origen. Las plantillas compartidas se guardan en `comunidad.json` en esta instalación. El planificador permite explorar como visitante. Al entrar a una cuenta, el navegador usa un espacio personal separado.
- Cada compra confirmada conserva una copia independiente del plan y su inventario. La despensa se declara en cada planificación; registrar un desayuno descuenta existencias del plan confirmado correspondiente.
- Un mes de demostración son 30 días desde un lunes. Los siete días forman la plantilla; el día 29 y el 30 corresponden a lunes y martes.
- El costo de la porción usa gramos planificados y precio por gramo. En caja se cobran paquetes completos después de descontar la despensa. Los totales parciales identifican faltantes. Los resultados comparan el consumo registrado con la referencia de kcal indicada por el usuario.

El encargo para rediseñar únicamente las vistas está en `PROMPT-VISUAL.md`.

## Perfil, plan y recetas

Desde la portada pública se accede al planificador y al perfil editable de seis pasos. La semana utiliza treinta preparaciones de elaboración propia, alergias declaradas, categorías preferidas y proximidad a las kcal configuradas. Los datos físicos y el objetivo de peso son descriptivos. Las metas numéricas iniciales son ilustrativas. Los ingredientes y la compra escalan por hogar; la nutrición y el consumo registrado son individuales. Desde una ficha se puede comparar la receta, la semana o el periodo, elegir la distribución de menor desembolso por producto entre las dos tiendas simuladas y abrir búsquedas externas en Metro/Wong. La comparación excluye transporte.

## Cuentas, comunidad y tiendas

En /#cuenta puedes registrar un usuario único personal o de tienda. /#comunidad permite leer recetas y planes sin sesión. La tienda publica sus productos, recetas y planes de siete días en /#tienda. /#administracion permite consultar usuarios, gestionar roles, suspender o reactivar cuentas y moderar publicaciones. Las credenciales iniciales de esta instalación están en el archivo privado .admin-inicial.txt. Los datos compartidos se conservan en plataforma.json.

La búsqueda en /#buscar requiere sesión. El servidor lee TAVILY_API_KEY de .env en la carpeta del proyecto. El filtro de comercios independientes excluye los dominios de Wong, Metro y Plaza Vea. Las fuentes externas no modifican automáticamente los precios del planificador.

Los cambios de experiencia, las reglas por rol y las propuestas de evolución están en VISTAS-Y-REGLAS.md y PRODUCTO-Y-ARQUITECTURA.md. Las tres cuentas de prueba se entregan en .cuentas-demo.txt, fuera del directorio público.

## Roles y entrega

[Casos de uso, diagramas, restricciones y recorrido de prueba](CASOS-DE-USO.md).

Para reproducir los dos productos de Mercado Aurora en una instalación nueva, inicia el servidor y ejecuta `node demo-aurora.mjs` en otra terminal. Crea una tienda de demostración con contraseña aleatoria local y publica los ejemplos en Comunidad.
