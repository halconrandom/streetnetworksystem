# Screenshot Editor - Documentación de Features

> Editor avanzado de screenshots para procesamiento de imágenes y creación de contenido visual.

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Interfaz y Navegación](#interfaz-y-navegación)
3. [Gestión de Imágenes](#gestión-de-imágenes)
4. [Editor de Texto y Chat Boxes](#editor-de-texto-y-chat-boxes)
5. [Sistema de Capas](#sistema-de-capas)
6. [Herramientas de Edición](#herramientas-de-edición)
7. [Configuración del Canvas](#configuración-del-canvas)
8. [Filtros y Post-Procesamiento](#filtros-y-post-procesamiento)
9. [Sistema de Historial y Caché](#sistema-de-historial-y-caché)
10. [Exportación y Guardado](#exportación-y-guardado)
11. [Strip Builder](#strip-builder)
12. [Atajos de Teclado](#atajos-de-teclado)

---

## Visión General

El **Screenshot Editor** es una herramienta web completa para editar screenshots, diseñada específicamente para crear contenido visual profesional con texto superpuesto, overlays, y efectos de imagen. Permite desde ajustes básicos hasta composiciones complejas con múltiples capas.

### Características Principales

- **Renderizado en tiempo real** con Canvas API
- **Sistema de historial** con Undo/Redo ilimitado
- **Múltiples bloques de texto** independientes con estilos personalizados
- **Sistema de capas** con reordenamiento drag & drop
- **Overlays** con soporte de crop, rotación y opacidad
- **Filtros globales** de imagen (brillo, contraste, saturación, viñeta, sepia)
- **Herramienta de redacción** para ocultar información sensible
- **Exportación** a archivo PNG o portapapeles
- **Persistencia** de estados en caché del servidor

---

## Interfaz y Navegación

### Barra Superior (Top Bar)

| Botón | Función | Descripción |
|-------|---------|-------------|
| **Undo** | Deshacer | Revierte la última acción (`Ctrl+Z`) |
| **Redo** | Rehacer | Reaplica la última acción deshecha (`Ctrl+Y`) |
| **Clear** | Limpiar todo | Resetea el editor a su estado inicial |
| **Import** | Importar workspace | Carga un archivo JSON con configuración guardada |
| **Export** | Exportar workspace | Descarga la configuración actual como JSON |
| **Cache** | Guardar en caché | Guarda el estado actual en el historial de puntos de guardado |
| **File** | Descargar PNG | Exporta la imagen final como archivo PNG |
| **Copy** | Copiar al portapapeles | Copia la imagen renderizada al clipboard |

### Barra de Herramientas Lateral (Sidebar Toolbar)

Panel modular con toggles para mostrar/ocultar secciones:

| Icono | Panel | Función |
|-------|-------|---------|
| 🖼️ | **Source** | Gestión de imágenes de origen y overlays |
| ✏️ | **Text Editor** | Editor de bloques de texto |
| 🖱️ | **Move Tool** | Herramienta de selección y movimiento |
| 🛡️ | **Redact Tool** | Herramienta de pixelado/redacción |
| 📚 | **Layers** | Panel de capas y profundidad |
| ⚙️ | **Canvas** | Configuración del canvas |
| 🎨 | **Colors** | Paleta de colores |
| 💬 | **Content** | Análisis de logs |
| 🕐 | **History** | Puntos de guardado |
| ✨ | **Filters** | Post-procesamiento de imagen |
| 📏 | **Strip Builder** | Constructor de tiras verticales |

---

## Gestión de Imágenes

### Imagen Principal (Screenshot)

- **Carga**: Soporta drag & drop o selección de archivo
- **Formatos**: PNG, JPG, GIF, WebP, BMP
- **Resolución**: Hasta 3840x2160px

### Overlays (Imágenes Superpuestas)

Los overlays permiten añadir logos, marcas de agua u otras imágenes sobre el screenshot base.

#### Propiedades de Overlay

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `x`, `y` | number | Posición en el canvas |
| `scale` | number | Escala (0.1 - 10x) |
| `rotation` | number | Rotación en grados (0-360°) |
| `opacity` | number | Transparencia (0-1) |
| `visible` | boolean | Visibilidad |
| `locked` | boolean | Bloqueo de edición |
| `crop` | object | Recorte definido |

#### Funciones de Overlay

- **Arrastrar y soltar**: Posicionamiento directo en el canvas
- **Crop integrado**: Editor visual para recortar overlays
- **Controles de transformación**: Escala, rotación y opacidad

### Names (Sistema de Nombres)

- Define nombres personalizados para reemplazar placeholders en los textos
- Almacenamiento local para nombres frecuentemente usados
- Añadir/eliminar nombres dinámicamente

---

## Editor de Texto y Chat Boxes

### Multi-Bloques de Texto

El editor soporta múltiples bloques de texto independientes, cada uno con su propia configuración.

#### Creación y Gestión

- **Añadir bloque**: Botón "+" para crear nuevo bloque
- **Duplicar**: Crea una copia del bloque seleccionado
- **Eliminar**: Remueve el bloque actual
- **Colapsar/Expandir**: Organización visual del panel

#### Configuración por Bloque

| Ajuste | Valores | Descripción |
|--------|---------|-------------|
| **Font Family** | Lista de fuentes | Tipografía del texto |
| **Font Weight** | 100-900 | Grosor de la fuente |
| **Font Size** | 8-200px | Tamaño del texto |
| **Line Height** | 10-100px | Espaciado entre líneas |
| **Stroke Width** | 0-10px | Grosor del contorno |
| **Stroke Color** | Color | Color del contorno |
| **Shadow Blur** | 0-50 | Difuminado de sombra |
| **Shadow Offset** | X/Y | Desplazamiento de sombra |
| **Shadow Color** | Color | Color de la sombra |
| **Text Align** | left/center/right | Alineación horizontal |

#### Posicionamiento

| Opción | Descripción |
|--------|-------------|
| **Top-Left** | Posiciona el texto en la esquina superior izquierda |
| **Bottom-Left** | Posiciona el texto en la esquina inferior izquierda |
| **Offset X/Y** | Ajuste fino de posición en píxeles |
| **Rotation** | Rotación del bloque de texto (0-360°) |
| **Box Width** | Ancho máximo del cuadro de texto |

#### Sistema de Backdrop (Fondo)

- **Modo Text**: Fondo individual por línea de texto
- **Modo All**: Fondo contínuo para todo el bloque
- **Configuración**: Color, opacidad y padding

#### Colores en Línea

El sistema permite colorear texto específico usando la sintaxis:
```
(#FFFFFF)Texto blanco (#FF0000)Texto rojo
```

- **Aplicar color**: Selecciona texto y aplica color desde la paleta
- **Limpiar colores**: Remueve todos los códigos de color del bloque

---

## Sistema de Capas

### Panel de Layers

El panel de capas permite gestionar el orden de renderizado de todos los elementos.

#### Características

- **Drag & Drop**: Reordenamiento visual de capas
- **Visibilidad**: Toggle para mostrar/ocultar elementos
- **Bloqueo**: Previene edición accidental
- **Indicadores visuales**: Iconos diferenciados para texto e imágenes

#### Orden de Renderizado

- Las capas se renderizan de **abajo hacia arriba**
- La primera capa en la lista es la más profunda
- La última capa es la más superficial (visible encima)

---

## Herramientas de Edición

### Move Tool (Herramienta de Selección)

- **Función**: Seleccionar y mover elementos en el canvas
- **Uso**: Click y arrastre para reposicionar bloques de texto u overlays
- **Estado por defecto**: Activa al iniciar el editor

### Redact Tool (Herramienta de Redacción)

Herramienta para ocultar información sensible mediante pixelado.

#### Funcionamiento

1. Selecciona la herramienta desde la barra lateral
2. Ajusta la intensidad del pixelado (3-20px)
3. Dibuja rectángulos sobre las áreas a ocultar
4. El área se pixela automáticamente en tiempo real

#### Propiedades

| Ajuste | Rango | Descripción |
|--------|-------|-------------|
| **Intensity** | 3-20 | Tamaño del pixelado (mayor = más borroso) |

#### Gestión

- Las áreas de redacción se guardan en el historial
- Se pueden eliminar individualmente
- Se renderizan sobre la imagen base, antes del texto

---

## Configuración del Canvas

### Dimensiones

| Parámetro | Rango | Default |
|-----------|-------|---------|
| **Width** | 320-3840px | 1920px |
| **Height** | 320-2160px | 1080px |

### Modos de Ajuste (Fit Mode)

| Modo | Descripción |
|------|-------------|
| **Contain** | Mantiene proporción, ajusta completo dentro del canvas |
| **Cover** | Mantiene proporción, llena todo el canvas (puede recortar) |
| **Stretch** | Distorsiona para llenar el canvas exactamente |
| **Crop** | Control manual de escala y posición |

### Modo Crop Manual

Cuando se selecciona el modo Crop, aparecen controles adicionales:

| Control | Rango | Descripción |
|---------|-------|-------------|
| **Scale** | 0.1x - 10x | Escala de la imagen de fondo |
| **Offset X** | -2000 a +2000 | Desplazamiento horizontal |
| **Offset Y** | -2000 a +2000 | Desplazamiento vertical |
| **Rotation** | -180° a +180° | Rotación de la imagen |

---

## Filtros y Post-Procesamiento

### Filtros Disponibles

| Filtro | Rango | Efecto |
|--------|-------|--------|
| **Brightness** | 0-200% | Ajuste de brillo (100% = normal) |
| **Contrast** | 0-200% | Ajuste de contraste (100% = normal) |
| **Saturate** | 0-200% | Intensidad de color (100% = normal) |
| **Sepia** | 0-100% | Tono sepia/vintage |
| **Vignette** | 0-100% | Oscurecimiento de bordes |

### Aplicación

- Los filtros se aplican en tiempo real
- Afectan solo a la imagen de fondo
- Se guardan en el historial para undo/redo

---

## Sistema de Historial y Caché

### Undo/Redo

- **Historial ilimitado**: Todas las acciones se registran
- **Atajos**: `Ctrl+Z` (undo), `Ctrl+Y` (redo)
- **Persistencia temporal**: El estado se mantiene durante la sesión

### Puntos de Guardado (Save Points)

El sistema permite guardar estados completos en el servidor.

#### Funcionalidades

- **Guardar**: Crea un punto de guardado con toda la configuración
- **Cargar**: Restaura un estado previo desde la lista
- **Renombrar**: Asigna nombres descriptivos a los puntos
- **Eliminar**: Remueve puntos de guardado individuales

#### Datos Guardados

```typescript
{
  imageName: string,
  imageDataUrl: string,      // Imagen de fondo limpia
  textBlocks: TextBlock[],   // Bloques de texto
  overlays: OverlayImage[],  // Overlays
  settings: EditorSettings,  // Configuración del canvas
  layerOrder: string[],      // Orden de capas
  redactionAreas: RedactionArea[], // Áreas de redacción
  lines: ChatLine[]          // Líneas de chat
}
```

---

## Exportación y Guardado

### Exportar como PNG

- Descarga la imagen renderizada como archivo PNG
- Nombre automático: `screenshot-{timestamp}.png`
- Resolución según configuración del canvas

### Copiar al Portapapeles

- Copia la imagen renderizada directamente al clipboard
- Permite pegar en cualquier aplicación (Discord, Photoshop, etc.)
- Formato: PNG con transparencia preservada

### Exportar/Importar Workspace

- **Exportar**: Descarga un archivo JSON con toda la configuración
- **Importar**: Carga un archivo JSON previamente exportado
- Útil para compartir configuraciones entre equipos

---

## Strip Builder

### Descripción

El Strip Builder permite combinar múltiples screenshots guardados en una sola imagen vertical (tira), ideal para presentar logs largos o secuencias de imágenes.

### Funcionalidades

1. **Selección**: Marca los puntos de guardado a incluir
2. **Reordenamiento**: Arrastra para cambiar el orden
3. **Vista previa**: Muestra las miniaturas seleccionadas
4. **Generación**: Crea una imagen vertical combinada
5. **Exportación**: Descarga o copia la tira resultante

### Uso

1. Guarda varios estados en caché
2. Abre el Strip Builder desde la barra de herramientas
3. Selecciona las imágenes deseadas
4. Reordena según necesites
5. Genera y exporta la tira

---

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + Z` | Deshacer |
| `Ctrl + Y` | Rehacer |
| `Ctrl + C` | Copiar imagen al portapapeles |
| `Ctrl + S` | Guardar en caché |
| `Space + Arrastrar` | Paneo del canvas |
| `Scroll` | Zoom in/out |
| `Alt + Click` | Paneo alternativo |

---

## Arquitectura Técnica

### Stack Tecnológico

- **Framework**: React 18+ con TypeScript
- **Renderizado**: Canvas API nativo
- **Estado**: React hooks personalizados (`useEditorState`, `useCanvasPainter`)
- **Drag & Drop**: react-dnd para reordenamiento de capas
- **Persistencia**: API REST + Base de datos PostgreSQL

### Hooks Principales

| Hook | Función |
|------|---------|
| `useEditorState` | Gestión del estado global del editor |
| `useCanvasPainter` | Renderizado del canvas en tiempo real |
| `useHistory` | Sistema de undo/redo |

### Flujo de Datos

```
Usuario → Acción → performAction() → pushHistory() → Estado actualizado
                                                    ↓
                                          Canvas re-renderizado
```

---

## Consideraciones de Rendimiento

- **Renderizado optimizado**: Solo se re-renderiza cuando cambian las dependencias
- **Caché de imágenes**: Los overlays se cachean para evitar recargas
- **Historial eficiente**: Solo se almacenan snapshots, no deltas
- **Lazy loading**: Los componentes pesados se cargan bajo demanda

---

## Limitaciones Conocidas

- Máximo de resolución: 3840x2160px
- Formatos de imagen soportados: PNG, JPG, GIF, WebP, BMP
- El historial de undo/redo se pierde al recargar la página
- Los puntos de guardado requieren autenticación

---

## Próximas Mejoras (Roadmap)

- [ ] Soporte para múltiples idiomas (i18n)
- [ ] Plantillas predefinidas de diseño
- [ ] Exportación a formatos adicionales (WebP, AVIF)
- [ ] Colaboración en tiempo real
- [ ] Integración con almacenamiento en la nube

---

*Documentación generada para Street Network Admin - Screenshot Editor*
*Última actualización: Marzo 2026*