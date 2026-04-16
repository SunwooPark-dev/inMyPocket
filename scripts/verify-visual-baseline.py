from __future__ import annotations

import json
import subprocess
from datetime import UTC, datetime
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


PROJECT_ROOT = Path.cwd()
EVIDENCE_DIR = PROJECT_ROOT / ".ops-evidence"
BASELINE_DIR = PROJECT_ROOT / "tests" / "visual-baseline"
BASELINE_CONFIG_PATH = BASELINE_DIR / "baseline-config.json"
REQUIRED_IMAGES = ["home-desktop.png", "home-mobile.png", "printable-mobile.png"]


def run_capture(output_dir: Path) -> None:
    command = [
        "node",
        str(PROJECT_ROOT / "scripts" / "run-powershell-script.mjs"),
        "./scripts/capture-ui-evidence.ps1",
        "-BaseUrl",
        "http://localhost:3000",
        "-OutputDir",
        str(output_dir),
    ]
    subprocess.run(command, check=True, cwd=PROJECT_ROOT)


def load_baseline_config() -> dict:
    raw = BASELINE_CONFIG_PATH.read_text(encoding="utf-8-sig")
    return json.loads(raw)


def compare_images(baseline_path: Path, candidate_path: Path) -> dict:
    baseline = Image.open(baseline_path).convert("RGBA")
    candidate = Image.open(candidate_path).convert("RGBA")

    if baseline.size != candidate.size:
        return {
            "ok": False,
            "differenceRatio": 1.0,
            "reason": f"size mismatch {baseline.size} vs {candidate.size}",
        }

    diff = ImageChops.difference(baseline, candidate)
    stat = ImageStat.Stat(diff)
    mean_per_channel = stat.mean
    mean_diff = sum(mean_per_channel) / (len(mean_per_channel) * 255)

    return {
        "ok": True,
        "differenceRatio": mean_diff,
        "reason": None,
        "diffImage": diff,
    }


def write_results(report_dir: Path, verdict: dict, markdown_lines: list[str]) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "visual-regression.json").write_text(
        json.dumps(verdict, indent=2) + "\n", encoding="utf-8"
    )
    (report_dir / "visual-regression.md").write_text(
        "\n".join(markdown_lines) + "\n", encoding="utf-8"
    )


def main() -> None:
    if not BASELINE_CONFIG_PATH.exists():
        raise SystemExit("visual baseline config is missing")

    config = load_baseline_config()
    threshold = float(config.get("maxDifferenceRatio", 0.015))

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    capture_dir = EVIDENCE_DIR / f"visual-candidate-{timestamp}"
    report_dir = EVIDENCE_DIR / f"visual-regression-{timestamp}"

    run_capture(capture_dir)

    failures: list[str] = []
    report_dir.mkdir(parents=True, exist_ok=True)

    results: dict[str, object] = {
        "generatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "threshold": threshold,
        "baselineDir": str(BASELINE_DIR),
        "candidateDir": str(capture_dir),
        "reportDir": str(report_dir),
        "images": {},
    }
    markdown_lines = [
        "# Visual Regression",
        "",
        f"Generated: {datetime.now(UTC).isoformat().replace('+00:00', 'Z')}",
        f"Threshold: {threshold}",
        f"Baseline: {BASELINE_DIR}",
        f"Candidate: {capture_dir}",
        "",
        "## Image results",
        "",
    ]

    for image_name in REQUIRED_IMAGES:
        baseline_path = BASELINE_DIR / image_name
        candidate_path = capture_dir / image_name

        if not baseline_path.exists():
            failures.append(f"missing baseline image: {image_name}")
            results["images"][image_name] = {"ok": False, "reason": "missing baseline"}
            markdown_lines.append(f"- {image_name}: missing baseline")
            continue

        if not candidate_path.exists():
            failures.append(f"missing candidate image: {image_name}")
            results["images"][image_name] = {"ok": False, "reason": "missing candidate"}
            markdown_lines.append(f"- {image_name}: missing candidate")
            continue

        comparison = compare_images(baseline_path, candidate_path)

        if not comparison["ok"]:
            failures.append(f"{image_name}: {comparison['reason']}")
            results["images"][image_name] = comparison
            markdown_lines.append(f"- {image_name}: {comparison['reason']}")
            continue

        difference_ratio = float(comparison["differenceRatio"])
        diff_output_path = report_dir / image_name.replace(".png", ".diff.png")
        comparison["diffImage"].save(diff_output_path)

        image_result = {
            "ok": difference_ratio <= threshold,
            "differenceRatio": difference_ratio,
            "baselinePath": str(baseline_path),
            "candidatePath": str(candidate_path),
            "diffPath": str(diff_output_path),
        }
        results["images"][image_name] = image_result

        if difference_ratio > threshold:
            failures.append(
                f"{image_name}: difference ratio {difference_ratio:.6f} exceeds threshold {threshold:.6f}"
            )

        markdown_lines.append(
            f"- {image_name}: difference ratio {difference_ratio:.6f}"
            + (" (FAIL)" if difference_ratio > threshold else " (PASS)")
        )

    results["verdict"] = "green" if not failures else "red"
    results["errors"] = failures

    markdown_lines.extend(["", "## Errors", ""])
    if failures:
        markdown_lines.extend([f"- {failure}" for failure in failures])
    else:
        markdown_lines.append("- None")

    write_results(report_dir, results, markdown_lines)
    (EVIDENCE_DIR / "visual-regression.latest.json").write_text(
        json.dumps(
            {
                "generatedAt": results["generatedAt"],
                "verdict": results["verdict"],
                "threshold": threshold,
                "candidateDir": str(capture_dir),
                "reportDir": str(report_dir),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    if failures:
        raise SystemExit("visual regression failed")


if __name__ == "__main__":
    main()
