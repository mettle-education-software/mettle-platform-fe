"""Papel de parede do Mettle Chat (public/img/chat-wall-{dark,light}.svg): rabiscos de linha do nosso mundo, densos como o
do WhatsApp (desenho próprio, não o deles). Ladrilho de 400 px sem emenda (o que passa da borda é repetido do outro
lado), tamanhos e giros variados, traço arredondado com espessura levemente irregular. Determinístico: rode de novo e
sai o mesmo arquivo.   python3 scripts/chat-wallpaper.py"""
import math, random

T = 400  # lado do ladrilho
# cada rabisco num quadro de 40 × 40, centro (20, 20)
ICONS = {
    'book': "M4 10q8-5 16 0v22q-8-5-16 0zM20 10q8-5 16 0v22q-8-5-16 0z",
    'phones': "M8 26v-6a12 12 0 0 1 24 0v6M5 24h6v10H5zM29 24h6v10h-6z",
    'mic': "M15 6a5 5 0 0 1 10 0v12a5 5 0 0 1-10 0zM10 17a10 10 0 0 0 20 0M20 27v6M14 33h12",
    'pencil': "M8 32l20-20 5 5-20 20H8zM25 15l5 5",
    'globe': "M20 6a14 14 0 1 0 0.1 0zM6 20h28M20 6c-7 8-7 20 0 28M20 6c7 8 7 20 0 28",
    'clock': "M20 6a14 14 0 1 0 0.1 0zM20 12v9l6 4",
    'star': "M20 5l4.5 9.5 10.5 1.4-7.6 7.2 1.9 10.4L20 28.4l-9.3 5.1 1.9-10.4-7.6-7.2 10.5-1.4z",
    'bulb': "M20 5a10 10 0 0 0-6 18v5h12v-5a10 10 0 0 0-6-18zM15 32h10M17 35h6",
    'cup': "M8 13h18v10a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8zM26 16h3a4 4 0 0 1 0 8h-3M13 5v4M19 5v4",
    'notebook': "M10 5h20v30H10zM7 10h6M7 16h6M7 22h6M7 28h6M15 12h11M15 17h11M15 22h8",
    'bubble': "M7 8h26a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H17l-8 6v-6H7a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4zM11 16h18M11 21h12",
    'calendar': "M6 9h28v25H6zM6 16h28M13 5v7M27 5v7M11 21h4M18 21h4M25 21h4M11 27h4M18 27h4",
    'plane': "M4 22l32-14-12 26-4-10zM20 24l16-16",
    'bigben': "M15 36V14h10v22M13 14l7-9 7 9M15 20h10M20 23a3 3 0 1 0 0.1 0zM12 36h16",
    'cap': "M3 16l17-8 17 8-17 8zM10 20v8c6 5 14 5 20 0v-8M37 16v9",
    'heart': "M20 33S6 25 6 15a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 10-14 18-14 18z",
    'note': "M14 32V9l18-4v22M14 32a4 3 0 1 1-1-1M32 27a4 3 0 1 1-1-1",
    'rocket': "M20 4c7 6 8 15 4 24h-8c-4-9-3-18 4-24zM16 28l-6 6 2-9M24 28l6 6-2-9M20 13a3 3 0 1 0 0.1 0zM18 32h4",
    'plant': "M12 26h16l-2 10H14zM20 26V14M20 18c-6 0-9-4-9-9 6 0 9 4 9 9zM20 15c5 0 8-3 8-8-5 0-8 3-8 8z",
    'camera': "M5 13h30v20H5zM14 13l3-5h6l3 5M20 17a6 6 0 1 0 0.1 0zM30 17h2",
    'puzzle': "M8 8h9a3 3 0 1 1 6 0h9v9a3 3 0 1 0 0 6v9h-9a3 3 0 1 0-6 0H8v-9a3 3 0 1 1 0-6z",
    'glasses': "M4 20a6 6 0 1 0 12 0 6 6 0 1 0-12 0zM24 20a6 6 0 1 0 12 0 6 6 0 1 0-12 0zM16 19q4-3 8 0M4 18L2 13M36 18l2-5",
    'backpack': "M10 14a10 10 0 0 1 20 0v20H10zM15 9V5h10v4M13 22h14v8H13zM20 22v3",
    'laptop': "M8 9h24v17H8zM4 30h32l-3 4H7zM18 32h4",
    'smile': "M20 6a14 14 0 1 0 0.1 0zM14 23q6 6 12 0M15 16v1M25 16v1",
    'cloud': "M11 30h19a7 7 0 0 0 0-14 9 9 0 0 0-17-2 8 8 0 0 0-2 16z",
    'sun': "M20 14a6 6 0 1 0 0.1 0zM20 4v4M20 32v4M4 20h4M32 20h4M9 9l3 3M28 28l3 3M9 31l3-3M28 12l3-3",
    'abc': "M5 30l5-16 5 16M7 25h6M19 14v16h5a4 4 0 0 0 0-8h-5 4a4 4 0 0 0 0-8zM37 16a6 6 0 1 0 0 12",
    'trophy': "M13 6h14v8a7 7 0 0 1-14 0zM13 9H8a5 5 0 0 0 5 6M27 9h5a5 5 0 0 1-5 6M20 21v7M14 34h12l-2-6h-8z",
    'chat2': "M20 7c9 0 15 5 15 11s-6 11-15 11c-2 0-4 0-6-1l-8 4 3-7c-3-2-4-4-4-7 0-6 6-11 15-11z",
}
SMALL = {  # enchimento, como as bolinhas e estrelinhas do WhatsApp
    'dot': "M20 15a5 5 0 1 0 0.1 0z",
    'ring': "M20 12a8 8 0 1 0 0.1 0z",
    'spark': "M20 6v28M6 20h28M11 11l18 18M29 11L11 29",
    'tiny_star': "M20 8l3 8 9 1-7 6 2 9-7-5-7 5 2-9-7-6 9-1z",
    'squiggle': "M6 24q4-8 8 0t8 0 8 0 8 0",
    'plus': "M20 9v22M9 20h22",
}

