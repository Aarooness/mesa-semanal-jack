(() => {
  let active = null;
  const cancel = () => {if (active) {active=null; speechSynthesis.cancel();}};
  window.addEventListener('hashchange', cancel);
  window.addEventListener('pagehide', cancel);
const root = document.querySelector('#main');
if (root) {
  const sync = () => {
    if(active && !root.querySelector(".mesa-jack-reader")) cancel();
    const title = root.querySelector('.recipe-title h1');
    const steps = root.querySelector('section.panel ol');
    if (!title || !steps || steps.parentElement.querySelector('.mesa-jack-reader')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mesa-jack-reader';
    button.textContent = 'Escuchar preparación';
    steps.after(button);
    button.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) {button.textContent='Voz no disponible';return;}
      if (active) {cancel();button.textContent='Escuchar preparación';return;}
      const speech=new SpeechSynthesisUtterance(Array.from(steps.children,(li,i)=>'Paso '+(i+1)+'. '+li.textContent).join('. '));
      speech.lang='es-PE';active=speech;
      speech.onend=speech.onerror=()=>{if(active===speech){active=null;button.textContent='Escuchar preparación';}};
      button.textContent='Detener lectura';speechSynthesis.speak(speech);
    });
  };
  new MutationObserver(sync).observe(root, {childList:true, subtree:true});
  sync();
}
})();
