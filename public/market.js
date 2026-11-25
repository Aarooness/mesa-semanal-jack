import {byId,money,stores} from './data.js';
const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export let marketState={offers:[],orders:[],cart:[],reserved:[]};
export async function loadMarket(api,guest=false){marketState=guest?{offers:[],orders:[],cart:[],reserved:[],sub:false}:await api('market');marketState.directory=await api('store-directory')}
const button=(action,label,attrs='')=>'<button type="button" data-market="'+action+'" '+attrs+'>'+label+'</button>';
function payment(action){
 return '<form class="panel"><h3>Registro de pago demo</h3><label>Medio<select name="method"><option>Yape</option><option>Plin</option><option>Transferencia</option></select></label><label>Referencia de prueba<input required maxlength="80" name="reference"></label><p>Simulación académica. Administración revisa la referencia. No transfieras dinero.</p>'+button(action,'Enviar para confirmación')+'</form>';
}
export function basketPanel(user){
 if(user?.role!=='user')return '';
 const {cart}=marketState;
 return '<section class="panel"><h2>Mi canasta local</h2>'+cart.map(i=>'<p>'+e(i.shop)+' · '+e(i.name)+' × '+i.qty+' · '+money(i.price*i.qty)+' '+button('minus','−','data-id="'+e(i.id)+'"')+'</p>').join('')+(cart.length?'<b>Total '+money(cart.reduce((n,i)=>n+i.price*i.qty,0))+'</b>'+payment('checkout'):'<p>Añade productos desde Tiendas.</p>')+'<a href="#locales">Ver tiendas</a></section>';
}
const fees={1:9,3:24,12:84};
export function marketView(route,user){
 if(route==='suscripcion')return '<h1>Suscriptores</h1><p>Compara ofertas locales por peso y reserva ingredientes para tu menú.</p><div class="grid">'+[1,3,12].map(m=>'<section class="card"><h2>'+m+' '+(m===1?'mes':'meses')+'</h2><b>'+money(fees[m])+'</b> '+button('plan','Elegir paquete','data-months="'+m+'"')+'</section>').join('')+'</div><small>Tarifas de demostración.</small>';
 if(route==='pagar'){const m=Number(sessionStorage.getItem('mesa-months'));return '<h1>Carrito de suscripción</h1>'+(!fees[m]?'<a href="#suscripcion">Seleccionar paquete</a>':'<p>'+m+' mes(es) · '+money(fees[m])+'</p>'+(user?.role==='user'?payment('subscribe'):'<a href="#cuenta">Acceder como usuario</a>'))}
 if(route==='pedidos')return '<h1>Pedidos</h1>'+(!user?'<a href="#cuenta">Iniciar sesión</a>':marketState.orders.map(o=>{
 const next=(state,label)=>button('transition',label,'data-id="'+o.id+'" data-state="'+state+'"');
 let actions='';
 if(user.role==='store'&&o.state==='pendiente de pago')actions=next('aceptado','Aceptar pedido');
 if(user.role==='admin'&&['pendiente de pago','aceptado'].includes(o.state))actions=next('pagado','Confirmar pago');
 if(user.role==='store'&&o.state==='pagado')actions='<form><label>Entrega estimada<input required name="eta" maxlength="80" placeholder="Mañana, 9–11 a. m."></label>'+next('enviado','Marcar enviado')+'</form>';
 if(user.id===o.buyer&&o.state==='enviado')actions=next('recibido','Confirmar recepción')+'<form><label>Detalle de la queja<input name="note" required maxlength="500"></label>'+next('reclamo','Registrar queja')+'</form>';
 return '<article class="panel"><h2>'+e(o.months?'Suscripción de '+o.months+' meses':o.items[0].shop)+'</h2><p>@'+e(o.buyerName)+' · '+e(o.state)+' · '+money(o.total)+'</p>'+e(o.items?.map(i=>i.name+' × '+i.qty).join(', '))+'<p>'+e(o.method)+' · '+e(o.reference)+'</p>'+e(o.eta)+' '+e(o.note)+actions+'</article>'}).join('')||'<p>Todavía no hay pedidos.</p>');
 const gate='<section class="panel"><h2>♛ Tiendas locales y precios reducidos</h2><p>Con la suscripción puedes comparar ingredientes de tiendas locales y añadirlos a tu compra.</p><a target="_blank" rel="noopener" href="#suscripcion">Ver paquetes de suscripción ↗</a></section>';
 const groups=Map.groupBy(marketState.offers,p=>p.storeName);
 const directory=(marketState.directory||[]).map(shop=>'<article class="card"><h3>'+e(shop.name)+'</h3><small>'+e(shop.specialty==='ambos'?'Ingredientes y desayunos':shop.specialty)+' · '+shop.ingredients+' ingredientes publicados</small></article>').join('');
 return '<h1>Tiendas</h1><div class="grid">'+directory+'</div>'+(!user||!marketState.sub?gate:'')+[...groups].map(([store,offers])=>'<section><h2>'+e(store)+'</h2><div class="grid">'+offers.map(p=>{
 const f=byId[p.food],g=parseFloat(p.unit)*(p.unit.endsWith('kg')?1000:1);
 const beaten=f?stores.filter((_,i)=>f.price[i]!=null&&p.price/g<f.price[i]/f.pack[i]):[];
 return '<article class="card">'+(p.photo?'<img src="'+e(p.photo)+'" alt="">':'')+'<h3>'+e(p.name)+'</h3><p>'+money(p.price)+' / '+e(p.unit)+'</p>'+(p.kind==='desayuno'&&p.composition?'<details><summary>Nutrición y preparación</summary>'+Math.round(p.composition.kcal)+' kcal · '+p.composition.protein.toFixed(1)+' g proteína<p>'+e(p.preparation)+'</p></details>':'')+(beaten.length?'<small>¡Precio reducido! Por gramo frente a '+e(beaten.join(', '))+' del catálogo referencial.</small>':'')+(user?.role==='user'?button('add','Añadir a mi canasta','data-id="'+p.id+'"'):'')+'</article>'}).join('')+'</div></section>').join('')+'<a href="#compra">Ver mi canasta</a>';
}
