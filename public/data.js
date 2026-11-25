// Datos ilustrativos por 100 g. Los paquetes y precios son casos de demostración.
export const foods = [
  {id:'pan',name:'Pan integral',group:'Cereales',desc:'Rebanadas para tostar.',tag:'Porción de 40 g',portion:40,n:[250,9,6,0],pack:[400,450],price:[7,7.2]},
  {id:'huevo',name:'Huevo',group:'Huevos',desc:'Peso comestible sin cáscara.',tag:'6,5 g de proteína por 50 g',portion:50,n:[143,13,0,0],pack:[300,600],price:[4,7]},
  {id:'cacao',name:'Cacao sin azúcar',group:'Cacao',desc:'Para mezclar en bebidas.',tag:'Porción de 5 g',portion:5,n:[228,20,33,0],pack:[100,100],price:[null,5]},
  {id:'avena',name:'Avena en hojuelas',group:'Cereales',desc:'Para cocinar con agua o mezclar con yogur.',tag:'4 g de fibra por 40 g',portion:40,n:[380,13,10,0],pack:[500,400],price:[6,5.2]},
  {id:'quinua',name:'Quinua en grano',group:'Cereales',desc:'Pésala en seco y cuécela antes de servir.',tag:'7 g de proteína por 50 g',portion:50,n:[368,14,7,0],pack:[250,500],price:[6,10]},
  {id:'yogur',name:'Yogur natural',group:'Lácteos',desc:'Una base fría para fruta y cereales.',tag:'90 kcal por 150 g',portion:150,n:[60,4,0,0],pack:[750,150],price:[9,2.4]},
  {id:'platano',name:'Plátano',group:'Frutas',desc:'En rodajas, sobre avena o yogur.',tag:'2,6 g de fibra por 100 g',portion:100,n:[89,1.1,2.6,8.7],pack:[100,100],price:[0.65,0.75]},
  {id:'almendra',name:'Almendras',group:'Frutos secos',desc:'Pícalas para dar textura al desayuno.',tag:'3,2 g de proteína por 15 g',portion:15,n:[579,21,12.5,0],pack:[100,200],price:[6,10.5]},
  {id:'fresa',name:'Fresas',group:'Frutas',desc:'Lávalas y córtalas al momento de servir.',tag:'29,5 mg de vitamina C por 50 g',portion:50,n:[32,0.7,2,59],pack:[250,500],price:[4.5,null]}
];
const additions=[["manzana","Manzana",52,0.3,2.4,5,14,0.2],["leche","Leche",61,3.2,0,0,5,3.3],["pera","Pera",57,0.4,3.1,4,15,0.1],["naranja","Naranja",47,0.9,2.4,53,12,0.1],["mango","Mango",60,0.8,1.6,36,15,0.4],["pina","Piña",50,0.5,1.4,48,13,0.1],["lucuma","Lúcuma",99,1.5,2.3,0,25.5,0.4],["griego","Yogur griego natural",73,10,0,0,4,2],["arandano","Arándanos",57,0.7,2.4,10,14,0.3],["kiwi","Kiwi",61,1.1,3,93,15,0.5],["coco","Coco rallado",660,7,16,1,24,65],["mani","Maní",567,26,9,0,16,49],["nuez","Nueces",654,15,7,1,14,65],["pasas","Pasas",299,3,4,2,79,0.5],["miel","Miel",304,0.3,0,0,82,0],["queso","Queso crema",342,6,0,0,4,34],["palta","Palta",160,2,7,10,9,15],["zanahoria","Zanahoria",41,0.9,3,6,10,0.2]];
for(const [id,name,kcal,p,f,v,c,fat] of additions){
 const portion=['coco','mani','nuez','pasas','miel'].includes(id)?15:100;
 foods.push({id,name,group:'Despensa y frescos',desc:'Peso de la parte comestible.',tag:portion+' g por uso',portion,n:[kcal,p,f,v],macro:[c,fat],pack:[250,500],price:[5,9]});
}
for(const f of foods){f.pack.push(f.pack[0],f.pack[1]);f.price.push(f.price[0]===null?null:+(f.price[0]*1.08).toFixed(2),f.price[1]===null?null:+(f.price[1]*.96).toFixed(2))}
const metroOats=foods.find(f=>f.id==='avena');metroOats.pack[3]=500;metroOats.price[3]=8.9;
export const byId = Object.fromEntries(foods.map(f=>[f.id,f]));
export const weekdays = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
export const stores = ['Wong','Plaza Vea','Vivanda','Metro'];
export const money = n => 'S/ '+n.toFixed(2);
export const num = n => new Intl.NumberFormat('es-PE',{maximumFractionDigits:1}).format(n);
export function totals(rows) {
  return rows.reduce((a,[id,g])=>a.map((v,i)=>v+(i===0?g:byId[id].n[i-1]*g/100)),[0,0,0,0,0]);
}
export function needs(days,portion,count) {
  const out={};
  for(let i=0;i<count;i++) for(const id of days[i%7]) out[id]=(out[id]||0)+portion[id];
  return out;
}
export function quote(required,pantry,shop) {
  return Object.entries(required).map(([id,g])=>{
    const f=byId[id], missing=Math.max(0,g-(pantry[id]||0)), packs=Math.ceil(missing/f.pack[shop]);
    const available=!packs||f.price[shop]!==null;
    return {id,g,missing,packs,available,cost:available?packs*(f.price[shop]||0):null,left:available?(pantry[id]||0)+packs*f.pack[shop]-g:null};
  });
}

export const deliverySlots=['9:00 a. m. – 12:00 p. m.','12:00 p. m. – 3:00 p. m.','3:00 p. m. – 6:00 p. m.','6:00 p. m. – 9:00 p. m.'];
