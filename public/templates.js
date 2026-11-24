import {byId, weekdays} from './data.js';

export const library = [
  {name:'Avena para variar', photo:'avena', desc:'Avena con fruta o yogur.', recipes:[['avena','platano'],['avena','yogur'],['avena','yogur','platano']], order:[0,1,2,0,1,2,0]},
  {name:'Yogur y fruta', photo:'yogur', desc:'Desayunos fríos con fresas, plátano y almendras.', recipes:[['yogur','fresa'],['yogur','platano'],['yogur','fresa','almendra']], order:[0,1,2,1,0,2,1]},
  {name:'Semana de quinua', photo:'quinua', desc:'Quinua cocida con fruta o almendras. Pésala en seco.', recipes:[['quinua','platano'],['quinua','almendra'],['quinua','fresa']], order:[0,1,2,0,2,1,0]}
].map(t=>({...t,days:t.order.map(i=>t.recipes[i])}));

export function templateCards(preview,portion){
  const cards=library.map((t,i)=>{
    const ingredients=[...new Set(t.days.flat())];
    const matches=ingredients.filter(id=>portion[id]).length;
    return `<article class="template-card"><img alt="" src="/fotos/${t.photo}.png">
      <h3>${t.name}</h3><p>${t.desc}</p><small>${matches} de ${ingredients.length} ingredientes en tu selección</small>
      <button data-action="preview" data-index="${i}" aria-expanded="${preview===i}" aria-label="Probar plantilla: ${t.name}">Probar plantilla</button></article>`;
  }).join('');
  const t=library[preview];
  let detail='';
  if(t){
    const missing=[...new Set(t.days.flat())].filter(id=>!portion[id]).map(id=>byId[id].name);
    const days=t.days.map((d,i)=>`<li><b>${weekdays[i]}</b> ${d.map(id=>byId[id].name+' ('+(portion[id]||byId[id].portion)+' g)').join(' + ')}</li>`).join('');
    detail=`<section class="template-preview"><h3 id="previewTitle" tabindex="-1">Vista previa · ${t.name}</h3><ul>${days}</ul>
      <p>${missing.length?'Al aplicar se añadirán: '+missing.join(', ')+'.':'Ya seleccionaste todos los ingredientes.'} Esta plantilla reemplazará el calendario actual.</p>
      <div class="actions"><button class="primary" data-action="preset">Usar esta semana</button><button data-action="closepreview">Cerrar vista previa</button></div></section>`;
  }
  return `<section><h2>Plantillas de desayuno</h2><p>Explora siete desayunos y elige cuáles llevar a tu semana.</p><div class="template-grid">${cards}</div>${detail}</section>`;
}
