import {createShoppingLookup} from './shopping-search.mjs';
import {byId} from './public/data.js';
import {nutrition as nutrients} from './public/breakfast.js';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const text=(v,max=200)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('Completa los campos y respeta sus límites.');return v.trim()};
const number=(v,min=0,max=10000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail('Cantidad fuera de rango.');return v};
const publicUser=u=>({id:u.id,username:u.username,role:u.role,status:u.status,subscription:u.subscription||"sin demo",storeName:u.storeName,createdAt:u.createdAt});
const digest=v=>createHash('sha256').update(v).digest('hex');
export function createPlatform(directory,{apiKey=process.env.TAVILY_API_KEY,fetcher=fetch}={}){
 const shoppingLookup=createShoppingLookup(apiKey,fetcher);
 const filename=path.join(directory,'plataforma.json');
 const db=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):{users:[],sessions:[],posts:[],products:[],audit:[]};
 db.privateFoods??=[];db.combos??=[];
 const persist=()=>{fs.writeFileSync(filename+'.tmp',JSON.stringify(db,null,2));fs.renameSync(filename+'.tmp',filename)};
 const audit=(actor,action,target)=>{db.audit.unshift({actor:actor.username,action,target,at:new Date().toISOString()});db.audit=db.audit.slice(0,300)};
 const limits=new Map();
 function limit(key,max){const now=Date.now(),v=(limits.get(key)||[]).filter(t=>now-t<60000);if(v.length>=max)fail('Demasiados intentos. Espera un minuto.',429);v.push(now);limits.set(key,v);if(limits.size>5000)limits.clear()}
 function createUser(input,admin=false){
  const username=text(input.username,24).toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username))fail('Usa de 3 a 24 letras sin tildes, números o guion bajo.');
  if(db.users.some(u=>u.username===username))fail('Ese nombre de usuario ya está ocupado.',409);
  const password=input.password;if(typeof password!=='string'||password.length<10||password.length>128)fail('La contraseña debe tener entre 10 y 128 caracteres.');
  const salt=randomBytes(16).toString('hex');
  const role=admin?'admin':input.role==='store'?'store':'user';
  const u={id:randomUUID(),username,salt,hash:scryptSync(password,salt,64).toString('hex'),role,status:'active',storeName:role==='store'?text(input.storeName,80):'',createdAt:new Date().toISOString()};db.users.push(u);audit(u,'Creó cuenta',u.username);persist();return u;
 }
 function session(req){const token=/(?:^|;\s*)mesa_session=([^;]+)/.exec(req.headers.cookie||'')?.[1];const s=token&&db.sessions.find(s=>s.hash===digest(token)&&s.expires>Date.now());return s&&db.users.find(u=>u.id===s.userId&&u.status==='active')}
 function requireUser(req,role){const u=session(req);if(!u)fail('Inicia sesión para continuar.',401);if(role&&u.role!==role)fail('No tienes permisos para esta operación.',403);return u}
 function author(id){const u=db.users.find(u=>u.id===id);return u?{username:u.username,role:u.role,storeName:u.storeName}:{username:'cuenta_eliminada',role:'user'}}
 function visible(post){return post.status==='published'&&db.users.some(u=>u.id===post.authorId&&u.status==='active')}
 function productPhoto(value){
  if(!value)return '';
  if(typeof value==='string'&&value.length<=380000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value)&&Buffer.from(value.split(',')[1],'base64').subarray(0,3).toString('hex')==='ffd8ff')return value;
  if(typeof value==='string'&&/^https:\/\//i.test(value))return text(value,1800);
  fail('Usa una foto JPEG subida o una dirección HTTPS.');
 }
 function productComponents(items){
  if(!Array.isArray(items)||items.length>40)fail('Revisa los ingredientes.');
  return items.map(x=>{if(!x||!Object.hasOwn(byId,x.id))fail('Ingrediente desconocido.');return {id:x.id,grams:number(x.grams,.1,100000),price:number(x.price,0,100000)}});
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
  if(p==='/api/private-foods'){
   const u=requireUser(req);
   if(method==='GET'){send(200,db.privateFoods.filter(f=>f.owner===u.id));return true}
   if(method==='POST'){const x=await body(req);const n=Object.fromEntries(['protein','carbs','fat','fiber','vitamin'].map(k=>[k,number(x[k]??0,0,k==='vitamin'?10000:100)]));if(!Object.values(n).some(Boolean))fail('Indica al menos un nutriente por 100 g.');const food={id:randomUUID(),owner:u.id,name:text(x.name,80),...n};db.privateFoods.push(food);persist();send(201,food);return true}
  }
  if(p==='/api/combos'&&method==='POST'){const u=requireUser(req,'store'),x=await body(req);if(!Array.isArray(x.items)||x.items.length<2||new Set(x.items.map(i=>i.id)).size!==x.items.length)fail('Elige al menos dos productos diferentes.');const items=x.items.map(i=>{const pr=db.products.find(pr=>pr.id===i.id&&pr.authorId===u.id);if(!pr)fail('Producto ajeno o inexistente');return {name:pr.name,id:i.id,price:pr.price,discount:number(i.discount,0,100)}});const combo={id:randomUUID(),authorId:u.id,name:text(x.name,100),items,total:+items.reduce((a,i)=>a+i.price*(1-i.discount/100),0).toFixed(2)};db.combos.push(combo);audit(u,'Publicó oferta',combo.name);persist();send(201,combo);return true}
  if(p==='/api/combos'&&method==='GET'){send(200,db.combos.filter(c=>db.users.some(u=>u.id===c.authorId&&u.status==='active')).map(c=>({...c,author:author(c.authorId)})));return true}
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
   const post={id:randomUUID(),authorId:u.id,type,title:text(input.title,100),...data,status:'published',createdAt:new Date().toISOString()};db.posts.unshift(post);audit(u,'Publicó '+type,post.title);persist();send(201,{...post,author:author(u.id)});return true;
  }
  if(p==='/api/store'&&method==='GET'){const u=requireUser(req,'store');send(200,{products:db.products.filter(p=>p.authorId===u.id),combos:db.combos.filter(p=>p.authorId===u.id),posts:db.posts.filter(p=>p.authorId===u.id)});return true}
  if(p==='/api/products'&&method==='GET'){send(200,db.products.filter(p=>db.users.some(u=>u.id===p.authorId&&u.status==='active')).map(p=>({...p,author:author(p.authorId)})));return true}
  if(p==='/api/products'&&method==='POST'){const u=requireUser(req,'store'),input=await body(req);const product={id:randomUUID(),authorId:u.id,name:text(input.name,100),unit:text(input.unit,60),price:number(input.price,0,100000),description:text(input.description,600),location:input.location?text(input.location,100):'',photo:productPhoto(input.photo),design:number(input.design??0,0,2),components:productComponents(input.components??[])};db.products.unshift(product);audit(u,'Publicó producto',product.name);persist();send(201,product);return true}
  if(p==='/api/content'&&method==='DELETE'){const u=requireUser(req),input=await body(req);const list=input.kind==='product'?db.products:db.posts;const i=list.findIndex(x=>x.id===input.id&&x.authorId===u.id);if(i<0)fail('Contenido inexistente.',404);if(input.kind==='product'&&db.posts.some(p=>p.productIds?.includes(input.id)))fail('Este producto está vinculado a una receta.');if(db.posts.some(p=>p.days?.includes(input.id)))fail('Esta receta está incluida en un plan semanal.');audit(u,'Retiró contenido',list[i].title||list[i].name);list.splice(i,1);persist();send(200,{ok:true});return true}
  if(p==='/api/admin'&&method==='GET'){requireUser(req,'admin');send(200,{users:db.users.map(publicUser),posts:db.posts.map(p=>({...p,author:author(p.authorId)})),products:db.products.map(p=>({...p,author:author(p.authorId)})),audit:db.audit,searchConfigured:!!apiKey});return true}
  if(p==='/api/admin/subscription'&&method==='PATCH'){
   const u=requireUser(req,'admin'),x=await body(req),account=db.users.find(a=>a.id===x.id);
   if(!account||account.role==='admin'||!['demo activa','congelada'].includes(x.state))fail('Cuenta o estado inválido.');
   if(x.state==='congelada'&&account.subscription!=='demo activa')fail('Primero activa la demo.');
   account.subscription=x.state;audit(u,'Suscripción '+x.state,account.username);persist();send(200,{ok:true});return true;
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
