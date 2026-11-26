# Mesa Jack · Guion para 20 minutos

18 diapositivas. Ritmo de ensayo aproximado de 115 palabras por minuto. Los 20 minutos incluyen 1 min 50 s para señalar las vistas y dejar correr los videos. Las indicaciones en cursiva son para el expositor. Las preguntas del público van después del cierre.

## 1. Mesa Jack · 0:00–0:50

Buenos días, soy Aaron Naif Gonzales. Les propongo pensar en el desayuno del lunes. Digamos que ya elegí yogur con fresas. Si el miércoles quiero preparar lo mismo para dos personas, ¿cuánto yogur tendría que comprar? Y si ya tengo medio envase en casa, ¿seguiría siendo buena idea comprar la promoción de la tienda? Esas fueron las preguntas que dieron origen a Mesa Jack. Hoy quiero mostrarles cómo se pasa de elegir un desayuno a preparar una compra, y qué cambia cuando participan una tienda y un administrador.

*En pantalla (5 s incluidos): Deja la portada unos segundos antes de empezar.*

## 2. ¿Por qué probarlo en Perú? · 0:50–2:15

Antes de mostrarles la app, quiero contarles por qué elegí este problema. A la izquierda aparecen dos cifras del programa Actívate con el IPD. En 2023 reportó más de 120 mil beneficiarios y en 2024, 300 727. Eso nos habla del alcance de ese programa. Para decidir cómo diseñar la plataforma, me sirvió más el siguiente dato. Según el INEI, en el último trimestre de 2024, casi nueve de cada diez personas que usaron internet en Perú accedieron desde el celular. Por eso la demo que van a ver está pensada para una pantalla pequeña.

Hay otro dato que pesó en el diseño. La evaluación de seguridad alimentaria de 2023 encontró inseguridad alimentaria en el 51,6 % de los hogares. Si voy a sugerir desayunos, también me interesa que la persona pueda ver cuánto dinero tendría que desembolsar para prepararlos. Queda por probar si esta herramienta concreta le resulta útil.

*En pantalla (6 s incluidos): Señala primero las barras del IPD. Haz una pausa antes de pasar a los porcentajes.*

## 3. ¿Qué pasa después de elegir un desayuno? · 2:15–3:35

Sigamos el dibujo con un ejemplo. Una persona publica en Comunidad su combinación de yogur, avena y fresas. Yo encuentro su receta, veo cómo se prepara y decido agregarla a mi semana. Si elijo repetirla dos días, la plataforma reúne las cantidades de ambos desayunos. Después descuenta lo que marqué en mi despensa y lo que ya reservé. Así obtengo una lista de lo que todavía me falta.

Ahora miren el dibujo de abajo. Desde el otro lado, una tienda puede ofrecer las fresas como ingrediente o publicar un desayuno preparado. Yo puedo descubrirla desde su perfil y revisar qué vende. El recuadro de la derecha muestra el paso adicional del suscriptor. Si una tienda mejora el precio de las fresas, puedo aprovechar esa oferta y mantener el resto de mi lista tal como estaba.

*En pantalla (7 s incluidos): Recorre con el puntero la fila superior y después el dibujo de la tienda.*

## 4. Del plan a la compra · 3:35–4:30

Para diseñar el menú tomé como referencia dos formas de resolver el problema. Eat This Much ayuda a decidir qué comer y reúne ingredientes en una lista. Fitia pone el énfasis en registrar la alimentación y seguir objetivos nutricionales. En Mesa Jack quise trabajar la decisión que viene después. Por ejemplo, mi receta puede necesitar quince gramos de almendras, pero en la tienda voy a pagar por una bolsa entera. Si ya tengo almendras en casa o las voy a usar varias veces esa semana, la compra que me conviene cambia. Esa diferencia entre porción y envase es importante para entender la demo.

*En pantalla (3 s incluidos): Señala las dos referencias y termina en la compra local.*

## 5. Un servidor, tres perspectivas · 4:30–5:35

