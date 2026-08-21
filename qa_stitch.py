from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
POSITIONS = [0, 648, 1296, 1944, 2592, 3240, 3888, 4536, 5184, 5830]
PAGE_HEIGHT = 6550
VIEWPORT_HEIGHT = 712
STICKY_HEIGHT = 64


segments = [Image.open(ROOT / f"qa-clean-segment-{index:02d}.png").convert("RGB") for index in range(len(POSITIONS))]
canvas = Image.new("RGB", (segments[0].width, PAGE_HEIGHT), "white")
canvas.paste(segments[0].crop((0, 0, segments[0].width, VIEWPORT_HEIGHT)), (0, 0))
covered = VIEWPORT_HEIGHT

for position, segment in zip(POSITIONS[1:], segments[1:]):
    crop_top = max(STICKY_HEIGHT, covered - position)
    crop_bottom = min(VIEWPORT_HEIGHT, PAGE_HEIGHT - position)
    visible = segment.crop((0, crop_top, segment.width, crop_bottom))
    canvas.paste(visible, (0, covered))
    covered += visible.height

canvas = canvas.crop((0, 0, canvas.width, PAGE_HEIGHT))
canvas.save(ROOT / "qa-desktop-final.png")


def resize_to_width(image: Image.Image, width: int) -> Image.Image:
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def comparison(left: Image.Image, right: Image.Image, output: str) -> None:
    width = 720
    gutter = 28
    label_height = 42
    left = resize_to_width(left, width)
    right = resize_to_width(right, width)
    height = max(left.height, right.height)
    result = Image.new("RGB", (width * 2 + gutter, height + label_height), "white")
    draw = ImageDraw.Draw(result)
    draw.rectangle((0, 0, result.width, label_height), fill="#f1f3f5")
    draw.text((18, 14), "SOURCE", fill="#333333")
    draw.text((width + gutter + 18, 14), "IMPLEMENTATION", fill="#333333")
    result.paste(left, (0, label_height))
    result.paste(right, (width + gutter, label_height))
    result.save(ROOT / output)


source = Image.open(ROOT / "reference-option-1.png").convert("RGB")
comparison(source, canvas, "qa-full-comparison.png")
comparison(source.crop((0, 0, source.width, 420)), canvas.crop((0, 0, canvas.width, 790)), "qa-hero-comparison.png")
