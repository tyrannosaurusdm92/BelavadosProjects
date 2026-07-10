(function(global){
  'use strict';

  const decoder = new TextDecoder('utf-8');

  function xmlToText(xml){
    if(!xml) return '';
    return xml
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<\/w:tr>/g, '\n')
      .replace(/<w:tc[^>]*>/g, '\t')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async function readDocx(arrayBuffer, sourcePath){
    const entries = await global.WorldForge.ZipReader.read(arrayBuffer, sourcePath || 'docx');
    const xmlFiles = entries.filter(e => /word\/(document|header\d+|footer\d+)\.xml$/i.test(e.path));
    let parts = [];
    for(const e of xmlFiles){
      const xml = decoder.decode(e.arrayBuffer);
      const text = xmlToText(xml);
      if(text) parts.push(text);
    }
    const props = {};
    const core = entries.find(e => /docProps\/core\.xml$/i.test(e.path));
    if(core){
      const xml = decoder.decode(core.arrayBuffer);
      const title = /<dc:title>(.*?)<\/dc:title>/s.exec(xml);
      const created = /<dcterms:created[^>]*>(.*?)<\/dcterms:created>/s.exec(xml);
      const modified = /<dcterms:modified[^>]*>(.*?)<\/dcterms:modified>/s.exec(xml);
      if(title) props.title = xmlToText(title[1]);
      if(created) props.created = created[1];
      if(modified) props.modified = modified[1];
    }
    return { text: parts.join('\n\n'), props, embeddedFiles: entries };
  }

  global.WorldForge = global.WorldForge || {};
  global.WorldForge.DocxReader = { readDocx, xmlToText };
})(window);
