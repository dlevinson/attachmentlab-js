from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE_ROOT = ROOT / ".cache"
MPL_CACHE = CACHE_ROOT / "matplotlib"
FONTCONFIG_CACHE = CACHE_ROOT / "fontconfig"
for path in (CACHE_ROOT, MPL_CACHE, FONTCONFIG_CACHE):
    path.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLBACKEND", "Agg")
os.environ.setdefault("MPLCONFIGDIR", str(MPL_CACHE))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_ROOT))

import matplotlib.pyplot as plt
import pandas as pd


def set_publication_style() -> None:
    plt.style.use("seaborn-v0_8-whitegrid")
    plt.rcParams.update(
        {
            "figure.dpi": 150,
            "savefig.dpi": 300,
            "font.size": 11,
            "axes.titlesize": 12,
            "axes.labelsize": 11,
            "legend.fontsize": 9,
            "xtick.labelsize": 10,
            "ytick.labelsize": 10,
            "axes.spines.top": False,
            "axes.spines.right": False,
        }
    )


def save_figure(fig: plt.Figure, output_dir: Path, stem: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(output_dir / f"{stem}.png", bbox_inches="tight")
    fig.savefig(output_dir / f"{stem}.pdf", bbox_inches="tight")
    plt.close(fig)


def read_figure_frame(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path)
    if "value" in frame.columns:
        frame["value"] = pd.to_numeric(frame["value"], errors="coerce")
    return frame


def metric_panel(
    ax: plt.Axes,
    frame: pd.DataFrame,
    metric: str,
    title: str,
    ylabel: str,
    color_map: dict[str, str],
) -> None:
    subset = frame[frame["metric"] == metric].copy()
    labels = subset["scenarioLabel"].tolist()
    values = subset["value"].tolist()
    colors = [color_map.get(label, "#4c78a8") for label in labels]
    positions = list(range(len(labels)))
    ax.bar(positions, values, color=colors, edgecolor="white")
    ax.set_xticks(positions, labels, rotation=18, ha="right")
    ax.set_title(title)
    ax.set_ylabel(ylabel)


def plot_planarity_core(frame: pd.DataFrame, output_dir: Path) -> None:
    set_publication_style()
    colors = {
        "Free geometry / none": "#4c78a8",
        "Free geometry / reject": "#f58518",
        "Free geometry / split": "#54a24b",
    }
    fig, axes = plt.subplots(2, 2, figsize=(11, 7.4))
    metric_panel(axes[0, 0], frame, "averageClustering", "Clustering", "Average clustering", colors)
    metric_panel(axes[0, 1], frame, "meanEdgeLength", "Mean edge length", "Mean edge length", colors)
    metric_panel(axes[1, 0], frame, "crossingCandidatesAdmitted", "Admitted crossing candidates", "Count", colors)
    metric_panel(axes[1, 1], frame, "generatedIntersectionNodes", "Generated intersection nodes", "Count", colors)
    fig.suptitle("Planarity extensions as distinct growth mechanisms", y=1.02)
    save_figure(fig, output_dir, "figure_extension_planarity_core")


def plot_access_interaction(frame: pd.DataFrame, output_dir: Path) -> None:
    set_publication_style()
    colors = {
        "Reject / no access": "#4c78a8",
        "Split / target access": "#e45756",
        "Split / both with seed access": "#72b7b2",
        "Split / both with opportunity access": "#54a24b",
    }
    fig, axes = plt.subplots(2, 3, figsize=(13, 8))
    metric_panel(axes[0, 0], frame, "meanGravityAccess", "Mean gravity access", "Gravity access", colors)
    metric_panel(axes[0, 1], frame, "meanCumulativeAccess", "Mean cumulative access", "Cumulative access", colors)
    metric_panel(axes[0, 2], frame, "crossingCandidatesAdmitted", "Admitted crossing candidates", "Count", colors)
    metric_panel(axes[1, 0], frame, "splitEvents", "Split events", "Count", colors)
    metric_panel(axes[1, 1], frame, "averageClustering", "Clustering", "Average clustering", colors)
    metric_panel(axes[1, 2], frame, "meanEdgeLength", "Mean edge length", "Mean edge length", colors)
    fig.suptitle("Accessibility semantics within split-planarity growth", y=1.02)
    save_figure(fig, output_dir, "figure_extension_access_interaction")


def main() -> None:
    root = ROOT / "results" / "beyond_paper_focused_20260422_medium"
    figures_dir = root / "figures"
    planarity = read_figure_frame(root / "planarity_core_figure.csv")
    interaction = read_figure_frame(root / "access_interaction_figure.csv")
    plot_planarity_core(planarity, figures_dir)
    plot_access_interaction(interaction, figures_dir)


if __name__ == "__main__":
    main()
