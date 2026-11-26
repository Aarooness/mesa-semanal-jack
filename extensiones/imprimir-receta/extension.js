(() => {
const root = document.querySelector('#main');
if (root) {
  const sync = () => {
    const title = root.querySelector('.recipe-title h1');
    const steps = root.querySelector('section.panel ol');
    if (!title || !steps || steps.parentElement.querySelector('.mesa-jack-print')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mesa-jack-print';
    button.textContent = 'Imprimir receta';
    steps.after(button);
    button.addEventListener('click', () => {
      const win = window.open('about:blank','_blank');
      if (!win) return;
      win.opener=null;
      const doc=win.document;
      doc.title=title.textContent+' · Mesa Jack';
      doc.documentElement.lang='es';
      const el=(tag,value,parent=doc.body)=>{const node=doc.createElement(tag);node.textContent=value;parent.appendChild(node);return node;};
      el('style','body{font:16px/1.55 system-ui;max-width:68ch;margin:3em auto;padding:1em}h1,h2{color:#17483f}li{margin:.35em 0}@page{margin:18mm}',doc.head);
      el('small','MESA JACK');el('h1',title.textContent);
      const portions=root.querySelector('.ingredient')?.parentElement.querySelector('h2')?.textContent||'Ingredientes';
      el('h2',portions);
      const list=el('ul','');
      for(const row of root.querySelectorAll('.ingredient'))el('li',[...row.querySelectorAll('strong,span')].map(n=>n.textContent).join(' · '),list);
      el('h2','Preparación');const ol=el('ol','');
      for(const step of steps.children)el('li',step.textContent,ol);
      win.focus();win.print();
    });
  };
  new MutationObserver(sync).observe(root, {childList:true, subtree:true});
  sync();
}
})();
