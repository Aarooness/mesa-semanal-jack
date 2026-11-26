import {createShoppingLookup} from './shopping-search.mjs';
import {byId,deliverySlots} from './public/data.js';
import {nutrition as nutrients,recipes} from './public/breakfast.js';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const text=(v,max=200)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('Completa los campos y respeta sus límites.');return v.trim()};
const number=(v,min=0,max=10000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail('Cantidad fuera de rango.');return v};
const premium=u=>u?.subscription==='demo activa'&&(!u.expires||Date.parse(u.expires)>Date.now());
const publicUser=u=>({id:u.id,username:u.username,role:u.role,status:u.status,specialty:u.specialty||'ambos',premium:premium(u),expires:u.expires,subscription:u.subscription||"sin demo",storeName:u.storeName,createdAt:u.createdAt});
const digest=v=>createHash('sha256').update(v).digest('hex');
export function createPlatform(directory,{apiKey=process.env.TAVILY_API_KEY,fetcher=fetch,dataDir=directory}={}){
 const shoppingLookup=createShoppingLookup(apiKey,fetcher);
 const filename=path.join(dataDir,'plataforma.json');
 const db=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):{users:[],sessions:[],posts:[],products:[],audit:[]};
 db.reviews??=[];db.orders??=[];db.carts??={};db.privateFoods??=[];db.combos??=[];
 const persist=()=>{fs.writeFileSync(filename+'.tmp',JSON.stringify(db,null,2));fs.renameSync(filename+'.tmp',filename)};
 let updatedPhotos=false;
 for(const post of db.posts){
  if(post.type!=='recipe'||post.photo||!db.users.some(u=>u.id===post.authorId&&u.role==='store'))continue;
  const recipe=recipes.find(r=>r.name===post.title);
  if(recipe){post.photo='/fotos/'+recipe.photo;updatedPhotos=true}
 }
 if(updatedPhotos)persist();
 const audit=(actor,action,target)=>{db.audit.unshift({actor:actor.username,action,target,at:new Date().toISOString()});db.audit=db.audit.slice(0,300)};
 const limits=new Map();
 function limit(key,max){const now=Date.now(),v=(limits.get(key)||[]).filter(t=>now-t<60000);if(v.length>=max)fail('Demasiados intentos. Espera un minuto.',429);v.push(now);limits.set(key,v);if(limits.size>5000)limits.clear()}
 function createUser(input,admin=false){
  const username=text(input.username,24).toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username))fail('Usa de 3 a 24 letras sin tildes, números o guion bajo.');
  if(db.users.some(u=>u.username===username))fail('Ese nombre de usuario ya está ocupado.',409);
  const password=input.password;if(typeof password!=='string'||password.length<10||password.length>128)fail('La contraseña debe tener entre 10 y 128 caracteres.');
  const salt=randomBytes(16).toString('hex');
  const role=admin?'admin':input.role==='store'?'store':'user';
  const specialty=input.specialty||'ambos';if(!['ambos','ingredientes','desayunos'].includes(specialty))fail('Especialidad desconocida.');const u={specialty,id:randomUUID(),username,salt,hash:scryptSync(password,salt,64).toString('hex'),role,status:'active',storeName:role==='store'?text(input.storeName,80):'',createdAt:new Date().toISOString()};db.users.push(u);audit(u,'Creó cuenta',u.username);persist();return u;
 }
 function session(req){const token=/(?:^|;\s*)mesa_session=([^;]+)/.exec(req.headers.cookie||'')?.[1];const s=token&&db.sessions.find(s=>s.hash===digest(token)&&s.expires>Date.now());return s&&db.users.find(u=>u.id===s.userId&&u.status==='active')}
 function requireUser(req,role){const u=session(req);if(!u)fail('Inicia sesión para continuar.',401);if(role&&u.role!==role)fail('No tienes permisos para esta operación.',403);return u}
 function author(id){const u=db.users.find(u=>u.id===id);return u?{username:u.username,role:u.role,storeName:u.storeName}:{username:'cuenta_eliminada',role:'user'}}
 function visible(post){return post.status==='published'&&db.users.some(u=>u.id===post.authorId&&u.status==='active')}
 function productPhoto(value){
  if(!value)return '';if(typeof value==='string'&&/^\/fotos\/[a-z0-9_-]+\.(png|jpg)$/.test(value)&&fs.existsSync(path.join(directory,'public',value)))return value;
  if(typeof value==='string'&&value.length<=380000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value)&&Buffer.from(value.split(',')[1],'base64').subarray(0,3).toString('hex')==='ffd8ff')return value;
  if(typeof value==='string'&&/^https:\/\//i.test(value))return text(value,1800);
  fail('Usa una foto JPEG subida o una dirección HTTPS.');
 }
 function productComponents(items){
  if(!Array.isArray(items)||items.length>40)fail('Revisa los ingredientes.');
  return items.map(x=>{if(!x||!Object.hasOwn(byId,x.id))fail('Ingrediente desconocido.');return {id:x.id,grams:number(x.grams,.1,100000),}});
 }
 function recipe(input){
  if(!Array.isArray(input.ingredients)||input.ingredients.length<1||input.ingredients.length>40)fail('Añade entre 1 y 40 ingredientes.');
  const ingredients=input.ingredients.map(i=>({name:text(i.name,100),amount:text(i.amount,60)}));
  const n=input.nutrition||{};const nutrition={protein:number(n.protein,0,500),carbs:number(n.carbs,0,1000),fat:number(n.fat,0,500)};
  nutrition.kcal=Math.round(nutrition.protein*4+nutrition.carbs*4+nutrition.fat*9);if(!nutrition.kcal&&!input.lines)fail('Indica los macronutrientes por porción.');
  const productIds=Array.isArray(input.productIds)?[...new Set(input.productIds)]:[];
  return {ingredients,preparation:text(input.preparation,5000),nutrition,productIds};
 }
 return {createUser,requireUser,async handle(req,res,url,body,send){
  const p=url.pathname,method=req.method;if(!p.startsWith('/api/'))return false;
  if(p==='/api/store-logo'&&method==='POST'){const u=requireUser(req,'store'),input=await body(req),logo=productPhoto(input.photo);if(!logo)fail('Elige un logo.');u.logo=logo;audit(u,'Actualizó logo',u.storeName);persist();send(200,{ok:true});return true}
  if(p==='/api/store-directory'&&method==='GET'){send(200,db.users.filter(a=>a.role==='store'&&a.status==='active').map(a=>({name:a.storeName,logo:a.logo||(fs.existsSync(path.join(directory,"public","logos",a.username+".svg"))?"/logos/"+a.username+".svg":null),username:a.username,specialty:a.specialty||'ambos',ingredients:db.products.filter(i=>i.authorId===a.id&&i.kind==='ingrediente').length})));return true}
  if(p==='/api/store-visit'&&method==='POST'){
   const user=requireUser(req);
   const {username}=await body(req);
   const shop=db.users.find(a=>a.username===username&&a.role==='store'&&a.status==='active');
   if(user.role==='user'&&shop&&!(user.visitedStores||[]).includes(shop.id)){
    (user.visitedStores??=[]).push(shop.id);persist();
   }
   send(200,{ok:true});return true;
  }
  if(p==='/api/market'){
   const u=requireUser(req),cart=db.carts[u.id]??=[],ownOrders=db.orders.filter(o=>o.buyer===u.id);
   const visibleOrders=db.orders.filter(o=>u.role==='admin'||o.buyer===u.id||o.store===u.id);
   if(method==='GET'){const offers=db.products.filter(pr=>db.users.some(a=>a.id===pr.authorId&&a.status==='active')&&(pr.kind!=='ingrediente'||premium(u))).map(pr=>({...pr,storeName:author(pr.authorId).storeName}));
    const cartView=cart.map(item=>({...item,photo:db.products.find(p=>p.id===item.id)?.photo||item.photo||''}));const familiar=new Set([...(u.visitedStores||[]),...ownOrders.filter(o=>['pagado','enviado','recibido','reclamo'].includes(o.state)).map(o=>o.store)]);
    const alerts=u.role==='user'&&premium(u)?offers.filter(o=>o.kind==='ingrediente'&&o.reduction&&familiar.has(o.authorId)).map(o=>({name:o.name,shop:o.storeName,username:author(o.authorId).username,price:o.price,unit:o.unit,previous:o.reduction.previous,at:o.reduction.at})).sort((a,b)=>b.at-a.at):[];
    send(200,{alerts,offers,cart:cartView,orders:visibleOrders,sub:premium(u),reserved:[...cart,...ownOrders.filter(o=>!['recibido','reclamo','rechazado'].includes(o.state)).flatMap(o=>o.items||[])]});return true}
   const x=await body(req);
   if(x.action==='add'||x.action==='addPremium'){
    if(x.action==='addPremium'&&!premium(u))fail('Esta comparación requiere una suscripción activa.',403);
    if(u.role!=='user')fail('Usa una cuenta personal.',403);
    const pr=db.products.find(pr=>pr.id===x.id&&db.users.some(a=>a.id===pr.authorId&&a.status==='active'));if(!pr)fail('Producto no disponible.',404);
    const qty=x.qty===undefined?1:x.qty;
    const existing=cart.find(i=>i.id===pr.id);
    if(!Number.isSafeInteger(qty)||qty<1||!Number.isSafeInteger((existing?.qty||0)+qty))fail('Elige un número entero de envases.');
    if(existing)existing.qty+=qty;else cart.push({id:pr.id,name:pr.name,food:pr.food,store:pr.authorId,shop:author(pr.authorId).storeName,grams:parseFloat(pr.unit)*(pr.unit.endsWith('kg')?1000:1)||0,price:pr.price,qty});db.carts[u.id]=cart;
   }else if(x.action==='minus'){const i=cart.findIndex(r=>r.id===x.id);if(i>=0&&--cart[i].qty<=0)cart.splice(i,1)}
   else if(['checkout','subscribe'].includes(x.action)){
    if(u.role!=='user'||!['Yape','Plin','Transferencia'].includes(x.method))fail('Revisa el pago.');
    const reference=randomUUID();
    const common={buyer:u.id,buyerName:u.username,state:'pendiente de pago',method:x.method,reference,created:new Date().toISOString()};
    if(x.action==='subscribe'){if(![1,3,12].includes(x.months))fail('Duración inválida.');db.orders.unshift({...common,id:randomUUID(),months:x.months,total:({1:9,3:24,12:84})[x.months]})}
    else{if(!cart.length||cart.some(i=>!db.products.some(p=>p.id===i.id&&db.users.some(a=>a.id===p.authorId&&a.status==='active'))))fail('Revisa tu canasta y suscripción.');
     for(const items of Map.groupBy(cart,i=>i.store+':'+(i.food?'ingredientes':'desayunos')).values()){db.orders.unshift({...common,id:randomUUID(),store:items[0].store,category:items[0].food?'Ingredientes':'Productos y desayunos',items,total:+items.reduce((t,i)=>t+i.price*i.qty,0).toFixed(2)})}db.carts[u.id]=[]}
    audit(u,'Registró pedido',reference);
   }else if(x.action==='retry'){
    const previous=db.orders.find(o=>o.id===x.id);
    if(!previous||(previous.buyer!==u.id&&previous.store!==u.id))fail('Este pedido no pertenece a tu cuenta.',403);
    if(previous.state!=='rechazado'||previous.retryId)fail('Este intento ya se procesó.',409);
    if(!db.users.some(a=>a.id===previous.buyer&&a.status==='active'))fail('La cuenta del comprador no está activa.');
    if(previous.store&&(!db.users.some(a=>a.id===previous.store&&a.status==='active')||previous.items.some(i=>!db.products.some(p=>p.id===i.id&&p.authorId===previous.store))))fail('La tienda o algún producto ya no está disponible.');
    const method=u.id===previous.buyer?(x.method??previous.method):previous.method;
    if(!['Yape','Plin','Transferencia'].includes(method))fail('Elige un medio de pago.');
    const {buyer,buyerName,total,months,store,category,items}=previous;
    const next={id:randomUUID(),reference:randomUUID(),created:new Date().toISOString(),state:'pendiente de pago',buyer,buyerName,total,months,store,category,items,method,retryOf:previous.id,attempt:(previous.attempt||1)+1};
    previous.retryId=next.id;db.orders.unshift(next);audit(u,'Reintentó pedido',next.id);
   }else if(x.action==='transition'){
    const o=db.orders.find(o=>o.id===x.id);if(!o)fail('Pedido inexistente.',404);
    if(x.state==='aceptado'&&o.state==='pendiente de pago'&&u.role==='store'&&o.store===u.id){}
    else if(x.state==='rechazado'&&['pendiente de pago','aceptado'].includes(o.state)&&u.role==='admin'){o.rejectionReason=x.note?text(x.note,500):''}
    else if(x.state==='pagado'&&['pendiente de pago','aceptado'].includes(o.state)&&u.role==='admin'){if(o.months){const buyer=db.users.find(a=>a.id===o.buyer);buyer.subscription='demo activa';const until=new Date(Math.max(Date.now(),Date.parse(buyer.expires)||0));until.setMonth(until.getMonth()+o.months);buyer.expires=until.toISOString()}}
    else if(x.state==='enviado'&&o.state==='pagado'&&o.store===u.id&&u.role==='store'){if(!deliverySlots.includes(x.eta))fail('Selecciona un horario de entrega.');o.eta=x.eta}
    else if(['recibido','reclamo'].includes(x.state)&&o.state==='enviado'&&o.buyer===u.id){if(x.state==='reclamo')o.note=text(x.note,500)}
    else fail('Transición no permitida.',403);
    o.state=x.state;audit(u,'Pedido '+o.state,o.id);
   }else fail('Acción desconocida.');
   persist();send(200,{ok:true});return true;
  }
  if(p==='/api/private-foods'){
   const u=requireUser(req);
   if(method==='GET'){send(200,db.privateFoods.filter(f=>f.owner===u.id));return true}
   if(method==='POST'){if(u.role==='store'&&u.specialty==='desayunos')fail('Selecciona un ingrediente existente.',403);const x=await body(req);const n=Object.fromEntries(['protein','carbs','fat','fiber','vitamin'].map(k=>[k,number(x[k]??0,0,k==='vitamin'?10000:100)]));if(!Object.values(n).some(Boolean))fail('Indica al menos un nutriente por 100 g.');const food={id:randomUUID(),owner:u.id,name:text(x.name,80),...n};db.privateFoods.push(food);persist();send(201,food);return true}
  }
  if(p==='/api/combos'&&method==='POST'){const u=requireUser(req,'store'),x=await body(req);if(!Array.isArray(x.items)||x.items.length<2||new Set(x.items.map(i=>i.id)).size!==x.items.length)fail('Elige al menos dos productos diferentes.');const items=x.items.map(i=>{const pr=db.products.find(pr=>pr.id===i.id&&pr.authorId===u.id);if(!pr)fail('Producto ajeno o inexistente');return {name:pr.name,id:i.id,price:pr.price,discount:number(i.discount,0,100)}});const combo={id:randomUUID(),authorId:u.id,name:text(x.name,100),items,total:+items.reduce((a,i)=>a+i.price*(1-i.discount/100),0).toFixed(2)};db.combos.push(combo);audit(u,'Publicó oferta',combo.name);persist();send(201,combo);return true}
  if(p==='/api/combos'&&method==='GET'){send(200,db.combos.filter(c=>db.users.some(u=>u.id===c.authorId&&u.status==='active')).map(c=>({...c,author:author(c.authorId)})));return true}
  if (method==='POST' && ['/api/recovery','/api/recovery/reset','/api/admin/recovery'].includes(p)) {
   const moderator=p==='/api/admin/recovery'?requireUser(req,'admin'):null;
   if(!moderator) limit('recovery:'+req.socket.remoteAddress,12);
   const input=await body(req);
   db.recoveries=(db.recoveries||[]).filter(r=>r.expires>Date.now());
   const target=db.users.find(u=>u.username===String(input.username||'').trim().toLowerCase() && ['user','store'].includes(u.role) && u.status==='active');
   const request=target&&db.recoveries.find(r=>r.userId===target.id);
   if(p==='/api/recovery'){
    if(target&&!request){db.recoveries.push({userId:target.id,expires:Date.now()+86400000});persist()}
    send(200,{ok:true});return true;
   }
   if(moderator){
    if(!request||request.hash)fail('Solicitud pendiente inexistente.',404);
    if(!['approve','deny'].includes(input.decision))fail('Decisión inválida.');
    let code;
    if(input.decision==='approve'){code=randomBytes(12).toString('hex');request.hash=digest(code);request.expires=Date.now()+1800000}
    else db.recoveries=db.recoveries.filter(r=>r!==request);
    audit(moderator,input.decision==='approve'?'Autorizó recuperación':'Denegó recuperación',target.username);
    persist();res.setHeader('Cache-Control','no-store');send(200,{code});return true;
   }
   if(!request?.hash||!timingSafeEqual(Buffer.from(request.hash,'hex'),Buffer.from(digest(String(input.code||'').trim()),'hex')))fail('Código inválido o vencido.');
   if(typeof input.password!=='string'||input.password.length<10||input.password.length>128)fail('Usa entre 10 y 128 caracteres.');
   target.salt=randomBytes(16).toString('hex');target.hash=scryptSync(input.password,target.salt,64).toString('hex');
   db.sessions=db.sessions.filter(s=>s.userId!==target.id);db.recoveries=db.recoveries.filter(r=>r!==request);
   audit(target,'Restableció contraseña',target.username);persist();send(200,{ok:true});return true;
  }
  if(p==='/api/account'&&method==='GET'){send(200,{user:session(req)?publicUser(session(req)):null});return true}
  if(['/api/register','/api/login'].includes(p)&&method==='POST'){
   limit('auth:'+req.socket.remoteAddress,15);const input=await body(req);let u;
   if(p.endsWith('register'))u=createUser(input);
   else{u=db.users.find(u=>u.username===String(input.username||'').toLowerCase().trim());const salt=u?.salt||'invalid-account';const hash=scryptSync(String(input.password||'').slice(0,128),salt,64);if(!u||!timingSafeEqual(Buffer.from(u.hash,'hex'),hash)||u.status!=='active')fail('Usuario o contraseña incorrectos.',401)}
   if(p.endsWith('login')&&input.access&&((input.access==='store')!==(u.role==='store')))fail('Selecciona el acceso correspondiente a tu cuenta.',403);
   const token=randomBytes(32).toString('hex');db.sessions=db.sessions.filter(s=>s.expires>Date.now());db.sessions.push({hash:digest(token),userId:u.id,expires:Date.now()+7*86400000});persist();res.setHeader('Set-Cookie','mesa_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'+(req.socket.encrypted?'; Secure':''));send(200,{user:publicUser(u)});return true;
  }
  if(p==='/api/logout'&&method==='POST'){const token=/(?:^|;\s*)mesa_session=([^;]+)/.exec(req.headers.cookie||'')?.[1];db.sessions=db.sessions.filter(s=>s.hash!==digest(token||''));persist();res.setHeader('Set-Cookie','mesa_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');send(200,{ok:true});return true}
  if(p==='/api/community'&&method==='GET'){send(200,db.posts.filter(visible).map(post=>({...post,author:author(post.authorId)})));return true}
  if(p==='/api/community'&&method==='POST'){
   const u=requireUser(req),input=await body(req);limit('post:'+u.id,15);
   const type=input.type==='plan'?'plan':'recipe';if(type==='plan'&&u.role!=='store')fail('Los planes promocionales son exclusivos de tiendas.',403);
   let data;
   if(type==='recipe'){
    if(input.lines){
     if(!Array.isArray(input.lines)||!input.lines.length||input.lines.length>40)fail('Selecciona entre 1 y 40 ingredientes.');
     const sum={protein:0,carbs:0,fat:0,fiber:0,vitamin:0};
     input.ingredients=input.lines.map(line=>{const g=number(line.grams,.1,2000),f=Object.hasOwn(byId,line.id)?byId[line.id]:db.privateFoods.find(f=>f.id===line.id&&f.owner===u.id);if(!f)fail('Ingrediente no disponible.');
      const n=f.owner?f:nutrients([[f.id,100]]);for(const k of Object.keys(sum))sum[k]+=(n[k]??n.carb??0)*g/100;
      return {name:f.name,amount:g+' g'}});input.nutrition=sum;
    }
    data=recipe(input);if(input.lines){data.nutrition.fiber=input.nutrition.fiber;data.nutrition.vitamin=input.nutrition.vitamin}
if(data.productIds.some(id=>!db.products.some(pr=>pr.id===id&&pr.authorId===u.id)))fail('Selecciona productos propios.');}
   else{if(!Array.isArray(input.days)||input.days.length!==7||input.days.some(id=>!db.posts.some(p=>p.id===id&&p.authorId===u.id&&p.type==='recipe'&&visible(p))))fail('Selecciona una receta propia publicada para cada día.');data={days:input.days}}
   if(type==='recipe'&&u.role==='store'&&!input.photo)fail('Añade una foto de la receta.');
   const post={id:randomUUID(),authorId:u.id,type,photo:type==='recipe'?productPhoto(input.photo):'',title:text(input.title,100),...data,status:'published',createdAt:new Date().toISOString()};db.posts.unshift(post);audit(u,'Publicó '+type,post.title);persist();send(201,{...post,author:author(u.id)});return true;
  }
  if(p==='/api/store'&&method==='GET'){const u=requireUser(req,'store');send(200,{products:db.products.filter(p=>p.authorId===u.id),combos:db.combos.filter(p=>p.authorId===u.id),posts:db.posts.filter(p=>p.authorId===u.id)});return true}
  if(p==='/api/products'&&method==='GET'){send(200,db.products.filter(p=>db.users.some(u=>u.id===p.authorId&&u.status==='active')).map(p=>({...p,author:author(p.authorId)})));return true}
  if(p==='/api/products'&&['POST','PATCH'].includes(method)){
   const u=requireUser(req,'store'),input=await body(req);
   const old=method==='PATCH'?db.products.find(p=>p.id===input.id&&p.authorId===u.id):null;
   if(method==='PATCH'&&!old)fail('Producto inexistente en tu tienda.',404);
   const kind=old?(old.kind||'desayuno'):(input.kind||'desayuno');
   if(old&&!input.photo)input.photo=old.photo;
   if(old&&input.unit!==old.unit&&(!/^\d+(\.\d+)? (g|kg)$/.test(input.unit)||parseFloat(input.unit)<=0))fail('Elige un peso positivo en g o kg.');
   if(!['ingrediente','desayuno'].includes(kind)||kind==='ingrediente'&&u.specialty==='desayunos'||kind==='desayuno'&&u.specialty==='ingredientes')fail('Producto fuera de tu especialidad.',403);
if(!input.photo)fail('Añade una foto al producto.');if(kind==='ingrediente'&&(!Object.hasOwn(byId,input.food)||!/^\d+(\.\d+)? (g|kg)$/.test(input.unit)||parseFloat(input.unit)<=0))fail('Elige un ingrediente y su peso.');const components=productComponents(input.components??[]);const composition=components.length?nutrients(components.map(i=>[i.id,i.grams])):null;
const product={preparation:typeof input.preparation==='string'?input.preparation.slice(0,2000):'',composition,kind,food:kind==='ingrediente'?input.food:null,id:old?.id||randomUUID(),authorId:u.id,name:text(input.name,100),unit:text(input.unit,60),price:number(input.price,0,100000),description:text(input.description,600),location:input.location?text(input.location,100):'',photo:productPhoto(input.photo),design:number(input.design??0,0,2),components};
   if(old){
    if(kind==='ingrediente'){
     if(old.food!==product.food||old.unit!==product.unit||product.price>old.price)delete old.reduction;
     else if(product.price<old.price)old.reduction={previous:old.price,at:Date.now()};
    }
    Object.assign(old,product);
    for(const cart of Object.values(db.carts)){
     const item=cart.find(i=>i.id===old.id);
     if(item)Object.assign(item,{name:old.name,food:old.food,price:old.price,grams:parseFloat(old.unit)*(old.unit.endsWith('kg')?1000:1)||0});
    }
    for(const combo of db.combos){
     const item=combo.items.find(i=>i.id===old.id);if(!item)continue;
     Object.assign(item,{name:old.name,price:old.price});
     combo.total=+combo.items.reduce((sum,i)=>sum+i.price*(1-i.discount/100),0).toFixed(2);
    }
   }else db.products.unshift(product);
   audit(u,old?'Editó producto':'Publicó producto',product.name);persist();send(old?200:201,product);return true}
  if(p==='/api/content'&&method==='DELETE'){const u=requireUser(req),input=await body(req);const list=input.kind==='product'?db.products:db.posts;const i=list.findIndex(x=>x.id===input.id&&x.authorId===u.id);if(i<0)fail('Contenido inexistente.',404);if(input.kind==='product'&&db.posts.some(p=>p.productIds?.includes(input.id)))fail('Este producto está vinculado a una receta.');if(db.posts.some(p=>p.days?.includes(input.id)))fail('Esta receta está incluida en un plan semanal.');audit(u,'Retiró contenido',list[i].title||list[i].name);list.splice(i,1);persist();send(200,{ok:true});return true}
  if(p==='/api/my-reviews'&&method==='GET'){
   const u=requireUser(req);send(200,db.reviews.filter(r=>r.authorId===u.id));return true;
  }
  if(p==='/api/admin/publication'&&['PATCH','DELETE'].includes(method)){
   const u=requireUser(req,'admin'),x=await body(req);
   const list={post:db.posts,product:db.products,combo:db.combos}[x.kind];
   const publication=Array.isArray(list)&&list.find(item=>item.id===x.id);
   if(!publication)fail('Publicación inexistente.',404);
   const denied=method==='DELETE';
   const note=denied&&!x.note?'':text(x.note,1000);
   const title=publication.title||publication.name;
   db.reviews.unshift({id:publication.id,authorId:publication.authorId,title,note,denied,at:new Date().toISOString()});
   if(denied){
    list.splice(list.indexOf(publication),1);
    if(x.kind==='product'){
     for(const post of db.posts)if(post.productIds)post.productIds=post.productIds.filter(id=>id!==x.id);
     for(const cart of Object.values(db.carts)){const i=cart.findIndex(row=>row.id===x.id);if(i>=0)cart.splice(i,1)}
     db.combos=db.combos.filter(combo=>!combo.items.some(row=>row.id===x.id));
    }else if(x.kind==='post'){
     for(const plan of db.posts)if(plan.days)plan.days=plan.days.map(id=>id===x.id?null:id);
    }
   }
   audit(u,denied?'Denegó publicación':'Dejó observaciones',title);persist();send(200,{ok:true});return true;
  }
  if(p==='/api/admin'&&method==='GET'){requireUser(req,'admin');send(200,{recoveries:(db.recoveries||[]).filter(r=>!r.hash&&r.expires>Date.now()).map(r=>db.users.find(u=>u.id===r.userId)).filter(u=>u?.status==="active").map(publicUser),reviews:db.reviews,combos:db.combos.map(c=>({...c,author:author(c.authorId)})),users:db.users.map(publicUser),posts:db.posts.map(p=>({...p,author:author(p.authorId)})),products:db.products.map(p=>({...p,author:author(p.authorId)})),audit:db.audit,searchConfigured:!!apiKey});return true}
  if(p==='/api/admin/subscription'&&method==='PATCH'){
   const u=requireUser(req,'admin'),x=await body(req),account=db.users.find(a=>a.id===x.id);
   if(!account||account.role==='admin'||!['demo activa','congelada'].includes(x.state))fail('Cuenta o estado inválido.');
   if(x.state==='congelada'&&account.subscription!=='demo activa')fail('Primero activa la demo.');
   account.subscription=x.state;if(x.state==='demo activa')account.expires=null;audit(u,'Suscripción '+x.state,account.username);persist();send(200,{ok:true});return true;
  }
  if(p==='/api/admin/dish'&&['PATCH','DELETE'].includes(method)){
   const u=requireUser(req,'admin'),x=await body(req),post=db.posts.find(p=>p.id===x.id&&p.type==='recipe'&&db.users.some(a=>a.id===p.authorId&&a.role==='store'));
   if(!post)fail('Plato de tienda inexistente.',404);
   if(method==='DELETE'){if(db.posts.some(p=>p.days?.includes(post.id)))fail('El plato forma parte de un plan. Puedes ocultarlo.');db.posts=db.posts.filter(p=>p!==post)}
   else{const title=text(x.title,100),preparation=text(x.preparation,2000);Object.assign(post,{title,preparation})}
   audit(u,method==='DELETE'?'Eliminó plato':'Editó plato',post.title);persist();send(200,{ok:true});return true;
  }
  if(p==='/api/admin/users'&&method==='PATCH'){
   const u=requireUser(req,'admin'),input=await body(req),target=db.users.find(u=>u.id===input.id);if(!target)fail('Cuenta inexistente.',404);if(target.id===u.id)fail('No puedes cambiar tus propios permisos o suspenderte.');
   if(input.status!==undefined){if(!['active','suspended'].includes(input.status))fail('Estado inválido.');target.status=input.status}
   if(input.role!==undefined){if(!['user','store','admin'].includes(input.role))fail('Rol inválido.');target.role=input.role;if(input.role==='store'&&!target.storeName)target.storeName=target.username}
   db.sessions=db.sessions.filter(s=>s.userId!==target.id);audit(u,'Actualizó cuenta',target.username);persist();send(200,publicUser(target));return true;
  }
  if(p==='/api/admin/posts'&&method==='PATCH'){const u=requireUser(req,'admin'),input=await body(req),post=db.posts.find(p=>p.id===input.id);if(!post)fail('Publicación inexistente.',404);if(!['published','hidden'].includes(input.status))fail('Estado inválido.');post.status=input.status;audit(u,'Moderó publicación',post.title);persist();send(200,{ok:true});return true}
  if(p==='/api/shopping-sources'&&method==='POST'){
   const u=requireUser(req),{items}=await body(req);
   if(!Array.isArray(items)||!items.length||items.length>Object.keys(byId).length||items.some(x=>!x||!Object.hasOwn(byId,x.id)||!Number.isInteger(x.shop)||x.shop<0||x.shop>3)||new Set(items.map(x=>x.id)).size!==items.length)fail('Selecciona una lista de compra válida.');
   limit('shopping:'+u.id,6);
   send(200,{results:await shoppingLookup(items)});return true;
  }
  if(p==='/api/search'&&method==='POST'){
   const u=requireUser(req);limit('search:'+u.id,6);if(!apiKey)fail('Tavily aún no está configurado en el servidor.',503);const input=await body(req),query=text(input.query,220),city=text(input.city||'Lima, Perú',80);
   const r=await fetcher('https://api.tavily.com/search',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({query:'comprar '+query+' '+city+' precio tienda online'+(input.independent?' tienda especializada venta por unidad':''),country:'peru',search_depth:'basic',max_results:8,include_raw_content:false,include_answer:false,...(input.independent?{exclude_domains:['wong.pe','metro.pe','plazavea.com.pe']}:{})}),signal:AbortSignal.timeout(20000)});
   if(!r.ok)fail(r.status===401?'La clave de Tavily no fue aceptada.':r.status===429?'Tavily alcanzó su límite de consultas.':'Tavily no pudo completar la búsqueda.',502);
   const result=await r.json();send(200,{results:(result.results||[]).filter(x=>/^https?:\/\//i.test(x.url)).map(x=>({title:x.title,url:x.url,content:x.content})),searchedAt:new Date().toISOString()});return true;
  }
  return false;
 }};
}
