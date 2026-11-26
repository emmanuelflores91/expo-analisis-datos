# Exposición — TPI Análisis de Datos

Presentación web de una sola página (`presentacion.html`) para exponer un trabajo en grupo, con una **sala compartida opcional**: varias personas abren la misma dirección, una tiene el control y las demás ven en vivo lo que se muestra y hacia dónde apunta el cursor.

Sirve como plantilla: se cambia el contenido de `fuente/plantilla.html`, se reconstruye y se despliega en Vercel.

## Qué hay en el repositorio

| Archivo | Para qué |
|---|---|
| `presentacion.html` | La presentación terminada, con las figuras incrustadas (un solo archivo). |
| `fuente/plantilla.html` | El mismo HTML con marcadores `{{IMG_...}}` en lugar de las imágenes. Es lo que se edita. |
| `fuente/construir.py` | Reemplaza los marcadores por las figuras y genera `presentacion.html`. |
| `figuras/` | Las imágenes que usa la presentación. |
| `api/estado.js` | Función de Vercel que guarda el estado de la sala (quién controla y qué se muestra). |
| `vercel.json` | Configuración del despliegue. |

## Cómo funciona la plantilla

`presentacion.html` es un **solo archivo** con todo adentro, imágenes incluidas, para que se abra en cualquier computadora o se suba a internet sin que se rompan las imágenes por faltar una carpeta. El costo es que pesa unos 2 MB y no se puede editar a mano: cada imagen está convertida en una cadena larguísima de letras y números.

Por eso se trabaja con dos piezas:

- **`fuente/plantilla.html`** es la presentación con huecos. En lugar de cada imagen hay un cartelito como `{{IMG_TENURE}}`, que significa "acá va el gráfico de la antigüedad". Es liviana y es lo que se edita.
- **`fuente/construir.py`** es el que pega las imágenes. Toma los gráficos de `figuras/`, los prepara (corta en dos el que tiene dos paneles y achica los muy grandes), los convierte a texto, reemplaza cada cartelito de la plantilla y guarda el resultado como `presentacion.html`.

Es como una máquina de imprimir carteles: la plantilla es el cartel con los huecos y el script le pega las fotos.

Tres cosas para tener presentes:

1. **`presentacion.html` siempre es el resultado.** No se edita: cada vez que se corre el constructor se vuelve a generar y se pisa cualquier cambio hecho a mano.
2. **Para cambiar texto o diseño**, se edita `fuente/plantilla.html` y se reconstruye.
3. **Para agregar una imagen nueva**, se copia el archivo a `figuras/`, se escribe un marcador nuevo en la plantilla (por ejemplo `{{IMG_MI_GRAFICO}}`) y se agrega una línea con ese mismo nombre en el diccionario `reemplazos` de `fuente/construir.py`, igual que las que ya están. Si falta alguna de las dos partes, el constructor se detiene con un error en lugar de generar un archivo roto.

## Verla sin desplegar nada

Abrir `presentacion.html` en el navegador. Funciona sola, sin la sala compartida.

## Cambiar el contenido

1. Editar `fuente/plantilla.html` (nunca `presentacion.html`; ver arriba).
2. Si cambian las imágenes, reemplazar los archivos de `figuras/` (o ajustar los nombres en `fuente/construir.py`).
3. Reconstruir, desde la raíz del repositorio:

```
pip install pillow
python fuente/construir.py
```

Eso regenera `presentacion.html`.

## Desplegarla en Vercel

1. Crear un proyecto en Vercel importando este repositorio (o, desde esta carpeta, `npx vercel`).
2. **Sala compartida (opcional):** en el proyecto, ir a *Storage* → *Marketplace* y agregar una base **Upstash Redis**. Vercel carga solo las variables de entorno que usa `api/estado.js` (`KV_REST_API_URL` y `KV_REST_API_TOKEN`, o las equivalentes `UPSTASH_REDIS_REST_*`). Sin esto, la presentación funciona igual pero sin sincronización, y `/api/estado` responde "falta configurar Redis".
3. Desplegar. La raíz del sitio muestra `presentacion.html`.

No hay que subir claves al repositorio: `.gitignore` ya excluye `.env*` y `.vercel`.

## Usar la sala compartida

Cada persona abre la misma dirección con dos parámetros:

```
https://TU-PROYECTO.vercel.app/?sala=UN_NOMBRE_LARGO&yo=M
```

- `sala`: un nombre de 6 a 40 caracteres (letras, números, `-` o `_`). Todos los que lo comparten ven lo mismo. Conviene que no sea fácil de adivinar.
- `yo`: quién sos, `M`, `J` o `E` (las iniciales de los tres integrantes del grupo original). Para otras personas o más integrantes, cambiar la lista `["M", "J", "E"]` en `api/estado.js` y la lógica equivalente en `fuente/plantilla.html`.

Empieza con el control `M`; desde la pantalla se puede pasar el control a otra persona. Quien no tiene el control solo mira.

El estado de cada sala se conserva 24 horas.

## Notas

- `vercel.json` fija la región `gru1` (São Paulo) y agrega `X-Robots-Tag: noindex` para que los buscadores no indexen la página. Se puede cambiar.
- El contenido de la presentación (cifras, hallazgos y nombres) corresponde al trabajo original; hay que reemplazarlo al reutilizarla.
