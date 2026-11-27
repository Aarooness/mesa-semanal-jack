import {copyList} from './copy-list.js';
import {offerLine} from './premium.js';
import {icon} from './icons.js';
import {foods,byId,weekdays,num,money,quote,stores} from './data.js';
import {recipes,meal,nutrition,pie,allowed} from './breakfast.js';
import {photo,choices,people,mixedQuote} from './planner.js';
export const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function slots(s,d){return [s.days[d],...(s.extra?.[d]||[])]}
export function grams(s,d,i){return slots(s,d)[i].map(id=>[id,(s.portion[id]||byId[id].portion)*(i===0?s.scales[d]:(s.extraScale?.[d]?.[i-1]||1))])}
export function dayCards(s,d){
 const available=choices(s);
 const picker=(action,i)=>'<div class="recipe-picker">'+(available.length ? available.map(r=>'<button data-action="'+action+'" data-day="'+d+'" data-slot="'+i+'" data-r="'+recipes.indexOf(r)+'"><img src="/fotos/'+photo(r)+'" alt="">'+r.name+'</button>').join('') : '<p>No hay platos compatibles con tus preferencias actuales.</p>')+'</div>';
 return '<article class="plan-day" data-drop-day="'+d+'"><div class="day-heading"><h2>'+weekdays[d]+'</h2><details class="edit-day"><summary aria-label="Añadir plato">＋</summary>'+picker('addSlot',0)+'</details></div>'+slots(s,d).map((ids,i)=>{
 const controls='<div class="dish-actions"><button class="shuffle-dish" data-action="randomSlot" data-day="'+d+'" data-slot="'+i+'" aria-label="Cambiar plato al azar" title="Cambiar plato al azar">'+icon('shuffle')+'</button><details class="edit-day"><summary aria-label="Opciones del plato">•••</summary><div><details><summary>Cambiar</summary>'+picker('changeSlot',i)+'</details><button data-action="removeSlot" data-day="'+d+'" data-slot="'+i+'">Remover del plan</button></div></details></div>';
 if(!ids.length)return '<small>Espacio libre</small>';
 const r=meal(ids),n=nutrition(grams(s,d,i)),marked=!!s.done?.[d+':'+i];
 return '<div class="slot" draggable="true" data-move-day="'+d+'" data-move-slot="'+i+'"><span class="drag-handle" title="Arrastrar plato">'+icon('grip')+'</span><label><input type="checkbox" aria-label="Consumido: '+r.name+'" data-mark="'+d+':'+i+'" '+(marked?'checked':'')+'></label><button class="meal-link" data-action="detail" data-day="'+d+'" data-slot="'+i+'"><img draggable="false" src="/fotos/'+photo(r)+'" alt=""><span>'+r.name+'<small>'+num(i===0?s.scales[d]:(s.extraScale?.[d]?.[i-1]||1))+' porción · '+num(n.kcal)+' kcal · '+(n.fiber>n.protein?num(n.fiber)+' g fibra':num(n.protein)+' g proteína')+'</small></span></button>'+controls+'</div>';
 }).join('')+'</article>';
}
export function progress(s,days){
 const planned=[],logged=[];
 for(const d of days)slots(s,d).forEach((ids,i)=>{if(ids.length){const rows=grams(s,d,i);planned.push(...rows);if(s.done[d+':'+i])logged.push(...rows)}});
 const plan=nutrition(planned),actual=nutrition(logged),n=days.length;
 const profile={kcal:400,carb:45,fatGrams:12,protein:15,fiber:5,...s.profile};
 const target=Number(profile.kcal)*n,pct=v=>num(100*v/target)+' %',diff=actual.kcal-target;
 const status=Math.abs(diff)<0.5?'Meta alcanzada':num(Math.abs(diff))+' kcal '+(diff>0?'por encima':'por debajo');
 const metrics=[['Energía','kcal','kcal','kcal'],['Carbohidratos','carb','carb','g'],['Grasas','fat','fatGrams','g'],['Proteína','protein','protein','g'],['Fibra','fiber','fiber','g']];
 const rows=metrics.map(([label,k,ref,u])=>'<tr><th>'+label+' ('+u+')</th><td>'+num(plan[k])+'</td><td>'+num(actual[k])+'</td><td>'+num(profile[ref]*n)+'</td></tr>').join('');
 return '<details class="panel nutrition-dashboard"><summary><strong>'+(n===1?weekdays[days[0]]:'Desayunos de la semana')+'</strong><span>Consumido · '+num(actual.kcal)+' / '+num(target)+' kcal · '+pct(actual.kcal)+'</span><progress aria-label="Energía consumida" max="'+target+'" value="'+Math.min(actual.kcal,target)+'"></progress><b>Ver detalle nutricional</b></summary><h2>Distribución de lo consumido</h2>'+(logged.length?pie(actual):'<p>Marca un plato consumido para ver la distribución.</p>')+'<p>'+status+' de la referencia por persona.</p><table><thead><tr><th>Nutriente</th><th>Plan</th><th>Consumido</th><th>Meta</th></tr></thead><tbody>'+rows+'</tbody></table><a href="#perfil">Editar metas del desayuno</a></details>';
}
export function discovery(s,tab){
 return '<h1>Descubrir</h1><div class="segments">'+['Desayunos','Ingredientes'].map((x,i)=>'<button data-action="discTab" data-tab="'+i+'" aria-pressed="'+(+tab===i)+'">'+x+'</button>').join('')+'</div><label>Buscar <input id="discSearch"></label> <a href="#publicar">＋ Crear receta</a>'+ (tab?'<section class="panel" id="ingredient-cart"><h2>Mi cesta</h2>'+Object.entries(s.cart||{}).map(([id,g])=>'<label>'+byId[id].name+(id==='huevo'?' (unidades de 50 g)':' (g)')+'<input type="number" min="1" max="99999" data-cartgrams="'+id+'" value="'+(id==='huevo'?g/50:g)+'"><button data-action="cartRemove" data-id="'+id+'">Quitar</button></label>').join('')+'<button class="primary" data-action="payCart">Ir a pagar</button>'+copyList(Object.entries(s.cart||{}).map(([id,g])=>[byId[id].name,g,'g']))+'</section>':'<label>Añadir a <select id="discDay">'+weekdays.map((x,i)=>'<option value="'+i+'">'+x+'</option>').join('')+'</select></label>')+
 (tab?foods.filter(f=>allowed(f.id,s.profile)).map(f=>[f.name,f.id+'.png',f.tag,'cartAdd',f.id]):choices(s).map(r=>[r.name,photo(r),num(nutrition(r.ids.map(id=>[id,byId[id].portion])).kcal)+' kcal por porción','discAdd',recipes.indexOf(r)])).map(([name,img,sub,act,id])=>'<article class="slot disc" '+(tab?'draggable="true" data-cartdrag="'+id+'"':'')+' data-name="'+name.toLowerCase()+'"><img src="/fotos/'+img+'" alt=""><div>'+name+'<small>'+sub+'</small></div><button aria-label="Añadir '+name+'" data-action="'+act+'" data-id="'+id+'">＋</button></article>').join('');
}
const domains=['wong.pe','plazavea.com.pe','vivanda.com.pe','metro.pe'];
export function purchaseStep(id){
 return id==='huevo'?100:byId[id].portion;
}
export function checkout(s,required,scope,focus,selected,source,sawLocal=false,{prem,deals,priority}){
 const mixed=mixedQuote(required,s.pantry);
 const selector=(value,label)=>'<label class="quote-choice"><input type="checkbox" data-field="quoteList" value="'+value+'" '+(selected===String(value)?'checked':'')+' aria-label="Seleccionar '+(value==='mixed'?'opción combinada':label)+'">'+label+'</label>';
 const total=rows=>money(rows.reduce((sum,r)=>sum+(r.cost||0),0))+' · '+(rows.every(r=>r.available)?'completo':'parcial · '+rows.filter(r=>!r.available).length+' sin precio');
 const listings=stores.map((name,i)=>'<article class="card"><img class="logo" src="/fotos/'+domains[i]+'.png" alt="">'+selector(i,name)+'<strong>'+total(quote(required,s.pantry,i))+'</strong></article>').join('');
 const row=r=>{
   const food=byId[r.id],step=purchaseStep(r.id);
   const days=scope==='recipe'?[focus]:s.days.map((_,i)=>i);
   const origin=scope==='cart'?null:days.flatMap(d=>slots(s,d)).find(ids=>ids.includes(r.id));
   const adjust=(direction,label)=>'<button data-action="quoteStep" data-id="'+r.id+'" data-direction="'+direction+'" aria-label="'+label+' '+step+' gramos de '+food.name+'" '+(direction<0&&!r.g?'disabled':'')+'>'+(direction>0?'＋':'−')+'</button>';
   const price=food.price[r.shop];
   const offer=r.missing===0?'Cubierto con lo que ya tienes':price==null?'No disponible en el catálogo de esta tienda':r.packs+' '+(r.packs===1?'envase':'envases')+' · '+money(price)+' por '+food.pack[r.shop]+' g · '+money(r.cost);
   return '<div class="slot purchase-row'+(r.missing===0?' covered-row':!r.available?' unavailable-row':'')+'"><img src="/fotos/'+r.id+'.png" alt=""><div><strong>'+food.name+'</strong><small>'+offer+'</small></div><div class="quantity-stepper">'+adjust(-1,'Restar')+'<label><input data-field="quoteGrams" data-id="'+r.id+'" aria-label="Gramos de '+food.name+'" type="number" min="0" step="0.1" required value="'+r.g+'"> g</label>'+adjust(1,'Sumar')+'</div>'+(origin?'<figure><img src="/fotos/'+photo(meal(origin))+'" alt=""><figcaption>'+meal(origin).name+'</figcaption></figure>':'')+'</div>';
 };
 const count=mixed.length===1?'1 ingrediente listado':mixed.length+' ingredientes listados';
 const combined=selected==="mixed";
 const baseRows=combined?mixed:quote(required,s.pantry,Number(selected)).map(r=>({...r,shop:Number(selected)}));
 const active=baseRows.filter(r=>!priority.has(r.id));
 const localRows=[...priority].map(id=>offerLine(id,deals.get(id),true,true)).join('');
 const offerPanel=sawLocal?'<details class="panel premium-search" '+(prem.open?'open':'')+'><summary>Tiendas locales y precios reducidos</summary><p>Ofertas que cuestan menos por gramo y por los envases que necesitas.</p>'+([...deals].map(([id,d])=>offerLine(id,d,prem.picks[id])).join('')||'<p>Sin rebajas para los ingredientes pendientes de esta lista.</p>')+'</details>':'<section class="panel premium-search"><h3>Tiendas locales y precios reducidos</h3><p>Con una cuenta gratuita puedes comprar desde cada tienda. La comparación y la lista prioritaria están incluidas con la suscripción.</p><a href="#suscripcion">Ver suscripción →</a></section>';
 const premiumTop=sawLocal?'<label class="quote-choice"><input type="checkbox" data-field="premiumEnabled" '+(prem.enabled?'checked':'')+'> Usar mi lista Premium</label>'+localRows:'';
 const valueByWeight=active.reduce((sum,r)=>{
   const food=byId[r.id];
   return sum+(r.available&&r.missing>0?r.missing*food.price[r.shop]/food.pack[r.shop]:0);
 },0);
 const summary='<div class="quote-summary"><h3>'+total([...active,...[...priority].map(id=>({available:true,cost:deals.get(id).cost}))])+'</h3><button type="button" data-action="refreshQuote">Actualizar precio</button></div><small>Compra de envases completos · Valor referencial de los gramos por comprar: '+money(valueByWeight+[...priority].reduce((n,id)=>n+baseRows.find(r=>r.id===id).missing*deals.get(id).p.price/deals.get(id).grams,0))+(active.some(r=>!r.available)?' (parcial)':'')+'</small>';
 const groups=combined?stores.map((name,i)=>{const items=active.filter(r=>r.shop===i);return items.length?'<h3>'+name+'</h3>'+items.map(row).join(''):''}).join(''):active.map(row).join('');
 const options=[['cart','Mi cesta'],['recipe',weekdays[focus]],['week','Semana'],['period','Periodo']];
 const consult=source?.items.length?'<a class="source-link" href="#buscar">Consultar fuentes en la web ↗</a>':'<button disabled>Consultar fuentes en la web</button>';
 return '<h1>Tiendas y compra</h1><label>Lista <select data-field="scope">'+options.map(([v,t])=>'<option value="'+v+'" '+(scope===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label><section class="panel"><h2>'+(combined?'Opción combinada':stores[Number(selected)])+'</h2>'+selector('mixed','Usar opción combinada <small>· '+count+'</small>')+ '<small>'+(combined?'Precio más bajo entre distintos mercados':'Precios del catálogo de referencia')+'</small>'+premiumTop+summary+groups+copyList(baseRows.map(r=>[byId[r.id].name,r.missing,'g']))+'</section><div class="grid">'+listings+'</div>'+offerPanel+'<section class="source-entry">'+icon('search')+'<div><h2>Fuentes de la lista</h2><p>'+(source?source.label+' · '+source.items.length+' ingredientes por comprar':'Marca una opción para consultar sus ingredientes en las tiendas.')+'</p></div>'+consult+'</section><p>Esta cotización no ejecuta un cobro.</p>';
}
