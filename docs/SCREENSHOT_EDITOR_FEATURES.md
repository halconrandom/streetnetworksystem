# Screenshot Editor: Secciones y Características

Este documento detalla el funcionamiento y la estructura actual del Screenshot Editor para asegurar que todas las funcionalidades se preserven durante el rediseño.

## 1. Barra Superior (Top Bar)
- **Historial**: Botones de Deshacer (Undo) y Rehacer (Redo) con soporte de atajos de teclado (`Ctrl+Z`, `Ctrl+Y`).
- **Guardar Snapshot**: Guarda el estado actual en la caché local para su uso posterior.
- **Limpiar Todo**: Resetea el editor a su estado inicial.

## 2. Barra de Herramientas Lateral (Main Toolbar)
- **Visibilidad de Paneles**: Toggles para mostrar/ocultar secciones (Source, Text Editor, Layers, Canvas Settings, Colors, Content, History).
- **Herramientas de Edición**:
  - **Move Tool**: Para seleccionar y mover elementos en el canvas.
  - **Redact Tool**: Herramienta de pincel para dibujar áreas de pixelado directamente sobre el canvas.

## 3. Panel Izquierdo (Source & Text Editor)

### Gestion de Origen (Source)
- **Cambiar Imagen**: Carga de la imagen de fondo principal.
- **Importar Chat**: Carga de archivos `.txt` de logs de chat.
- **Overlays**: Gestión de imágenes superpuestas (logos, marcas de agua, etc.).
- **Names**: Definición de nombres personalizados para reemplazar placeholders en los textos.

### Editor de Bloques de Texto
- **Multi-bloques**: Capacidad de tener múltiples bloques de texto independientes.
- **Configuración por Bloque**:
  - Fuente (Font Family), Peso, Tamaño y Altura de línea.
  - Contorno (Stroke) y Sombra (Shadow).
  - Fondo (Backdrop) ajustable (Modo texto o bloque completo).
  - Posicionamiento rápido (Top-Left, Bottom-Left).
- **Filtrado**: Buscador de líneas dentro del bloque seleccionado.

## 4. Canvas Central (Interactive Preview)
- **Renderizado en Tiempo Real**: Visualización inmediata de cambios usando Canvas API.
- **Zoom & Pan**:
  - Zoom de 0.1x a 3x.
  - Función "Fit" para ajustar al área disponible.
  - Paneo fluido (Espacio + Arrastre).
- **Interacción Directa**: 
  - Arrastrar y soltar para posicionar bloques de texto y overlays.
  - **Crop Editor**: Interfaz dedicada para recortar overlays individuales.
- **Exportación**:
  - Botón de Descarga (PNG).
  - Función de Copiar al Portapapeles.

## 5. Panel Derecho (Configuración Avanzada)

### Ajustes del Canvas
- **Dimensiones**: Configuración manual de ancho y alto.
- **Fit Modes**: 
  - `Contain`: Ajusta la imagen completa.
  - `Cover`: Llena el canvas.
  - `Stretch`: Estira la imagen.
  - `Crop`: Permite escalar y mover manualmente la imagen de fondo.
- **Filtros Globales**: Brillo, Contraste, Saturación, Sepia y Viñeta.

### Herramientas de Color
- **Selector de Color**: Picker avanzado con soporte de opacidad.
- **Plantillas**: Paleta de colores predefinidos (Template Colors).

### Panel de Capas (Layers)
- **Orden de Capas**: Lista interactiva para reordenar elementos (Drag & Drop).
- **Controles de Capa**: Bloqueo (Lock) y visibilidad de cada elemento individual.

### Historial y Contenido
- **Visor de Chat Raw**: Permite ver el texto original, sanitizar timestamps y parsear líneas.
- **Caché de Instantáneas**: Lista de snapshots anteriores para recuperación rápida.

## 6. Strip Builder
- Interfaz independiente para combinar varios snapshots guardados en una sola tira vertical (strip), ideal para presentaciones de logs largos.
