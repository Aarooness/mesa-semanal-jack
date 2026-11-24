import {foods,byId} from './data.js';
import {recipes} from './breakfast.js';
import {photo} from './planner.js';
import {esc} from './revision.js';
const designs=['Pie de foto','Portada','Díptico'];
export function poster(title,image,design=0){
 return '<div class="product-poster design-'+Number(design)+'">'+(image?'<img referrerpolicy="no-referrer" src="'+esc(image)+'" alt="">':'')+'<strong>'+esc(title)+'</strong></div>';
}
export function breakfastImage(post){
 const recipe=recipes.find(r=>r.name===post.title);
 const food=foods.find(f=>post.ingredients?.some(i=>i.name===f.name));
 return '/fotos/'+(recipe?photo(recipe):food?food.id+'.png':'parfait.jpg');
}
export function productFields(){
 return '<label>URL HTTPS de la foto<input type="url" name="photo" pattern="https://.*"></label><label>O sube una foto<input type="file" name="upload" accept="image/jpeg,image/png,image/webp"></label><h4>Ingredientes del producto</h4><div id="product-lines"></div><button type="button" data-add-product-line>＋ Ingrediente</button><h4>Diseño para Comunidad</h4><div class="design-grid">'+designs.map((name,i)=>'<label><span class="sample"></span><input name="design" type="radio" value="'+i+'" '+(!i?'checked':'')+'>'+name+'</label>').join('')+'</div>';
}
function line(){return '<div class="product-line"><select aria-label="Ingrediente">'+foods.map(f=>'<option value="'+f.id+'">'+esc(f.name)+'</option>').join('')+'</select><label>Peso (g)<input type="number" required min=".1" step=".1" value="50"></label><label>Precio de esa cantidad (S/)<input type="number" required min="0" step=".01"></label><button type="button" data-remove-product-line>Quitar</button></div>'}
export function refreshDesigns(form){
 if(!form)return;
 const image=form.dataset.preview||(form.photo.value.startsWith('https://')?form.photo.value:'');
 form.querySelectorAll('.sample').forEach((el,i)=>el.innerHTML=poster(form.elements.name.value||'Tu producto',image,i));
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-add-product-line]'))document.querySelector('#product-lines').insertAdjacentHTML('beforeend',line());
 if(e.target.closest('[data-remove-product-line]'))e.target.closest('.product-line').remove();
});
document.addEventListener('input',e=>{if(['name','photo'].includes(e.target.name))refreshDesigns(e.target.closest('[data-platform-form="product"]'))});
document.addEventListener('change',e=>{if(e.target.name==='upload'){const f=e.target.form;if(f.dataset.preview)URL.revokeObjectURL(f.dataset.preview);f.dataset.preview=e.target.files[0]?URL.createObjectURL(e.target.files[0]):'';refreshDesigns(f)}});
export async function productData(form,data){
 const file=form.upload.files[0];let photo=data.photo;
 if(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10000000)throw Error('Elige JPG, PNG o WebP de hasta 10 MB.');
  const img=await createImageBitmap(file);const canvas=document.createElement('canvas'),scale=Math.min(1,700/Math.max(img.width,img.height));
  canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);img.close();photo=canvas.toDataURL('image/jpeg',.72);
  if(photo.length>380000)throw Error('Reduce el tamaño de esta foto.');
 }
 if(photo&&!file){const img=new Image();img.src=photo;try{await img.decode()}catch{throw Error('La URL no carga como imagen. Puedes subir la foto desde tu equipo.')}}
 const components=[...form.querySelectorAll('.product-line')].map(el=>{const [g,p]=el.querySelectorAll('input');return {id:el.querySelector('select').value,grams:+g.value,price:+p.value}});
 return {...data,upload:undefined,photo,design:+data.design,components,unit:data.weight+' '+data.weightUnit,price:+data.price};
}
export function ingredientSummary(items=[]){return items.map(x=>esc(byId[x.id].name)+' · '+x.grams+' g · S/ '+x.price.toFixed(2)).join('<br>')}
