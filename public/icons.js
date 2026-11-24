const lines = {
 plan:'M4 5h16v15H4z M8 3v4 M16 3v4 M4 10h16 M8 14h3',
 search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
 basket:'M2 10h20l-3 10H5z M6 10l5-7 M18 10l-5-7 M9 13v4 M15 13v4',
 profile:'M3 21c0-8 18-8 18 0 M16 8a4 4 0 1 1-8 0 4 4 0 1 1 8 0',
 stack:'M3 7l9-5 9 5-9 5z M3 12l9 5 9-5 M3 17l9 5 9-5',
 list:'M8 6h13 M8 12h13 M8 18h13 M3 6h1 M3 12h1 M3 18h1',
 track:'M3 19h18 M5 15l5-5 4 2 6-8',
 heart:'M12 20C9 17 2 13 2 8c0-5 7-7 10-2 3-5 10-3 10 2 0 5-7 9-10 12z',
 star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
 repeat:'M4 8h15l-4-4 M20 16H5l4 4',
 back:'M20 12H4l7-7 M4 12l7 7',chevron:'M9 5l7 7-7 7',
 bowl:'M3 12h18a9 9 0 0 1-18 0z M7 22h10 M7 9c-2-2 2-3 0-5 M12 9c-2-2 2-4 0-6 M17 9c-2-2 2-3 0-5',
 clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 6v6l4 2',
 more:'M5 12h.1 M12 12h.1 M19 12h.1',grip:'M8 7h.1 M16 7h.1 M8 12h.1 M16 12h.1 M8 17h.1 M16 17h.1',
 shuffle:'M3 6h3c5 0 7 12 12 12h3l-3-3 M3 18h3c2 0 4-3 5-5 M14 8c1-1 3-2 5-2h2l-3-3'
};
export const icon=(key)=>'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(['more','grip'].includes(key)?3.6:1.7)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+lines[key]+'"/></svg>';
