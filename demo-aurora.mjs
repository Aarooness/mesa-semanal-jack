// Ejecutar con el servidor local encendido en una instalación nueva.
import {randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:8734/api/';
const file=new URL('.aurora-demo.json',import.meta.url);
let saved;
try{saved=JSON.parse(await readFile(file,'utf8'))}catch(err){if(err.code!=='ENOENT')throw err}
const credentials=saved||{username:'mercado_aurora',password:randomBytes(18).toString('base64url')};
let cookie='';
async function post(route,data){
 const res=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',cookie},body:JSON.stringify(data)});
 const value=await res.json();if(!res.ok)throw Error(value.error);
 cookie=res.headers.get('set-cookie')?.split(';')[0]||cookie;return value;
}
if(saved)await post('login',credentials);
else{
 await post('register',{...credentials,role:'store',storeName:'Mercado Aurora'});
 await writeFile(file,JSON.stringify(credentials),{flag:'wx',mode:0o600});
}
const image=await readFile(new URL('public/fotos/parfait.jpg',import.meta.url));
const examples=[
 {name:'Avena y cacao Aurora',unit:'250 g',price:8.9,description:'Mezcla de avena y cacao para preparar en casa.',photo:'https://www.themealdb.com/images/ingredients/Oats.png',design:1,components:[{id:'avena',grams:230,price:5},{id:'cacao',grams:20,price:2}]},
 {name:'Parfait de fresa Aurora',unit:'200 g',price:7.5,description:'Yogur con fresas en capas.',photo:'data:image/jpeg;base64,'+image.toString('base64'),design:2,components:[{id:'yogur',grams:150,price:4},{id:'fresa',grams:50,price:2}]}
];
const catalog=await (await fetch(base+'store',{headers:{cookie}})).json();
for(const product of examples)if(!catalog.products.some(p=>p.name===product.name))await post('products',{...product,location:'Lima · tienda de demostración'});
console.log('Productos disponibles en Comunidad. Acceso local en .aurora-demo.json.');
