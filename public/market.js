import {copyList} from './copy-list.js';
import {byId,money,stores,deliverySlots} from './data.js';
const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export let marketState={offers:[],orders:[],cart:[],reserved:[]};
export async function loadMarket(api,guest=false){marketState=guest?{offers:[],orders:[],cart:[],reserved:[],sub:false}:await api('market');marketState.directory=await api('store-directory')}
const button=(action,label,attrs='')=>'<button type="button" data-market="'+action+'" '+attrs+'>'+label+'</button>';
const weight=grams=>grams>=1000?(grams/1000).toLocaleString('es-PE',{maximumFractionDigits:5})+' kg':grams.toLocaleString('es-PE',{maximumFractionDigits:3})+' g';
const packageTotal=(qty,grams,price)=>weight(qty*grams)+' · '+money(qty*price);
export function buyControl(p){
 const add=button('add','Añadir a la canasta','data-id="'+e(p.id)+'"');
 if(p.kind!=='ingrediente')return add;
 const grams=parseFloat(p.unit)*(p.unit.endsWith('kg')?1000:1);
 return '<div class="package-picker" data-grams="'+grams+'" data-price="'+p.price+'"><div class="unit-stepper"><button type="button" data-step="-1" aria-label="Restar un envase" disabled>−</button><output aria-label="Envases">1</output><button type="button" data-step="1" aria-label="Sumar un envase">+</button></div><small aria-live="polite">'+packageTotal(1,grams,p.price)+'</small>'+add+'</div>';
}
export function stepPackage(btn){
 const picker=btn.closest('.package-picker'), count=picker.querySelector('output');
 const qty=Math.max(1,Number(count.value)+Number(btn.dataset.step));
 count.value=qty;
 picker.querySelector('[data-step="-1"]').disabled=qty===1;
 picker.querySelector('small').textContent=packageTotal(qty,Number(picker.dataset.grams),Number(picker.dataset.price));
}
function cartControls(i){
 const attrs='data-id="'+e(i.id)+'"';
 const minus=button('minus','−',attrs+' aria-label="Restar una unidad de '+e(i.name)+'"');
 if(!i.food)return minus;
 return '<div class="unit-stepper">'+minus+'<output aria-label="Envases">'+i.qty+'</output>'+button('add','+',attrs+' aria-label="Sumar una unidad de '+e(i.name)+'"')+'</div>';
}
function payment(action){
 return '<form class="panel"><h3>Registro de pago demo</h3><label>Medio<select name="method"><option>Yape</option><option>Plin</option><option>Transferencia</option></select></label><p>Pedido de demostración. Administración confirma el pago manualmente.</p>'+button(action,'Enviar para confirmación')+'</form>';
}
export function basketPanel(user){
 if(user?.role!=='user')return '';
 const {cart}=marketState;
 const groups=['Ingredientes','Productos y desayunos'].map((label,index)=>{
  const items=cart.filter(i=>index?!i.food:i.food);
  if(!items.length)return '';
  return '<h3>'+label+'</h3>'+items.map(i=>'<div class="cart-item"><img src="'+e(i.photo||(i.food?'/fotos/'+i.food+'.png':'/fotos/parfait.jpg'))+'" alt=""><div><strong>'+e(i.name)+'</strong><small>'+e(i.shop)+' · '+i.qty+' × '+money(i.price)+(i.food?' · '+weight(i.qty*i.grams):'')+'</small></div><b>'+money(i.price*i.qty)+'</b>'+cartControls(i)+'</div>').join('');
 }).join('');
 return '<section class="panel"><h2>Mi canasta local</h2>'+groups+(cart.length?'<b>Total '+money(cart.reduce((n,i)=>n+i.price*i.qty,0))+'</b>'+payment('checkout'):'<p>Añade productos desde Tiendas.</p>')+'<a href="#locales">Ver tiendas</a>'+copyList(cart.map(i=>i.food?[byId[i.food]?.name||i.name,i.qty*i.grams,'g']:[i.name,i.qty,'ud.']))+'</section>';
}
const fees={1:9,3:24,12:84};
export function shopLogo(shop){return shop.logo?'<img class="shop-logo" src="'+e(shop.logo)+'" alt="">':'<span class="shop-initial">'+e(shop.name.charAt(0))+'</span>'}
export function marketView(route,user){
 if(route==='suscripcion')return '<h1>Suscriptores</h1><p>Compara ofertas locales por peso y reserva ingredientes para tu menú.</p><div class="grid">'+[1,3,12].map(m=>'<section class="card"><h2>'+m+' '+(m===1?'mes':'meses')+'</h2><b>'+money(fees[m])+'</b> '+button('plan','Elegir paquete','data-months="'+m+'"')+'</section>').join('')+'</div><small>Tarifas de demostración.</small>';
 if(route==='pagar'){const m=Number(sessionStorage.getItem('mesa-months'));return '<h1>Carrito de suscripción</h1>'+(!fees[m]?'<a href="#suscripcion">Seleccionar paquete</a>':'<p>'+m+' mes(es) · '+money(fees[m])+'</p>'+(user?.role==='user'?payment('subscribe'):'<a href="#cuenta">Acceder como usuario</a>'))}
 if(route==='pedidos')return '<h1>Pedidos</h1>'+(!user?'<a href="#cuenta">Iniciar sesión</a>':marketState.orders.map(o=>{
 const next=(state,label)=>button('transition',label,'data-id="'+o.id+'" data-state="'+state+'"');
 let actions='';
 if(user.role==='store'&&o.state==='pendiente de pago')actions=next('aceptado','Aceptar pedido');
 if(user.role==='admin'&&['pendiente de pago','aceptado'].includes(o.state))actions=next('pagado','Confirmar pago')+'<form><label>Motivo del rechazo (opcional)<input name="note" maxlength="500"></label>'+next('rechazado','Rechazar pedido')+'</form>';
 if(o.state==='rechazado'){
  if(o.rejectionReason)actions='<p>Motivo: '+e(o.rejectionReason)+'</p>';
  if(o.retryId)actions+='<small>Ya se abrió un nuevo intento.</small>';
  else if(o.buyer===user.id||o.store===user.id){
   const methods=['Yape','Plin','Transferencia'];
   const paymentField=o.buyer===user.id?'<label>Medio de pago<select name="method">'+methods.map(m=>'<option '+(m===o.method?'selected':'')+'>'+m+'</option>').join('')+'</select></label>':'';
   actions+='<form>'+paymentField+button('retry','Intentar nuevamente','data-id="'+e(o.id)+'"')+'</form>';
  }
 }
 if(user.role==='store'&&o.state==='pagado')actions='<form><label>Entrega estimada<select required name="eta"><option value="">Elige un horario</option>'+deliverySlots.map(slot=>'<option>'+slot+'</option>').join('')+'</select></label>'+next('enviado','Marcar enviado')+'</form>';
 if(user.id===o.buyer&&o.state==='enviado')actions=next('recibido','Confirmar recepción')+'<form><label>Detalle de la queja<input name="note" required maxlength="500"></label>'+next('reclamo','Registrar queja')+'</form>';
 return '<article class="panel"><h2>'+e(o.months?'Suscripción de '+o.months+' meses':o.items[0].shop+(o.category?' · '+o.category:''))+'</h2><p>@'+e(o.buyerName)+' · '+e(o.state)+(o.attempt?' · Intento '+o.attempt:'')+' · '+money(o.total)+'</p>'+e(o.items?.map(i=>i.name+' × '+i.qty).join(', '))+'<p>'+e(o.method)+'</p>'+e(o.eta)+' '+e(o.note)+actions+'</article>'}).join('')||'<p>Todavía no hay pedidos.</p>');
 const gate='<section class="panel"><h2>♛ Tiendas locales y precios reducidos</h2><p>Visita cada tienda para comprar directamente. Con la suscripción puedes comparar ofertas locales en una misma vista.</p><a target="_blank" rel="noopener" href="#suscripcion">Ver paquetes de suscripción ↗</a></section>';
 const groups=Map.groupBy(marketState.offers,p=>p.storeName);
 const directory=(marketState.directory||[]).map(shop=>'<a class="card directory-shop" href="#comercio/'+encodeURIComponent(shop.username)+'">'+shopLogo(shop)+'<h3>'+e(shop.name)+'</h3><small>'+e(shop.specialty==='ambos'?'Ingredientes y desayunos':shop.specialty)+' · '+shop.ingredients+' ingredientes publicados</small></a>').join('');
 const alerts=marketState.sub?'<section class="panel jack-alerts"><h2>Alertas de ahorro local</h2>'+(marketState.alerts?.map(a=>'<a class="jack-deal" href="#comercio/'+encodeURIComponent(a.username)+'"><span><b>'+e(a.name)+'</b><small>'+e(a.shop)+' · '+e(a.unit)+'</small></span><span><del>'+money(a.previous)+'</del> '+money(a.price)+' →</span></a>').join('')||'<p>Las rebajas de ingredientes de tiendas que visites o donde compres aparecerán aquí.</p>')+'</section>':'';
 return '<h1>Tiendas</h1>'+alerts+'<div class="grid">'+directory+'</div>'+(!user||!marketState.sub?gate:'')+[...groups].map(([store,offers])=>'<section><h2>'+e(store)+'</h2><div class="grid">'+offers.map(p=>{
 const f=byId[p.food],g=parseFloat(p.unit)*(p.unit.endsWith('kg')?1000:1);
 const beaten=f?stores.filter((_,i)=>f.price[i]!=null&&p.price/g<f.price[i]/f.pack[i]):[];
 return '<article class="card">'+(p.photo?'<img src="'+e(p.photo)+'" alt="">':'')+'<h3>'+e(p.name)+'</h3><p>'+money(p.price)+' / '+e(p.unit)+'</p>'+(p.kind==='desayuno'&&p.composition?'<details><summary>Nutrición y preparación</summary>'+Math.round(p.composition.kcal)+' kcal · '+p.composition.protein.toFixed(1)+' g proteína<p>'+e(p.preparation)+'</p></details>':'')+(beaten.length?'<small>¡Precio reducido! Por gramo frente a '+e(beaten.join(', '))+' del catálogo referencial.</small>':'')+(user?.role==='user'?buyControl(p):'')+'</article>'}).join('')+'</div></section>').join('')+'<a href="#compra">Ver mi canasta</a>';
}
