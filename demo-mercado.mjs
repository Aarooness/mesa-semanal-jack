import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {byId} from './public/data.js';
import {recipes} from './public/breakfast.js';
const base='http://127.0.0.1:8734/api/',file='.cuentas-demo.txt';
const accounts=fs.existsSync(file)?fs.readFileSync(file,'utf8').trim().split(/\r?\n/).map(l=>l.split(' | ')):[];
let cookie='';
async function api(path,data,method=data?'POST':'GET'){
 const r=await fetch(base+path,{method,headers:{cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
 const v=await r.json();if(!r.ok)throw Error(path+': '+v.error);cookie=r.headers.get('set-cookie')?.split(';')[0]||cookie;return v;
}
async function use(username,role,storeName,specialty){
 cookie='';let account=accounts.find(a=>a[0]===username);
 if(!account){account=[username,randomBytes(15).toString('base64url'),role];await api('register',{username,password:account[1],role,storeName,specialty});accounts.push(account);fs.writeFileSync(file,accounts.map(a=>a.join(' | ')).join('\n'));}else await api('login',{username,password:account[1]});
}
const stock=['fresa','avena','platano','yogur','huevo','almendra','quinua','cacao','mango','manzana'];
for(const [username,name,specialty,count] of [['mercado_aurora','Mercado Aurora','ambos',10],['huerto_del_valle','Huerto del Valle','ingredientes',5],['desayunos_alba','Desayunos Alba','desayunos',5]]){
 await use(username,'store',name,specialty);
 const own=await api('store');
 for(let i=0;i<count;i++){
  const f=byId[stock[i]],r=recipes[i],dish=specialty==='desayunos',title=dish?r.name:f.name+' · '+name;
  if(own.products.some(p=>p.name===title))continue;
  const components=dish?r.ids.map(id=>({id,grams:Math.max(5,Math.round(byId[id].portion/5)*5)})):[];
  await api('products',{kind:dish?'desayuno':'ingrediente',food:f.id,name:title,unit:dish?components.reduce((s,c)=>s+c.grams,0)+' g':'100 g',price:dish?6+i:+(.95+i*.18+(username==='mercado_aurora'?0:.12)).toFixed(2),components,preparation:dish?r.steps.join(' '):'',location:'Lima · demostración',description:dish?r.description:'Envase de 100 g para completar tu menú.',photo:'/fotos/'+(dish?['batido.jpg','licuado.jpg','porridge.jpg','huevos.jpg','parfait.jpg'][i]:f.id+'.png')});
 }
}
await use('suscriptor_mesa','user');const buyer=(await api('account')).user;
if(!buyer.premium){const admin=accounts.find(a=>a[2]==='admin');if(!admin)throw Error('Activa la demo de suscriptor_mesa desde Administración.');await use(admin[0],'admin');await api('admin/subscription',{id:buyer.id,state:'demo activa'},'PATCH')}
await use('suscriptor_mesa','user');const m=await api('market');console.log('Suscripción activa:',m.sub);for(const shop of ['Mercado Aurora','Huerto del Valle','Desayunos Alba'])console.log(shop,m.offers.filter(o=>o.storeName===shop&&o.kind==='ingrediente').length,'ingredientes,',m.offers.filter(o=>o.storeName===shop&&o.kind!=='ingrediente').length,'desayunos');
