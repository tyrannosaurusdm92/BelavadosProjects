(() => {
  'use strict';
  const S = window.BelavadosScanner || (window.BelavadosScanner = {});
  S.previewSelected = function(){
    const readout = document.getElementById('scannerPreviewStatus') || document.getElementById('voiceStatus');
    if(readout) readout.textContent = 'Scanner voice preview placeholder active — speech runtime removed.';
  };
  S.stopPreview = function(){
    const readout = document.getElementById('scannerPreviewStatus') || document.getElementById('voiceStatus');
    if(readout) readout.textContent = 'Scanner voice preview placeholder stopped.';
  };
})();
