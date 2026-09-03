from __future__ import annotations

import csv
import json
import math
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_rows(relative_path: str) -> list[dict[str, str]]:
    with (ROOT / relative_path).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def select(rows: list[dict[str, str]], **criteria: object) -> dict[str, str]:
    matches = [
        row
        for row in rows
        if all(str(row.get(key, "")) == str(value) for key, value in criteria.items())
    ]
    if len(matches) != 1:
        raise AssertionError(f"Expected one row for {criteria}; found {len(matches)}")
    return matches[0]


def check(label: str, actual: str, expected: float, digits: int) -> None:
    value = float(actual)
    quantum = Decimal(1).scaleb(-digits)
    displayed = Decimal(actual).quantize(quantum, rounding=ROUND_HALF_UP)
    if displayed != Decimal(str(expected)).quantize(quantum):
        raise AssertionError(f"{label}: expected {expected}, found {value}")
    print(f"PASS {label}: {value}")


def main() -> None:
    summary = read_rows("results/baseline/summary_by_scenario.csv")
    headline_expectations = {
        ("ba_benchmark", 200): (36.38, 0.388, 0.099, 0.518),
        ("capacity_only", 200): (15.25, 0.334, 0.026, 0.525),
        ("spatial_only", 200): (35.31, 0.383, 0.104, 0.370),
        ("general_model", 200): (15.13, 0.334, 0.037, 0.361),
        ("ba_benchmark", 1000): (82.31, 0.388, 0.028, 0.521),
        ("capacity_only", 1000): (16.00, 0.335, 0.007, 0.521),
        ("spatial_only", 1000): (85.50, 0.389, 0.035, 0.351),
        ("general_model", 1000): (16.00, 0.336, 0.009, 0.349),
    }
    for (scenario, size), expected in headline_expectations.items():
        row = select(summary, suite="headline", scenario_name=scenario, final_nodes=size)
        check(f"{scenario} N={size} maximum degree", row["max_degree_mean"], expected[0], 2)
        check(f"{scenario} N={size} degree Gini", row["degree_gini_mean"], expected[1], 3)
        check(f"{scenario} N={size} clustering", row["average_clustering_mean"], expected[2], 3)
        check(f"{scenario} N={size} mean edge length", row["mean_edge_length_mean"], expected[3], 3)

    heterogeneous = {
        "constant_capacity": (16.00, 0.337, 0.0039, 0.0096),
        "uniform_capacity": (23.06, 0.355, 0.0040, 0.0132),
        "lognormal_capacity": (49.00, 0.381, 0.0046, 0.0210),
    }
    for scenario, expected in heterogeneous.items():
        row = select(summary, suite="heterogeneous_capacity", scenario_name=scenario, final_nodes=1000)
        check(f"{scenario} maximum degree", row["max_degree_mean"], expected[0], 2)
        check(f"{scenario} degree Gini", row["degree_gini_mean"], expected[1], 3)
        check(f"{scenario} share at capacity", row["share_at_capacity_mean"], expected[2], 4)
        check(f"{scenario} clustering", row["average_clustering_mean"], expected[3], 4)

    tails = read_rows("results/baseline/tail_fits.csv")
    ba_tail = select(tails, suite="headline", scenario_name="ba_benchmark", final_nodes=1000)
    if ba_tail["preferred_model"] != "power_law":
        raise AssertionError(f"BA tail: expected power_law, found {ba_tail['preferred_model']}")
    check(
        "BA power-law versus discretised-lognormal AIC gap",
        str(float(ba_tail["lognorm_aic"]) - float(ba_tail["power_aic"])),
        1.09,
        2,
    )

    focused = read_rows("results/transport_extensions/focused_summary.csv")
    crossing = {
        "planarity_free_none": (0.123, 0.5371, 357.0, 0.0, 0.0),
        "planarity_free_reject": (0.776, 0.2659, 0.0, 0.0, 0.0),
        "planarity_free_split": (0.170, 0.0046, 368.0, 93.0, 17626.0),
    }
    for scenario, expected in crossing.items():
        row = select(focused, group="planarity_core", scenarioId=scenario)
        check(f"{scenario} clustering", row["averageClustering"], expected[0], 3)
        check(f"{scenario} mean segment length", row["meanEdgeLength"], expected[1], 4)
        check(f"{scenario} crossing candidates admitted", row["crossingCandidatesAdmitted"], expected[2], 1)
        check(f"{scenario} split-active steps", row["splitEvents"], expected[3], 1)
        check(f"{scenario} generated junctions", row["generatedIntersectionNodes"], expected[4], 1)

    access = read_rows(
        "results/transport_extensions/corrected_access_comparison/"
        "corrected_access_summary.csv"
    )
    access_expected = {
        "interaction_reject_none": (63.98, 187.47),
        "interaction_split_target": (66.13, 193.46),
        "interaction_split_both_seed": (66.32, 194.59),
        "interaction_split_both_opportunity": (66.52, 195.00),
    }
    for scenario, expected in access_expected.items():
        row = select(access, scenarioId=scenario)
        check(f"{scenario} gravity access", row["gravityMean"], expected[0], 2)
        check(f"{scenario} cumulative access", row["cumulativeMean"], expected[1], 2)

    required_figures = [
        "figure_02_degree_ccdf.pdf",
        "figure_04_share_at_capacity_heatmap.pdf",
        "figure_05_clustering_vs_kappa.pdf",
        "figure_06a_max_degree_heatmap.pdf",
        "figure_06b_degree_gini_heatmap.pdf",
        "figure_08_sensitivity_panels.pdf",
        "figure_phi_localisation.pdf",
        "figure_headline_graph_access_gallery.pdf",
        "figure_extension_design_schematic.pdf",
        "figure_extension_planarity_gallery.pdf",
        "figure_extension_access_gallery.pdf",
    ]
    for name in required_figures:
        path = ROOT / "paper-figures" / name
        if not path.is_file() or path.stat().st_size == 0:
            raise AssertionError(f"Missing paper figure: {path}")
        print(f"PASS figure {name}")

    headline_root = ROOT / "results/baseline_visualisation"
    headline = json.loads((headline_root / "headline.json").read_text(encoding="utf-8"))
    representatives = json.loads(
        (headline_root / "headline_representative_states.json").read_text(encoding="utf-8")
    )
    source_runs = {
        (run["scenarioId"], run["replication"], run["seed"]): run
        for run in headline["runs"]
    }
    for state in representatives["states"]:
        key = (state["scenarioId"], state["replication"], state["seed"])
        source = source_runs.get(key)
        if source is None:
            raise AssertionError(f"Representative state lacks a matching saved run: {key}")
        for metric in ("maxDegree", "degreeGini", "averageClustering", "meanEdgeLength"):
            if not math.isclose(
                float(state["metrics"][metric]),
                float(source["metrics"][metric]),
                rel_tol=0,
                abs_tol=1e-12,
            ):
                raise AssertionError(f"Representative metric mismatch for {key}: {metric}")
        if len(state["nodes"]) != 500:
            raise AssertionError(f"Representative state {key} has {len(state['nodes'])} nodes")
        print(f"PASS representative state {key}")

    print("All reported-value and figure checks passed.")


if __name__ == "__main__":
    main()
