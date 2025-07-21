
import argparse
from PIL import Image
import json

def convert_png_to_json(png_path, json_path, description):
    img = Image.open(png_path).convert("RGBA")
    width, height = img.size

    if width != 16 or height != 16:
        raise ValueError("Image must be 16x16 pixels.")

    pixels = img.load()
    sprite = []
    color_set = set()

    for y in range(height):
        row = []
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                hex_color = "#00000000"
            else:
                hex_color = "#{:02x}{:02x}{:02x}".format(r, g, b)
            row.append(hex_color)
            if hex_color != "#00000000":
                color_set.add(hex_color)
        sprite.append(row)

    json_data = {
        "type": "pixel",
        "description": description,
        "width": 16,
        "height": 16,
        "sprite": sprite,
        "colors": sorted(list(color_set))
    }

    with open(json_path, "w") as f:
        json.dump(json_data, f, indent=4)

    print(f"JSON saved to {json_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert a 16x16 PNG image to JSON sprite format.")
    parser.add_argument("input", help="Path to the 16x16 PNG input file")
    parser.add_argument("output", help="Path to the output JSON file")
    parser.add_argument("-d", "--description", default="Converted 16x16 PNG to JSON", help="Optional description for the JSON file")

    args = parser.parse_args()
    convert_png_to_json(args.input, args.output, args.description)
