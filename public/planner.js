import {slots,grams,dayCards,progress} from './revision.js';
import {icon} from './icons.js';
import {byId,weekdays,num,quote,stores,money} from './data.js';
import {allowed,recipes,meal,nutrition,pie,categories} from './breakfast.js';

export function people(s){return s.profile?.household==='Yo y mi familia'?Number(s.profile.people)||2:1}
export function rowsFor(s,day){return s.days[day].map(id=>[id,+(s.portion[id]*(s.scales?.[day]||1)).toFixed(1)])}
export function basket(s,indices){
 const result={};
 for(const d of indices)for(const [id,g] of slots(s,d).flatMap((_,i)=>grams(s,d,i)))result[id]=+((result[id]||0)+g*people(s)).toFixed(1);
 return result;
}
export function choices(s){
 const cats=s.profile?.categories||[];
 const target=Number(s.profile?.kcal)||400;
 const distance=r=>Math.abs(nutrition(r.ids.map(id=>[id,s.portion[id]||byId[id].portion])).kcal-target);
 return recipes.filter(r=>r.ids.every(id=>allowed(id,s.profile))).sort((a,b)=>Number(cats.includes(b.cat))-Number(cats.includes(a.cat))||distance(a)-distance(b));
}
export function suggestedEnergy(profile){
 const all=recipes.filter(r=>r.ids.every(id=>allowed(id,profile)));
 const fav=all.filter(r=>profile.categories.includes(r.cat));
 const values=(fav.length?fav:all).map(r=>nutrition(r.ids.map(id=>[id,byId[id].portion])).kcal).sort((a,b)=>a-b);
 return values.length?Math.max(10,10*Math.round(values[Math.floor(values.length/2)]/10)):400;
}
export function seed(s,all=false,regenerate=false){
 const choicesAll=choices(s),preferred=choicesAll.filter(r=>s.profile?.categories?.includes(r.cat));
 const target=Number(s.profile?.kcal)||400;
 const energy=r=>nutrition(r.ids.map(id=>[id,s.portion[id]||byId[id].portion])).kcal;
 function candidates(items){
  const near=items.filter(r=>energy(r)*2.5>=target&&energy(r)*.5<=target);
  const pool=(near.length?near:items).slice(0,14);
  if(regenerate)for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  return pool;
 }
 const favorites=candidates(preferred),others=candidates(choicesAll.filter(r=>!preferred.includes(r)));
 const editable=[],fixedFavorites=[];
 for(let i=0;i<7;i++){
  const locked=regenerate&&slots(s,i).some((ids,k)=>ids.length&&s.done[i+':'+k]);
  if(locked||(!all&&s.days[i].length&&s.days[i].every(id=>allowed(id,s.profile)))){
   if(s.days[i].length&&preferred.includes(meal(s.days[i])))fixedFavorites.push(i);
  }else editable.push(i);
 }
 const quota=others.length?Math.min(editable.length,Math.max(0,5-fixedFavorites.length)):editable.length;
 let used=0,variety=0;
 for(const [index,i] of editable.entries()){
  const useFavorite=favorites.length&&Math.round((index+1)*quota/editable.length)>Math.round(index*quota/editable.length);
  const r=useFavorite?favorites[used++%favorites.length]:others[variety++%others.length];if(!r){s.days[i]=[];continue}
  s.extra[i]=[];s.extraScale[i]=[];s.days[i]=[...r.ids];s.scales[i]=Math.min(2.5,Math.max(.5,Math.round(20*target/energy(r))/20));
  for(const id of r.ids)s.portion[id]??=byId[id].portion;
 }
}
export function photo(r){return r.photo||recipes.find(item=>item.name===r.name)?.photo||({0:r.ids.includes('fresa')?'licuado.jpg':'batido.jpg',1:'licuado.jpg',2:'porridge.jpg',3:'huevos.jpg',4:'parfait.jpg',5:'tostada.jpg',6:'frutas.jpg',7:'panqueques.jpg',8:'huevo.png'})[r.cat]||r.ids[0]+'.png'}

