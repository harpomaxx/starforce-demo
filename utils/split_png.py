import argparse
from PIL import Image
import os

def split_sprite(image_path):
    img = Image.open(image_path)

    # Check size
    if img.size != (32, 32):
        raise ValueError("Image must be 32x32 pixels")

    # Coordinates for cropping
    regions = [
        (0, 0), (16, 0),      # top-left, top-right
        (0, 16), (16, 16),    # bottom-left, bottom-right
    ]

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    output_dir = os.path.dirname(image_path) or '.'

    # Save cropped sprites
    for i, (x, y) in enumerate(regions):
        cropped = img.crop((x, y, x + 16, y + 16))
        out_path = os.path.join(output_dir, f"{base_name}_part_{i}.png")
        cropped.save(out_path)
        print(f"Saved: {out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split a 32x32 sprite into four 16x16 sprites.")
    parser.add_argument("image_path", help="Path to the 32x32 PNG sprite image")

    args = parser.parse_args()
    split_sprite(args.image_path)

