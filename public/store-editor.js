import {foods,byId} from './data.js';
import {recipes,nutrition} from './breakfast.js';
import {photo} from './planner.js';
import {esc} from './revision.js';
const designs=['Pie de foto','Portada','Díptico'];
export function poster(title,image,design=0){
 return '<div class="product-poster design-'+Number(design)+'">'+(image?'<img referrerpolicy="no-referrer" src="'+esc(image)+'" alt="">':'')+'<strong>'+esc(title)+'</strong></div>';
}
export function breakfastImage(post){
 if(post.photo)return post.photo;
 const recipe=recipes.find(r=>r.name===post.title);
 const food=foods.find(f=>post.ingredients?.some(i=>i.name===f.name));
 return '/fotos/'+(recipe?photo(recipe):food?food.id+'.png':'parfait.jpg');
}
export function productFields(specialty){
 return '<label>Tipo de producto<select name="kind">'+(specialty!=='desayunos'?'<option value="ingrediente">Ingrediente en venta</option>':'')+(specialty!=='ingredientes'?'<option value="desayuno">Desayuno preparado</option>':'')+'</select></label><label data-food-tag>Ingrediente del catálogo<select name="food">'+foods.map(f=>'<option value="'+f.id+'">'+esc(f.name)+'</option>').join('')+'</select></label><label>URL HTTPS de la foto<input type="url" name="photo" pattern="https://.*"></label><label>O sube una foto<input type="file" name="upload" accept="image/jpeg,image/png,image/webp"></label><label data-meal-template>Plantilla de desayuno<select name="mealTemplate"><option value="">Personalizado</option>'+recipes.map((r,i)=>'<option value="'+i+'">'+esc(r.name)+'</option>').join('')+'</select></label><label data-preparation>Preparación<textarea name="preparation" maxlength="2000"></textarea></label><h4>Ingredientes del producto</h4><div data-product-lines></div><output data-composition></output><button type="button" data-add-product-line>＋ Ingrediente</button><h4>Diseño para Comunidad</h4><div class="design-grid">'+designs.map((name,i)=>'<label><span class="sample"></span><input name="design" type="radio" value="'+i+'" '+(!i?'checked':'')+'>'+name+'</label>').join('')+'</div>';
}
function line(){return '<div class="product-line"><select aria-label="Ingrediente">'+foods.map(f=>'<option value="'+f.id+'">'+esc(f.name)+'</option>').join('')+'</select><label>Peso (g)<input type="number" required min="5" step="5" value="50"></label><button type="button" data-remove-product-line>Quitar</button></div>'}
export function editProduct(form,p){
 form.reset();
 if(form.dataset.preview?.startsWith('blob:'))URL.revokeObjectURL(form.dataset.preview);
 form.dataset.editId=p.id;form.dataset.preview=p.photo||'';form.dataset.originalPhoto=p.photo||'';
 const fields=form.elements;
 for(const key of ['name','location','description','preparation','food','design'])if(p[key]!=null)fields[key].value=String(p[key]);
 fields.price.value=p.price;
 const weight=/^([\d.]+) (g|kg)$/.exec(p.unit);
 fields.weight.value=weight?.[1]||'';fields.weightUnit.value=weight?.[2]||'g';
 const lines=form.querySelector('[data-product-lines]');lines.innerHTML='';
 for(const c of p.components||[]){
  lines.insertAdjacentHTML('beforeend',line());
  lines.lastElementChild.querySelector('select').value=c.id;
  const amount=lines.lastElementChild.querySelector('input');amount.min='.1';amount.step='any';amount.value=c.grams;
 }
 form.querySelector('h3').textContent=p.kind==='ingrediente'?'Editar ingrediente':'Editar producto';
 form.querySelector('[type="submit"]').textContent='Guardar cambios';
 if(!form.querySelector('[data-platform="cancel-product"]'))form.insertAdjacentHTML('beforeend',' <button type="button" data-platform="cancel-product">Cancelar</button>');
 refreshDesigns(form);fields.name.focus();
}
export function refreshDesigns(form){
 if(!form)return;form.querySelector('[data-food-tag]').hidden=form.elements.kind.value!=='ingrediente';
 const image=form.elements.upload.files.length?form.dataset.preview:(form.photo.value||form.dataset.originalPhoto||'');
 const breakfast=form.elements.kind.value==='desayuno';for(const sel of ['[data-meal-template]','[data-preparation]'])form.querySelector(sel).hidden=!breakfast;
 const rows=[...form.querySelectorAll('.product-line')].map(row=>[row.querySelector('select').value,+row.querySelector('input').value]);const n=nutrition(rows);
 form.querySelector('[data-composition]').textContent=breakfast&&rows.length?Math.round(n.kcal)+' kcal · '+n.protein.toFixed(1)+' g proteína · '+n.fiber.toFixed(1)+' g fibra':'';
 form.querySelectorAll('.sample').forEach((el,i)=>el.innerHTML=poster(form.elements.name.value||'Tu producto',image,i));
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-add-product-line]'))e.target.closest('form').querySelector('[data-product-lines]').insertAdjacentHTML('beforeend',line());
 if(e.target.closest('[data-remove-product-line]'))e.target.closest('.product-line').remove();
});
document.addEventListener('input',e=>{if(['name','photo'].includes(e.target.name))refreshDesigns(e.target.closest('[data-platform-form="product"]'))});
document.addEventListener('change',e=>{if(e.target.name==='mealTemplate'&&e.target.value!==''){const r=recipes[+e.target.value],f=e.target.form;f.elements.name.value=r.name;f.elements.preparation.value=r.steps.join('\n');const lines=f.querySelector('[data-product-lines]');lines.innerHTML='';for(const id of r.ids){lines.insertAdjacentHTML('beforeend',line());lines.lastElementChild.querySelector('select').value=id;lines.lastElementChild.querySelector('input').value=Math.max(5,Math.round(byId[id].portion/5)*5)}refreshDesigns(f)}
 if(e.target.closest('.product-line'))refreshDesigns(e.target.closest('form'));if(e.target.name==='kind')refreshDesigns(e.target.form);if(e.target.name==='upload'&&e.target.form.dataset.platformForm==='product'){const f=e.target.form;if(f.dataset.preview)URL.revokeObjectURL(f.dataset.preview);f.dataset.preview=e.target.files[0]?URL.createObjectURL(e.target.files[0]):'';refreshDesigns(f)}});
