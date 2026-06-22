(function(){
  'use strict';
  function escAttr(value){ return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
  function buildSheetSrcdoc(){
    const tpl = document.getElementById('belavados-character-sheet-template');
    const body = tpl ? tpl.innerHTML : '<p>Character sheet template missing.</p>';
    const base = new URL('.', window.location.href).href;
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<base href="' + escAttr(base) + '">'
      + '<title>Belavadös Profile D&D Character Sheet</title>'
      + '<link rel="stylesheet" href="css/character-sheet.css">'
      + '</head><body>' + body + '<script src="js/sheet-data-loader.js" defer><\/script></body></html>';
  }
  function mount(){
    const frame = document.getElementById('characterSheetFrame');
    if(!frame) return;
    frame.srcdoc = buildSheetSrcdoc();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
