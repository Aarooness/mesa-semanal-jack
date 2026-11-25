import {byId,totals,num} from './data.js';
export const categories=['Batidos','Batidos con proteína','Avena y cereales','Huevos y revueltos','Yogur, pudines y parfaits','Tostadas dulces y saladas','Frutas y verduras','Panqueques y waffles','Bocados con proteína'];
export const categoryPhotos=['licuado.jpg','batido.jpg','porridge.jpg','huevos.jpg','parfait.jpg','tostada.jpg','frutas.jpg','panqueques.jpg','almendra.png'];
export const allergens=['Lácteos','Huevos','Pescado','Gluten','Maní','Sésamo','Mariscos','Soya','Frutos secos'];
const exclude={griego:['Lácteos'],leche:['Lácteos'],queso:['Lácteos'],mani:['Maní'],nuez:['Frutos secos'],yogur:['Lácteos'],huevo:['Huevos'],almendra:['Frutos secos'],pan:['Gluten'],avena:['Gluten']};
export function allowed(id,profile){return !(exclude[id]||[]).some(x=>profile?.allergies?.includes(x))}
const macros={avena:[67,7],quinua:[64,6],yogur:[5,2.5],platano:[23,0.3],almendra:[22,50],fresa:[8,0.3],pan:[45,4],huevo:[1,10],cacao:[58,14]};
export const recipes=[
 ['Batido de cacao y plátano',0,'platano yogur cacao',5,0,'Pela el plátano y córtalo en rodajas.|Licúa con el yogur, el cacao y un poco de agua hasta lograr la textura que prefieras.'],
 ['Batido de yogur con almendras',1,'yogur platano almendra',5,0,'Pica las almendras.|Licúa con el yogur y el plátano. Agrega agua al gusto.'],
 ['Quinua tibia con plátano',2,'quinua platano',3,15,'Enjuaga la quinua en un colador.|Cocina con dos partes de agua por una de quinua hasta que esté tierna. Sirve con el plátano.'],
 ['Revueltos y fresas al lado',3,'huevo fresa',4,5,'Lava y corta las fresas.|Bate los huevos y cocina en una sartén antiadherente hasta que cuajen. Sirve la fruta aparte.'],
 ['Parfait de fresas',4,'yogur fresa almendra',5,0,'Lava y corta las fresas. Pica las almendras.|Alterna capas de yogur y fresas. Termina con las almendras.'],
 ['Tostada con huevo',5,'pan huevo',3,7,'Tuesta el pan.|Bate el huevo y cocínalo por completo en una sartén antiadherente. Colócalo sobre la tostada.'],
 ['Vaso de frutas',6,'platano fresa',5,0,'Lava las fresas y pela el plátano.|Corta ambos en trozos y mezcla justo antes de servir.'],
 ['Panqueques de avena y plátano',7,'avena huevo platano',5,8,'Tritura las hojuelas y mezcla con el plátano machacado y el huevo.|Forma discos en una sartén antiadherente. Cocina por ambos lados hasta que el centro esté firme.'],
 ['Huevo cocido con almendras',8,'huevo almendra',2,12,'Coloca el huevo en agua y cocina hasta que la clara y la yema estén firmes.|Pela y sirve con las almendras al lado.'],
 ['Avena caliente con fresas',2,'avena fresa',3,6,'Calienta agua y añade las hojuelas. Remueve hasta que estén suaves.|Lava y corta las fresas y sirve encima.'],
 ['Quinua y fresas con bebida de plátano',2,'quinua fresa platano',5,15,'Enjuaga y cocina la quinua en agua hasta que esté tierna. Sirve con fresas lavadas.|Licúa por separado el plátano con agua y acompaña el tazón.'],
 ['Batido de fresas y plátano',0,'fresa platano cacao',4,0,'Lava las fresas y pela el plátano.|Licúa la fruta con agua y el cacao. Sirve enseguida.']
].map(([name,cat,ingredients,prep,cook,steps])=>({name,cat,ids:ingredients.split(' '),prep,cook,steps:steps.split('|')}));
for(const row of ["Yogur con mango|yogur mango|4","Tostada de palta|pan palta|5","Batido de plátano con leche|leche platano|0","Avena con manzana|avena manzana|2","Tazón de yogur con kiwi|yogur kiwi|4","Batido de piña|pina leche|0","Panqueques de pera|huevo avena pera|7","Tostada de queso y miel|pan queso miel|5","Jugo de lúcuma|lucuma|0","Quinua con pasas|quinua pasas|2","Yogur con arándanos|yogur arandano|4","Batido de mango y naranja|mango naranja|0","Avena con nueces|avena nuez|2","Manzana con maní|manzana mani|6","Panqueques de coco|avena huevo coco|7","Revuelto con zanahoria|huevo zanahoria|3","Yogur griego solo|griego|4","Jugo de plátano|platano|0"]){
 const [name,items,category]=row.split('|'),ids=items.split(' '),cat=+category;
 const instruction={0:'Lava y pela la fruta. Licúa con el líquido indicado o con agua al gusto.',2:'Cuece el cereal en agua hasta que esté tierno. Añade los acompañamientos.',3:'Ralla la zanahoria. Bate el huevo y cocina ambos hasta que el huevo cuaje.',4:'Sirve el yogur frío y añade los acompañamientos lavados y cortados, si corresponde.',5:'Tuesta el pan y distribuye encima los ingredientes.',6:'Lava la fruta, córtala y sirve con sus acompañamientos.',7:'Tritura los ingredientes con un poco de agua. Cocina discos en una sartén por ambos lados hasta que cuajen.'};
 recipes.push({name,ids,cat,prep:4,cook:cat===2?15:[3,5,7].includes(cat)?6:0,steps:[items==='lucuma'?'Lava la lúcuma, pélala y retira las semillas. Licúa la pulpa con agua hasta lograr la textura deseada.':instruction[cat]]});
}
for(const recipe of recipes){
 const slug=recipe.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll(' ','-');
 recipe.photo='plato-'+slug+'.jpg';
}
const recipeNotes={
 'Batido de cacao y plátano':['El plátano maduro aporta dulzor y cuerpo. El cacao queda más uniforme si primero lo mezclas con una cucharada del yogur.','Haz una pausa a mitad del licuado para recoger el cacao de las paredes. Sirve cuando la bebida tenga un color uniforme.'],
 'Batido de yogur con almendras':['Un batido espeso con la textura del plátano y un toque de almendra. Reserva parte de las almendras para terminar el vaso.','Licúa primero a velocidad baja y después aumenta hasta que desaparezcan los trozos grandes. Reparte la almendra reservada por encima.'],
 'Quinua tibia con plátano':['La quinua queda suelta y el plátano se ablanda con el calor del tazón. Usa el peso de quinua en seco para medir tu porción.','Cuando el grano se abra y absorba el agua, retira del fuego. Déjalo reposar tapado y sepáralo con un tenedor antes de incorporar la fruta.'],
 'Revueltos y fresas al lado':['Un plato de dos texturas. Las fresas se sirven frescas y en un lado del plato para que su jugo quede separado del huevo.','Remueve el huevo desde los bordes al centro con una espátula. Pasa el revuelto al plato en cuanto esté cuajado.'],
 'Parfait de fresas':['Un desayuno frío que puedes montar en un vaso transparente para distinguir las capas. El jugo de las fresas aporta sabor al yogur.','Corta parte de las fresas en láminas y colócalas contra el vaso. Añade las almendras al servir para conservar su textura.'],
 'Tostada con huevo':['La base crujiente sostiene el huevo recién hecho. Elige una rebanada que pueda tostarse de manera pareja hasta el centro.','Deja que el vapor salga de la tostada unos segundos antes de cubrirla. Distribuye el huevo hasta los bordes y sirve enseguida.'],
 'Vaso de frutas':['El plátano da suavidad y la fresa aporta una textura más firme. Corta la fruta en piezas que puedas recoger fácilmente con una cuchara.','Seca las fresas después de lavarlas. Añade el plátano al final y mezcla con cuidado para mantener enteras las rodajas.'],
 'Panqueques de avena y plátano':['El plátano liga la masa y aporta dulzor. Los discos pequeños son más fáciles de voltear y se cocinan de forma pareja.','Deja reposar la masa mientras calientas la sartén. Voltea cada disco cuando el borde esté firme y la espátula pase por debajo sin romperlo.'],
 'Huevo cocido con almendras':['Una opción sencilla para llevar por separado. Las almendras aportan un contraste crujiente con la textura suave del huevo.','Pasa el huevo cocido a agua fría para detener la cocción. Pélalo, córtalo por la mitad y reparte las almendras al lado.'],
 'Avena caliente con fresas':['El cereal se espesa mientras reposa. Las fresas frescas sobre la avena tibia conservan su forma y contrastan con la base cremosa.','Si la avena queda muy espesa, incorpora un chorrito de agua caliente. Sirve en un tazón y reparte las fresas por encima.'],
 'Quinua y fresas con bebida de plátano':['Esta preparación se sirve en dos recipientes. La quinua y las fresas van en un tazón y el plátano se aprovecha en una bebida.','Suelta la quinua cocida con un tenedor y deja salir un poco de vapor antes de añadir las fresas. Sirve el licuado aparte y recién hecho.'],
 'Batido de fresas y plátano':['Las fresas dan el sabor principal y el plátano aporta cuerpo. El cacao se incorpora poco a poco para evitar grumos.','Retira las hojas de las fresas. Empieza con poca agua y añade un poco más solo si el batido no circula bien en la licuadora.'],
 'Yogur con mango':['Usa mango maduro para que su jugo se mezcle con el yogur.','Corta a ambos lados de la pepa, saca la pulpa con una cuchara y reserva unos cubos para servir encima.'],
 'Tostada de palta':['Una tostada tibia sirve de base para la palta recién abierta.','Aplasta parte de la pulpa para untarla y corta el resto en láminas. Monta la tostada justo antes de comer.'],
 'Batido de plátano con leche':['Un vaso cremoso que puedes hacer con leche fría y plátano maduro.','Vierte primero la leche y después añade las rodajas de plátano. Licúa hasta que no queden trozos en el fondo.'],
 'Avena con manzana':['La manzana rallada se integra en la avena y la manzana en cubos conserva más textura.','Incorpora una parte durante la cocción. Reserva el resto para terminar el tazón al servir.'],
 'Tazón de yogur con kiwi':['El kiwi aporta un toque ácido al yogur frío.','Pela la fruta, córtala en medias lunas y añádela al yogur justo antes de comer para conservar su textura.'],
 'Batido de piña':['El centro de la piña puede ser más fibroso que la pulpa.','Retira los trozos duros, corta la pulpa en cubos pequeños y licúa con la leche fría. Sirve inmediatamente.'],
 'Panqueques de pera':['La pera madura aporta humedad a la masa de avena y huevo.','Retira el corazón y ralla la pulpa. Si suelta mucho jugo, incorpora el agua poco a poco antes de cocinar los discos.'],
 'Tostada de queso y miel':['Una capa de queso crema sobre pan tostado sostiene un hilo de miel.','Espera unos segundos a que deje de salir vapor del pan. Unta el queso y distribuye la miel por encima al final.'],
 'Jugo de lúcuma':['La pulpa madura es espesa y se deshace fácilmente con una cuchara.','Retira también la película que rodea la pepa. Empieza con poca agua y ajusta el espesor después del primer licuado.'],
 'Quinua con pasas':['Las pasas quedan tiernas si pasan los últimos minutos en la quinua caliente.','Enjuaga el grano antes de cocerlo. Incorpora las pasas cuando quede poca agua, tapa y deja reposar antes de servir.'],
 'Yogur con arándanos':['Los arándanos se pueden combinar enteros y machacados en el mismo vaso.','Seca la fruta lavada, aplasta unos cuantos con un tenedor y mezcla su jugo con el yogur. Termina con los restantes.'],
 'Batido de mango y naranja':['La naranja aporta el líquido para licuar el mango.','Exprime la naranja y retira las pepas. Añade la pulpa del mango en cubos y ajusta con agua si queda muy espeso.'],
 'Avena con nueces':['La avena queda cremosa y las nueces conservan mejor su textura si se incorporan al final.','Trocea las nueces mientras cueces el cereal. Reserva algunos pedazos más grandes para repartir sobre el tazón.'],
 'Manzana con maní':['Los gajos de manzana sirven de base para el maní troceado.','Retira el corazón de la fruta. Pica el maní y sirve ambas partes juntas para combinar un poco de cada una en cada bocado.'],
 'Panqueques de coco':['El coco rallado absorbe parte del líquido de la mezcla de avena y huevo.','Deja reposar la masa unos minutos. Si cuesta extenderla, añade agua de a cucharadas y cocina porciones pequeñas a fuego medio.'],
 'Revuelto con zanahoria':['Una ralladura fina permite que la zanahoria se cocine en poco tiempo.','Ablanda primero la zanahoria en la sartén con un poco de agua. Cuando se evapore, añade el huevo batido y remueve hasta que cuaje.'],
 'Yogur griego solo':['Una porción fría que se puede sumar a otro plato del día.','Pesa la cantidad que figura en tu menú y remueve el yogur para integrar el suero de la superficie antes de servirlo.'],
 'Jugo de plátano':['El plátano maduro permite preparar una bebida suave usando agua como base.','Empieza con agua fría y la mitad del plátano. Añade el resto poco a poco hasta conseguir el espesor que te guste.']
};
for(const r of recipes){
 const [description,tip]=recipeNotes[r.name];
 r.description=description;
 if(r.name==='Revuelto con zanahoria')r.steps=['Lava y ralla la zanahoria. Bate el huevo en un recipiente aparte.'];
 r.steps.push(tip);
}
export function meal(ids){
 const same=recipes.find(r=>r.ids.length===ids.length&&r.ids.every(id=>ids.includes(id)));
 if(same)return same;
 return {name:ids.map(id=>byId[id].name).join(' + '),cat:null,ids,prep:5,cook:ids.includes('quinua')?15:ids.some(x=>['huevo','avena'].includes(x))?8:0,steps:ids.map(id=>({quinua:'Enjuaga y cuece la quinua en agua hasta que esté tierna.',huevo:'Cocina el huevo hasta que clara y yema estén firmes.',pan:'Tuesta el pan.',avena:'Cuece las hojuelas con agua hasta que estén suaves.',fresa:'Lava y corta las fresas.',platano:'Pela y corta el plátano.',almendra:'Pica las almendras.',yogur:'Sirve el yogur frío.',cacao:'Disuelve el cacao en agua caliente.'})[id])};
}
export function nutrition(rows){
 const [,kcal,protein,fiber,vitamin]=totals(rows);
 const sum=i=>rows.reduce((a,[id,g])=>a+(byId[id].macro||macros[id])[i]*g/100,0);
 return {kcal,protein,fiber,vitamin,carb:sum(0),fat:sum(1)};
}
export function pie(n){
 const values=[['Carbohidratos',n.carb,4,'#dd9d20'],['Grasas',n.fat,9,'#257d75'],['Proteína',n.protein,4,'#8361bc']].filter(x=>x[1]>0);
 const energy=values.reduce((sum,[,g,k])=>sum+g*k,0);
 let start=0;
 const segments=values.map(([,g,k,color])=>{const prev=start;start+=100*g*k/energy;return color+' '+prev+'% '+start+'%'});
 const list=values.map(([name,g,k,color])=>'<li><i style="background:'+color+'"></i>'+name+' · '+num(g)+' g · '+num(100*g*k/energy)+' %</li>').join('');
 return '<div class="composition"><div class="pie" aria-hidden="true" style="background:conic-gradient('+segments.join(',')+')"></div><div><b>'+num(n.kcal)+' kcal</b><ul>'+list+'</ul>'+(n.fiber>0?'Fibra '+num(n.fiber)+' g · ':'')+(n.vitamin>0?'Vitamina C '+num(n.vitamin)+' mg':'')+'</div></div><small>Porcentajes de energía estimada de los tres macronutrientes.</small>';
}