La aplicación tiene tres roles. El usuario organiza desayunos y hace pedidos. La tienda publica su catálogo, edita precios y atiende pedidos. El administrador revisa pagos y publicaciones. Les pongo un ejemplo de por qué importa esta separación. El comprador puede indicar que pagó por Yape. Para que el pedido figure como pagado, hace falta que administración revise el registro y lo confirme. Técnicamente, las tres vistas se apoyan en un mismo servidor Node.js organizado por módulos. El navegador se ocupa de interacciones como ajustar una porción. El servidor comprueba los permisos para los cambios que afectan a otras personas. Así, la tienda y el comprador pueden consultar el estado del mismo pedido.

*En pantalla (4 s incluidos): Sigue las flechas desde el navegador hasta los datos.*

## 6. Del celular a los datos · 5:35–6:35

Aquí se ve dónde vive cada parte. Desde el celular envío una solicitud a la aplicación que corre en una instancia de AWS. Docker me permite desplegar la misma versión que probé en mi equipo. Los datos compartidos, como los catálogos y los pedidos, se conservan en un volumen. Esto tuvo una utilidad bastante concreta en el proyecto. Para publicar el último cambio de Compras pude reemplazar el contenedor y conservar las tiendas que ya existían. También hay una consulta externa con Tavily cuando quiero buscar fuentes en la web. En la comparación Premium que veremos luego se usan los precios y envases publicados en los catálogos.

*En pantalla (4 s incluidos): Indica el contenedor y luego el volumen.*

## 7. Del plan al cierre del pedido · 6:35–7:25

Antes de entrar a la demostración, conviene separar dos cosas que el usuario puede querer hacer. Si voy a cocinar, compro los ingredientes que me faltan. Si esa mañana tengo poco tiempo, puedo pedir el desayuno ya preparado. En ambos casos puedo revisar la canasta antes de enviar el pedido. Ese momento es importante porque todavía puedo corregir cantidades. Una vez que registro el pago de demostración, el pedido pasa a revisión. Luego la tienda puede indicar la entrega y el usuario puede confirmar que lo recibió o registrar un reclamo.

*En pantalla (3 s incluidos): Marca en el esquema el punto en que se pasa de canasta a pedido.*

## 8. Del menú semanal a la tienda · 7:25–8:30

Miren el desayuno que aparece primero. Cuando abro Mi menú ya tengo una propuesta para la semana y puedo empezar desde ahí. Voy a cambiar un desayuno que ese día no me provoca. Lo interesante es que conservo los demás días y puedo abrir la ficha del reemplazo para ver qué lleva. También puedo mover un plato entre días si solo quiero reorganizar la semana. Ahora aparece la tienda. Lo que ven ahí es su catálogo. Entrar a verlo sigue siendo una decisión aparte. Cambiar el desayuno actualiza lo que necesito para mi plan y todavía me deja decidir dónde voy a comprar.

*En pantalla (12 s incluidos): Reproduce el video horizontal. Deja ver el desayuno antes y después del cambio.*

## 9. ¿Dónde compro lo que falta? · 8:30–9:30

En Compras empiezo por elegir qué quiero cotizar. Puedo revisar lo pendiente para un desayuno o ampliar la lista a la semana. Si dos preparaciones llevan el mismo ingrediente, lo encuentro reunido en una fila. A partir de ahí puedo tomar una decisión bastante práctica. Si de todas maneras voy a Wong, elijo su lista y veo qué parte de mi compra cubre. Si prefiero repartir la compra, elijo la combinada. Cuando una tienda cubre solo parte de la lista, los ingredientes faltantes aparecen atenuados. Así puedo distinguir entre algo que ya tengo en la despensa y algo que todavía necesito, pero que esa tienda no ofrece.

*En pantalla (6 s incluidos): Señala un ingrediente, su cantidad pendiente y el total de envases.*

## 10. Un desayuno, tres perspectivas · 9:30–11:05

