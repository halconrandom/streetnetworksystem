// Screenshot Editor translations
export const translations = {
  en: {
    // TopBar
    clearAll: 'Clear All',
    import: 'Import',
    export: 'Export',
    cache: 'Cache',
    files: 'Files',
    copy: 'Copy',
    reviewChannels: 'Review Channels',
    review: 'Review',
    sending: 'Sending...',
    sent: 'Sent',
    error: 'Error',
    premiumFeature: 'Premium Feature',
    selectChannel: 'Select channel',
    
    // Review Channel Selector
    loadingChannels: 'Loading channels...',
    noChannels: 'No channels configured',
    manageChannels: 'Manage channels',
    addChannel: 'Add channel',
    channels: 'Manage Channels',
    name: 'Name',
    channelId: 'Channel ID',
    namePlaceholder: 'Name (e.g: Reviews ES)',
    channelIdPlaceholder: 'Channel ID (17-20 digits)',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirmDelete: 'Delete this channel?',
    
    // Unified Sidebar - Tabs
    backgroundOverlays: 'Background & Overlays',
    chatBoxes: 'Chat Boxes',
    moveTool: 'Move Tool',
    censorTool: 'Censor Tool',
    comicMaker: 'Comic Maker',
    
    // Source section
    source: 'Source',
    background: 'Background',
    overlays: 'Overlays',
    dragDropImage: 'Drag & drop image here',
    orClick: 'or click to browse',
    supportedFormats: 'PNG, JPG, WebP up to 10MB',
    addOverlay: 'Add Overlay',
    
    // Canvas settings
    canvas: 'Canvas',
    width: 'Width',
    height: 'Height',
    fitMode: 'Fit Mode',
    fitCover: 'Cover',
    fitContain: 'Contain',
    fitStretch: 'Stretch',
    
    // Text blocks
    textBlocks: 'Text Blocks',
    addBlock: 'Add Block',
    duplicate: 'Duplicate',
    clearColors: 'Clear Colors',
    remove: 'Remove',
    
    // Characters
    characters: 'Characters',
    addCharacter: 'Add Character',
    characterName: 'Character Name',
    
    // Log Analysis
    logAnalysis: 'Log Analysis',
    pasteLog: 'Paste log text',
    removeTimestamps: 'Remove Timestamps',
    applyLines: 'Apply Lines',
    
    // Layers
    layers: 'Layers',
    
    // Tools
    pixelSize: 'Pixel Size',
    intensitySettings: 'Intensity Settings',
    
    // Cache/History
    savedDrafts: 'Saved Drafts',
    noDrafts: 'No saved drafts',
    load: 'Load',
    rename: 'Rename',
    
    // Status messages
    copied: 'Copied!',
    saved: 'Saved!',
    errorSaving: 'Error saving',
    errorLoading: 'Error loading',
  },
  
  es: {
    // TopBar
    clearAll: 'Limpiar Todo',
    import: 'Importar',
    export: 'Exportar',
    cache: 'Cache',
    files: 'Archivos',
    copy: 'Copiar',
    reviewChannels: 'Canales de Revisión',
    review: 'Revisión',
    sending: 'Enviando...',
    sent: 'Enviado',
    error: 'Error',
    premiumFeature: 'Función Premium',
    selectChannel: 'Seleccionar canal',
    
    // Review Channel Selector
    loadingChannels: 'Cargando canales...',
    noChannels: 'No hay canales configurados',
    manageChannels: 'Gestionar canales',
    addChannel: 'Añadir canal',
    channels: 'Gestionar Canales',
    name: 'Nombre',
    channelId: 'ID del Canal',
    namePlaceholder: 'Nombre (ej: Reviews ES)',
    channelIdPlaceholder: 'ID del Canal (17-20 dígitos)',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    confirmDelete: '¿Eliminar este canal?',
    
    // Unified Sidebar - Tabs
    backgroundOverlays: 'Fondo & Overlays',
    chatBoxes: 'Cajas de Chat',
    moveTool: 'Mover',
    censorTool: 'Censurar',
    comicMaker: 'Creador de Cómics',
    
    // Source section
    source: 'Fuente',
    background: 'Fondo',
    overlays: 'Overlays',
    dragDropImage: 'Arrastra y suelta la imagen aquí',
    orClick: 'o haz clic para explorar',
    supportedFormats: 'PNG, JPG, WebP hasta 10MB',
    addOverlay: 'Añadir Overlay',
    
    // Canvas settings
    canvas: 'Lienzo',
    width: 'Ancho',
    height: 'Alto',
    fitMode: 'Modo de Ajuste',
    fitCover: 'Cubrir',
    fitContain: 'Contener',
    fitStretch: 'Estirar',
    
    // Text blocks
    textBlocks: 'Bloques de Texto',
    addBlock: 'Añadir Bloque',
    duplicate: 'Duplicar',
    clearColors: 'Limpiar Colores',
    remove: 'Eliminar',
    
    // Characters
    characters: 'Personajes',
    addCharacter: 'Añadir Personaje',
    characterName: 'Nombre del Personaje',
    
    // Log Analysis
    logAnalysis: 'Análisis de Log',
    pasteLog: 'Pega el texto del log',
    removeTimestamps: 'Eliminar Marcas de Tiempo',
    applyLines: 'Aplicar Líneas',
    
    // Layers
    layers: 'Capas',
    
    // Tools
    pixelSize: 'Tamaño de Píxel',
    intensitySettings: 'Configuración de Intensidad',
    
    // Cache/History
    savedDrafts: 'Borradores Guardados',
    noDrafts: 'No hay borradores guardados',
    load: 'Cargar',
    rename: 'Renombrar',
    
    // Status messages
    copied: '¡Copiado!',
    saved: '¡Guardado!',
    errorSaving: 'Error al guardar',
    errorLoading: 'Error al cargar',
  }
};

export type Language = 'en' | 'es';
export type TranslationKey = keyof typeof translations.en;