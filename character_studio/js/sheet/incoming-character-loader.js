
(function(){
  function applyIncomingCharacterSheetData(payload){
    if(!payload || typeof payload !== 'object') return;
    var data = payload.character || payload.characterData || payload.sheet || payload.data || payload;
    if(!data || typeof data !== 'object') return;
    if(typeof window.loadSheet === 'function'){
      window.loadSheet(data);
    } else {
      Object.keys(data).forEach(function(key){
        var field = document.querySelector('[data-key="' + String(key).replace(/"/g,'\\"') + '"]');
        if(!field) return;
        if(field.type === 'checkbox') field.checked = !!data[key];
        else field.value = data[key] == null ? '' : data[key];
        field.dispatchEvent(new Event('input',{bubbles:true}));
        field.dispatchEvent(new Event('change',{bubbles:true}));
      });
    }
    document.dispatchEvent(new CustomEvent('belavados:characterSheetApplied',{detail:{source:'external-page'}}));
  }
  window.BelavadosCharacterSheet = window.BelavadosCharacterSheet || {};
  window.BelavadosCharacterSheet.applyData = applyIncomingCharacterSheetData;
  window.addEventListener('message', function(event){
    var msg = event.data;
    if(!msg || typeof msg !== 'object') return;
    if(msg.type === 'belavados.characterSheet.load' || msg.type === 'belavados.character.load' || msg.kind === 'belavados-character-sheet'){
      applyIncomingCharacterSheetData(msg.payload || msg.character || msg.data || msg);
    }
  });
  window.addEventListener('belavados:loadCharacterSheet', function(event){
    applyIncomingCharacterSheetData(event.detail || {});
  });
})();