export async function readPhoto(form,required=false){
 const file=form.elements.upload.files[0];let photo=form.elements.photo.value.trim();
 if(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10000000)throw Error('Elige JPG, PNG o WebP de hasta 10 MB.');
  const img=await createImageBitmap(file);const canvas=document.createElement('canvas'),scale=Math.min(1,700/Math.max(img.width,img.height));
  canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);img.close();photo=canvas.toDataURL('image/jpeg',.72);
  if(photo.length>380000)throw Error('Reduce el tamaño de esta foto.');
 }
 if(!photo&&required)throw Error('Selecciona una foto o su URL.');if(photo&&!file){const img=new Image();img.src=photo;try{await img.decode()}catch{throw Error('La URL no carga como imagen. Puedes subir la foto desde tu equipo.')}}
 return photo;
}
export async function productData(form,data){
 const photo=await readPhoto(form,!form.dataset.editId);
 const components=[...form.querySelectorAll('.product-line')].map(el=>{const [g]=el.querySelectorAll('input');return {id:el.querySelector('select').value,grams:+g.value}});
 return {...data,upload:undefined,photo,design:+data.design,components,unit:data.weight+' '+data.weightUnit,price:+data.price};
}
export function ingredientSummary(items=[]){return items.map(x=>esc(byId[x.id].name)+' · '+x.grams+' g').join('<br>')}
