# Producto, arquitectura y siguientes decisiones

## Qué aprovechar de Yapa

El README de la API de la copia local de Yapa describe una cotización y el registro de pago Yape/Plin mediante un código de operación único. Esa evidencia acredita un flujo de conciliación, no demuestra por sí sola una integración bancaria automática.

| Decisión cotidiana | Qué falta en Mesa Semanal para operar |
|---|---|
| «¿Cuánto pago finalmente?» | Crear una cotización identificable que congele productos, presentaciones, tienda, fecha y total al confirmar. |
| «¿Ya pagué?» | Primera etapa: mostrar instrucciones y registrar referencia única para verificación por la tienda. Segunda: integrar pasarela con confirmación en servidor; un enlace o una captura no confirma el pago. |
| «¿Dónde está mi compra?» | Mostrar estados simples: cotizada, pendiente de confirmación, pagada o cancelada. Permitir revisar el detalle y descargar comprobante. |
| «¿Quién corrigió el precio?» | Extender la auditoría de administración a cambios de catálogo y ofrecer reclamo con número de cotización. |

Las compras vecinales y el reparto por rutas apuntan a otro problema de negocio.

## Qué arquitectura tiene hoy

Aplicación web cliente–servidor. Una interfaz JavaScript se comunica con un servidor Node que se despliega como una sola aplicación: un **monolito con módulos** de catálogo, planificación, nutrición, comunidad y cuentas. Guarda información común en archivos JSON y datos del plan en el navegador. La búsqueda depende de un servicio externo, Tavily. «Centralizado» describe dónde se administra el servicio y puede coexistir con «monolito».

### Cómo introducir extensiones genuinas

Un **microkernel** tendría un núcleo que conoce un contrato y un registro de extensiones. Ejemplo: el núcleo emite una cotización y un complemento externo exporta la lista a una app de notas. La prueba para el profesor: instalar el complemento después de compilar el núcleo, verlo aparecer, desactivarlo y seguir cotizando. Habría que implementar descubrimiento, versión del contrato, permisos y aislamiento.

Una **extensión del navegador** es otra opción independiente. Tres ejemplos para la demo: leer en voz alta los pasos, convertir una receta visible en una tarjeta imprimible o guardar en Mesa Semanal el enlace y presentación de un producto mientras visitas una tienda. La extensión puede añadir un botón desde fuera de la web. Eso por sí solo no convierte el servidor en microkernel.

Si el volumen de consultas crece, se podría separar la actualización de precios en un trabajador con cola. Solo si ese componente cuenta con despliegue e interfaz independientes tendría sentido explicar esa parte como servicio separado.

## Cinco hipótesis alternativas de suscripción

| Opción | Por qué pagaría alguien | Prueba de interés |
|---|---|---|
| A · Ahorro local | Descubrir comercios adicionales de su distrito y guardar alertas de bajada de precio para envases concretos. | Cuántos usuarios vuelven desde una alerta y confirman el precio. |
| B · Variedad | Ahorro local más colecciones de recetas revisadas, sustituciones por disponibilidad y planes estacionales. | Cuántas recetas terminan realmente en el menú. |
| C · Hogar compartido | Varios miembros editan la misma despensa, distribuyen porciones y comparten la lista entre teléfonos. | Cuántas familias invitan a una segunda persona. |
| D · Aprovechamiento | Recordatorios de caducidad y sugerencias para consumir sobrantes de la compra anterior. | Cuántos ingredientes próximos a vencer se utilizan. |
| E · Tienda profesional | Calendario de promociones, métricas agregadas de recetas guardadas y comparación de conversiones de combos. | Cuántos comercios renuevan tras medir ventas atribuibles. |

Son alternativas para validar, sin cobros habilitados. Como referencia, Eat This Much publica planificación semanal y gestión de sobrantes entre sus funciones premium. [Planes oficiales](https://www.eatthismuch.com/pricing).