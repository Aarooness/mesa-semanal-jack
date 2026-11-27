export function copyList(entries){
 const totals=new Map();
 for(const [name,quantity,unit] of entries){
   if(quantity<=0)continue;
   const key=JSON.stringify([name,unit]);totals.set(key,(totals.get(key)||0)+quantity);
 }
 const lines=[...totals].map(([key,q])=>{const [name,unit]=JSON.parse(key);return name+' · '+q.toLocaleString('es-PE')+' '+unit});
 const data=JSON.stringify(lines).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 return lines.length?'<div><button type="button" data-lista-jack="'+data+'">Copiar a mi extensión</button><small hidden>Instala la <a download href="/extensiones/lista-compras.zip">extensión Lista de compras</a> y recarga Mesa Jack.</small></div>':'';
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-lista-jack]');if(b&&!document.documentElement.dataset.mesaLista)b.nextElementSibling.hidden=false;
});
