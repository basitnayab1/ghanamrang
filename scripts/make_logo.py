"""Build path-based Urdu brand marks from the bundled Nastaliq font."""

from pathlib import Path
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "public/fonts/noto-nastaliq-urdu.ttf"
OUT = ROOT / "public/brand"
OUT.mkdir(parents=True, exist_ok=True)

font_data = FONT.read_bytes()
face = hb.Face(font_data)
hb_font = hb.Font(face)
tt = TTFont(FONT)
upem = tt["head"].unitsPerEm
hb_font.scale = (upem, upem)
glyphs = tt.getGlyphSet()
names = tt.getGlyphOrder()

buf = hb.Buffer()
buf.add_str("غنم رنگ")
buf.guess_segment_properties()
hb.shape(hb_font, buf, {"kern": True})

pen = BoundsPen(glyphs)
paths = []
x = y = 0
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    glyph = glyphs[names[info.codepoint]]
    gx = x + pos.x_offset
    gy = y + pos.y_offset
    path_pen = SVGPathPen(glyphs)
    glyph.draw(path_pen)
    d = path_pen.getCommands()
    if d:
        paths.append(f'<path d="{d}" transform="translate({gx} {gy})"/>')
        glyph.draw(TransformPen(pen, (1, 0, 0, 1, gx, gy)))
    x += pos.x_advance
    y += pos.y_advance

min_x, min_y, max_x, max_y = pen.bounds
source_w, source_h = max_x - min_x, max_y - min_y

def urdu_box(left, top, width, height, fill):
    scale = min(width / source_w, height / source_h)
    actual_w, actual_h = source_w * scale, source_h * scale
    tx = left + (width - actual_w) / 2 - min_x * scale
    ty = top + (height - actual_h) / 2 + max_y * scale
    outlines = "".join(paths)
    return f'<g fill="{fill}" transform="translate({tx:.3f} {ty:.3f}) scale({scale:.6f} {-scale:.6f})">{outlines}</g>'

def emblem(transform):
    return f'''<g transform="{transform}" fill="none" stroke="#c6a16b" stroke-linecap="round" stroke-linejoin="round">
      <path d="M100 15 C60 40 31 83 31 129 C31 166 57 189 100 206 C143 189 169 166 169 129 C169 83 140 40 100 15Z" stroke-width="4"/>
      <path d="M100 47 C72 68 59 99 59 138 C59 158 72 175 88 185" stroke-width="3"/>
      <path d="M100 47 C128 68 141 99 141 138 C141 158 128 175 112 185" stroke-width="3"/>
      <path d="M100 49V188" stroke-width="3"/>
      <path d="M76 150 Q100 165 124 150" stroke-width="2" opacity=".6"/>
    </g>'''

header = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 82" role="img" aria-label="Ghanam Rang">
  {emblem('translate(3 4) scale(.34)')}
  {urdu_box(81, 9, 241, 60, '#f3ece2')}
  <path d="M139 75h126" stroke="#c6a16b" stroke-width="1.3" opacity=".75"/>
</svg>'''

avatar = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Ghanam Rang premium logo">
  <rect width="1024" height="1024" fill="#140e13"/>
  <rect x="55" y="55" width="914" height="914" rx="164" fill="none" stroke="#c6a16b" stroke-width="3"/>
  <rect x="75" y="75" width="874" height="874" rx="148" fill="none" stroke="#c6a16b" stroke-width="1.5" opacity=".36"/>
  {emblem('translate(342 116) scale(1.7)')}
  {urdu_box(115, 552, 794, 194, '#f3ece2')}
  <path d="M333 792h358" stroke="#c6a16b" stroke-width="2.5"/>
  <path d="M512 783l9 9-9 9-9-9z" fill="#c6a16b"/>
  <text x="512" y="864" text-anchor="middle" fill="#c6a16b" font-family="Arial, sans-serif" font-size="31" letter-spacing="10">GHANAM RANG</text>
</svg>'''

(OUT / "wordmark.svg").write_text(header, encoding="utf-8")
(OUT / "instagram-avatar.svg").write_text(avatar, encoding="utf-8")
print(OUT)
