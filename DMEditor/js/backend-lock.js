(function (root) {
  'use strict';
  const lock = Object.freeze({
    schema: 'belavados-dmeditor-backend-lock-v1',
    projectId: 'dmeditor',
    projectName: 'DMEditor',
    githubOwner: 'tyrannosaurusdm92',
    githubRepository: 'tyrannosaurusdm92/BelavadosProjects',
    githubBranch: 'main',
    repositoryPath: 'DMEditor',
    jsonRepositoryPath: 'DMEditor/json',
    githubPagesUrl: 'https://tyrannosaurusdm92.github.io/BelavadosProjects/DMEditor/',
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec',
    appsScriptLibraryUrl: 'https://script.google.com/macros/library/d/1v06thwdjlv-j82hqHibJF3_gik7i8p9fFfK9nj0EOfi8VHhwT11jK5Eb/4',
    sessionStorageKey: 'Belavados_DMEditor_Backend_Session_v1',
    logicalCollection: 'dmeditor-json-files',
    defaultWorldFile: 'dm_map.json'
  });
  Object.defineProperty(root, 'BELAVADOS_DMEDITOR_BACKEND_LOCK', {
    value: lock, configurable: false, enumerable: true, writable: false
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
