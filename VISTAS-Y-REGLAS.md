# Mesa Semanal · vistas y reglas

| Vista | Qué permite | Restricciones implementadas |
|---|---|---|
| Visitante y usuario | Explorar platos y alimentos, elaborar el menú y cotizar una cesta. Con sesión, editar el perfil y publicar recetas. | Perfil invita a acceder antes de mostrar medidas u objetivos. El registro público crea cuentas personales o de tienda. Un nombre de usuario es único sin distinguir mayúsculas. Las alergias declaradas filtran las sugerencias del catálogo. |
| Tienda | Gestionar productos, ofertas, recetas propias y planes promocionales. Copiar un plato del catálogo al recetario de la tienda. | Sus productos tienen precio, presentación, localidad y foto mediante URL. Una oferta exige al menos dos productos propios distintos; cada descuento está entre 0 y 100 %. Un plan promocional de siete días usa recetas publicadas por la misma tienda. |
| Administración | Buscar cuentas, cambiar roles, suspender/reactivar, ocultar/restaurar publicaciones y consultar auditoría. | La autorización se comprueba en el servidor. La cuenta administradora no puede suspenderse ni modificar su propio rol. Suspender una cuenta invalida sus sesiones. |

## Qué significa privado

El autor guarda un ingrediente con información por 100 g, incluyendo al menos un nutriente positivo. Puede reutilizarlo en otras recetas de su cuenta. El catálogo común no recibe ese ingrediente. Si publica el desayuno, los lectores sí ven el nombre y la cantidad utilizados. La composición de la receta se calcula a partir de los gramos incluidos. El plan personal se conserva por cuenta y navegador; la cuenta y las publicaciones sí se guardan en el servidor.

## Cotizar y pagar

La cesta admite unidades de huevo de 50 g comestibles y gramos para el resto. La opción combinada compara paquetes suficientes por tienda, descontando la despensa. La fuente puntual de la avena de Metro es su catálogo público para Quaker 500 g, consultado el 23/11/2026; los demás precios son de demostración. En la realidad pueden cambiar por distrito, presentación o membresía. «Ir a pagar» abre la cotización. No transfiere dinero. El 15 % es un ejemplo aritmético de la pantalla premium, no un resultado de clientes.

## Decisiones por tomar antes de operar con comercios reales

1. **Verificación de tienda.** ¿Una tienda puede publicar apenas se registra o necesita validar razón social y local? Para una entrega académica basta identificar las tiendas demo; para venta real propondría validación previa.
2. **Precio vencido.** Definir cuánto tiempo conserva vigencia una cotización. Mostrar fecha y tienda, y pedir reconfirmación si cambia el total.
3. **Datos nutricionales.** Indicar quién cargó los valores, sus unidades y su fuente. Un valor desconocido no debe venderse como certificación. Revisar trazas en envases para decisiones sobre alergias.
4. **Combos y stock.** Definir fechas, unidades disponibles, compatibilidad entre descuentos y si el combo cambia cuando el vendedor modifica un producto.
5. **Privacidad.** Decidir por separado si interesa sincronizar perfil físico e historial entre dispositivos; moderar recetas no requiere acceso a esas medidas.
La foto de referencia de la lúcuma y su composición aproximada proceden de la [ficha de lúcuma de Plaza Vea](https://www.plazavea.com.pe/lucuma-madura-bells-x-kg-1/p).
