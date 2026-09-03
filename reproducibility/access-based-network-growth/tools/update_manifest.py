from __future__ import annotations

import csv
import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {
    ".cache",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "node_modules",
    "beyond_paper_focused_test",
    "paper_replication_smoke_test",
}
EXCLUDED_NAMES = {".DS_Store", "MANIFEST.csv", "SHA256SUMS"}


def included(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    return (
        path.is_file()
        and path.name not in EXCLUDED_NAMES
        and not any(part in EXCLUDED_PARTS for part in relative.parts)
        and not any(part.endswith(".egg-info") for part in relative.parts)
        and path.suffix != ".tsbuildinfo"
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def category(relative: Path) -> str:
    if relative.parts[0] == "results":
        return "generated_output"
    if relative.parts[0] == "paper-figures":
        return "paper_figure"
    if relative.parts[0] in {"python", "src", "tools"}:
        return "source"
    return "documentation_or_environment"


def main() -> None:
    files = sorted(
        (path for path in ROOT.rglob("*") if included(path)),
        key=lambda path: path.relative_to(ROOT).as_posix(),
    )
    rows = []
    checksum_lines = []
    for path in files:
        relative = path.relative_to(ROOT)
        digest = sha256(path)
        rows.append(
            {
                "path": relative.as_posix(),
                "category": category(relative),
                "bytes": path.stat().st_size,
                "sha256": digest,
            }
        )
        checksum_lines.append(f"{digest}  {relative.as_posix()}")

    with (ROOT / "MANIFEST.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["path", "category", "bytes", "sha256"],
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)
    (ROOT / "SHA256SUMS").write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} manifest entries.")


if __name__ == "__main__":
    main()
