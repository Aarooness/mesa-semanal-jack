import {buyControl,stepPackage,shopLogo,marketView,basketPanel,loadMarket,marketState} from './market.js';
export {basketPanel,marketState};
import {productFields,productData,editProduct,readPhoto,poster,ingredientSummary,breakfastImage,refreshDesigns} from './store-editor.js';
import {byId,stores} from './data.js';
import {setPrivate,ingredientLine,editor,readLines,preview,merchant,importDish} from './creator.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export async function api(route,data,method=data?'POST':'GET'){
 const r=await fetch('/api/'+route,{method,headers:data?{'Content-Type':'application/json'}:{},...(data?{body:JSON.stringify(data)}:{})});let value;try{value=await r.json()}catch{throw Error('El servidor no respondió. Vuelve a intentarlo.')}if(!r.ok)throw Error(value.error||'No se pudo completar la operación.');return value;
}
let accountError='';
export let currentUser=null;
try{currentUser=(await api('account')).user}catch(e){accountError=e.message}
if(currentUser)await loadMarket(api);
const ownRoutes=['inicio','cuenta','comunidad','tienda','administracion','buscar','publicar','locales','pedidos','suscripcion','pagar','producto','comercio'];
const link=(route,label)=>`<a href="#${route}">${label}</a>`;
const field=(name,label,type='text',extra='')=>`<label>${label}<input name="${name}" type="${type}" required ${extra}></label>`;
const button=(label,extra='')=>`<button type="submit" class="primary" ${extra}>${label}</button>`;
const empty=label=>`<p class="empty-state">${label}</p>`;
const week=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
let combos=[],posts=[],products=[],admin=null,store=null,revision=0,filter='',kind='all';
let shoppingSource=null;
function bar(){
 document.querySelector('#platform-nav').innerHTML=`<div class="wrap platform-links">${link('inicio','Inicio')}${(currentUser?.role==='store'?'':link('plan','Planificador'))}${link('comunidad','Comunidad')}${link('locales','Tiendas')}${currentUser?link('pedidos','Pedidos'):''}${currentUser?.role==='store'?'':link(shoppingSource?.items.length?'buscar':'compra','Buscar tiendas')}${currentUser?.role==='store'?link('tienda','Mi tienda'):''}${currentUser?.role==='admin'?link('administracion','Administración'):''}<span class="account-links">${link('compra','Tiendas y Compras')}${link('cuenta',currentUser?'@'+esc(currentUser.username):'Entrar / Registrarse')}</span></div>`;
}
const title=(eyebrow,name,description)=>`<div class="page-heading"><small>${eyebrow}</small><h1>${name}</h1><p>${description}</p></div>`;
function home(){return `<section class="platform-hero"><div><span class="eyebrow">TU SEMANA EMPIEZA EN LA MESA</span><h1>Un buen desayuno.<br>Una semana mejor.</h1><p>Combina ingredientes, organiza tu menú y encuentra nuevas ideas de personas y tiendas de tu comunidad.</p><div class="actions">${link('plan','Probar el planificador →')}${link('comunidad','Explorar desayunos')}</div><small>Puedes explorar sin cuenta. Regístrate para publicar y buscar tiendas.</small></div><img src="/fotos/parfait.jpg" alt="Desayuno con yogur y frutas"></section><div class="platform-grid"><article class="panel"><span class="eyebrow">01 · PLANIFICA</span><h2>Tu menú, a tu manera</h2><p>Porciones, ingredientes, lista de compra y seguimiento en un solo lugar.</p>${link('plan','Armar mi semana →')}</article><article class="panel"><span class="eyebrow">02 · COMPARTE</span><h2>Ideas de la comunidad</h2><p>Recetas originales con ingredientes, preparación y distribución de macronutrientes.</p>${link('comunidad','Ver recetas →')}</article><article class="panel"><span class="eyebrow">03 · DESCUBRE</span><h2>También cerca de ti</h2><p>Productos, recetas y planes semanales de tiendas, más búsqueda de comercios locales.</p>${link('compra','Comparar tiendas →')}</article></div>`}
function account(){
 if(currentUser)return title('MI CUENTA','Hola, @'+esc(currentUser.username),currentUser.role==='store'?'Cuenta de tienda · '+esc(currentUser.storeName):currentUser.role==='admin'?'Administración de Mesa Semanal':'Cuenta personal')+`<section class="panel"><p>Tu nombre público es <b>@${esc(currentUser.username)}</b>.</p><p>Tu planificación se conserva por cuenta en este navegador.</p><div class="actions">${link('publicar','Crear un desayuno')}${currentUser.role==='store'?link('tienda','Gestionar mi tienda'):''}<button data-platform="logout">Cerrar sesión</button></div></section>`;
 return title('BIENVENIDO','Tu lugar en la mesa','Elige un nombre único para compartir tus creaciones.')+`<div class="platform-grid auth-grid"><form data-platform-form="login" class="panel"><h2>Iniciar sesión</h2><label>Acceder como<select name="access"><option value="user">Usuario</option><option value="store">Tienda</option></select></label>${field('username','Nombre de usuario','text','autocomplete="username" maxlength="24"')}${field('password','Contraseña','password','autocomplete="current-password" maxlength="128"')}${button('Entrar')}</form><form data-platform-form="register" class="panel"><h2>Crear cuenta</h2>${field('username','Nombre de usuario único','text','pattern="[A-Za-z0-9_]{3,24}" minlength="3" maxlength="24" autocomplete="username"')}<small>3–24 letras sin tildes, números o guion bajo.</small>${field('password','Contraseña (mínimo 10 caracteres)','password','minlength="10" maxlength="128" autocomplete="new-password"')}<label>Tipo de cuenta<select name="role"><option value="user">Personal</option><option value="store">Tienda</option></select></label><label data-store-registration hidden>Especialidad de la tienda<select name="specialty"><option value="ambos">Ingredientes y desayunos</option><option value="ingredientes">Ingredientes</option><option value="desayunos">Desayunos preparados</option></select></label><label data-store-registration hidden>Nombre de tienda<input name="storeName" maxlength="80"></label>${button('Crear mi cuenta')}</form></div>`;
}
function chart(n){const total=n.kcal;if(!total)return '<p>Sin energía cuantificable con estos ingredientes.</p>';const p=n.protein*4/total*100,c=n.carbs*4/total*100;return `<div class="nutrition"><div class="macro-pie" role="img" aria-label="Distribución de energía: proteína ${p.toFixed(0)}%, carbohidratos ${c.toFixed(0)}%, grasas ${(100-p-c).toFixed(0)}%" style="background:conic-gradient(#27F5E0 0 ${p}%,#65e7d9 ${p}% ${p+c}%,#83b5a0 ${p+c}% 100%)"><b>${total}<small>kcal</small></b></div><ul><li><i style="background:#27F5E0"></i>Proteína: ${n.protein} g · ${p.toFixed(0)}%</li><li><i style="background:#65e7d9"></i>Carbohidratos: ${n.carbs} g · ${c.toFixed(0)}%</li><li><i style="background:#83b5a0"></i>Grasas: ${n.fat} g · ${(100-p-c).toFixed(0)}%</li></ul></div>${n.fiber!=null?'<small>Fibra '+n.fiber.toFixed(1)+' g · Vitamina C '+n.vitamin.toFixed(1)+' mg</small>':''}<small>Por porción · Energía calculada a partir de macronutrientes (4/4/9). Valores aproximados por porción.</small>`}
function postCard(p){return `<article class="panel community-card" id="post-${p.id}"><small>${p.type==='plan'?'PLAN SEMANAL':'DESAYUNO'} ${p.author.role==='store'?'· TIENDA':''}</small><h2>${esc(p.title)}</h2>${p.type==='recipe'&&(p.photo||p.author.role==='store')?`<img class="community-photo" src="${esc(breakfastImage(p))}" alt="${esc(p.title)}">`:''}<p class="byline">${p.author.role==='store'?shopLink(p.author):'@'+esc(p.author.username)}${p.author.storeName?' · '+esc(p.author.storeName):''}</p>${p.type==='recipe'?chart(p.nutrition)+`<details><summary>Ingredientes y preparación</summary><h3>Ingredientes · 1 porción</h3><ul>${p.ingredients.map(i=>`<li>${esc(i.name)} · ${esc(i.amount)}</li>`).join('')}</ul><h3>Preparación</h3><p class="preparation">${esc(p.preparation)}</p>${p.productIds?.length?'<h3>Productos de esta tienda</h3>'+p.productIds.map(id=>{const pr=products.find(x=>x.id===id);return pr?`<p>${esc(pr.name)} · S/ ${pr.price.toFixed(2)} / ${esc(pr.unit)}</p>`:'<p>Producto ya no disponible.</p>'}).join(''):''}</details>`:`<ol class="weekly-list">${p.days.map((id,i)=>{const r=posts.find(x=>x.id===id);return `<li><b>${week[i]}</b> ${r?`<a href="#comunidad" data-open-post="${id}">${esc(r.title)}</a>`:'Receta no disponible'}</li>`}).join('')}</ol>`}${p.authorId===currentUser?.id?`<button data-platform="delete" data-kind="post" data-id="${p.id}">Retirar publicación</button>`:''}</article>`}
function feed(){const filtered=posts.filter(p=>(kind==='all'||p.type===kind)&&(p.title+' '+p.author.username+' '+p.author.storeName).toLocaleLowerCase('es').includes(filter.toLocaleLowerCase('es')));return '<h1>Desayunos de la comunidad</h1>'+`<div class="feed-toolbar"><label>Buscar receta o autor<input id="community-search" value="${esc(filter)}" placeholder="Avena, @usuario, tienda…"></label><label>Mostrar<select id="community-kind"><option value="all">Todo</option><option value="recipe" ${kind==='recipe'?'selected':''}>Desayunos</option><option value="plan" ${kind==='plan'?'selected':''}>Planes semanales</option></select></label>${link(currentUser?'publicar':'cuenta','+ Publicar un desayuno')}</div><div class="platform-grid" id="community-results">${filtered.map(postCard).join('')||empty('Aún no hay publicaciones que coincidan. Comparte la primera receta.')}</div><section class="panel"><h2>Productos publicados por tiendas</h2>${products.length?products.map(productCard).join(''):empty('Las tiendas todavía no han publicado productos.')}</section>`}
function recipeForm(){return `<form class="panel recipe-form" data-platform-form="recipe"><h2>Comparte tu combinación</h2>${field('title','Nombre de tu desayuno','text','maxlength="100"')}<label>Ingredientes (uno por línea: nombre | cantidad)<textarea name="ingredients" required rows="5" placeholder="Avena | 40 g&#10;Yogur natural | 150 g"></textarea></label><label>Preparación<textarea name="preparation" required rows="5" maxlength="5000" placeholder="Explica cómo prepararlo…"></textarea></label><h3>Macronutrientes por porción</h3><p>Introduce gramos. El gráfico y las calorías se calculan automáticamente.</p><div class="macro-fields">${field('protein','Proteína (g)','number','min="0" max="500" step="0.1"')}${field('carbs','Carbohidratos (g)','number','min="0" max="1000" step="0.1"')}${field('fat','Grasas (g)','number','min="0" max="500" step="0.1"')}</div><div id="macro-preview"></div>${currentUser?.role==='store'&&store?.products.length?'<fieldset><legend>Promociona productos propios (opcional)</legend>'+store.products.map(p=>`<label><input type="checkbox" name="productIds" value="${p.id}">${esc(p.name)}</label>`).join('')+'</fieldset>':''}${button('Publicar en Comunidad')}</form>`}
function shopLink(author){return '<a href="#comercio/'+encodeURIComponent(author.username)+'">@'+esc(author.username)+'</a>'}
function itemPage(p){
 const fallback=p.components?.length?ingredientSummary(p.components):p.food?esc(byId[p.food]?.name||p.name):'Composición sin registrar';
 return '<a href="#comunidad">← Comunidad</a><h1>'+esc(p.name)+'</h1>'+shopLink(p.author)+(p.photo?'<img class="community-photo" src="'+esc(p.photo)+'" alt="'+esc(p.name)+'">':'')+'<p>'+esc(p.description)+'</p><strong>S/ '+p.price.toFixed(2)+' / '+esc(p.unit)+'</strong><p>'+esc(p.location)+'</p><h2>Ingredientes</h2><p>'+fallback+'</p>'+(p.composition?chart({...p.composition,carbs:p.composition.carb}):'')+(p.preparation?'<h2>Preparación</h2><p>'+esc(p.preparation)+'</p>':'')+(currentUser?.role==='user'?buyControl(p):'');
}
function storefront(shop, items, posts, selected){
 const sections=[
  {id:'ingredientes',label:'Ingredientes',entries:items.filter(p=>p.kind==='ingrediente'),card:productCard},
  {id:'productos',label:'Productos',entries:items.filter(p=>p.kind!=='ingrediente'),card:productCard},
  {id:'recetas',label:'Recetas',entries:posts.filter(p=>p.type==='recipe'),card:postCard}
 ].filter(section=>section.entries.length);
 const active=sections.find(section=>section.id===selected)||sections[0];
 const header='<a href="#locales">← Tiendas</a><header class="shop-heading">'+shopLogo(shop)+'<h1>'+esc(shop.name)+'</h1></header><p>@'+esc(shop.username)+'</p>';
 if(!active)return header+empty('Esta tienda aún no tiene publicaciones.');
 const tabs=sections.map(section=>'<a href="#comercio/'+encodeURIComponent(shop.username)+'/'+section.id+'"'+(section===active?' aria-current="page"':'')+'>'+section.label+' <small>'+section.entries.length+'</small></a>').join('');
 return header+'<div class="shop-sections" role="navigation" aria-label="Secciones de la tienda">'+tabs+'</div><section><h2>'+active.label+'</h2>'+active.entries.map(active.card).join('')+'</section>';
}
function productCard(p,editable=false){return `<div class="store-product ${p.kind==='ingrediente'?'ingredient-product':''}"><div>${p.author?`<a class="product-link" href="#producto/${p.id}" aria-label="Ver ${esc(p.name)}">${poster(p.name,p.photo,p.design)}</a>`:poster(p.name,p.photo,p.design)}<small>${ingredientSummary(p.components)}</small><small>${esc(p.location)}</small><small>${esc(p.description)}</small><small>${p.author?shopLink(p.author):''}</small></div><b>S/ ${p.price.toFixed(2)}<small>por ${esc(p.unit)}</small>${/^[0-9.]+ (g|kg)$/.test(p.unit)?'<small>S/ '+(p.price/(parseFloat(p.unit)*(p.unit.endsWith('kg')?1:.001))).toFixed(2)+'/kg</small>':''}</b>${currentUser?.role==='user'?buyControl(p):''}${p.authorId===currentUser?.id?`${editable===true?`<button type="button" data-platform="edit-product" data-id="${p.id}">Editar</button>`:''}<button data-platform="delete" data-kind="product" data-id="${p.id}">Retirar</button>`:''}</div>`}
let shopTab='';
function updateShopTabs(){
 const buttons=[...document.querySelectorAll('[data-shop-tab]')];
 if(!buttons.some(b=>b.dataset.shopTab===shopTab))shopTab=buttons[0]?.dataset.shopTab;
 document.querySelectorAll('[data-shop-pane]').forEach(p=>p.hidden=p.dataset.shopPane!==shopTab);
 buttons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.shopTab===shopTab));
}
function inventoryPane(isIngredient,allowCreate){
 const items=store.products.filter(p=>(p.kind==='ingrediente')===isIngredient);
 const label=isIngredient?'Ingredientes':'Productos en venta';
 const form=allowCreate?`<form data-platform-form="product"><h3>${isIngredient?'Publicar ingrediente':'Publicar producto'}</h3>${field('name','Nombre','text','maxlength="100"')}${field('location','Localidad')}${productFields(isIngredient?'ingredientes':'desayunos')}<div class="weight-unit">${field('weight','Peso del envase','number','min="0.01" step="0.01"')}<label>Unidad<select name="weightUnit"><option>g</option><option>kg</option></select></label></div>${field('price','Precio en soles','number','min="0" max="100000" step="0.01"')}<label>Descripción<textarea name="description" required maxlength="600"></textarea></label>${button(isIngredient?'Publicar ingrediente':'Publicar producto')}</form>`:'';
 return '<section class="panel" data-shop-pane="'+(isIngredient?'ingredientes':'productos')+'"><h2>'+label+' ('+items.length+')</h2>'+items.map(p=>productCard(p,true)).join('')+form+'</section>';
}
function shop(){
 const mine=store.posts.filter(p=>p.type==='recipe'&&p.status==='published');
 const ingredients=currentUser.specialty!=='desayunos',products=currentUser.specialty!=='ingredientes';
 const tabs=[];
 if(ingredients||store.products.some(p=>p.kind==='ingrediente'))tabs.push(['ingredientes','Ingredientes']);
 if(products||store.products.some(p=>p.kind!=='ingrediente'))tabs.push(['productos','Productos en venta']);
 tabs.push(['desayunos','Recetas'],['catalogo','Catálogo de platos'],['planes','Planes semanales'],['ofertas','Combos y ofertas']);
 return title('ESPACIO DE TIENDA',esc(currentUser.storeName),'Gestiona tu catálogo y tus publicaciones.')+`<div class="actions">${tabs.map(([id,label])=>`<button data-shop-tab="${id}">${label}</button>`).join('')}</div><div>${inventoryPane(true,ingredients)}${inventoryPane(false,products)}<section data-shop-pane="desayunos"><div class="panel"><h2>Recetas</h2>${link('publicar','+ Crear una receta con mis productos')}${store.posts.filter(p=>p.type==='recipe').map(p=>`<p>${p.type==='recipe'?`<img width="58" height="50" style="object-fit:cover;vertical-align:middle" alt="" src="${breakfastImage(p)}">`:''} ${esc(p.title)} · ${p.type==='plan'?'Plan semanal':'Desayuno'} · ${p.status==='hidden'?'Oculto por moderación':'Publicado'} <button data-platform="delete" data-kind="post" data-id="${p.id}">Retirar</button></p>`).join('')}</div></section><section data-shop-pane="planes"><div class="panel"><h2>Planes semanales</h2>${store.posts.filter(p=>p.type==='plan').map(p=>`<p>${esc(p.title)} <button data-platform="delete" data-kind="post" data-id="${p.id}">Retirar</button></p>`).join('')}</div><form class="panel" data-platform-form="plan"><h2>Proponer plan semanal</h2>${field('title','Nombre del plan','text','maxlength="100"')}${week.map((d,i)=>`<label>${d}<select name="day${i}" required><option value="">Elige un desayuno propio</option>${mine.map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></label>`).join('')}${mine.length?button('Publicar plan semanal'):empty('Publica al menos una receta para crear un plan.')}</form></section></div>`}
function reviewHistory(rows){
 return rows.map(r=>'<p><b>'+esc(r.title)+'</b> · '+(r.denied?'Denegada':'Observación')+' · '+esc(new Date(r.at).toLocaleString('es-PE'))+'<br>'+esc(r.note)+'</p>').join('');
}
function publicationReview(kind,id){
 const groups=[['Recetas','post',admin.posts.filter(p=>p.type==='recipe')],['Desayunos y productos en venta','product',admin.products.filter(p=>p.kind!=='ingrediente')],['Ingredientes','product',admin.products.filter(p=>p.kind==='ingrediente')],['Planes semanales','post',admin.posts.filter(p=>p.type==='plan')],['Ofertas','combo',admin.combos]];
 if(!kind)return '<section class="panel"><h2>Publicaciones</h2>'+groups.filter(g=>g[2].length).map(([label,k,items])=>'<h3>'+label+'</h3>'+items.map(p=>'<div class="store-product"><div><strong>'+esc(p.title||p.name)+'</strong><small>@'+esc(p.author.username)+(p.status==='hidden'?' · Oculta':'')+'</small></div><a href="#administracion/'+k+'/'+p.id+'">Ver publicación</a></div>').join('')).join('')+'</section>';
 const group=groups.find(g=>g[1]===kind&&g[2].some(p=>p.id===id));
 const back='<a href="#administracion">← Administración</a>';
 if(!group)return back+empty('Publicación no disponible.');
 const p=group[2].find(p=>p.id===id);
 let detail;
 if(kind==='post'){posts=admin.posts;products=admin.products;detail=postCard(p).replace('<details>','<details open>')}
 else if(kind==='product')detail=itemPage(p).replace('<a href="#comunidad">← Comunidad</a>','');
 else detail='<h1>'+esc(p.name)+'</h1><ul>'+p.items.map(i=>'<li>'+esc(i.name)+' · S/ '+i.price.toFixed(2)+' · descuento '+i.discount+' %</li>').join('')+'</ul><strong>Total S/ '+p.total.toFixed(2)+'</strong>';
 return back+'<p>'+group[0]+' · @'+esc(p.author.username)+'</p>'+detail+(kind==='post'&&p.status==='hidden'?'<button data-platform="moderate" data-id="'+id+'" data-status="published">Restaurar publicación oculta</button>':'')+'<section class="panel"><h2>Revisión de la publicación</h2>'+reviewHistory(admin.reviews.filter(r=>r.id===id))+'<form data-platform-form="review"><input type="hidden" name="id" value="'+id+'"><input type="hidden" name="kind" value="'+kind+'"><label>Observaciones para el autor<textarea name="note" maxlength="1000"></textarea></label><div class="actions"><button type="submit">Enviar observación</button><button type="button" disabled>Permitir</button><button type="button" data-platform="deny">Denegar y eliminar</button></div></form></section>';
}
function administration(){return title('CONTROL DE LA PLATAFORMA','Administración','Gestiona cuentas, permisos y publicaciones de esta instalación.')+`<div class="admin-metrics">${[['Usuarios',admin.users.length],['Tiendas',admin.users.filter(u=>u.role==='store').length],['Publicaciones',admin.posts.length+admin.products.length+admin.combos.length],['Tavily',admin.searchConfigured?'Configurado':'Pendiente']].map(([k,v])=>`<div class="panel"><small>${k}</small><strong>${v}</strong></div>`).join('')}</div>${publicationReview()}<section class="panel"><h2>Usuarios y permisos</h2><label>Filtrar usuarios<input id="admin-search" placeholder="Nombre de usuario…"></label><div class="table"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Gestión</th></tr></thead><tbody>${admin.users.map(u=>`<tr data-admin-username="${esc(u.username)}"><td>@${esc(u.username)}<small>${esc(u.storeName)}</small></td><td>${esc(u.role)}</td><td>${u.status==='active'?'Activo':'Suspendido'}</td><td>${u.id===currentUser.id?'Tu cuenta':`<button data-platform="user-status" data-id="${u.id}" data-status="${u.status==='active'?'suspended':'active'}">${u.status==='active'?'Suspender':'Reactivar'}</button><label>Rol<select data-user-role="${u.id}">${['user','store','admin'].map(r=>`<option ${r===u.role?'selected':''}>${r}</option>`).join('')}</select></label>`}</td></tr>`).join('')}</tbody></table></div></section><section class="panel"><h2>Platos de tiendas</h2>${admin.posts.filter(p=>p.type==='recipe'&&p.author.role==='store').map(p=>`<details><summary>${esc(p.title)} · @${esc(p.author.username)}</summary><form data-platform-form="adminDish"><input type="hidden" name="id" value="${p.id}"><label>Nombre<input required name="title" maxlength="100" value="${esc(p.title)}"></label><label>Preparación<textarea required maxlength="2000" name="preparation">${esc(p.preparation)}</textarea></label><p>${p.ingredients.map(i=>esc(i.name)+' · '+esc(i.amount)).join(', ')}</p>${button('Guardar cambios')} <button type="button" data-platform="delete-dish" data-id="${p.id}">Eliminar plato</button></form></details>`).join('')||empty('Aún no hay platos de tiendas.')}<h2>Suscripciones demo</h2>${admin.users.filter(a=>a.role!=='admin').map(a=>`<p>@${esc(a.username)} · ${esc(a.subscription)} <button data-platform="subscription" data-id="${a.id}" data-state="${a.subscription==='demo activa'?'congelada':'demo activa'}">${a.subscription==='demo activa'?'Congelar':'Activar demo'}</button></p>`).join('')}<h2>Historial de movimientos</h2>${admin.audit.map(a=>`<p>${esc(new Date(a.at).toLocaleString('es-PE'))} · @${esc(a.actor)} · ${esc(a.action)} · ${esc(a.target)}</p>`).join('')||empty('Todavía no hay acciones registradas.')}</section>`}
function sourceKey(){return JSON.stringify([currentUser?.id,shoppingSource])}
const cacheName='mesa-sources-v2';
function savedSources(){
 try{const hit=JSON.parse(sessionStorage.getItem(cacheName));return hit?.key===sourceKey()?hit.results:null}catch{return null}
}
function sourceResults(results){
    const types={product:'Ficha',category:'Categoría',storeSearch:'Buscador'};
    return (results.some(r=>r.failed)?'<p role="status">Tavily no respondió para parte de la lista. Puedes abrir los enlaces de tienda.</p>':'')+
     results.map(r=>'<a class="source-result" href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer"><img src="/fotos/'+esc(r.id)+'.png" alt=""><strong>'+esc(byId[r.id].name)+'</strong><small>'+(Number.isFinite(r.price)?'S/ '+r.price.toFixed(2):'Precio sin confirmar')+' · '+esc(stores[r.shop])+' · '+types[r.kind]+'</small><span aria-hidden="true">↗</span></a>').join('');
}
function searchView(){
 const more='<section class="source-entry"><div><h2>Buscar más tiendas</h2><small>Precios reducidos</small></div><a class="source-link" href="'+(marketState.sub?'#locales':'#suscripcion')+'">'+(marketState.sub?'Comparar tiendas':'Ver suscripción')+' →</a></section>';
 const back=link('compra','← Tiendas y compra');
 if(!shoppingSource?.items.length)return back+'<section class="panel"><h1>Fuentes de tu lista</h1><p>Marca una opción de compra con ingredientes pendientes para consultar sus enlaces.</p></section>'+more;
 const {label,items}=shoppingSource;
 const photos=items.slice(0,4).map(({id})=>'<img src="/fotos/'+id+'.png" alt="">').join('');
 return back+'<section class="source-hero"><div class="source-photos">'+photos+'</div><div><h1>Fuentes de tu lista</h1><p>'+esc(label)+' · '+items.length+' '+(items.length===1?'ingrediente':'ingredientes')+'</p><small>Tiendas consultadas: '+[...new Set(items.map(item=>stores[item.shop]))].map(esc).join(', ')+'</small></div><form data-platform-form="search">'+(currentUser?button('Buscar'):link('cuenta','Inicia sesión para buscar'))+'</form></section><div id="search-results" aria-live="polite">'+(savedSources()?sourceResults(savedSources()):'')+'</div>'+more;
}
export function renderPlatform(source=shoppingSource){
 shoppingSource=source;
 bar();const hash=location.hash.slice(1)||'inicio';const [route,id]=hash.split('/');if(currentUser?.role==='store'&&!ownRoutes.includes(route)){location.replace('#tienda');return true}if(!ownRoutes.includes(route))return false;
 document.body.dataset.view=route;const root=document.querySelector('#main');const tick=++revision;
 const show=html=>{if(tick===revision&&((location.hash.slice(1)||'inicio')===hash))root.innerHTML=html};
 if(accountError){show(`<p role="alert">${esc(accountError)} Recarga cuando el servidor esté disponible.</p>`);return true}
 if(['tienda','administracion','publicar'].includes(route)&&!currentUser){show(account());return true}
 if(['locales','pedidos','suscripcion','pagar'].includes(route)){loadMarket(api,!currentUser).then(()=>show(marketView(route,currentUser))).catch(err=>show(esc(err.message)))}
 if(route==='producto'||route==='comercio'){
  show('<p role="status">Cargando…</p>');
  (async()=>{try{
   const list=await api('products');
   if(route==='producto'){const p=list.find(p=>p.id===id);show(p?itemPage(p):empty('Producto no disponible con este acceso.'));return}
   const [directory,recipes]=await Promise.all([api('store-directory'),api('community')]);
   const shop=directory.find(s=>s.username===id);
   if(!shop){show(empty('Tienda no disponible.'));return}
   show(storefront(shop,list.filter(p=>p.author.username===id),recipes.filter(p=>p.author.username===id),hash.split('/')[2]));
  }catch(err){show(empty(esc(err.message)))}})();return true
 }
 if(route==='inicio')show(home());
 if(route==='cuenta'){show(account());if(currentUser)api('my-reviews').then(rows=>{if(rows.length)show(account()+'<section class="panel"><h2>Revisión de mis publicaciones</h2>'+reviewHistory(rows)+'</section>')}).catch(err=>notify(err.message))}

 if(route==='buscar')show(searchView());
 if(route==='administracion'&&currentUser.role!=='admin'||route==='tienda'&&currentUser.role!=='store'){show(empty('Esta vista requiere el tipo de cuenta correspondiente.'));return true}
 if(['comunidad','tienda','publicar','administracion'].includes(route)){
  show('<p role="status">Cargando…</p>');
  (async()=>{try{
   if(route==='comunidad'){[posts,products,combos]=await Promise.all([api('community'),api('products'),api('combos')]);show(feed()+'<section class="panel"><h2>Ofertas de tiendas</h2>'+combos.map(c=>'<p>'+esc(c.name)+' · @'+esc(c.author.username)+' · S/ '+c.total.toFixed(2)+'</p>').join('')+'</section>')}
   if(route==='administracion'){admin=await api('admin');show(id?publicationReview(id,hash.split('/')[2]):administration())}
   if(route==='tienda'||route==='publicar'){if(currentUser.role==='store')store=await api('store');if(route==='publicar')setPrivate(await api('private-foods'));show(route==='tienda'?shop()+merchant(store)+'<details class="panel"><summary>Cambiar logo de mi tienda</summary><form data-platform-form="storeLogo"><label>Imagen del logo<input name="upload" type="file" required accept="image/png,image/jpeg,image/webp"></label><input type="hidden" name="photo"><button type="submit">Guardar logo</button></form></details>':editor(currentUser.role==='store'));const links=document.querySelector('#linked-products');if(links&&store&&currentUser.role==='store')links.innerHTML=store.products.map(p=>'<label><input type="checkbox" name="productIds" value="'+p.id+'">'+esc(p.name)+'</label>').join('');if(route==='tienda'){updateShopTabs();document.querySelectorAll('[data-platform-form="product"]').forEach(refreshDesigns)}if(route==='publicar'){if(currentUser.specialty==='desayunos')document.querySelector('[data-platform-form=private]')?.closest('details')?.remove();updatePreview()}}
  }catch(e){show(`<p role="alert">${esc(e.message)}</p>`)}})();
 }
 return true;
}
const notify=message=>{const el=document.querySelector('#message');el.textContent=message;setTimeout(()=>{if(el.textContent===message)el.textContent=''},6000)};
document.addEventListener('input',e=>{
 if(e.target.id==='community-search'){filter=e.target.value;document.querySelector('#community-results').innerHTML=posts.filter(p=>(kind==='all'||p.type===kind)&&(p.title+' '+p.author.username+' '+p.author.storeName).toLowerCase().includes(filter.toLowerCase())).map(postCard).join('')||empty('Sin coincidencias.')}
 if(e.target.id==='admin-search')document.querySelectorAll('[data-admin-username]').forEach(row=>row.hidden=!row.dataset.adminUsername.includes(e.target.value.toLowerCase()));
 if(e.target.closest('[data-platform-form="recipe"]')){const form=e.target.form;const n=Object.fromEntries(['protein','carbs','fat'].map(k=>[k,Math.max(0,+form.elements[k].value||0)]));n.kcal=Math.round(n.protein*4+n.carbs*4+n.fat*9);document.querySelector('#macro-preview').innerHTML=chart(n)}
});
document.addEventListener('change',async e=>{
 if(e.target.name==='role'&&e.target.form?.dataset.platformForm==='register'){e.target.form.querySelectorAll('[data-store-registration]').forEach(el=>el.hidden=e.target.value!=='store');e.target.form.elements.storeName.required=e.target.value==='store'}
 if(e.target.id==='community-kind'){kind=e.target.value;renderPlatform()}
 if(e.target.dataset.userRole){try{await api('admin/users',{id:e.target.dataset.userRole,role:e.target.value},'PATCH');renderPlatform()}catch(err){notify(err.message);renderPlatform()}}
});
document.addEventListener('click',async e=>{
 const step=e.target.closest('[data-step]');if(step&&step.closest('.package-picker')){stepPackage(step);return}
 const market=e.target.closest('[data-market]');if(market){const {market:action,id,state,months}=market.dataset;if(action==='plan'){sessionStorage.setItem('mesa-months',months);location.hash='pagar';return}market.disabled=true;
 try{const form=market.closest('form');if(form&&!form.reportValidity())return;
 await api('market',{action,id,state,qty:Number(market.closest('.package-picker')?.querySelector('output').value||1),months:Number(sessionStorage.getItem('mesa-months')), ...Object.fromEntries(form?new FormData(form):[])});
 await loadMarket(api);if(['subscribe','checkout'].includes(action))location.hash='pedidos';else window.dispatchEvent(new Event('hashchange'));notify('Actualizado');
 }catch(err){notify(err.message)}finally{market.disabled=false}return}
 const tab=e.target.closest('[data-shop-tab]');if(tab){shopTab=tab.dataset.shopTab;updateShopTabs();return}
 const anchor=e.target.closest('[data-open-post]');if(anchor){e.preventDefault();const card=document.querySelector('#post-'+anchor.dataset.openPost);card?.scrollIntoView({behavior:'smooth'});const detail=card?.querySelector('details');if(detail)detail.open=true;return}
 const b=e.target.closest('[data-platform]');if(!b)return;b.disabled=true;
 try{const {platform:action,id,status}=b.dataset;
  if(action==='edit-product'){
   const form=b.closest('[data-shop-pane]').querySelector('[data-platform-form="product"]');
   editProduct(form,store.products.find(p=>p.id===id));return;
  }
  if(action==='cancel-product'){renderPlatform();return}
  if(action==='deny'){
   const data=Object.fromEntries(new FormData(b.closest('form')));
   if(!confirm('¿Denegar y eliminar la publicación? Al eliminar un producto también se retiran sus ofertas asociadas.'))return;
   await api('admin/publication',data,'DELETE');location.hash='administracion';notify('Publicación eliminada.');return;
  }
  if(action==='delete-dish'){if(!confirm('¿Eliminar este plato de la tienda y la comunidad?'))return;await api('admin/dish',{id},'DELETE')}
  if(action==='subscription')await api('admin/subscription',{id,state:b.dataset.state},'PATCH');
  if(action==='logout'){await api('logout',{});location.hash='inicio';location.reload();return}
  if(action==='delete'){await api('content',{id,kind:b.dataset.kind},'DELETE')}
  if(action==='user-status')await api('admin/users',{id,status},'PATCH');
  if(action==='moderate')await api('admin/posts',{id,status},'PATCH');
  renderPlatform();
 }catch(err){notify(err.message)}finally{b.disabled=false}
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(!form.dataset.platformForm)return;e.preventDefault();const type=form.dataset.platformForm,data=Object.fromEntries(new FormData(form)),submit=form.querySelector('[type=submit]');if(submit)submit.disabled=true;
 try{
  if(type==='review'){if(!data.note.trim()){notify('Escribe la observación para el autor.');return}await api('admin/publication',data,'PATCH');renderPlatform();notify('Observación enviada.');return}
  if(type==='adminDish'){await api('admin/dish',data,'PATCH');renderPlatform();return}
  if(type==='login'||type==='register'){await api(type,data);const u=(await api('account')).user;location.hash=u.role==='store'?'tienda':u.role==='admin'?'administracion':localStorage.getItem('mesa-semanal-v1:'+u.id)&&JSON.parse(localStorage.getItem('mesa-semanal-v1:'+u.id)).profile?'plan':'perfil';location.reload();return}
  if(type==='components'){await api('community',{title:data.title,photo:await readPhoto(form,currentUser?.role==='store'),preparation:data.preparation,lines:readLines(),productIds:new FormData(form).getAll('productIds')});location.hash='comunidad';return}
  if(type==='private'){const x=await api('private-foods',{...data,...Object.fromEntries(['protein','carbs','fat','fiber','vitamin'].map(k=>[k,Number(data[k])]))});setPrivate(await api('private-foods'));document.querySelectorAll('.component-line select').forEach(el=>el.add(new Option(x.name,x.id)));form.reset();notify('Ingrediente guardado en tu cuenta.');return}
  if(type==='combo'){const items=new FormData(form).getAll('product').map(id=>({id,discount:Number(form.querySelector('[data-discount="'+id+'"]').value)}));await api('combos',{name:data.name,items});renderPlatform();return}
  if(type==='recipe'){const ingredients=data.ingredients.split('\n').filter(l=>l.trim()).map(line=>{const [name,...amount]=line.split('|');return {name:name.trim(),amount:amount.join('|').trim()}});await api('community',{type:'recipe',title:data.title,ingredients,preparation:data.preparation,nutrition:{protein:+data.protein,carbs:+data.carbs,fat:+data.fat},productIds:new FormData(form).getAll('productIds')});location.hash='comunidad';notify('Tu desayuno ya está en la comunidad.');renderPlatform()}
  if(type==='storeLogo'){await api('store-logo',{photo:await readPhoto(form,true)});notify('Logo actualizado.');renderPlatform();return}
  if(type==='product'){const id=form.dataset.editId;await api('products',{...await productData(form,data),id},id?'PATCH':'POST');renderPlatform();notify(id?'Cambios guardados.':'Publicación creada.')}
  if(type==='plan'){await api('community',{type:'plan',title:data.title,days:week.map((_,i)=>data['day'+i])});notify('Plan semanal publicado.');renderPlatform()}
  if(type==='search'&&shoppingSource?.items.length){
   const target=document.querySelector('#search-results');target.textContent='Buscando enlaces de la lista…';
   try{
    const key=sourceKey();
    const {results}=await api('shopping-sources',{items:shoppingSource.items});
    if(key===sourceKey()){
     sessionStorage.setItem(cacheName,JSON.stringify({key,results}));
     const visible=document.querySelector('#search-results');if(visible)visible.innerHTML=sourceResults(results);
    }
   }catch(err){target.textContent=err.message}
  }
 }catch(err){notify(err.message)}finally{if(submit)submit.disabled=false}
});

function updatePreview(){const target=document.querySelector('#macro-preview');if(target)target.innerHTML=chart(preview())}
document.addEventListener('input',e=>{if(e.target.closest('.component-line'))updatePreview()});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-creator]');if(!b)return;try{if(b.dataset.creator==='line')document.querySelector('#lines').insertAdjacentHTML('beforeend',ingredientLine());if(b.dataset.creator==='remove')b.closest('.component-line').remove();if(b.dataset.creator==='import'){await importDish(api,Number(b.dataset.dish));renderPlatform();notify('Receta añadida al menú de tienda.')}updatePreview()}catch(err){notify(err.message)}});
document.addEventListener('dragstart',e=>{const el=e.target.closest('[data-dish],[data-pr]');if(el)e.dataTransfer.setData('text/plain',el.dataset.dish??el.dataset.pr)});
document.addEventListener('dragover',e=>{if(e.target.closest('#combo-drop,#store-menu-drop'))e.preventDefault()});
document.addEventListener('drop',e=>{const target=e.target.closest('#combo-drop,#store-menu-drop');if(!target)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(target.id==='combo-drop'){const el=[...document.querySelectorAll('[name=product]')].find(x=>x.value===id);if(el)el.checked=true}else [...document.querySelectorAll('[data-dish]')].find(x=>x.dataset.dish===id)?.click()});
