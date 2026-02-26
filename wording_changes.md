# Wording Refactor Report - Screenshot Editor

A continuación, se detalla la lista de todos los textos de la interfaz (en inglés) que fueron reemplazados por una versión más amigable para los jugadores, con miras a facilitar su comprensión y futuras traducciones al español.

## 1. Menú Principal y Barra Izquierda (`UnifiedSidebar.tsx`)

| Texto Original (Técnico) | Nuevo Texto (Amigable) | Contexto en la UI |
| :--- | :--- | :--- |
| **Source Material** | **Background & Overlays** | Pestaña y sección de imágenes base. |
| **Content Strategy** | **Chat Boxes** | Pestaña y lista de cajas de texto de rol. |
| **Redact Tool** | **Censor Tool** | Herramienta para tachar/censurar pixeles. |
| **Strip Builder** | **Comic Maker** | Botón para abrir el panel de tiras cómicas. |
| **Canvas Setup** | **Image Size & Format** | Sección para cambiar la resolución (Width/Height/Fit). |
| **Atmosphere Control** | **Filters & Lighting** | Controles de brillo, saturación, viñeta, etc. |
| **Quick Action Matrix** | **Character Name Quick Actions** | Matriz para guardar nombres y usar macros (/me, /do, dice). |
| **Unit #** | **BOX #** | Etiqueta individual para cada caja de texto importada. |
| **Advanced Visuals** | **Extra Text Styles** | Botón para abrir las opciones de fuente, trazo (stroke) y grosor. |

## 2. Panel de Ajustes Derecho (`RightSidebar.tsx`)

| Texto Original (Técnico) | Nuevo Texto (Amigable) | Contexto en la UI |
| :--- | :--- | :--- |
| **Layers & Depth** | **Image Layers** | Sección para reordenar las capas superpuestas. |
| **Vibe & Palette** | **Color Settings** | Sección global de paleta de colores y opacidad. |
| **Log Analysis** | **Chat Logs** | Sección donde se pega el archivo de chat en crudo (`.log`). |
| **Strip Times** | **Remove Time** | Botón para limpiar las horas/timestamps del log pegado. |
| **Extract Lines from Log** | **Import Text to Workspace** | Botón principal para convertir el .log en líneas listas. |
| **Processed Stream** | **Prepared Text Lines** | Título de la lista inferior de las líneas ya extraídas. |
| **Save Points** | **Saved Drafts** | Título de la sección de guardados en caché (History). |
| **No Save Points** | **No Saved Drafts** | Mensaje visible cuando la caché del editor local está vacía. |

---
*Nota: Se mantuvo el idioma base en inglés, pero utilizando términos universales entre jugadores (como "Background", "Chat Box", "Comic Maker") para que la estructura siga siendo natural antes de generar los archivos `.json` de internacionalización.*