export function planView(s,day,dayOnly){
 const days=dayOnly?[day]:weekdays.map((_,i)=>i);
 const alternatives=choices(s);
 const destinations=dayOnly?'<div class="day-targets" aria-label="Destinos para arrastrar platos">'+weekdays.map((name,i)=>i===day?'':'<span data-drop-day="'+i+'" title="'+name+'">'+name+'</span>').join('')+'</div>':'';
 const rows=progress(s,days)+destinations+days.map(d=>dayCards(s,d)).join('');
 const first=days.find(i=>s.days[i].length);
 let feature='';
 if(first!==undefined){
  const r=meal(s.days[first]);
  feature='<aside class="recipe-cover"><img src="/fotos/'+photo(r)+'" alt="'+r.name+'"><div><small>Receta del '+weekdays[first].toLowerCase()+'</small><h2>'+r.name+'</h2><p>'+icon('clock')+' '+(r.prep+r.cook)+' min · '+num(nutrition(rowsFor(s,first)).kcal)+' kcal</p><button class="primary" data-action="detail" data-day="'+first+'">Ver preparación '+icon('chevron')+'</button></div></aside>';
 }
 return '<div class="plan-title"><h1>Mi menú</h1><details class="plan-actions"><summary>Acciones '+icon('more')+'</summary><div><button data-action="suggest">Regenerar días</button>'+ (s.profile?'<button data-action="foodPreferences">Cambiar desayunos preferidos</button>':'')+'<button data-action="nav" data-page="2">Explorar plantillas</button></div></details></div><div class="plan-columns"><section><div class="segments"><button data-action="dayView" aria-pressed="'+dayOnly+'">Día</button><button data-action="week" aria-pressed="'+!dayOnly+'">Semana</button></div><div class="week-caption">'+(dayOnly?'<label>Día <select data-field="focusDay">'+weekdays.map((n,i)=>'<option value="'+i+'" '+(i===day?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'Lunes a domingo')+'<small>'+people(s)+' '+(people(s)===1?'persona':'personas')+'</small></div><p class="move-help">'+icon('shuffle')+' Arrastra los platos entre días o usa sus opciones.</p>'+rows+'</section>'+feature+'</div>';
}
export function detailView(s,day){
 const r=meal(s.days[day]),rows=rowsFor(s,day),n=nutrition(rows),scale=s.scales[day]||1;
 const goal=s.profile,key=[...r.ids].sort().join('|');
 const toolbar='<div class="actions recipe-tools"><button data-action="likeMeal" aria-pressed="'+!!s.likes?.includes(key)+'">'+icon('heart')+(s.likes?.includes(key)?'Te gusta':'Me gusta')+'</button><button data-action="saveMeal" aria-pressed="'+!!s.savedMeals?.includes(key)+'">'+icon('star')+(s.savedMeals?.includes(key)?'Guardada':'Guardar receta')+'</button><details><summary>'+icon('repeat')+'Repetir</summary><select id="repeatDay" aria-label="Día">'+weekdays.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('')+'</select><button data-action="repeatMeal">Añadir al día</button></details></div>';

 return `<div class="recipe-title"><button data-action="backPlan" aria-label="Volver al menú">${icon('back')}</button><h1>${r.name}</h1></div><img class="meal-hero" src="/fotos/${photo(r)}" alt="Imagen ilustrativa de la preparación o su ingrediente principal">${toolbar}${r.description?`<p class="recipe-description">${r.description}</p>`:''}<p class="prep-line">${weekdays[day]} · ${categories[r.cat]||'Preparación personalizada'} · ${r.prep} min de preparación · ${r.cook} min de cocción</p>
 <label class="serving-line">Porciones por persona <select data-field="scale">${[...new Set([.5,1,1.5,2,3,scale])].sort((a,b)=>a-b).map(x=>'<option '+(x===scale?'selected':'')+'>'+x+'</option>').join('')}</select></label>
 ${r.cat===1?'<label>Batido con proteína <select data-field="shakeTarget"><option value="">Ajustar aporte</option><option value="20">20 g de proteína</option><option value="30">30 g de proteína</option><option value="40">40 g de proteína</option></select></label>':''}<section class="panel"><h2>Nutrición por persona</h2>${pie(n)}${goal?'<p>Metas del desayuno: '+num(+goal.kcal)+' kcal · carbohidratos '+num(+goal.carb)+' g · grasas '+num(+goal.fatGrams)+' g · proteína '+num(+goal.protein)+' g · fibra '+num(+goal.fiber)+' g.</p>':''}</section>
 <section class="panel"><h2>Ingredientes para ${people(s)} persona(s)</h2>${rows.map(([id,g])=>'<div class="ingredient"><img src="/fotos/'+id+'.png" alt=""><strong>'+byId[id].name+'</strong><span>'+num(g*people(s))+' g</span></div>').join('')}<button class="primary" data-action="findShops">Buscar tiendas en línea</button></section>
 <section class="panel"><h2>Preparación</h2><ol>${r.steps.map(x=>'<li>'+x+'</li>').join('')}</ol></section>`;
}
export function mixedQuote(required,pantry){
 const offers=stores.map((_,i)=>quote(required,pantry,i));
 return offers[0].map((_,index)=>offers.map((rows,shop)=>({...rows[index],shop})).sort((a,b)=>Number(b.available)-Number(a.available)||(a.cost??Infinity)-(b.cost??Infinity))[0]);
}
export function splitBox(rows){
 const names=new Set(rows.filter(r=>r.packs&&r.available).map(r=>stores[r.shop]));
 return '<section class="panel"><h2>Compra por producto</h2><p>'+(!names.size?(rows.every(r=>r.available)?'Tu despensa cubre la compra.':'Hay ingredientes pendientes.'):names.size===1?'Una sola parada en '+[...names][0]+'.':'Compra dividida entre '+[...names].join(' y ')+'.')+'</p>'+rows.map(r=>'<div>'+byId[r.id].name+' · '+(!r.available?'Faltante':r.packs?stores[r.shop]+' · '+r.packs+' envase(s) · '+money(r.cost):'Ya en casa')+'</div>').join('')+'<p><b>Total '+(rows.every(r=>r.available)?'':'parcial ')+money(rows.reduce((a,r)=>a+(r.cost||0),0))+'</b> · sin transporte</p><button data-action="split">Usar esta distribución</button></section>';
}
