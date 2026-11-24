import {icon} from './icons.js';
import {categories,categoryPhotos,allergens} from './breakfast.js';
const steps=['Perfil físico','Objetivo','Alergias','Para quién cocinas','Desayunos preferidos','Metas nutricionales'];
export const profileDefaults={height:'',weight:'',age:'',sex:'',fat:'',mode:'General',goal:'Mantener peso',targetWeight:'',household:'Solo yo',people:2,allergies:[],categories:[],kcal:400,carb:45,fatGrams:12,protein:15,fiber:5};
function radio(key,items,p){return items.map(x=>`<label class="choice"><input type="radio" name="${key}" value="${x}" ${p[key]===x?'checked':''}>${x}</label>`).join('')}
function number(key,title,p,min,max,step=1){return `<label>${title}<input type="number" name="${key}" value="${p[key]===''?'':Number(p[key])}" min="${min}" max="${max}" step="${step}"></label>`}
export function profileForm(p,i){
 const body=[
 ()=>number('height','Talla (cm)',p,1,300)+number('weight','Peso (kg)',p,1,650,0.1)+number('age','Edad (años)',p,1,120)+'<h3>Sexo biológico</h3>'+radio('sex',['Femenino','Masculino','Otro'],p)+'<h3>Grasa corporal percibida</h3>'+radio('fat',['Baja','Media','Alta'],p)+'<p><small>Datos opcionales guardados en este navegador.</small></p>',
 ()=>radio('mode',['General','Exacto'],p)+'<h3>¿Qué quieres lograr?</h3>'+radio('goal',['Perder grasa','Mantener peso','Ganar músculo'],p)+'<div id="exact" '+(p.mode==='Exacto'?'':'hidden')+'>'+number('targetWeight','Peso objetivo (kg)',p,1,650,.1)+'</div>',
 ()=>'<p>Marca los grupos que quieres excluir del plan. Para los envases reales, comprueba sus etiquetas y posibles trazas.</p>'+allergens.map(x=>`<label class="choice"><input type="checkbox" name="allergies" value="${x}" ${p.allergies.includes(x)?'checked':''}>${x}</label>`).join(''),
 ()=>'<p>¿Para quién preparas los desayunos y las comidas ligeras?</p>'+radio('household',['Solo yo','Yo y mi familia'],p)+'<div id="family" '+(p.household==='Solo yo'?'hidden':'')+'>'+number('people','Personas en total, incluyéndote',p,2,30)+'</div>',
 ()=>'<p>Selecciona las preparaciones que quisieras ver primero. Puedes dejar todas sin marcar.</p><div class="category-grid">'+categories.map((c,j)=>`<label class="category"><img src="/fotos/${categoryPhotos[j]}" alt=""><span><input type="checkbox" name="categories" value="${j}" ${p.categories.includes(j)?'checked':''}>${c}</span></label>`).join('')+'</div>',
 ()=>'<p>La meta inicial de energía usa como referencia una porción típica de tus recetas compatibles. Puedes editar todas las referencias por persona y desayuno.</p>'+number('kcal','Energía (kcal)',p,1,9999)+number('carb','Carbohidratos (g)',p,0,999,.1)+number('fatGrams','Grasas (g)',p,0,999,.1)+number('protein','Proteína (g)',p,0,999,.1)+number('fiber','Fibra (g)',p,0,999,.1)
 ];
 return `<form id="profileForm" class="panel wizard" data-step="${i}"><div class="wizard-head"><button type="button" aria-label="Volver" ${i?'data-action="prevProfile"':'data-action="nav" data-page="5"'}>${icon('back')}</button><h1>${steps[i]}</h1><button>${i===5?'Guardar':'Siguiente'}</button></div><progress aria-label="Paso ${i+1} de 6" max="6" value="${i+1}"></progress><div class="wizard-body">${body[i]()}</div><div class="actions"><button class="primary">${i===5?'Guardar y ver mi plan':'Siguiente'}</button></div></form>`;
}
export function captureProfile(form,p,i){
 const values=new FormData(form);
 for(const [key,value] of values) if(!['allergies','categories'].includes(key))p[key]=value;
 if(i===2)p.allergies=values.getAll('allergies');
 if(i===4)p.categories=values.getAll('categories').map(Number);
}
