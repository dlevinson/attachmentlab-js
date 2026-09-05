"""Refresh tail diagnostics and capacity-axis labels from saved outputs only."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "python"))
import pandas as pd
from src.tail_fits import fit_tail_table
from src.run_experiments import write_latex_table
from src.plots import plot_capacity_heatmap, plot_sensitivity_panels


def main() -> None:
    output = ROOT / "results" / "baseline"
    degrees = pd.read_csv(output / "degree_sequences.csv.gz")
    tails = fit_tail_table(degrees, ["suite", "scenario_name", "final_nodes"])
    tails.to_csv(output / "tail_fits.csv", index=False)
    tails.to_csv(output / "tables" / "table_04_tail_fits.csv", index=False)
    write_latex_table(tails, output / "tables" / "table_04_tail_fits.tex")
    print(tails[tails.suite == "headline"].to_string(index=False), flush=True)
    summary = pd.read_csv(output / "summary_by_scenario.csv")
    for metric, stem, title in [
        ("share_at_capacity_mean", "figure_04_share_at_capacity_heatmap", "Share of saturated nodes by capacity and saturation strength"),
        ("max_degree_mean", "figure_06a_max_degree_heatmap", "Maximum degree by capacity and saturation strength"),
        ("degree_gini_mean", "figure_06b_degree_gini_heatmap", "Degree inequality by capacity and saturation strength"),
    ]:
        plot_capacity_heatmap(summary, output / "figures", metric, stem, title)
    plot_sensitivity_panels(summary, output / "figures")


if __name__ == "__main__":
    main()
