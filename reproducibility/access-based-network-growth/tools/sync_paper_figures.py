"""Copy the generated PDFs used by the manuscript to the publication directory."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    **{name: ROOT / "results/baseline/figures" / name for name in (
        "figure_02_degree_ccdf.pdf", "figure_04_share_at_capacity_heatmap.pdf",
        "figure_05_clustering_vs_kappa.pdf", "figure_06a_max_degree_heatmap.pdf",
        "figure_06b_degree_gini_heatmap.pdf", "figure_08_sensitivity_panels.pdf",
    )},
    "figure_headline_graph_access_gallery.pdf": ROOT / "results/baseline_visualisation/figures/figure_headline_graph_access_gallery.pdf",
    **{name: ROOT / "results/transport_extensions/corrected_access_comparison/figures" / name for name in (
        "figure_extension_design_schematic.pdf", "figure_extension_planarity_gallery.pdf", "figure_extension_access_gallery.pdf",
    )},
}


def main() -> None:
    destination = ROOT / "paper-figures"
    destination.mkdir(exist_ok=True)
    for name, source in SOURCES.items():
        if not source.is_file():
            raise FileNotFoundError(source)
        shutil.copy2(source, destination / name)
    print(f"Synced {len(SOURCES)} figure PDFs; the localisation script writes directly to paper-figures.")


if __name__ == "__main__":
    main()
