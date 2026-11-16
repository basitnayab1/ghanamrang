"""Build the Ghanam Rang marks using the owner's exact Urdu lettering."""

from base64 import b64encode
from pathlib import Path

root = Path(__file__).resolve().parents[1]
brand = root / "public/brand"
lettering = b64encode((brand / "original-lettering.png").read_bytes()).decode("ascii")
lettering_uri = f"data:image/png;base64,{lettering}"

def abaya(transform: str) -> str:
    return f'''<g transform="{transform}" fill="none" stroke="#c9a36c" stroke-linecap="round" stroke-linejoin="round">
      <path d="M118 39 Q150 54 182 39 L222 65 L280 172 L247 190 L208 133 L216 280 Q150 309 84 280 L92 133 L53 190 L20 172 L78 65 Z" stroke-width="4"/>
      <path d="M118 39 Q150 75 182 39" stroke-width="3"/>
      <path d="M136 59 L119 273 M164 59 L181 273" stroke-width="2.7"/>
      <path d="M92 133 Q104 109 108 82 M208 133 Q196 109 192 82" stroke-width="2" opacity=".65"/>
      <path d="M84 280 Q150 294 216 280" stroke-width="2" opacity=".55"/>
    </g>'''

filter_def = '''<filter id="cream" x="-5%" y="-5%" width="110%" height="110%">
  <feColorMatrix type="matrix" values="0 0 0 0 .956  0 0 0 0 .933  0 0 0 0 .890  0 0 0 1 0"/>
</filter>'''

header = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 314 94" role="img" aria-label="Ghanam Rang">
  <defs>{filter_def}</defs>
  {abaya('translate(5 7) scale(.26)')}
  <image href="{lettering_uri}" x="89" y="3" width="220" height="94" filter="url(#cream)"/>
</svg>'''

avatar = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Ghanam Rang abaya logo">
  <defs>{filter_def}</defs>
  <rect width="1024" height="1024" fill="#130e13"/>
  <circle cx="512" cy="512" r="448" fill="none" stroke="#c9a36c" stroke-width="3"/>
  <circle cx="512" cy="512" r="426" fill="none" stroke="#c9a36c" stroke-width="1.5" opacity=".35"/>
  {abaya('translate(335 112) scale(1.18)')}
  <image href="{lettering_uri}" x="152" y="521" width="720" height="308" filter="url(#cream)"/>
  <path d="M352 872h320" stroke="#c9a36c" stroke-width="2.5"/>
  <path d="M512 863l9 9-9 9-9-9z" fill="#c9a36c"/>
</svg>'''

(brand / "wordmark.svg").write_text(header, encoding="utf-8")
(brand / "instagram-avatar.svg").write_text(avatar, encoding="utf-8")
print("Updated wordmark.svg and instagram-avatar.svg")
