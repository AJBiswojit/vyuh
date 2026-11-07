#!/usr/bin/env python3
"""Generate the original, silent Phase 6 sample edits in public/media.

Dev-only utility; not a runtime dependency. Requires Pillow and imageio-ffmpeg:
  python3 -m pip install --target /tmp/vyuh-media pillow imageio-ffmpeg
  PYTHONPATH=/tmp/vyuh-media python3 scripts/generate_sample_media.py

Colours are read from src/styles/tokens.css so the media stays on-brand. The
transcript captions are read from src/mock-data/recordings.js to avoid drift.
"""
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "media"
OUT.mkdir(parents=True, exist_ok=True)

try:
    from PIL import Image, ImageDraw, ImageFont
    import imageio_ffmpeg
except ImportError as exc:  # pragma: no cover - dev utility
    raise SystemExit("Install pillow and imageio-ffmpeg first (see module docstring).") from exc

tokens = (ROOT / "src" / "styles" / "tokens.css").read_text()
def token(name: str) -> str:
    match = re.search(rf"{re.escape(name)}:\s*(#[0-9a-fA-F]{{6}})", tokens)
    if not match:
        raise SystemExit(f"Missing colour token {name}")
    return match.group(1)

INK = token("--vyuh-surface-inverse")
PAPER = token("--vyuh-text-inverse")
EMBER = token("--color-ember")
INFO = token("--vyuh-info")
LINE = token("--vyuh-text-muted")
MUTED = token("--vyuh-text-muted")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

SLIDES = {
    "rec-rot-b": {
        "file": "rotational-dynamics-sample",
        "title": "Rotational Dynamics",
        "subtitle": "Torque & Equilibrium · sample edit",
        "chapters": [
            ("01 · Read the system", "Choose the hinge as the axis.", "τ = F × r⊥", "Mark the weight at the centre of mass."),
            ("02 · Build the equation", "Net force = 0  ·  Net torque = 0", "Στ hinge = 0", "The hinge reaction has zero moment arm."),
            ("03 · Check the limit", "Vertical ladder → moment arm shrinks.", "r⊥ → 0  ⇒  τ → 0", "Recheck geometry before algebra."),
            ("04 · Practice prompt", "Uniform beam, hinge + vertical string.", "Find T from Στ = 0", "Pause, solve, then take the end check."),
        ],
    },
    "rec-org-m": {
        "file": "organic-mechanisms-sample",
        "title": "Organic Mechanisms",
        "subtitle": "Arrow pushing · sample edit",
        "chapters": [
            ("01 · Electron source", "Lone pair or π bond → nucleophile.", "Nu:  +  E⁺", "Arrows start at electrons, never at +."),
            ("02 · Push the arrows", "Attack and leaving group together.", "Concerted step", "Check valence after every arrow."),
            ("03 · Slow step", "SN1 ionisation controls the rate.", "R–LG → R⁺ + LG", "Order is experimental; molecularity is counted."),
            ("04 · Practice prompt", "tert-butyl bromide + water.", "Identify Nu and the slow step", "Sketch three steps, then take the check."),
        ],
    },
    "rec-int-c": {
        "file": "integration-sample",
        "title": "Definite Integration",
        "subtitle": "Properties & substitution · sample edit",
        "chapters": [
            ("01 · Reflect the interval", "Replace x with a + b − x.", "∫ᵇ f(x)dx = ∫ₐᵇ f(a+b−x)dx", "Add the two forms to expose symmetry."),
            ("02 · Change the limits", "New variable → new limits immediately.", "t = a+b−x,  dt = −dx", "The swapped limits cancel the minus sign."),
            ("03 · Use symmetry", "Odd about the centre → zero.", "∫₋ₐ odd(x)dx = 0", "Split symmetric and antisymmetric parts."),
            ("04 · Practice prompt", "∫₂² x dx  and  ∫₋₂² x² dx.", "0  ·  2∫₀² x² dx", "Give a one-line reason for each."),
        ],
    },
}

def font(path: str, size: int):
    return ImageFont.truetype(path, size)

