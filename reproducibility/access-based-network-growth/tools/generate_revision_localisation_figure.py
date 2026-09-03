from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


REPO_ROOT = Path(__file__).resolve().parents[1]
SUMMARY_PATH = REPO_ROOT / "results" / "baseline" / "summary_by_scenario.csv"
OUTPUT_PATH = REPO_ROOT / "paper-figures" / "figure_phi_localisation.pdf"


def main() -> None:
    summary = pd.read_csv(SUMMARY_PATH)
    frame = summary[
        (summary["suite"] == "sensitivity")
        & (summary["varied_parameter"] == "phi")
    ].copy()
    frame["phi"] = pd.to_numeric(frame["varied_value"])
    frame = frame.sort_values("phi")

    fig, axes = plt.subplots(2, 1, figsize=(6.4, 6.4), sharex=True)
    axes[0].errorbar(
        frame["phi"],
        frame["mean_edge_length_mean"],
        yerr=frame["mean_edge_length_std"],
        marker="o",
        color="#2b6cb0",
        capsize=3,
        linewidth=1.8,
    )
    axes[0].set_ylabel("Mean edge length")
    axes[0].set_title("Link localisation")

    axes[1].errorbar(
        frame["phi"],
        frame["average_shortest_path_lcc_mean"],
        yerr=frame["average_shortest_path_lcc_std"],
        marker="o",
        color="#9c4221",
        capsize=3,
        linewidth=1.8,
    )
    axes[1].set_xlabel(r"Distance deterrence, $\phi$")
    axes[1].set_ylabel("Average shortest-path length")
    axes[1].set_title("Paths in the connected graph")

    for axis in axes:
        axis.grid(alpha=0.25, linewidth=0.6)
        axis.spines[["top", "right"]].set_visible(False)

    fig.tight_layout()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUTPUT_PATH, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
