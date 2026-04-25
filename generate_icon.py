"""Generate PornHub-style icon for HTool with 'H' as the central mark."""
from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 256
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "electron", "build")

def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)

def generate_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    padding = int(size * 0.04)
    outer_radius = int(size * 0.18)

    # Black rounded rectangle background
    bg_xy = (padding, padding, size - padding, size - padding)
    draw_rounded_rect(draw, bg_xy, outer_radius, (0, 0, 0, 255))

    # Inner area dimensions
    inner_x0 = padding + int(size * 0.06)
    inner_y0 = padding + int(size * 0.06)
    inner_x1 = size - padding - int(size * 0.06)
    inner_y1 = size - padding - int(size * 0.06)
    inner_w = inner_x1 - inner_x0
    inner_h = inner_y1 - inner_y0

    mid_x = inner_x0 + int(inner_w * 0.52)

    # Orange pill (right side) - the "Hub" part
    pill_pad = int(size * 0.14)
    pill_x0 = mid_x + int(size * 0.02)
    pill_x1 = inner_x1 - int(size * 0.02)
    pill_y0 = inner_y0 + pill_pad
    pill_y1 = inner_y1 - pill_pad
    pill_radius = int((pill_y1 - pill_y0) / 2)
    orange = (255, 153, 0, 255)  # PornHub signature orange
    draw_rounded_rect(draw, (pill_x0, pill_y0, pill_x1, pill_y1), pill_radius, orange)

    # Draw "H" in white on the left black area
    try:
        font_size = int(size * 0.55)
        font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    h_text = "H"
    bbox = draw.textbbox((0, 0), h_text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # Center the H in the left portion of the icon
    left_center_x = (inner_x0 + mid_x) / 2
    text_x = left_center_x - tw / 2 - int(size * 0.01)
    text_y = size / 2 - th / 2 - int(size * 0.01)
    draw.text((text_x, text_y), h_text, fill=(255, 255, 255, 255), font=font)

    # Draw small "▶" or dot in the orange pill for visual interest
    try:
        small_font_size = int(size * 0.2)
        small_font = ImageFont.truetype("C:/Windows/Fonts/seguisym.ttf", small_font_size)
    except Exception:
        small_font = font

    # A small tool icon mark inside the orange pill
    tool_text = "⚡"
    sbbox = draw.textbbox((0, 0), tool_text, font=small_font)
    stw = sbbox[2] - sbbox[0]
    sth = sbbox[3] - sbbox[1]
    pill_cx = (pill_x0 + pill_x1) / 2
    pill_cy = (pill_y0 + pill_y1) / 2
    draw.text((pill_cx - stw/2, pill_cy - sth/2 - int(size*0.02)),
              tool_text, fill=(0, 0, 0, 255), font=small_font)

    return img

# Generate main PNG icon (256x256)
img = generate_icon(256)
png_path = os.path.join(OUTPUT_DIR, "icon.png")
img.save(png_path, "PNG")
print(f"Saved PNG: {png_path}")

# Generate ICO with multiple sizes
ico_sizes = [16, 24, 32, 48, 64, 128, 256]
ico_images = []
for s in ico_sizes:
    resized = generate_icon(s)
    ico_images.append(resized)

ico_path = os.path.join(OUTPUT_DIR, "icon.ico")
ico_images[0].save(ico_path, format="ICO", sizes=[(s, s) for s in ico_sizes],
                   append_images=ico_images[1:])
print(f"Saved ICO: {ico_path}")

# Preview info
print(f"\nIcon generated successfully!")
print(f"PNG: {png_path}")
print(f"ICO: {ico_path}")
