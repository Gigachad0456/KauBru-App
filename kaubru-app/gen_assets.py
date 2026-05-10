from PIL import Image, ImageDraw, ImageFont
import math, os

# ── Brand colours ─────────────────────────────────────────────────────────────
GREEN_DARK   = (15,  40,  25)   # #0F2819  deep forest background
GREEN_MID    = (26,  90,  55)   # #1A5A37  mid green
GREEN_LIGHT  = (0,   200, 120)  # #00C878  bright accent
GREEN_BRIGHT = (0,   229, 180)  # #00E5B4  highlight
WHITE        = (255, 255, 255)
GOLD         = (201, 168, 76)

def draw_logo(draw, cx, cy, size, bg=True):
    """Draw the KauBru logo: a stylised leaf/translate mark inside a circle."""
    r = size // 2

    # Outer circle (dark green)
    if bg:
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=GREEN_DARK)

    # Inner glowing ring
    ring = int(r * 0.88)
    draw.ellipse([cx-ring, cy-ring, cx+ring, cy+ring],
                 outline=GREEN_LIGHT, width=max(2, r//20))

    # Leaf shape (two arcs forming a leaf)
    lw = int(r * 0.55)
    lh = int(r * 0.65)
    # Left arc of leaf
    draw.arc([cx-lw, cy-lh, cx+lw//3, cy+lh],
             start=200, end=340, fill=GREEN_BRIGHT, width=max(3, r//14))
    # Right arc of leaf
    draw.arc([cx-lw//3, cy-lh, cx+lw, cy+lh],
             start=20, end=160, fill=GREEN_BRIGHT, width=max(3, r//14))

    # Centre dot
    dot = max(4, r//10)
    draw.ellipse([cx-dot, cy-dot, cx+dot, cy+dot], fill=GREEN_LIGHT)

    # Two small horizontal lines (translate symbol)
    llen = int(r * 0.30)
    lthick = max(2, r//18)
    y1 = cy - int(r * 0.18)
    y2 = cy + int(r * 0.18)
    draw.rectangle([cx-llen, y1-lthick//2, cx+llen, y1+lthick//2], fill=GOLD)
    draw.rectangle([cx-llen, y2-lthick//2, cx+llen, y2+lthick//2], fill=GOLD)

# ── 1. icon.png  1024×1024 ────────────────────────────────────────────────────
SIZE = 1024
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Rounded square background
pad = 60
r_corner = 180
# Draw rounded rect manually via pieslice + rectangles
d.rectangle([pad+r_corner, pad, SIZE-pad-r_corner, SIZE-pad], fill=GREEN_DARK)
d.rectangle([pad, pad+r_corner, SIZE-pad, SIZE-pad-r_corner], fill=GREEN_DARK)
for cx2, cy2 in [(pad+r_corner, pad+r_corner),
                 (SIZE-pad-r_corner, pad+r_corner),
                 (pad+r_corner, SIZE-pad-r_corner),
                 (SIZE-pad-r_corner, SIZE-pad-r_corner)]:
    d.ellipse([cx2-r_corner, cy2-r_corner, cx2+r_corner, cy2+r_corner], fill=GREEN_DARK)

draw_logo(d, SIZE//2, SIZE//2, int(SIZE*0.62), bg=False)

# "KB" text at bottom
try:
    font = ImageFont.truetype("arial.ttf", 90)
except:
    font = ImageFont.load_default()
d.text((SIZE//2, SIZE-pad-80), "KauBru", fill=WHITE, font=font, anchor="mm")

img.save("kaubru-app/assets/icon.png")
print("icon.png done")

# ── 2. adaptive-icon.png  1024×1024 (foreground only, transparent bg) ─────────
img2 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
d2 = ImageDraw.Draw(img2)
draw_logo(d2, 512, 512, 420, bg=False)
img2.save("kaubru-app/assets/adaptive-icon.png")
print("adaptive-icon.png done")

# ── 3. favicon.png  48×48 ─────────────────────────────────────────────────────
img3 = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
d3 = ImageDraw.Draw(img3)
d3.ellipse([0, 0, 47, 47], fill=GREEN_DARK)
draw_logo(d3, 24, 24, 20, bg=False)
img3.save("kaubru-app/assets/favicon.png")
print("favicon.png done")

# ── 4. splash.png  1284×2778 (iPhone 14 Pro Max size, safe for all) ───────────
SW, SH = 1284, 2778
splash = Image.new("RGBA", (SW, SH), GREEN_DARK)
ds = ImageDraw.Draw(splash)

# Subtle radial glow in centre
for i in range(80, 0, -1):
    alpha = int(30 * (1 - i/80))
    glow_r = int(SW * 0.6 * i / 80)
    ds.ellipse([SW//2-glow_r, SH//2-glow_r, SW//2+glow_r, SH//2+glow_r],
               fill=(0, 200, 120, alpha))

# Logo
draw_logo(ds, SW//2, SH//2 - 120, 320, bg=False)

# App name
try:
    font_big  = ImageFont.truetype("arial.ttf", 110)
    font_sub  = ImageFont.truetype("arial.ttf", 52)
except:
    font_big  = ImageFont.load_default()
    font_sub  = font_big

ds.text((SW//2, SH//2 + 240), "KauBru", fill=WHITE, font=font_big, anchor="mm")
ds.text((SW//2, SH//2 + 370), "AI Translator", fill=(180, 220, 200), font=font_sub, anchor="mm")

splash.save("kaubru-app/assets/splash.png")
print("splash.png done")

print("\nAll assets generated!")