#!/usr/bin/env python3
"""
Generate Vanda Orchid images via Freepik AI Image Generation API.
Output: PNG files on a solid white background.
API docs: https://developer.freepik.com/
"""

import os
import time
import base64
import requests

API_KEY = os.environ.get("FREEPIK_API_KEY", "YOUR_API_KEY_HERE")
OUTPUT_DIR = "output_orchids"
NUM_IMAGES = 5

PROMPT = (
    "Vanda orchid flower, studio photography, pure white background, "
    "elegant blooms, vibrant petals, sharp focus, high resolution, "
    "botanical illustration style, soft natural lighting, PNG"
)

NEGATIVE_PROMPT = (
    "dark background, grey background, shadows, blurry, low quality, "
    "watermark, text, other flowers"
)

API_URL = "https://api.freepik.com/v1/ai/text-to-image"

HEADERS = {
    "Content-Type": "application/json",
    "x-freepik-api-key": API_KEY,
}

PAYLOAD = {
    "prompt": PROMPT,
    "negative_prompt": NEGATIVE_PROMPT,
    "guidance_scale": 7,
    "seed": None,
    "num_images": 1,
    "image": {"size": "square_1_1"},
    "styling": {
        "style": "photo",
        "color": "pastel",
        "lightning": "studio",
        "framing": "portrait"
    }
}


def generate_image(index: int) -> None:
    print(f"[{index + 1}/{NUM_IMAGES}] Generating image...")
    response = requests.post(API_URL, headers=HEADERS, json=PAYLOAD, timeout=60)

    if response.status_code != 200:
        print(f"  Error {response.status_code}: {response.text}")
        return

    images = response.json().get("data", [])
    if not images:
        print("  No images returned.")
        return

    for i, img_obj in enumerate(images):
        b64 = img_obj.get("base64")
        if not b64:
            continue
        filename = os.path.join(OUTPUT_DIR, f"vanda_orchid_{index + 1}_{i + 1}.png")
        with open(filename, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"  Saved: {filename}")


def main() -> None:
    if API_KEY == "YOUR_API_KEY_HERE":
        raise SystemExit(
            "Set your Freepik API key via the FREEPIK_API_KEY environment variable.\n"
            "Get one at: https://developer.freepik.com/"
        )

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for i in range(NUM_IMAGES):
        generate_image(i)
        if i < NUM_IMAGES - 1:
            time.sleep(1)

    print(f"\nDone. Images saved to ./{OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
