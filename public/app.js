import {discovery,checkout,slots,grams,purchaseStep} from './revision.js';
import {icon} from './icons.js';
import {currentUser,renderPlatform,basketPanel,marketState} from './platform.js';
import {meal,allowed,recipes,nutrition} from './breakfast.js';
import {profileDefaults,profileForm,captureProfile} from './profile.js';
import {people,rowsFor,basket,seed,suggestedEnergy,planView,detailView,mixedQuote,splitBox} from './planner.js';
import {library,templateCards} from './templates.js';
import {foods,byId,weekdays,stores,num,money,totals,needs,quote} from './data.js';
const main=document.querySelector('#main'),nav=document.querySelector('#nav');
const key=currentUser?'mesa-semanal-v1:'+currentUser.id:'mesa-semanal-v1';
const blankDays=()=>Array.from({length:7},()=>[]);
const initial={portion:{},pantry:{},count:7,days:blankDays(),shop:0,budget:0,records:[],base:0,origin:'Manual',buy:{}};
const s={...initial,...JSON.parse(localStorage.getItem(key)||'{}')};
let discTab=0,activeSlot=0;s.cart??={};s.extraScale??=Array.from({length:7},()=>[]);s.extra??=Array.from({length:7},()=>[]);s.done??={};
s.scales??=Array(7).fill(1);
let profileStep=0,profileDraft=structuredClone(s.profile||profileDefaults);
let focusDay=s.checkoutContext?.day??0,dayOnly=false,detail=false,scope=s.checkoutContext?.scope||'period',split=false;
activeSlot=s.checkoutContext?.slot??0;
const quoteKey=()=>scope==='recipe'?'recipe:'+focusDay+':'+activeSlot:scope==='period'?'period:'+s.count:scope;
function shoppingDays(){
  return scope==='recipe'?[focusDay]:Array.from({length:scope==='week'?7:s.count},(_,i)=>i%7);
}
function currentQuote(){return split?mixedQuote(required(),s.pantry):quote(required(),s.pantry,s.shop).map(r=>({...r,shop:s.shop}))}
function checkMenu(days){if(days.flat().some(id=>!allowed(id,s.profile)))throw Error('Esta plantilla incluye un ingrediente excluido por tus alergias. Elige otra.')}
const save=()=>localStorage.setItem(key,JSON.stringify(s));
if(!s.menuInicializado){
  if(s.days.every(d=>!d.length)){seed(s,true);s.origin='Semana sugerida'}
  s.menuInicializado=true;save();
}
const labels=['Descubrir','Mi selección','Plantillas','Tiendas y compra','Seguimiento','Mi menú','Perfil'];
const routes=['descubrir','seleccion','plantillas','compra','seguimiento','plan','perfil'];
let page=0,category='Todos',search='',community=[],communityError='',preview=null,recordIndex=0,logIndex=0,toastTimer;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const ids=()=>Object.keys(s.portion);
const btn=(label,action,cls='',extra='')=>'<button type="button" class="'+cls+'" data-action="'+action+'" '+extra+'>'+label+'</button>';
const dataId=id=>'data-id="'+id+'"';
const opts=(items,current)=>items.map(([v,t])=>'<option value="'+esc(v)+'" '+(String(v)===String(current)?'selected':'')+'>'+esc(t)+'</option>').join('');
const foodOpts=id=>opts(foods.filter(f=>allowed(f.id,s.profile)).map(f=>[f.id,f.name]),id);
const notice=t=>{const el=document.querySelector('#message');el.textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.textContent='',4200)};
const metric=(t,v)=>'<span class="metric">'+t+'<b>'+v+'</b></span>';
function metrics(rows){const a=totals(rows);return '<div class="metrics">'+['Peso','Energía','Proteína','Fibra','Vitamina C'].map((t,i)=>metric(t,num(a[i])+' '+['g','kcal','g','g','mg'][i])).join('')+'</div>'}
function setPage(i){location.hash=routes[i];page=i;render();window.scrollTo(0,0)}
function moveDish(from,slot,to){
  if(![from,to].every(d=>Number.isInteger(d)&&d>=0&&d<7)||from===to||!slots(s,from)[slot]?.length)return;
  const dishes=d=>slots(s,d).map((ids,i)=>({ids,scale:i?s.extraScale[d][i-1]||1:s.scales[d],done:!!s.done[d+':'+i]}));
  function setDishes(d,list){
    const [first,...rest]=list.filter(x=>x.ids.length);
    s.days[d]=first?.ids||[];s.scales[d]=first?.scale||1;
    s.extra[d]=rest.map(x=>x.ids);s.extraScale[d]=rest.map(x=>x.scale);
    for(const key of Object.keys(s.done))if(key.startsWith(d+':'))delete s.done[key];
    list.filter(x=>x.ids.length).forEach((x,i)=>{if(x.done)s.done[d+':'+i]=true});
  }
  const origin=dishes(from),destination=dishes(to);
  const [moved]=origin.splice(slot,1);
  setDishes(from,origin);setDishes(to,[...destination,moved]);
  s.origin='Personalizado';resetBuy();save();render();notice(meal(moved.ids).name+' → '+weekdays[to]);
}
main.addEventListener('dragstart',e=>{
 const source=e.target.closest('[data-move-day]');
 if(source){e.dataTransfer.setData('application/x-mesa-dia',source.dataset.moveDay+':'+source.dataset.moveSlot);e.dataTransfer.effectAllowed='move'}
});
main.addEventListener('dragover',e=>{
 const target=e.target.closest('[data-drop-day]');
 if(target&&e.dataTransfer.types.includes('application/x-mesa-dia')){e.preventDefault();target.classList.add('over')}
});
main.addEventListener('dragleave',e=>{const target=e.target.closest('[data-drop-day]');if(target&&!target.contains(e.relatedTarget))target.classList.remove('over')});
main.addEventListener('dragend',()=>main.querySelectorAll('.over').forEach(el=>el.classList.remove('over')));
main.addEventListener('drop',e=>{
 const target=e.target.closest('[data-drop-day]'),from=e.dataTransfer.getData('application/x-mesa-dia');
 if(target&&from!==''){e.preventDefault();target.classList.remove('over');moveDish(...from.split(':').map(Number),Number(target.dataset.dropDay))}
});
let touchMove;
main.addEventListener('pointerdown',e=>{
 const handle=e.target.closest('.drag-handle');
 if(!handle||e.pointerType==='mouse')return;
 touchMove={id:e.pointerId,from:Number(handle.closest('[data-move-day]').dataset.moveDay),slot:Number(handle.closest('[data-move-slot]').dataset.moveSlot)};
 handle.setPointerCapture(e.pointerId);
});
main.addEventListener('pointermove',e=>{
 if(touchMove?.id!==e.pointerId)return;
 if(e.clientY<70)window.scrollBy(0,-12);
 if(e.clientY>innerHeight-95)window.scrollBy(0,12);
 const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-day]');
 main.querySelectorAll('.over').forEach(el=>el.classList.remove('over'));target?.classList.add('over');
});
function endTouchMove(e){
 if(touchMove?.id!==e.pointerId)return;
 const {from,slot}=touchMove;touchMove=null;
 main.querySelectorAll('.over').forEach(el=>el.classList.remove('over'));
 const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-day]');
 if(target&&e.type==='pointerup')moveDish(from,slot,Number(target.dataset.dropDay));
}
main.addEventListener('pointerup',endTouchMove);
main.addEventListener('pointercancel',endTouchMove);
main.addEventListener('dragstart',e=>{const r=e.target.closest('[data-cartdrag]');if(r)e.dataTransfer.setData('application/x-ingredient',r.dataset.cartdrag)});
main.addEventListener('dragover',e=>{if(e.target.closest('#ingredient-cart'))e.preventDefault()});
main.addEventListener('drop',e=>{if(!e.target.closest('#ingredient-cart'))return;e.preventDefault();const id=e.dataTransfer.getData('application/x-ingredient');if(byId[id]&&allowed(id,s.profile)){s.cart[id]=(s.cart[id]||0)+byId[id].portion;s.portion[id]??=byId[id].portion;save();render()}});
function resetBuy(){s.buy={}}
function assignDays(days,origin,scales){checkMenu(days);s.extra=Array.from({length:7},()=>[]);s.done={};s.scales=scales?[...scales]:Array(7).fill(1);s.days=days;s.origin=origin;resetBuy();save();render()}
main.addEventListener('dragstart',e=>{const card=e.target.closest('[data-food]');if(card)e.dataTransfer.setData('text/plain',card.dataset.food)});
main.addEventListener('dragover',e=>{if(e.target.closest('#drop'))e.preventDefault()});
main.addEventListener('drop',e=>{if(e.target.closest('#drop')){e.preventDefault();add(e.dataTransfer.getData('text/plain'))}});
main.addEventListener('input',e=>{
  const el=e.target,id=el.dataset.id;
  if(el.id==='discSearch'){main.querySelectorAll('.disc').forEach(row=>row.hidden=!row.dataset.name.includes(el.value.toLowerCase()));return}if(el.id==='search'){search=el.value;document.querySelector('#products').innerHTML=products();return}
  if(el.dataset.field!=='slider')return;
  s.portion[id]=Number(el.value);resetBuy();save();
  main.querySelector('[data-field="portion"][data-id="'+id+'"]').value=el.value;
  document.querySelector('#cost-'+id).innerHTML=portionCost(id);document.querySelector('#portionResults').innerHTML=portionResults();
});
main.addEventListener('change',e=>{
  const el=e.target,{field,id}=el.dataset;
  if(el.dataset.mark){s.done[el.dataset.mark]=el.checked;save();render();return}if(el.dataset.cartgrams){if(el.value&&el.checkValidity())s.cart[el.dataset.cartgrams]=Number(el.value)*(el.dataset.cartgrams==='huevo'?50:1);save();render();return}if(!field||field==='slider')return;
  if(el.type==='number'&&!el.checkValidity()){el.reportValidity();return}
  switch(field){
    case 'quoteGrams':setQuoteGrams(id,el.valueAsNumber);break;
    case 'quoteList':s.quoteSelection=el.checked?{list:el.value,key:quoteKey()}:null;break;
    case 'focusDay':focusDay=Number(el.value);resetBuy();break;
    case 'scope':scope=el.value;resetBuy();break;
    case 'shakeTarget':{if(!el.value)return;const n=nutrition(slots(s,focusDay)[activeSlot].map(id=>[id,s.portion[id]])).protein;if(!n)return;const factor=+(Number(el.value)/n).toFixed(3);if(activeSlot)s.extraScale[focusDay][activeSlot-1]=factor;else s.scales[focusDay]=factor;resetBuy();break}
    case 'scale':if(activeSlot)s.extraScale[focusDay][activeSlot-1]=Number(el.value);else s.scales[focusDay]=Number(el.value);resetBuy();break;
    case 'category':category=el.value;break;
    case 'period':s.count=Number(el.value);resetBuy();break;
    case 'shop':s.shop=Number(el.value);resetBuy();break;
    case 'portion':s.portion[id]=Math.max(5,Math.min(500,Math.round(Number(el.value))));resetBuy();break;
    case 'pantry':s.pantry[id]=Number(el.value);resetBuy();break;
    case 'day':{const d=Number(el.dataset.day);s.days[d]=el.checked?[...new Set([...s.days[d],id])]:s.days[d].filter(v=>v!==id);s.origin='Personalizado';resetBuy();break}
    case 'budget':s.budget=Number(el.value);break;
    case 'base':s.base=Number(el.value);break;
    case 'record':recordIndex=Number(el.value);logIndex=0;break;
    case 'logday':logIndex=Number(el.value);break;
    case 'bfood':case 'bgrams':case 'bpaid':{
      const row=currentQuote().find(r=>r.id===id),a={...actual(row)};
      if(field==='bfood'){a.id=el.value;a.grams=0;a.paid=0}
      if(field==='bgrams'){a.grams=Number(el.value);if(!a.grams)a.paid=0}
      if(field==='bpaid')a.paid=Number(el.value);
      s.buy[id]=a;save();
      if(field==='bfood'||(field==='bgrams'&&!a.grams))render();
      return;
    }
    default:return;
  }
  save();render();
});
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  const {action,id}=b.dataset;
  try{switch(action){
    case 'refreshQuote':{
      for(const input of main.querySelectorAll('[data-field="quoteGrams"]')){
        if(!input.reportValidity())return;
        if(required()[input.dataset.id]!==input.valueAsNumber)setQuoteGrams(input.dataset.id,input.valueAsNumber);
      }
      save();render();notice('Precio de referencia actualizado.');break;
    }
    case 'quoteStep':{
      const target=Math.max(0,required()[id]+Number(b.dataset.direction)*purchaseStep(id));
      setQuoteGrams(id,target);save();render();
      const next=main.querySelector('[data-action="quoteStep"][data-id="'+id+'"][data-direction="'+b.dataset.direction+'"]:not(:disabled)');
      next?.focus({preventScroll:true});break;
    }
    case 'foodPreferences':profileDraft=structuredClone(s.profile);profileStep=4;setPage(6);break;
    case 'prevProfile':captureProfile(main.querySelector('form'),profileDraft,profileStep);profileStep--;render();break;
    case 'likeMeal':case 'saveMeal':{
      const list=action==='likeMeal'?'likes':'savedMeals',key=[...slots(s,focusDay)[activeSlot]].sort().join('|');
      s[list]??=[];s[list]=s[list].includes(key)?s[list].filter(x=>x!==key):[...s[list],key];save();render();break;
    }
    case 'repeatMeal':{
      const d=Number(document.querySelector('#repeatDay').value);s.days[d]=[...slots(s,focusDay)[activeSlot]];s.scales[d]=activeSlot?(s.extraScale[focusDay][activeSlot-1]||1):s.scales[focusDay];
      resetBuy();save();notice('Preparación añadida al '+weekdays[d]+'.');break;
    }
    case 'openSaved':{
      const key=document.querySelector('#savedMeal').value;if(!key)break;const ids=key.split('|');checkMenu([ids]);
      const d=Number(document.querySelector('#savedDay').value);s.days[d]=ids;s.scales[d]=1;for(const id of ids)s.portion[id]??=byId[id].portion;
      resetBuy();save();detail=false;focusDay=d;setPage(5);break;
    }
    case 'cartAdd':if(!s.portion[id])s.portion[id]=byId[id].portion;s.cart[id]=(s.cart[id]||0)+byId[id].portion;save();render();break;
    case 'cartRemove':delete s.cart[id];save();render();break;
    case 'payCart':if(!Object.keys(s.cart).length)throw Error('Añade un ingrediente a tu cesta.');scope='cart';setPage(3);break;
    case 'discTab':discTab=Number(b.dataset.tab);render();break;
    case 'discAdd':case 'changeSlot':case 'randomSlot':case 'removeSlot':case 'addSlot':{
      const d=action==='discAdd'?Number(document.querySelector('#discDay').value):Number(b.dataset.day),i=Number(b.dataset.slot||0);
      let r=recipes[Number(action==='discAdd'?id:b.dataset.r)];
      if(action==='randomSlot'){const pool=recipes.filter(x=>x.ids.every(k=>allowed(k,s.profile))&&x.name!==meal(slots(s,d)[i]).name);r=pool[Math.floor(Math.random()*pool.length)]}
      if(action==='removeSlot'){if(i){s.extra[d].splice(i-1,1);s.extraScale[d].splice(i-1,1)}else{s.days[d]=s.extra[d].shift()||[];s.scales[d]=s.extraScale[d].shift()||1}}
      else{if(!r)throw Error('Sin alternativas disponibles');checkMenu([r.ids]);for(const k of r.ids)s.portion[k]??=byId[k].portion;
      if(['discAdd','addSlot'].includes(action)&&s.days[d].length){s.extra[d].push([...r.ids]);s.extraScale[d][s.extra[d].length-1]=1}else if(i){s.extra[d][i-1]=[...r.ids];s.extraScale[d][i-1]=1}else{s.days[d]=[...r.ids];s.scales[d]=1}}
      if(action==='changeSlot'||action==='randomSlot')delete s.done[d+':'+i];
      if(action==='removeSlot'){
        for(let j=i;j<slots(s,d).length;j++)s.done[d+':'+j]=!!s.done[d+':'+(j+1)];
        delete s.done[d+':'+slots(s,d).length];
      }
      resetBuy();save();render();if(action==='discAdd')notice('Añadido al '+weekdays[d]);break;
    }
    case 'week':dayOnly=false;render();break;
    case 'dayView':dayOnly=true;render();break;
    case 'backPlan':detail=false;setPage(5);break;
    case 'detail':activeSlot=Number(b.dataset.slot||0);focusDay=Number(b.dataset.day);detail=true;render();window.scrollTo(0,0);break;
    case 'suggest':seed(s,true,true);s.origin='Preferencias';resetBuy();save();render();break;
    case 'alternative':{
      const d=Number(b.dataset.day),r=recipes[Number(document.querySelector('#alternative-'+d).value)];
      checkMenu([r.ids]);s.origin='Personalizado';s.days[d]=[...r.ids];s.scales[d]=1;for(const id of r.ids)s.portion[id]??=byId[id].portion;
      resetBuy();save();render();break;
    }
    case 'findShops':scope='recipe';resetBuy();setPage(3);break;
    case 'split':split=true;resetBuy();render();break;
    case 'nav':detail=false;setPage(Number(b.dataset.page));break;
    case 'catalog':setPage(0);break;
    case 'selection':setPage(1);break;
    case 'menu':setPage(2);break;
    case 'shopping':scope='period';resetBuy();setPage(3);break;
    case 'add':add(id);break;
    case 'remove':delete s.portion[id];delete s.pantry[id];s.days=s.days.map(d=>d.filter(v=>v!==id));resetBuy();save();render();break;
    case 'preview':preview=Number(b.dataset.index);render();document.querySelector('#previewTitle').focus();break;
    case 'closepreview':preview=null;render();break;
    case 'preset':{
      const t=library[preview];if(!t)break;checkMenu(t.days);
      for(const id of new Set(t.days.flat()))s.portion[id]??=byId[id].portion;
      preview=null;assignDays(structuredClone(t.days),t.name);notice('Plantilla aplicada. Puedes editar cada día.');break;
    }
    case 'manual':preview=null;assignDays(blankDays(),'Manual');break;
    case 'publish':{const name=document.querySelector('#templateName').value.trim();if(!name||!ready())throw Error('Escribe un nombre y completa los siete días.');await api('templates',{name,days:s.days,portion:s.portion,scales:s.scales,extra:s.extra,extraScale:s.extraScale});await loadCommunity();notice('Plantilla disponible para quienes usan esta instalación.');break}
    case 'reload':await loadCommunity();break;
    case 'use':{const t=community.find(v=>v.id===document.querySelector('#community').value);if(!t)throw Error('Aún no hay una plantilla para aplicar.');checkMenu(t.days);checkMenu((t.extra||[]).flat());Object.assign(s.portion,t.portion);assignDays(structuredClone(t.days),'Comunidad · '+t.name,t.scales);s.extra=structuredClone(t.extra||Array.from({length:7},()=>[]));s.extraScale=structuredClone(t.extraScale||Array.from({length:7},()=>[]));save();render();break}
    case 'choose':if(split||s.shop!==Number(b.dataset.shop)){split=false;s.shop=Number(b.dataset.shop);resetBuy();save();render()}break;
    case 'confirm':confirmBuy();break;
    case 'log':{
      const fields=[...main.querySelectorAll('.loggrams')];if(fields.some(f=>!f.checkValidity()))throw Error('La cantidad debe estar dentro del inventario disponible.');
      const rows=fields.map(f=>[f.dataset.id,Number(f.value)]).filter(x=>x[1]>0);if(!rows.length)throw Error('Indica al menos un alimento consumido.');
      s.records[recordIndex].logs[logIndex]=rows;save();render();notice('Desayuno guardado. Resultados actualizados.');break;
    }
  }}catch(err){notice(err.message)}
});
main.addEventListener('change',e=>{
  if(!e.target.closest('#profileForm'))return;
  if(e.target.name==='mode')main.querySelector('#exact').hidden=e.target.value!=='Exacto';
  if(e.target.name==='household')main.querySelector('#family').hidden=e.target.value==='Solo yo';
});
main.addEventListener('submit',e=>{
  if(e.target.id!=='profileForm')return;e.preventDefault();
  captureProfile(e.target,profileDraft,profileStep);
  if(profileStep===1&&profileDraft.mode==='Exacto'&&!(+profileDraft.targetWeight>0)){notice('Indica el peso objetivo.');return}
  if(profileStep===3&&profileDraft.household!=='Solo yo'&&!(+profileDraft.people>=2)){notice('Indica el total de personas.');return}
  if(profileStep===5&&!(+profileDraft.kcal>0)){notice('Indica la referencia de energía.');return}
  if(profileStep===4&&!s.profile&&!profileDraft.energyReviewed){profileDraft.kcal=suggestedEnergy(profileDraft);profileDraft.energyReviewed=true}
  if(profileStep<5){profileStep++;render();return}
  const alreadyPlanned=s.origin!=='Semana sugerida'&&s.days.some(d=>d.length);
  s.profile=structuredClone(profileDraft);s.extra=s.extra.map(day=>day.filter(ids=>ids.every(id=>allowed(id,s.profile))));s.done={};
  for(const id of ids())if(!allowed(id,s.profile))delete s.portion[id];
  seed(s,!alreadyPlanned);resetBuy();save();profileStep=0;detail=false;setPage(5);
});
window.addEventListener('hashchange',()=>{page=routes.includes(location.hash.slice(1))?routes.indexOf(location.hash.slice(1)):5;render()});
queueMicrotask(()=>{page=routes.includes(location.hash.slice(1))?routes.indexOf(location.hash.slice(1)):5;render();loadCommunity()});
function ready(){return s.days.every(d=>d.length)}
function empty(){return '<div class="panel">Elige al menos un alimento para comenzar.'+btn('Abrir catálogo','catalog','primary')+'</div>'}
function period(){return '<label>Periodo <select data-field="period">'+opts([[7,'Semanal · 7 días'],[30,'Mensual · 30 días']],s.count)+'</select></label>'}
function render(){
 if(page===6&&(!currentUser||currentUser.role==='store')&&location.hash==='#perfil'){location.replace(currentUser?'#tienda':'#cuenta');return}if(page===3){s.checkoutContext={day:focusDay,slot:activeSlot,scope};save()}
 const selected=s.quoteSelection?.key===quoteKey()?s.quoteSelection.list:'mixed';
 const req=selected===null?{}:required();
 const selectedRows=selected==='mixed'?mixedQuote(req,s.pantry):selected===null?[]:quote(req,s.pantry,Number(selected)).map(row=>({...row,shop:Number(selected)}));
 const source=selected!==null?{scope:quoteKey(),label:selected==='mixed'?'Opción combinada':stores[Number(selected)],items:selectedRows.filter(row=>row.missing>0).map(({id,shop,missing})=>({id,shop,grams:missing}))}:null;
 if(renderPlatform(source))return;
 const names=['search','list','stack','basket','track','plan','profile'];
 const navButton=i=>btn(icon(names[i])+'<span>'+labels[i]+'</span>','nav','nav-item','data-page="'+i+'" '+(i===page?'aria-current="page"':''));
 nav.innerHTML=[5,0,3,6].map(navButton).join('')+'<details class="more-nav"><summary>'+icon('more')+'<span>Más</span></summary><div>'+[1,2,4].map(navButton).join('')+'</div></details>';
 document.body.dataset.view=page===5&&detail?'receta':routes[page];main.innerHTML=[()=>discovery(s,discTab),selection,menu,()=>basketPanel(currentUser)+checkout(s,required(),scope,focusDay,selected,source,marketState.sub),tracking,()=>detail&&s.days[focusDay].length?detailView(activeSlot?{...s,days:s.days.map((ids,d)=>d===focusDay?(s.extra[d][activeSlot-1]||ids):ids),scales:s.scales.map((v,d)=>d===focusDay?(s.extraScale[d][activeSlot-1]||1):v)}:s,focusDay):planView(s,focusDay,dayOnly),()=>profileForm(profileDraft,profileStep)][page]()}