def build(stroke, opacity):
    rnd = random.Random(7)
    items = []
    def fits(x, y, r):
        for (x2, y2, r2) in items:
            dx = min(abs(x - x2), T - abs(x - x2)); dy = min(abs(y - y2), T - abs(y - y2))
            if math.hypot(dx, dy) < r + r2 - 2: return False  # os desenhos não enchem o círculo: encostam, como no WhatsApp
        return True
    placed = []
    names = list(ICONS)
    # grandes e médios primeiro, depois pequenos, depois enchimento até saturar
    for rmin, rmax, pool, tries in ((26, 36, names, 3000), (17, 25, names, 5000), (11, 16, names, 7000), (5, 8, list(SMALL), 12000)):
        for _ in range(tries):
            r = rnd.uniform(rmin, rmax); x = rnd.uniform(0, T); y = rnd.uniform(0, T)
            if fits(x, y, r):
                items.append((x, y, r)); placed.append((rnd.choice(pool), x, y, r, rnd.uniform(-40, 40), rnd.uniform(0.94, 1.06), rnd.uniform(1.35, 1.9)))
    uses = []
    for name, x, y, r, rot, sq, sw in placed:
        s = (2 * r) / 40
        for ox in (-T, 0, T):
            for oy in (-T, 0, T):
                cx, cy = x + ox, y + oy
                if -r <= cx <= T + r and -r <= cy <= T + r:
                    uses.append(f"<use href='#{name}' transform='translate({cx - 20 * s:.1f} {cy - 20 * s:.1f}) rotate({rot:.0f} {20 * s:.1f} {20 * s:.1f}) scale({s:.3f} {s * sq:.3f})' stroke-width='{sw / s:.2f}'/>")
    defs = ''.join(f"<path id='{k}' d='{v}'/>" for k, v in {**ICONS, **SMALL}.items())
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='{T}' height='{T}' viewBox='0 0 {T} {T}'>"
           f"<defs>{defs}</defs><g fill='none' stroke='{stroke}' stroke-opacity='{opacity}' stroke-linecap='round' stroke-linejoin='round'>"
           + ''.join(uses) + "</g></svg>")
    return svg, len(placed)

for theme, stroke, op in (('dark', '#ffffff', 0.07), ('light', '#4a3a26', 0.085)):
    svg, n = build(stroke, op)
    open(f'public/img/chat-wall-{theme}.svg', 'w').write(svg)
    print(theme, n, 'rabiscos', len(svg), 'bytes')
