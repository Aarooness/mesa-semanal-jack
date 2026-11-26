import {byId, money, stores} from './data.js';

export function reducedOffers(rows, products) {
  const deals = new Map();
  for (const row of rows) {
    if (!row.missing) continue;
    const food = byId[row.id];
    for (const p of products) {
      if (p.food !== row.id || p.kind !== 'ingrediente') continue;
      const grams = parseFloat(p.unit) * (p.unit.endsWith('kg') ? 1000 : 1);
      if (!(grams > 0 && p.price > 0)) continue;
      const reference = row.available ? row.shop : food.price.reduce((best, price, i) =>
        price != null && (best < 0 || Math.ceil(row.missing/food.pack[i])*price < Math.ceil(row.missing/food.pack[best])*food.price[best]) ? i : best, -1);
      if (reference < 0) continue;
      const packs = Math.ceil(row.missing / grams);
      const cost = Math.round(packs * p.price * 100) / 100;
      const base = Math.ceil(row.missing / food.pack[reference]) * food.price[reference];
      const saving = Math.round((base - cost) * 100) / 100;
      if (saving <= 0 || p.price/grams >= food.price[reference]/food.pack[reference]) continue;
      const existing = deals.get(row.id);
      if (!existing || cost < existing.cost || (cost === existing.cost && grams*packs < existing.grams*existing.packs))
        deals.set(row.id, {p, grams, packs, cost, saving, reference});
    }
  }
  return deals;
}
const escape = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function offerLine(id, deal, chosen, priority=false) {
  const {p, packs, cost, saving, reference} = deal;
  const food=byId[id];
  const action=priority
    ? '<button data-market="addPremium" data-qty="'+packs+'" data-id="'+escape(p.id)+'">Añadir '+packs+' '+(packs===1?'envase':'envases')+' a la canasta</button>'
    : '<label><input type="checkbox" data-field="premiumPick" data-id="'+id+'" '+(chosen?'checked':'')+'> Priorizar</label>';
  return '<div class="premium-item"><img src="/fotos/'+id+'.png" alt=""><div><strong>'+escape(food.name)+'</strong><small>'+escape(p.storeName)+' · '+packs+' × '+escape(p.unit)+' · '+money(cost)+'</small><small>Ahorras '+money(saving)+' frente a '+escape(stores[reference])+'</small></div>'+action+'</div>';
}
