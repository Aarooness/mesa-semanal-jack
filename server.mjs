import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {foods,byId} from './public/data.js';
import {createPlatform} from './platform-api.mjs';
try{process.loadEnvFile(fileURLToPath(new URL('.env',import.meta.url)))}catch(e){if(e.code!=='ENOENT')throw e}
const root=path.dirname(fileURLToPath(import.meta.url)), web=path.join(root,'public');
const db=path.join(root,'comunidad.json'), port=Number(process.env.PORT||8734);
const platform=createPlatform(root);
function templates(){return fs.existsSync(db)?JSON.parse(fs.readFileSync(db,'utf8')):[]}
const validDays=(days,ids)=>Array.isArray(days)&&days.length===7&&days.every(day=>Array.isArray(day)&&day.length>0&&new Set(day).size===day.length&&day.every(id=>ids.includes(id)));
function fail(msg,status=400){throw Object.assign(new Error(msg),{status})}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>(req.url==='/api/products'?400000:64000))fail('Solicitud demasiado grande.',413)}try{return JSON.parse(raw)}catch{fail('Datos incorrectos.')}}
const server=http.createServer(async(req,res)=>{
  const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))};
  try{
    const url=new URL(req.url,'http://localhost');
    if(['POST','PATCH','DELETE'].includes(req.method)&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)fail('Origen inválido.',403);
    if(await platform.handle(req,res,url,body,send))return;
    if(url.pathname==='/api/templates'&&req.method==='GET')return send(200,templates());
    if(url.pathname==='/api/templates'&&req.method==='POST'){
      const user=platform.requireUser(req);
      const {name,days,portion,scales=Array(7).fill(1),extra=Array.from({length:7},()=>[]),extraScale=Array.from({length:7},()=>[])}=await body(req);
      if(!Array.isArray(scales)||scales.length!==7||!scales.every(n=>Number.isFinite(n)&&n>0&&n<=100))fail("Revisa las porciones de cada día.");
      if(typeof name!=='string'||!name.trim()||name.length>70||!validDays(days,foods.map(f=>f.id)))fail('Completa los siete días y el nombre.');
      const ids=foods.map(f=>f.id);
      if(!Array.isArray(extra)||extra.length!==7||!extra.every(d=>Array.isArray(d)&&d.length<=40&&d.every(r=>Array.isArray(r)&&r.length&&r.every(id=>ids.includes(id))))||!Array.isArray(extraScale)||extraScale.length!==7||!extraScale.every(d=>Array.isArray(d)&&d.every(x=>x===null||Number.isFinite(x)&&x>0&&x<=100)))fail('Platos adicionales inválidos.');
      const clean={};for(const id of new Set([...days.flat(),...extra.flat(2)])){if(!Number.isInteger(portion?.[id])||portion[id]<5||portion[id]>500)fail('Porción inválida.');clean[id]=portion[id]}
      const data=templates();data.unshift({id:crypto.randomUUID(),name:name.trim(),author:user.username,days,scales,extra,extraScale,portion:clean});fs.writeFileSync(db+'.tmp',JSON.stringify(data));fs.renameSync(db+'.tmp',db);return send(201,data[0]);
    }
    if(req.method!=='GET'||url.pathname.includes('..'))fail('Ruta inexistente.',404);
    const file=path.join(web,url.pathname==='/'?'index.html':url.pathname);
    if(!file.startsWith(web+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())fail('Ruta inexistente.',404);
    const type={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg'};
    res.writeHead(200,{'Content-Type':type[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
  }catch(err){send(err.status||500,{error:err.status?err.message:'No se pudo completar la operación.'})}
});
server.listen(port,'127.0.0.1',()=>console.log('Mesa Semanal http://127.0.0.1:'+port));
