# Convierte las fotos de los dibujos a tinta en sprites PNG con fondo transparente.
# Uso: python3 next/tools/ink-sprite.py  (desde games/terrario-isopodos/)
# Lee art/aberraciones/<id>.webp y escribe next/assets/sprites/<id>.png (tinta negra, alfa = oscuridad).
# El papel se detecta por el brillo máximo de cada zona: así el fondo oscuro de la foto (teclado,
# sábana) no se confunde con tinta y el garabato denso sí cuenta como tinta.
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import os

# Recorte (x0, y0, x1, y1) en píxeles de la foto original, sobre la figura.
CROPS = {
    'la-gemela': (75, 360, 1095, 1840),
    'el-comensal': (10, 310, 1200, 1720),
    'el-bufon': (270, 630, 1120, 1640),
    'el-segador': (105, 860, 1115, 1550),
}
# Zonas a borrar (polígonos en píxeles de la foto): bolígrafo, borde del cuaderno.
ERASE = {
    'el-bufon': [(900, 630), (1206, 630), (1206, 1100)],
    'el-comensal': [(700, 290), (1206, 290), (1206, 900)],
}
MAX_SIDE = 768

def sprite(src, crop, erase=None):
    gray = ImageOps.grayscale(Image.open(src))
    if erase:
        ImageDraw.Draw(gray).polygon(erase, fill=255)
    gray = gray.crop(crop)
    small = gray.resize((gray.width // 4, gray.height // 4))
    # Brillo del papel en cada zona: el máximo cercano ignora la tinta aunque sea densa.
    paper = small.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(6)).resize(gray.size)
    paper_mask = paper.point(lambda v: 255 if v > 140 else 0)
    w, h = gray.size
    g, p, m = gray.load(), paper.load(), paper_mask.load()
    alpha = Image.new('L', (w, h))
    a = alpha.load()
    for y in range(h):
        for x in range(w):
            if not m[x, y]:
                continue
            ink = 1 - g[x, y] / max(p[x, y], 1)             # cuánto más oscuro que su papel
            a[x, y] = max(0, min(255, int((ink - 0.18) * 520)))
    out = Image.new('RGBA', (w, h), (20, 18, 16, 0))
    out.putalpha(alpha)
    out = out.crop(out.getbbox())
    out.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    return out

if __name__ == '__main__':
    os.makedirs('next/assets/sprites', exist_ok=True)
    for name, crop in CROPS.items():
        img = sprite(f'art/aberraciones/{name}.webp', crop, ERASE.get(name))
        img.save(f'next/assets/sprites/{name}.png', optimize=True)
        print(name, img.size)
