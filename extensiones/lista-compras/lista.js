async function render(){
  const {lista=[]}=await chrome.storage.local.get('lista');
  const box=document.querySelector('#items');box.replaceChildren();
  for(const row of lista){
    const label=document.createElement('label'),check=document.createElement('input'),span=document.createElement('span');
    check.type='checkbox';check.checked=row.done;span.textContent=row.text;
    check.onchange=async()=>{
      const {lista:latest=[]}=await chrome.storage.local.get('lista');
      const item=latest.find(i=>i.text===row.text);if(item){item.done=check.checked;await chrome.storage.local.set({lista:latest})}
    };
    label.append(check,span);box.append(label);
  }
  document.querySelector('#estado').textContent=lista.length?lista.filter(i=>i.done).length+' de '+lista.length+' comprados':'En Mesa Jack abre tu canasta y pulsa Copiar a mi extensión.';
}
document.querySelector('#refresh').onclick=render;chrome.storage.onChanged.addListener(render);render();
