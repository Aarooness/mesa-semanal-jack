document.documentElement.dataset.mesaLista='1';
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-lista-jack]');
  if(!button||!event.isTrusted)return;
  try{
    const lines=JSON.parse(button.dataset.listaJack);
    if(!Array.isArray(lines)||!lines.every(s=>typeof s==='string'))return;
    const {lista=[]}=await chrome.storage.local.get('lista');
    const checked=new Set(lista.filter(row=>row.done).map(row=>row.text));
    await chrome.storage.local.set({lista:lines.map(text=>({text,done:checked.has(text)}))});
    button.textContent='Lista guardada en la extensión';
  }catch{button.textContent='Recarga la página y vuelve a copiar'}
});
