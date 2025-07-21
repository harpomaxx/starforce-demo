import argparse
from PIL import Image
import os

def split_sprite(image_path):
    img = Image.open(image_path)

    # Check size
    if img.size != (64, 64):
        raise ValueError("Image must be 64x64 pixels")

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    output_dir = os.path.dirname(image_path) or '.'

    tile_size = 16
    count = 0

    # Loop over 4 rows and 4 columns (4x4 = 16 tiles)
    for row in range(0, 64, tile_size):
        for col in range(0, 64, tile_size):
            cropped = img.crop((col, row, col + tile_size, row + tile_size))
            out_path = os.path.join(output_dir, f"{base_name}_part_{count}.png")
            cropped.save(out_path)
            print(f"Saved: {out_path}")
            count += 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split a 64x64 sprite into sixteen 16x16 tiles.")
    parser.add_argument("image_path", help="Path to the 64x64 PNG sprite image")

    args = parser.parse_args()
    split_sprite(args.image_path)