Ahora sigamos un solo pedido; en cada celular cambia la persona que lo está viendo. En el primero entro como comprador, elijo un desayuno, reviso qué quedó en la canasta y registro el medio de pago. Fíjense en el estado que aparece después de enviarlo. Eso es lo que ahora va a revisar el administrador.

En la segunda pantalla, administración encuentra el pedido y confirma el registro. También podría rechazarlo y dejar un motivo. En ese caso, el comprador puede ver qué ocurrió desde Pedidos e intentar nuevamente.

En el tercer celular, la tienda ya ve el pedido pagado y puede escoger una franja de entrega. Esos horarios se organizan en intervalos de tres horas. Si mañana el comprador pregunta qué pasó con su desayuno, hay un estado concreto que consultar. En esta demostración la confirmación del pago es manual. El video muestra quién registra, quién valida y quién entrega.

*En pantalla (18 s incluidos): Reproduce los tres clips en orden. Detente al aparecer la confirmación del administrador y la franja de entrega.*

## 11. De la receta a la ficha pública · 11:05–12:05

Veamos ahora el recorrido de una tienda que quiere darse a conocer. Puede publicar una receta con su foto, ingredientes y preparación. Una persona que la encuentre en Comunidad puede abrirla, revisar las cantidades y ver la distribución de macronutrientes. Desde el nombre de la tienda puede entrar a su perfil y explorar qué ofrece. Por ejemplo, una tienda puede enseñar cómo prepara un parfait de fresa y, además, ofrecer las fresas por envase. También un usuario puede publicar su propia combinación de desayuno. En ambos casos queda visible quién la creó, de modo que se puede volver al mismo autor si gustó la receta.

*En pantalla (5 s incluidos): Recorre publicación, Comunidad y ficha de detalle.*

## 12. ¿Por qué pagaría alguien por comparar? · 12:05–13:00

Como usuario gratuito ya puedo organizar mi menú, publicar desayunos y comprar en una tienda. Entonces, ¿por qué pagaría nueve soles al mes? La hipótesis es que, si compro ingredientes todas las semanas, comparar en una sola pantalla puede ahorrarme tiempo y ayudarme a elegir mejor los envases. Para evaluarlo, le daría a una persona la misma lista en dos ocasiones. Una vez buscaría tienda por tienda y otra usaría la comparación. Mediría los minutos y el importe final, y después observaría si vuelve la semana siguiente por iniciativa propia. Eso me diría bastante más que preguntarle si le gustó el diseño.

*En pantalla (3 s incluidos): Deja visible el precio mensual al explicar la hipótesis.*

## 13. Qué cambia al suscribirse · 13:00–13:55

Pensemos en dos personas que necesitan lo mismo. Con una cuenta gratuita puedo entrar al perfil de Mercado Aurora, revisar cuánto cuesta cada envase y añadir las unidades a mi canasta. Con una suscripción activa puedo empezar directamente en Compras. Mesa Jack toma mi lista pendiente, revisa las ofertas de tiendas locales y me muestra qué ingredientes conviene priorizar. Si quiero seguir comprando todo lo demás en Vivanda, puedo hacerlo. La otra ventaja es recibir avisos de rebajas en tiendas que ya visité o donde compré. Esas dos funciones pueden parecer muy parecidas. En la siguiente pantalla se ve cuándo usar cada una.

*En pantalla (3 s incluidos): Señala las acciones disponibles para cada tipo de cuenta.*

## 14. Cómo se ve el beneficio en la app · 13:55–14:50

Supongamos que ayer visité una tienda para ver fresas. Hoy la tienda baja su precio. La alerta me avisa de ese cambio y con la flecha puedo abrir el perfil para revisar la oferta. Eso me puede interesar incluso si esta semana no tengo fresas en el menú. La Lista Premium responde a otra pregunta mucho más puntual. Si hoy solo necesito almendras y plátano, quiero ver cuál de esos dos ingredientes me saldría más barato en una tienda local. Para eso entro a Compras. Ahora vamos a mirar qué ocurre con esas almendras desde la comparación hasta la canasta.