def wrap(draw, text, fnt, width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def slide(rec, index, chapter):
    img = Image.new("RGB", (960, 540), INK)
    d = ImageDraw.Draw(img)
    for x in range(0, 960, 96):
        d.line([(x, 0), (x, 540)], fill=LINE, width=1)
    d.rectangle((0, 0, 960, 6), fill=EMBER)
    d.text((48, 34), "VYUH · SAMPLE LECTURE MEDIA", font=font(MONO, 18), fill=INFO)
    d.text((48, 72), rec["title"], font=font(BOLD, 40), fill=PAPER)
    d.text((48, 124), rec["subtitle"], font=font(FONT, 20), fill=PAPER)
    title, body, formula, note = chapter
    d.text((48, 190), title, font=font(BOLD, 28), fill=EMBER)
    y = 240
    for line in wrap(d, body, font(FONT, 26), 860):
        d.text((48, y), line, font=font(FONT, 26), fill=PAPER)
        y += 36
    d.rectangle((48, 330, 912, 404), outline=INFO, width=2)
    d.text((68, 352), formula, font=font(MONO, 26), fill=INFO)
    for line in wrap(d, note, font(FONT, 20), 860):
        d.text((48, 430), line, font=font(FONT, 20), fill=PAPER)
    d.text((48, 492), f"Chapter {index + 1}/4 · {index * 12:02d}:00–{(index + 1) * 12:02d}:00 · silent visual", font=font(MONO, 16), fill=MUTED)
    return img

def vtt_time(seconds: int) -> str:
    return f"00:00:{seconds:02d}.000"

def captions(rec_id, block):
    lines = re.findall(r"line\('([^']+)',\s*(\d+),\s*'([^']+)'\)", block)
    out = ["WEBVTT", ""]
    for i, (_, start, text) in enumerate(lines, 1):
        start = int(start)
        out += [str(i), f"{vtt_time(start)} --> {vtt_time(start + 4)}", text, ""]
    (OUT / f"{SLIDES[rec_id]['file']}.vtt").write_text("\n".join(out))

def poster(rec):
    title = rec["title"].replace("&", "&amp;")
    subtitle = rec["subtitle"].replace("&", "&amp;")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="{title} sample poster">
  <rect width="960" height="540" fill="{INK}"/><rect width="960" height="6" fill="{EMBER}"/>
  <text x="48" y="60" fill="{INFO}" font-family="monospace" font-size="18">VYUH · SAMPLE LECTURE MEDIA</text>
  <text x="48" y="150" fill="{PAPER}" font-family="sans-serif" font-weight="700" font-size="44">{title}</text>
  <text x="48" y="205" fill="{PAPER}" font-family="sans-serif" font-size="22">{subtitle}</text>
  <circle cx="480" cy="340" r="54" fill="none" stroke="{INFO}" stroke-width="3"/>
  <path d="M462 312 L516 340 L462 368 Z" fill="{EMBER}"/>
  <text x="48" y="492" fill="{MUTED}" font-family="monospace" font-size="16">48-second original sample · captions available</text>
</svg>'''
    (OUT / f"{rec['file']}-poster.svg").write_text(svg)

recordings_js = (ROOT / "src" / "mock-data" / "recordings.js").read_text()
blocks = {}
matches = list(re.finditer(r"id: '(rec-[^']+)'", recordings_js))
for i, match in enumerate(matches):
    if match.group(1) in blocks:
        continue
    end = matches[i + 1].start() if i + 1 < len(matches) else len(recordings_js)
    blocks[match.group(1)] = recordings_js[match.start():end]

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
for rec_id, rec in SLIDES.items():
    poster(rec)
    captions(rec_id, blocks[rec_id])
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        concat = []
        for index, chapter in enumerate(rec["chapters"]):
            path = tmp / f"slide-{index}.png"
            slide(rec, index, chapter).save(path)
            concat += [f"file '{path}'", "duration 12"]
        concat.append(f"file '{tmp / 'slide-3.png'}'")
        listfile = tmp / "concat.txt"
        listfile.write_text("\n".join(concat))
        output = OUT / f"{rec['file']}.mp4"
        # A moving ember progress line makes the silent edit feel like media,
        # while the four slides keep the file small and the text legible.
        vf = f"fps=12,drawbox=x=0:y=ih-8:w=iw*min(t/48\\,1):h=8:color={EMBER}:t=fill,format=yuv420p"
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
            "-i", str(listfile), "-vf", vf, "-t", "48", "-c:v", "libx264", "-preset", "veryfast",
            "-crf", "27", "-movflags", "+faststart", "-an", str(output),
        ], check=True)
        print(f"{output.relative_to(ROOT)} · {output.stat().st_size // 1024} KB")
