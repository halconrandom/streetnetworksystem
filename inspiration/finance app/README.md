# FINANCE.OS - Manual de Usuario

Bienvenido al **Command Center de Finanzas y Logística**, un dashboard de estilo cyberpunk diseñado para tener un control absoluto de tus ingresos, gastos y pendientes del mercado en una sola pantalla de alta densidad de información.

## 1. FLUJO DE EFECTIVO (Sueldo y Métricas)
En la parte superior izquierda encontrarás el panel principal de liquidez.

*   **Sueldo del Mes (Base):** Ingresa tu sueldo o ingreso principal base aquí. El sistema lo tomará como tu punto de partida (Ingresos).
*   **Total Disponible:** Es la suma de tu Sueldo Base + cualquier "Ingreso (+)" adicional que agregues en los movimientos (ej. devoluciones, ventas).
*   **Balance Neto:** Es tu *Total Disponible* menos *Todo lo que has gastado*. En verde si tienes dinero a favor, en rojo si los gastos superan tus ingresos.
*   **Burn Rate (Tasa de Quema):** Una barra visual que te indica qué porcentaje de tus ingresos ya has consumido. Si llega al 100%, has gastado todo tu dinero.

## 2. ADJUDICAR MOVIMIENTO (Registro)
Aquí es donde registras las operaciones financieras. Rellena los datos:

*   **Concepto:** El nombre del gasto o ingreso (Ej. "Netflix", "Supermercado", "Pago por freelance").
*   **Monto:** El valor exacto.
*   **Tipo:** 
    *   `Egreso (-)`: Dinero que sale de tu cuenta (gastos).
    *   `Ingreso (+)`: Dinero extra que sumará a tu Sueldo Base.
*   **Categoría:** Clasifica tu movimiento (Suscripciones, Vivienda, Alimentación, etc.).
*   **Fecha:** Se autocompleta con el día de hoy, pero puedes ajustarla.

Al presionar **"AÑADIR AL LEDGER"**, el movimiento pasará a la tabla central.

## 3. LEDGER / HISTORIAL GENERAL (Tabla Central)
Todo lo que adjudiques en tu panel de movimientos aparecerá aquí, ordenado por fecha de captura.

*   **Historial:** Revisa a detalle tus transacciones.
*   **Borrar Movimientos:** Si cometiste un error, simplemente haz hover (pasa el ratón) sobre la fila y da clic en el icono del bote de basura rojo a la derecha.
*   **TOTAL LLEVADO GASTADO:** En la base de la tabla, verás un contador gigante rojo fijo. Esto resume **EXACTAMENTE** la cantidad total de dinero (solo egresos) que ha salido en todo el periodo. Así no lo confundes con balance general.

## 4. MARKET LOGISTICS (Pendientes / Mercado)
La columna de la derecha está aislada de tus finanzas. Es tu *Scratchpad* o libreta de notas rápida para el mercado y logística general.

*   **Añadir Ítem:** Escribe en la consola (con el prefijo `>`) el producto que necesitas comprar y presiona el "+" o "Enter".
*   **Check/Uncheck:** Haz clic sobre el ícono cuadrado a la izquierda de cada producto para marcarlo como comprado/completado (se tachará e irá al fondo visualmente) o regresarlo a pendiente.

---
*Uplink Secure. V2.4.0-BUILD.829*