*En pantalla (5 s incluidos): Señala la alerta y la flecha que abre la tienda.*

## 15. De la rebaja al envase · 14:50–16:35

Este es el ejemplo que mejor explica la suscripción. Mi lista tiene dos ingredientes. Necesito ciento cincuenta gramos de almendras y también necesito plátano. En la primera pantalla, como usuario gratuito, puedo ir a la tienda y elegir los envases por mi cuenta.

En la segunda, como suscriptor, ya veo las almendras que conviene priorizar. El sistema comprueba dos cosas. El precio por gramo debe ser mejor y los envases necesarios también deben costar menos en total. Una bolsa enorme podría ser barata por gramo y aun así obligarme a gastar más de lo que pensaba esta semana. Por eso se revisan ambas cantidades.

Ahora marco Priorizar. Las almendras pasan a mi Lista Premium y el plátano sigue en la lista de Wong. Todavía no he añadido nada a la canasta. Como la tienda vende bolsas de cien gramos, para cubrir ciento cincuenta necesito dos. Al pulsar Añadir dos envases, en el tercer celular aparecen doscientos gramos en la canasta. Esos gramos se descuentan de lo pendiente y todavía puedo cambiar la cantidad antes de enviar un pedido.

*En pantalla (12 s incluidos): Deja unos segundos en cada celular. Señala «Priorizar», «Añadir 2 envases» y la cantidad final en la canasta.*

## 16. Tres pantallas para la demostración · 16:35–17:30

Si alguien quisiera probar la aplicación por primera vez, le pediría hacer este recorrido sin ayuda. Primero, cambiar un desayuno de su semana. Segundo, encontrar en Compras cuál de los ingredientes le falta. Tercero, entrar a la tienda y decirme cuántos envases necesita y cuánto pagaría. Es una prueba sencilla, pero me permite detectar problemas distintos. Si se pierde al cambiar el plato, tengo que revisar el menú. Si llega a la tienda y confunde los gramos de la receta con el peso del envase, tengo que revisar cómo se muestra la comparación.

*En pantalla (4 s incluidos): Pasa el puntero de Mi menú a Compras y termina en el perfil de la tienda.*

## 17. Dos extensiones alrededor de Mesa Jack · 17:30–18:25

Las dos extensiones nacen de algo que pasa en la cocina. Una vez que ya elegí la receta, quizá tengo las manos ocupadas o prefiero dejar el celular a un lado. La primera extensión añade un botón para escuchar la preparación en voz alta. Lo puedo volver a pulsar para detenerla. La segunda toma los ingredientes y los pasos de la receta abierta y prepara una tarjeta para imprimir o guardar como PDF. Como muestra el dibujo, ambas trabajan en el navegador y se instalan por separado. Una persona puede usar solo la lectura y otra elegir solo la impresión.

*En pantalla (4 s incluidos): Señala el monolito y luego los dos complementos.*

## 18. ¿Cuánto costaría probar la idea? · 18:25–20:00

Para cerrar, este sería el costo de probar la idea durante seis meses. El escenario que planteé considera mil ochenta soles mensuales entre infraestructura, promoción, soporte y diseño. Eso suma seis mil cuatrocientos ochenta soles.

Por el lado de los ingresos supuse doscientos usuarios activos, de los cuales veinte pagarían nueve soles al mes, y cinco tiendas que aportarían diez soles al mes. El cobro a las tiendas es una hipótesis para el piloto. Con esos supuestos entrarían mil trescientos ochenta soles en seis meses y quedarían cinco mil cien soles por cubrir. Con esa inversión, lo primero que querría averiguar es si la gente repite la compra y cuánto tiempo o dinero ahorra con su lista real. Si al terminar la semana el usuario puede decirme qué desayunó, qué tuvo que comprar y cuánto le costó preparar esos desayunos, ya tengo una buena base para evaluar el proyecto. Muchas gracias.

*En pantalla (6 s incluidos): Señala costos e ingresos. Deja la cifra final en pantalla al cerrar.*

