from __future__ import annotations

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    home_desktop = output_dir / "home-desktop.png"
    home_mobile = output_dir / "home-mobile.png"
    printable_mobile = output_dir / "printable-mobile.png"
    printable_pdf = output_dir / "printable.pdf"

    with sync_playwright() as p:
      browser = p.chromium.launch(channel="chrome", headless=True)

      desktop = browser.new_page(viewport={"width": 1440, "height": 2200})
      desktop.goto(f"{args.base_url}/", wait_until="networkidle")
      desktop.screenshot(path=str(home_desktop), full_page=True)
      desktop.close()

      mobile = browser.new_page(viewport={"width": 430, "height": 3400}, device_scale_factor=1)
      mobile.goto(f"{args.base_url}/", wait_until="networkidle")
      mobile.screenshot(path=str(home_mobile), full_page=True)
      mobile.close()

      printable = browser.new_page(viewport={"width": 430, "height": 2400}, device_scale_factor=1)
      printable.goto(f"{args.base_url}/printable", wait_until="networkidle")
      printable.screenshot(path=str(printable_mobile), full_page=True)
      printable.pdf(path=str(printable_pdf), print_background=True, width="8.5in", height="11in")
      printable.close()

      browser.close()

    print("BROWSER=playwright-chrome")
    print(f"HOME_DESKTOP={home_desktop}")
    print(f"HOME_MOBILE={home_mobile}")
    print(f"PRINTABLE_MOBILE={printable_mobile}")
    print(f"PRINTABLE_PDF={printable_pdf}")


if __name__ == "__main__":
    main()