function products(){return foods.filter(f=>allowed(f.id,s.profile)).filter(f=>(category==='Todos'||f.group===category)&&f.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).map(f=>'<article class="card" draggable="true" data-food="'+f.id+'"><img src="/fotos/'+f.id+'.png" alt="'+f.name+'"><small>'+f.group+'</small><h3>'+f.name+'</h3><div class="tag">'+f.tag+'</div><p>'+f.desc+'</p>'+btn(s.portion[f.id]?'En mi selección':'Añadir a mi selección','add','',dataId(f.id))+'</article>').join('')||'<p>Sin coincidencias.</p>'}
function catalog(){return '<h1>¿Qué te gustaría desayunar?</h1><p>Explora ingredientes y arma tu selección para la semana.</p><div class="filters"><label>Buscar <input id="search" value="'+esc(search)+'" placeholder="Avena, quinua…"></label><label>Grupo <select data-field="category">'+opts(['Todos',...new Set(foods.map(f=>f.group))].map(v=>[v,v]),category)+'</select></label></div><div class="drop" id="drop">Suelta aquí un ingrediente · '+ids().length+' seleccionados '+btn('Ajustar cantidades','selection','primary')+'</div><div class="grid" id="products">'+products()+'</div>'}
function add(id){if(!byId[id]||!allowed(id,s.profile))return;if(!s.portion[id]){s.portion[id]=byId[id].portion;s.buy={};save()}render();notice(byId[id].name+' en tu selección')}
function priceLine(f){const sh=s.shop;return f.price[sh]==null?'Sin precio disponible':money(f.price[sh]/f.pack[sh]*1000)+'/kg · '+money(f.price[sh])+' por '+f.pack[sh]+' g'}
function portionResults(){return '<h2>Si usas una porción de cada alimento</h2>'+metrics(ids().map(id=>[id,s.portion[id]]))+'<small>El calendario de la siguiente vista determina los totales reales del periodo.</small>'}
function selection(){return '<h1>Ajusta tus porciones</h1>'+(ids().length?'<div class="filters">'+period()+'<label>Precios de referencia <select data-field="shop">'+opts(stores.map((n,i)=>[i,n]),s.shop)+'</select></label></div><div class="grid">'+ids().map(id=>{const f=byId[id];return '<article class="card"><small>'+priceLine(f)+'</small><h3>'+f.name+'</h3><label>Gramos por uso <input type="number" min="5" max="500" step="1" data-field="portion" '+dataId(id)+' value="'+s.portion[id]+'"></label><input aria-label="Porción de '+f.name+'" type="range" min="5" max="500" data-field="slider" '+dataId(id)+' value="'+s.portion[id]+'"><div id="cost-'+id+'">'+portionCost(id)+'</div><label>Ya tengo en casa (g) <input type="number" min="0" max="99000" data-field="pantry" '+dataId(id)+' value="'+(s.pantry[id]||0)+'"></label>'+btn('Quitar','remove','',dataId(id))+'</article>'}).join('')+'</div><section class="panel" id="portionResults">'+portionResults()+'</section>'+btn('Añadir a mi canasta y elegir menú','menu','primary'):empty())}
function portionCost(id){const f=byId[id];const times=ready()?Array.from({length:s.count},(_,i)=>s.days[i%7].includes(id)).filter(Boolean).length:s.count;return (f.price[s.shop]===null?'Costo de porción desconocido':'Porción: <b>'+money(f.price[s.shop]*s.portion[id]/f.pack[s.shop])+'</b>')+'<p>'+num(ready()?basket(s,Array.from({length:s.count},(_,i)=>i%7))[id]||0:times*s.portion[id]*people(s))+' g en '+s.count+' días · '+(ready()?times+' usos en el menú':'proyección de un uso diario')+'</p>'}
function summary(){const rows=Object.entries(basket(s,Array.from({length:s.count},(_,i)=>i%7)));return '<section class="panel"><h2>Total programado · '+s.count+' días</h2>'+metrics(rows)+'</section>'}
function savedView(){
 const items=(s.savedMeals||[]).filter(k=>k.split('|').every(id=>allowed(id,s.profile)));
 return '<section class="panel"><h2>Mis recetas guardadas</h2>'+(items.length?'<select aria-label="Receta guardada" id="savedMeal">'+opts(items.map(k=>[k,meal(k.split('|')).name]),items[0])+'</select><select id="savedDay" aria-label="Añadir al día">'+opts(weekdays.map((n,i)=>[i,n]),0)+'</select>'+btn('Añadir al plan','openSaved'):'Guarda una preparación desde su ficha.')+'</section>';
}
function menu(){return '<h1>Arma tu menú</h1>'+period()+templateCards(preview,s.portion)+savedView()+'<section class="panel"><h2>Otras formas de empezar</h2>'+btn('Empezar manualmente','manual')+'<div class="actions"><label>Comunidad local <select id="community">'+opts(community.length?community.map(t=>[t.id,t.name]):[['','Aún no hay plantillas']],null)+'</select></label>'+btn('Usar plantilla compartida','use')+btn('Actualizar','reload')+'</div><small>'+esc(communityError||'Al aplicar una plantilla compartida se incorporan sus ingredientes y porciones.')+'</small></section><h2>Semana editable · '+esc(s.origin.startsWith('Ollama')?'Semana guardada':s.origin)+'</h2>'+(!ids().length?empty():'')+weekdays.map((name,i)=>'<div class="day"><b>'+name+'</b><div>'+ids().map(id=>'<label><input type="checkbox" data-field="day" data-day="'+i+'" '+dataId(id)+' '+(s.days[i].includes(id)?'checked':'')+'>'+byId[id].name+' · '+s.portion[id]+' g</label>').join('')+'</div></div>').join('')+summary()+'<div class="panel"><label>Nombre público de la plantilla <input id="templateName" maxlength="70" placeholder="Mi semana de avena"></label>'+btn('Publicar en comunidad local','publish')+'</div>'+btn('Comparar mi compra','shopping','primary')}
async function api(path,arg){const r=await fetch('/api/'+path,arg?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arg)}:{});const data=await r.json();if(!r.ok)throw Error(data.error||'Error del servidor');return data}
async function loadCommunity(){try{community=await api('templates');communityError=''}catch(e){communityError=e.message}if(page===2)render()}
function setQuoteGrams(id,target){
  const base=baseRequired();
  if(!Object.hasOwn(base,id)||!Number.isFinite(target)||target<0)return;
  s.quoteAdjustments??={};
  const adjustments=s.quoteAdjustments[quoteKey()]??={};
  const reserved=(marketState.reserved||[]).filter(i=>i.food===id).reduce((n,i)=>n+i.grams*i.qty,0);
  adjustments[id]=+(target-base[id]+reserved).toFixed(1);
  resetBuy();
}
// Keep a pending manual edit until the refresh button reads it (blur redraws the list).
main.addEventListener('mousedown',e=>{
  if(e.target.closest('[data-action="refreshQuote"]')&&document.activeElement?.dataset.field==='quoteGrams')e.preventDefault();
});
main.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.field==='quoteGrams'){e.preventDefault();if(e.target.reportValidity())e.target.blur()}});
function required(){return Object.fromEntries(Object.entries(baseRequired()).map(([id,g])=>[id,Math.max(0,+(g-(marketState.reserved||[]).filter(i=>i.food===id).reduce((n,i)=>n+i.grams*i.qty,0)+(s.quoteAdjustments?.[quoteKey()]?.[id]||0)).toFixed(1))]))}
const baseRequired=()=>scope==='cart'?s.cart:scope==='recipe'?Object.fromEntries(grams(s,focusDay,Math.min(activeSlot,slots(s,focusDay).length-1)).map(([id,g])=>[id,g*people(s)])):basket(s,shoppingDays());
function shopBox(shop){const q=quote(required(),s.pantry,shop),ok=q.filter(r=>r.available).length,sum=q.reduce((a,r)=>a+(r.cost||0),0);
return '<article class="card"><h3>'+stores[shop]+'</h3><b>'+money(sum)+(ok<q.length?' · parcial':' · lista completa')+'</b><p>'+ok+' de '+q.length+' ingredientes cubiertos</p>'+(s.budget&&ok===q.length?'<p>'+(sum>s.budget?'Excede por ':'Margen disponible: ')+money(Math.abs(s.budget-sum))+'</p>':'')+btn(!split&&shop===s.shop?'Tienda seleccionada':'Elegir tienda','choose',!split&&shop===s.shop?'primary':'','data-shop="'+shop+'"')+'</article>'}
function actual(row){const f=byId[row.id],defaults={id:row.id,grams:row.available?row.packs*f.pack[row.shop]:0,paid:row.cost||0};return s.buy[row.id]||defaults}
function confirmBuy(){const stock={...s.pantry}, bought={},mapping={};let cost=0;
for(const row of currentQuote()){const a=actual(row);if((!a.grams&&a.paid)||a.paid<0)throw Error('Revisa el importe de los productos omitidos.');bought[a.id]=(bought[a.id]||0)+a.grams;stock[a.id]=(stock[a.id]||0)+a.grams;mapping[row.id]=a.id;cost+=a.paid}
s.records.unshift({date:new Date().toLocaleDateString('es-PE'),shop:s.shop,storeLabel:split?'Compra por producto':stores[s.shop],count:shoppingDays().length,weekdayIndices:shoppingDays(),scales:shoppingDays().map(d=>s.scales[d]),days:shoppingDays().map(d=>[...s.days[d]]),portion:{...s.portion},bought,stock,mapping,cost,logs:{}});s.buy={};save();recordIndex=0;logIndex=0;setPage(4);notice('Compra registrada y plan guardado.')}
function tracking(){const r=s.records[recordIndex];if(!r)return '<h1>Seguimiento y resultados</h1><div class="panel">Aquí aparecerá tu primer plan cuando confirmes la compra.'+btn('Ver mi compra','shopping')+'</div>';
const entries=Object.values(r.logs),used={};for(const rows of entries)for(const [id,g] of rows)used[id]=(used[id]||0)+g;
const rows=r.logs[logIndex]||[],planned=r.days[r.weekdayIndices?logIndex:logIndex%7],draft={};
for(const id of planned){const replacement=r.mapping[id]||id;draft[replacement]=(draft[replacement]||0)+r.portion[id]*(r.scales?.[logIndex]||1)}
const eaten=entries.length?totals(entries.flat())[1]/entries.length:0,delta=s.base?(eaten-s.base)/s.base*100:0;
return '<h1>Seguimiento y resultados</h1><label>Plan guardado <select data-field="record">'+opts(s.records.map((p,i)=>[i,p.date+' · '+(p.storeLabel||stores[p.shop])+' · '+money(p.cost)+' · #'+(s.records.length-i)]),recordIndex)+'</select></label><section class="panel"><div class="metrics">'+metric('Pagaste',money(r.cost))+metric('Desayunos registrados',entries.length+' / '+r.count)+'</div><details><summary>Ver plan confirmado y compra</summary>'+r.days.map((d,i)=>'<p>'+weekdays[r.weekdayIndices?.[i]??i]+': '+d.map(id=>byId[id].name+' '+num(r.portion[id]*(r.scales?.[i]||1))+' g').join(', ')+'</p>').join('')+'<b>Compra real</b><p>'+Object.entries(r.bought).map(([id,g])=>byId[id].name+' '+g+' g').join(', ')+'</p></details></section><section class="panel"><h2>Registrar lo que desayuné</h2><label>Día <select data-field="logday">'+opts(Array.from({length:r.count},(_,i)=>[i,(i+1)+' · '+weekdays[r.weekdayIndices?.[i]??i%7]+(r.logs[i]?' · registrado':'')]),logIndex)+'</select></label><p>Corrige los gramos que consumiste. El inventario incluye lo que tenías en casa.</p>'+foods.filter(f=>r.stock[f.id]||draft[f.id]||rows.some(x=>x[0]===f.id)).map(f=>{const prev=rows.find(x=>x[0]===f.id)?.[1]||0,available=(r.stock[f.id]||0)-(used[f.id]||0)+prev;return '<div class="row"><label>'+f.name+' <input class="loggrams" step="any" data-id="'+f.id+'" type="number" min="0" max="'+available+'" value="'+(r.logs[logIndex]?prev:Math.min(available,draft[f.id]||0))+'"> g</label><small>Disponibles para este registro: '+available+' g</small></div>'}).join('')+btn('Guardar desayuno consumido','log','primary')+'</section><section class="panel"><h2>Resultados de los días registrados</h2>'+metrics(entries.flat())+'<label>Mi desayuno habitual (kcal) <input data-field="base" type="number" min="0" max="10000" value="'+s.base+'"></label><p>'+(entries.length?'Promedio registrado: <b>'+num(eaten)+' kcal por desayuno.</b> ':'Registra un desayuno para calcular el promedio. ')+(s.base&&entries.length?'Diferencia frente a tu referencia de '+num(s.base)+' kcal: <b>'+num(Math.abs(delta))+' % '+(delta<0?'menos':delta>0?'más':'de diferencia')+'</b>.':'Introduce tu propia referencia para ver la diferencia porcentual.')+'</p><small>La comparación usa alimentos consumidos y una referencia personal, sin atribuirle un promedio nacional.</small></section>'}
