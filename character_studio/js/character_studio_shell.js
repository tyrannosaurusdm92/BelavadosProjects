(function(){
  const frames = {
    generator: document.getElementById('frame-generator'),
    studio: document.getElementById('frame-studio')
  };
  const panels = {
    generator: document.getElementById('panel-generator'),
    studio: document.getElementById('panel-studio')
  };
  const tabs = {
    generator: document.getElementById('tab-generator'),
    studio: document.getElementById('tab-studio')
  };
  const loaders = {
    generator: document.getElementById('loading-generator'),
    studio: document.getElementById('loading-studio')
  };
  const xScroll = document.getElementById('page-x-scroll');
  const xStatus = document.getElementById('page-x-status');
  const xLeft = document.getElementById('page-x-left');
  const xRight = document.getElementById('page-x-right');
  const scrollState = {
    generator: {centered:false, userMoved:false},
    studio: {centered:false, userMoved:false}
  };
  let active = 'generator';
  let syncingRange = false;

  function getDoc(frame){
    try {
      return frame.contentDocument || frame.contentWindow.document;
    } catch(err) {
      return null;
    }
  }

  function buildSrcDoc(sourceId, key){
    const raw = document.getElementById(sourceId).value;
    const wideCanvasInject = '';
    if(raw.includes('</head>')) {
      return raw.replace('</head>', wideCanvasInject + '</head>');
    }
    return wideCanvasInject + raw;
  }

  function pageHeight(doc){
    if(!doc) return 900;
    const body = doc.body;
    const html = doc.documentElement;
    return Math.max(
      900,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0
    ) + 48;
  }

  function pageWidth(doc){
    if(!doc) return 0;
    const body = doc.body;
    const html = doc.documentElement;
    return Math.max(
      body ? body.scrollWidth : 0,
      body ? body.offsetWidth : 0,
      html ? html.scrollWidth : 0,
      html ? html.offsetWidth : 0
    );
  }

  function panelMaxX(key){
    const panel = panels[key];
    if(!panel) return 0;
    return Math.max(0, Math.round((panel.scrollWidth || 0) - (panel.clientWidth || 0)));
  }

  function frameMaxX(key){
    const frame = frames[key];
    const doc = getDoc(frame);
    if(!doc) return 0;
    return Math.max(0, Math.round(pageWidth(doc) - (frame.clientWidth || 0)));
  }

  function usePanelHorizontalScroll(key){
    /* Voice Studio sometimes renders as a 2550px-wide iframe inside the parent panel;
       Generator usually renders as a 2550px document inside a normal iframe.
       This detection lets the one top scroll bar control whichever layer is actually scrollable. */
    return panelMaxX(key) > frameMaxX(key) + 2;
  }

  function getFrameX(key){
    const frame = frames[key];
    const doc = getDoc(frame);
    const panel = panels[key];
    if(usePanelHorizontalScroll(key)) {
      return Math.max(0, Math.round(panel ? panel.scrollLeft || 0 : 0));
    }
    if(!doc || !frame.contentWindow) return 0;
    return Math.max(
      0,
      Math.round(frame.contentWindow.scrollX || doc.documentElement.scrollLeft || doc.body.scrollLeft || 0)
    );
  }

  function maxFrameX(key){
    return Math.max(panelMaxX(key), frameMaxX(key));
  }

  function setFrameX(key, x){
    const frame = frames[key];
    const doc = getDoc(frame);
    const panel = panels[key];
    const max = maxFrameX(key);
    const clamped = Math.max(0, Math.min(max, Math.round(Number(x) || 0)));
    if(usePanelHorizontalScroll(key)) {
      if(panel) panel.scrollLeft = clamped;
      if(doc && frame.contentWindow) {
        const currentY = frame.contentWindow.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0;
        try { frame.contentWindow.scrollTo({left:0, top:currentY, behavior:'auto'}); }
        catch(err) { frame.contentWindow.scrollTo(0, currentY); }
        doc.documentElement.scrollLeft = 0;
        doc.body.scrollLeft = 0;
      }
      syncHorizontalRange();
      return;
    }
    if(!doc || !frame.contentWindow) return;
    if(panel) panel.scrollLeft = 0;
    const currentY = frame.contentWindow.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    try {
      frame.contentWindow.scrollTo({left:clamped, top:currentY, behavior:'auto'});
    } catch(err) {
      frame.contentWindow.scrollTo(clamped, currentY);
    }
    doc.documentElement.scrollLeft = clamped;
    doc.body.scrollLeft = clamped;
    syncHorizontalRange();
  }

  function centerTab(key){
    const max = maxFrameX(key);
    if(max <= 0) return;
    setFrameX(key, Math.round(max / 2));
    scrollState[key].centered = true;
  }

  function syncHorizontalRange(){
    if(!xScroll) return;
    const max = maxFrameX(active);
    const x = getFrameX(active);
    syncingRange = true;
    xScroll.max = String(max);
    xScroll.value = String(Math.max(0, Math.min(max, x)));
    syncingRange = false;
    if(xStatus) {
      if(max <= 0) xStatus.textContent = 'full';
      else {
        const pct = Math.round((Math.max(0, Math.min(max, x)) / max) * 100);
        xStatus.textContent = pct + '%';
      }
    }
  }

  function resizeFrame(key){
    const frame = frames[key];
    const doc = getDoc(frame);
    if(!doc) return;
    frame.style.height = pageHeight(doc) + 'px';
    if(key === active) syncHorizontalRange();
  }

  function resizeAll(){
    Object.keys(frames).forEach(resizeFrame);
  }

  function wireFrame(key){
    const frame = frames[key];
    const panel = panels[key];
    if(panel) panel.addEventListener('scroll', () => { if(key === active) syncHorizontalRange(); }, {passive:true});
    frame.addEventListener('load', () => {
      const doc = getDoc(frame);
      if(loaders[key]) loaders[key].style.display = 'none';
      frame.style.display = 'block';
      resizeFrame(key);
      if(doc) {
        const resize = () => {
          resizeFrame(key);
          if(!scrollState[key].userMoved && !scrollState[key].centered) centerTab(key);
          if(key === active) syncHorizontalRange();
        };
        try {
          const ro = new ResizeObserver(resize);
          if(doc.body) ro.observe(doc.body);
          if(doc.documentElement) ro.observe(doc.documentElement);
        } catch(err) {}
        doc.addEventListener('click', () => setTimeout(resize, 80), true);
        doc.addEventListener('input', () => setTimeout(resize, 80), true);
        doc.addEventListener('change', () => setTimeout(resize, 80), true);
        doc.addEventListener('scroll', () => { if(key === active) syncHorizontalRange(); }, true);
        frame.contentWindow.addEventListener('resize', resize);
        setTimeout(resize, 80);
        setTimeout(resize, 300);
        setTimeout(resize, 900);
      }
    });
  }

  function switchTab(tab){
    if(!frames[tab]) tab = 'generator';
    active = tab;
    document.body.classList.toggle('voice-studio-active', tab === 'studio');
    for(const key of Object.keys(frames)) {
      const isActive = key === tab;
      panels[key].classList.toggle('active', isActive);
      tabs[key].classList.toggle('active', isActive);
      tabs[key].setAttribute('aria-selected', isActive ? 'true' : 'false');
      panels[key].hidden = !isActive;
    }
    const hash = tab === 'studio' ? '#studio' : '#generator';
    if(location.hash !== hash) history.replaceState(null, '', hash);
    setTimeout(() => {
      resizeFrame(tab);
      if(!scrollState[tab].userMoved && !scrollState[tab].centered) centerTab(tab);
      syncHorizontalRange();
      window.scrollTo({top:0, behavior:'smooth'});
    }, 60);
  }

  window.CharacterStudioSwitch = switchTab;
  Object.values(tabs).forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  if(xScroll) {
    xScroll.addEventListener('input', () => {
      if(syncingRange) return;
      scrollState[active].userMoved = true;
      scrollState[active].centered = true;
      setFrameX(active, xScroll.value);
    });
  }
  if(xLeft) {
    xLeft.addEventListener('click', () => {
      scrollState[active].userMoved = true;
      scrollState[active].centered = true;
      setFrameX(active, getFrameX(active) - 420);
    });
  }
  if(xRight) {
    xRight.addEventListener('click', () => {
      scrollState[active].userMoved = true;
      scrollState[active].centered = true;
      setFrameX(active, getFrameX(active) + 420);
    });
  }

  wireFrame('generator');
  wireFrame('studio');
  frames.generator.srcdoc = buildSrcDoc('generator-html-source', 'generator');
  frames.studio.srcdoc = buildSrcDoc('studio-html-source', 'studio');

  window.addEventListener('resize', () => {
    resizeAll();
    syncHorizontalRange();
  });
  setInterval(() => {
    resizeAll();
    syncHorizontalRange();
  }, 1200);

  if(location.hash && location.hash.toLowerCase().includes('studio')) switchTab('studio');
  else switchTab('generator');
})();
