import {byId} from './public/data.js';

const domains=['wong.pe','plazavea.com.pe','vivanda.com.pe','metro.pe'];
const fruit=new Set('platano fresa manzana pera naranja mango pina lucuma arandano kiwi palta'.split(' '));
const words=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/ +/);
const aliases={arandano:['arandano'],fresa:['fresa'],almendra:['almendra'],pasas:['pasa'],avena:['avena'],griego:['griego','griega'],yogur:['yogur','yogurt'],pan:['pan'],nuez:['nuez','nueces'],queso:['queso'],pina:['pina'],platano:['platano','banana']};
function matchesIngredient(id,title){
 const tokens=words(title),wanted=aliases[id]||[words(byId[id].name)[0]];
 const contains=w=>tokens.some(t=>t===w||t===w+'s'||t===w+'es');
 if(!wanted.some(contains))return false;
 if(id==='pan'&&!contains('integral')||id==='queso'&&!contains('crema')||id==='griego'&&!['yogur','yogurt'].some(contains))return false;
 if(id==='huevo'&&['pasta','chocolate','mayonesa','fideos','tallarines','galletas','sorpresa'].some(contains))return false;
 if(fruit.has(id)&&['sabor','jugo','yogurt','yogur','mermelada','galleta','chips','licor','néctar','nectar','helado','bebida','gomita','cereal','compota','queque','papilla','chocolate','pulpa','bombon','bombones','snack','plato','torta','split','deshidratado','congelado','congelada','barrita'].some(contains))return false;
 return true;
}
function fallback(id,shop){
 const category=fruit.has(id);
 const path=category?([0,3].includes(shop)?'/colecciones/frutas':'/frutas-y-verduras/frutas'):'/busca?ft='+encodeURIComponent(byId[id].name);
 return {id,shop,kind:category?'category':'storeSearch',url:'https://www.'+domains[shop]+path};
}
export function createShoppingLookup(apiKey,fetcher){
 const cache=new Map(),pending=new Map();
 async function productPrice(url,shop){
  try{
   const slug=url.pathname.split('/').filter(Boolean).at(-2);
   if(!slug)return null;
   const endpoint='https://www.'+domains[shop]+'/api/catalog_system/pub/products/search/'+encodeURIComponent(decodeURIComponent(slug))+'/p';
   const response=await fetcher(endpoint,{signal:AbortSignal.timeout(6000),redirect:'error'});
   if(!response.ok)return null;
   const products=await response.json();
   const product=products.find(p=>p.linkText===decodeURIComponent(slug));
   if(product?.items?.length!==1)return null;
   const sku=product.items[0];
   const seller=sku.sellers?.find(s=>s.sellerDefault)||sku.sellers?.[0];
   const offer=seller?.commertialOffer;
   return offer?.IsAvailable!==false&&Number.isFinite(offer?.Price)&&offer.Price>0?offer.Price:null;
  }catch{return null}
 }
 async function find(id,shop){
  const other=fallback(id,shop);
  if(!apiKey)return {...other,failed:true};
  try{
   const response=await fetcher('https://api.tavily.com/search',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({query:'site:'+domains[shop]+' '+byId[id].name+' /p Perú comprar',include_domains:[domains[shop]],search_depth:'basic',max_results:6}),signal:AbortSignal.timeout(12000)});
   if(!response.ok)return {...other,failed:true};
   const {results}=await response.json();
   for(const item of results||[]){
    let url;try{url=new URL(item.url)}catch{continue}
    if(url.protocol!=='https:'||!(url.hostname===domains[shop]||url.hostname.endsWith('.'+domains[shop]))||! /\/p\/?$/i.test(url.pathname))continue;
    if(matchesIngredient(id,item.title||'')&&matchesIngredient(id,url.pathname))return {id,shop,kind:'product',url:url.href,price:await productPrice(url,shop)};
   }
   return other;
  }catch{return {...other,failed:true}}
 }
 async function lookup({id,shop}){
  const key=id+':'+shop,hit=cache.get(key);
  if(hit&&hit.until>Date.now())return hit.result;
  if(!pending.has(key))pending.set(key,find(id,shop).then(result=>{
    if(!result.failed)cache.set(key,{result,until:Date.now()+3600000});
    return result;
  }).finally(()=>pending.delete(key)));
  return pending.get(key);
 }
 return async items=>{
  const rows=[];
  for(let i=0;i<items.length;i+=4)rows.push(...await Promise.all(items.slice(i,i+4).map(lookup)));
  return rows;
 };
}
