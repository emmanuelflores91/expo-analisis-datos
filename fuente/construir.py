"""Genera exposicion/presentacion.html: un único archivo con las figuras incrustadas.

Uso (desde cualquier carpeta): python construir.py
Requiere Pillow (pip install pillow). Lee las figuras de la carpeta figuras/.
"""

import base64
import io
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent
EXPO = AQUI.parent
FIGURAS = EXPO / "figuras"
ANCHO_MAX = 1700


def a_base64(imagen):
    if imagen.width > ANCHO_MAX:
        imagen = imagen.resize((ANCHO_MAX, round(imagen.height * ANCHO_MAX / imagen.width)), Image.LANCZOS)
    buf = io.BytesIO()
    imagen.convert("RGB").save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def figura(nombre):
    return Image.open(FIGURAS / nombre)


def mitades(nombre):
    """Separa una figura de dos paneles en izquierda y derecha (sin el título general)."""
    img = figura(nombre)
    w, h = img.size
    arriba = int(h * 0.06)
    abajo = int(h * 0.96)
    return img.crop((0, arriba, w // 2, abajo)), img.crop((w // 2, arriba, w, abajo))


def main():
    izq, der = mitades("25_diagnostico_regresion.png")
    reemplazos = {
        "{{IMG_TENURE}}": a_base64(figura("17_histograma_tenure.png")),
        "{{IMG_CARGO}}": a_base64(figura("17_histograma_cargo_mensual.png")),
        "{{IMG_REG_IZQ}}": a_base64(izq),
        "{{IMG_REG_DER}}": a_base64(der),
    }
    html = (AQUI / "plantilla.html").read_text(encoding="utf-8")
    for clave, valor in reemplazos.items():
        assert clave in html, clave
        html = html.replace(clave, valor)
    assert "{{" not in html, "Quedó un marcador sin reemplazar"
    salida = EXPO / "presentacion.html"
    salida.write_text(html, encoding="utf-8")
    print(f"Generado: {salida} ({salida.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
