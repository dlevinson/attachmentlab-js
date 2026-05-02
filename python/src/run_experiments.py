from __future__ import annotations

import argparse
import hashlib
import os
from itertools import product
from pathlib import Path
from typing import Any

import pandas as pd
import yaml

_CACHE_ROOT = Path.cwd() / ".cache"
_MPLCONFIGDIR = _CACHE_ROOT / "matplotlib"
_CACHE_ROOT.mkdir(parents=True, exist_ok=True)
_MPLCONFIGDIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("XDG_CACHE_HOME", str(_CACHE_ROOT))
os.environ.setdefault("MPLCONFIGDIR", str(_MPLCONFIGDIR))
os.environ.setdefault("MPLBACKEND", "Agg")

from src.general_attachment import CapacityConfig, GrowthParams, run_growth
from src.metrics import compute_run_metrics
from src.plots import generate_all_figures
from src.tail_fits import fit_tail_table


def load_config(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def deterministic_seed(base_seed: int, payload: str) -> int:
    digest = hashlib.sha256(f"{base_seed}|{payload}".encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "little") % (2**32 - 1)


def ensure_output_dirs(root: Path) -> dict[str, Path]:
    paths = {
        "root": root,
        "figures": root / "figures",
        "tables": root / "tables",
        "networks": root / "networks",
        "text": root / "text",
    }
    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)
    return paths


def _scenario_record(base: dict[str, Any], suite_name: str, scenario_name: str, final_nodes: int) -> dict[str, Any]:
    scenario = dict(base)
    scenario["suite"] = suite_name
    scenario["scenario_name"] = scenario_name
    scenario["final_nodes"] = final_nodes
    scenario["K_label"] = str(scenario["K"])
    return scenario


def expand_suites(config: dict[str, Any], suite_names: list[str]) -> pd.DataFrame:
    scenarios: list[dict[str, Any]] = []
    for suite_name in suite_names:
        suite = config["suites"][suite_name]
        suite_type = suite["type"]
        if suite_type == "explicit":
            for final_nodes in suite["final_nodes"]:
                for scenario in suite["scenarios"]:
                    record = _scenario_record(scenario, suite_name, scenario["scenario_name"], final_nodes)
                    record.setdefault("varied_parameter", None)
                    record.setdefault("varied_value", None)
                    record["replications"] = suite["replications"]
                    scenarios.append(record)
        elif suite_type == "one_factor":
            baseline = suite["baseline"]
            for final_nodes in suite["final_nodes"]:
                base_record = _scenario_record(baseline, suite_name, "baseline", final_nodes)
                base_record["varied_parameter"] = "baseline"
                base_record["varied_value"] = 0
                base_record["replications"] = suite["replications"]
                scenarios.append(base_record)
                for parameter, values in suite["vary"].items():
                    for value in values:
                        record = dict(baseline)
                        record[parameter] = value
                        record = _scenario_record(record, suite_name, f"{parameter}_{value}", final_nodes)
                        record["varied_parameter"] = parameter
                        record["varied_value"] = value
                        record["replications"] = suite["replications"]
                        scenarios.append(record)
        elif suite_type == "grid":
            reserved = {"type", "replications", "final_nodes", "fixed", "varied_parameter"}
            grid_axes = {key: value for key, value in suite.items() if key not in reserved}
            for final_nodes in suite["final_nodes"]:
                fixed = dict(suite.get("fixed", {}))
                axis_names = list(grid_axes.keys())
                axis_values = [value if isinstance(value, list) else [value] for value in grid_axes.values()]
                for combo in product(*axis_values):
                    record = dict(fixed)
                    record.update(zip(axis_names, combo))
                    name = "_".join(f"{key}_{value}" for key, value in zip(axis_names, combo))
                    record = _scenario_record(record, suite_name, name, final_nodes)
                    record["varied_parameter"] = suite.get("varied_parameter", "grid")
                    record["varied_value"] = "|".join(f"{key}={value}" for key, value in zip(axis_names, combo))
                    record["replications"] = suite["replications"]
                    scenarios.append(record)
        else:
            raise ValueError(f"Unsupported suite type: {suite_type}")
    return pd.DataFrame(scenarios)


def build_growth_params(defaults: dict[str, Any], scenario: dict[str, Any]) -> GrowthParams:
    capacity_mode = scenario.get("capacity_mode", defaults["capacity_mode"])
    if pd.isna(capacity_mode):
        capacity_mode = defaults["capacity_mode"]
    capacity_params = scenario.get("capacity_params", {})
    if isinstance(capacity_params, float) and pd.isna(capacity_params):
        capacity_params = {}

    impedance = scenario.get("impedance", defaults["impedance"])
    if pd.isna(impedance):
        impedance = defaults["impedance"]

    impedance_lambda = scenario.get("impedance_lambda", defaults["impedance_lambda"])
    if pd.isna(impedance_lambda):
        impedance_lambda = defaults["impedance_lambda"]

    capacity = CapacityConfig(mode=str(capacity_mode), params={"value": scenario["K"]})
    if capacity.mode != "constant":
        capacity = CapacityConfig(
            mode=str(capacity_mode),
            params=capacity_params,
        )
    return GrowthParams(
        final_nodes=int(scenario["final_nodes"]),
        alpha=float(scenario["alpha"]),
        beta=float(scenario["beta"]),
        phi=float(scenario["phi"]),
        kappa=int(scenario["kappa"]),
        m0=int(defaults["m0"]),
        eps=float(defaults["eps"]),
        impedance=str(impedance),
        impedance_lambda=float(impedance_lambda),
        capacity=capacity,
    )


def aggregate_summary(runs_df: pd.DataFrame, group_cols: list[str]) -> pd.DataFrame:
    metric_cols = [
        column
        for column in runs_df.columns
        if column
        not in {
            "replication",
            "seed",
            "termination_reason",
            "scenario_name",
            "suite",
            "varied_parameter",
            "varied_value",
            "K_label",
        }
        and pd.api.types.is_numeric_dtype(runs_df[column])
    ]
    grouped = runs_df.groupby(group_cols, dropna=False)[metric_cols].agg(["mean", "std"])
    grouped.columns = ["_".join(part for part in column if part) for column in grouped.columns.to_flat_index()]
    return grouped.reset_index()


def write_latex_table(frame: pd.DataFrame, path: Path, *, float_format: str = "%.3f") -> None:
    def latex_escape(text: str) -> str:
        replacements = {
            "\\": r"\textbackslash{}",
            "&": r"\&",
            "%": r"\%",
            "$": r"\$",
            "#": r"\#",
            "_": r"\_",
            "{": r"\{",
            "}": r"\}",
            "~": r"\textasciitilde{}",
            "^": r"\textasciicircum{}",
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text

    def format_cell(value: Any) -> str:
        if pd.isna(value):
            return ""
        if isinstance(value, bool):
            return str(value)
        if isinstance(value, int):
            return str(value)
        if isinstance(value, float):
            return float_format % value
        return latex_escape(str(value))

    columns = [latex_escape(str(column)) for column in frame.columns]
    lines = [
        r"\begin{tabular}{" + ("l" * len(columns)) + "}",
        r"\toprule",
        " & ".join(columns) + r" \\",
        r"\midrule",
    ]
    for row in frame.itertuples(index=False, name=None):
        lines.append(" & ".join(format_cell(value) for value in row) + r" \\")
    lines.extend([r"\bottomrule", r"\end{tabular}"])
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_results_summary(summary_df: pd.DataFrame, tail_df: pd.DataFrame, acceptance: pd.DataFrame) -> str:
    headline = summary_df[summary_df["suite"] == "headline"]
    general = headline[headline["scenario_name"] == "general_model"]
    if general.empty:
        general_line = "General-model outcomes were not available in the executed suites."
    else:
        focal = general.sort_values("final_nodes").iloc[-1]
        general_line = (
            f"In the largest executed general-model scenario (N={int(focal['final_nodes'])}), the mean degree was "
            f"{focal['mean_degree_mean']:.2f}, the mean edge length was {focal['mean_edge_length_mean']:.3f}, and "
            f"{100 * focal['share_at_capacity_mean']:.1f}% of nodes sat at capacity."
        )

    tail_subset = tail_df[tail_df["suite"] == "headline"]
    if tail_subset.empty:
        tail_line = "Tail-fit diagnostics were not available."
    else:
        favored = tail_subset["preferred_model"].value_counts().to_dict()
        tail_line = f"Across headline scenarios, the preferred tail model counts were {favored}."

    heterogeneity = summary_df[summary_df["suite"] == "heterogeneous_capacity"]
    if heterogeneity.empty:
        heterogeneity_line = "No heterogeneous-capacity comparison suite was included in the executed configuration."
    else:
        focal = heterogeneity.sort_values(["final_nodes", "scenario_name"]).copy()
        if "share_at_capacity_mean" in focal.columns and "degree_gini_mean" in focal.columns:
            comparison_bits = []
            for _, row in focal.iterrows():
                comparison_bits.append(
                    f"{row['scenario_name']}: Gini={row['degree_gini_mean']:.3f}, saturated={100 * row['share_at_capacity_mean']:.1f}%"
                )
            heterogeneity_line = "Heterogeneous-capacity comparison: " + "; ".join(comparison_bits) + "."
        else:
            heterogeneity_line = "A heterogeneous-capacity comparison suite was executed."

    acceptance_lines = [
        f"- {row['hypothesis']}: {row['status']}. {row['evidence']}"
        for _, row in acceptance.iterrows()
    ]
    return "\n".join(
        [
            "# Results Summary",
            "",
            general_line,
            tail_line,
            heterogeneity_line,
            "",
            "Acceptance checks:",
            *acceptance_lines,
        ]
    )


def build_captions() -> str:
    figure_captions = {
        "Figure 1": "Final spatial network realizations for the four headline scenarios, showing how capacity and distance deterrence alter hub formation and local structure.",
        "Figure 2": "Empirical complementary cumulative degree distributions for the headline scenarios on log-log axes, using pooled degree sequences from the largest executed network size.",
        "Figure 3": "Mean edge length as a function of the distance-deterrence parameter phi, holding other parameters at the baseline sensitivity setting.",
        "Figure 4": "Share of nodes at capacity across the beta-K design, illustrating how stronger saturation and lower capacity generate more binding constraints.",
        "Figure 5": "Average clustering coefficient as a function of the number of initial attachments kappa.",
        "Figure 6": "Heatmaps of max degree and degree Gini over the beta-K design, summarizing how capacity truncates hub concentration.",
        "Figure 7": "Largest-component share and average path length on the largest connected component as phi varies.",
        "Figure 8": "One-factor sensitivity panels for alpha, beta, phi, kappa, and K around the baseline specification.",
        "Figure 9": "Heatmap of largest-component share over the beta-K design as a compact view of connectedness in the constrained model.",
    }
    table_captions = {
        "Table 1": "Simulation scenarios and parameter values used across the executed suites.",
        "Table 2": "Mean outcomes across replications for the four headline scenarios.",
        "Table 3": "Sensitivity summary over the one-factor benchmark suite.",
        "Table 4": "Tail-fit diagnostics for the pooled degree distributions, including Clauset-style k_min selection and competing tail models.",
        "Table 5": "Comparison of homogeneous and heterogeneous capacity specifications under the general model, showing how capacity dispersion affects degree inequality and saturation.",
    }
    lines = ["# Captions", "", "## Figures"]
    lines.extend([f"- {label}: {caption}" for label, caption in figure_captions.items()])
    lines.extend(["", "## Tables"])
    lines.extend([f"- {label}: {caption}" for label, caption in table_captions.items()])
    return "\n".join(lines)


def evaluate_acceptance_checks(summary_df: pd.DataFrame, tail_df: pd.DataFrame) -> pd.DataFrame:
    records: list[dict[str, str]] = [
        {
            "hypothesis": "Adding capacity truncates the upper tail and raises the share of saturated nodes",
            "status": "not evaluated",
            "evidence": "Headline comparison data were incomplete.",
        },
        {
            "hypothesis": "Raising phi shortens edge lengths and may increase local clustering",
            "status": "not evaluated",
            "evidence": "Sensitivity comparison data were incomplete.",
        },
        {
            "hypothesis": "Raising kappa reduces tree-like structure and may increase redundancy or clustering",
            "status": "not evaluated",
            "evidence": "Sensitivity comparison data were incomplete.",
        },
        {
            "hypothesis": "The BA benchmark approximately reproduces a heavy-tailed degree pattern",
            "status": "not evaluated",
            "evidence": "Tail-fit outputs were incomplete.",
        },
    ]

    headline = summary_df[summary_df["suite"] == "headline"]
    if not headline.empty:
        merged = headline.pivot_table(
            index="final_nodes",
            columns="scenario_name",
            values=["max_degree_mean", "share_at_capacity_mean", "mean_edge_length_mean", "average_clustering_mean"],
        )
        if ("max_degree_mean", "ba_benchmark") in merged.columns and ("max_degree_mean", "capacity_only") in merged.columns:
            max_degree_diff = (merged[("max_degree_mean", "capacity_only")] < merged[("max_degree_mean", "ba_benchmark")]).all()
            saturation_diff = (
                merged[("share_at_capacity_mean", "capacity_only")] > merged[("share_at_capacity_mean", "ba_benchmark")]
            ).all()
            status = "supported" if max_degree_diff and saturation_diff else "not supported"
            evidence = (
                f"Capacity-only runs had lower mean max degree={max_degree_diff} and higher saturation share={saturation_diff} "
                "relative to the BA benchmark across executed N values."
            )
            records[0] = {
                "hypothesis": records[0]["hypothesis"],
                "status": status,
                "evidence": evidence,
            }

    sensitivity = summary_df[summary_df["suite"] == "sensitivity"]
    phi_frame = sensitivity[sensitivity["varied_parameter"] == "phi"].sort_values("varied_value")
    if not phi_frame.empty and phi_frame.shape[0] >= 2:
        lower = phi_frame.iloc[0]
        upper = phi_frame.iloc[-1]
        shorter = upper["mean_edge_length_mean"] < lower["mean_edge_length_mean"]
        more_clustered = upper["average_clustering_mean"] > lower["average_clustering_mean"]
        status = "supported" if shorter and more_clustered else ("partially supported" if shorter else "not supported")
        evidence = (
            f"From phi={lower['varied_value']} to phi={upper['varied_value']}, mean edge length decreased={shorter} "
            f"and clustering increased={more_clustered}."
        )
        records[1] = {
            "hypothesis": records[1]["hypothesis"],
            "status": status,
            "evidence": evidence,
        }

    kappa_frame = sensitivity[sensitivity["varied_parameter"] == "kappa"].sort_values("varied_value")
    if not kappa_frame.empty and kappa_frame.shape[0] >= 2:
        lower = kappa_frame.iloc[0]
        upper = kappa_frame.iloc[-1]
        less_tree_like = upper["cyclomatic_number_mean"] > lower["cyclomatic_number_mean"]
        more_clustered = upper["average_clustering_mean"] > lower["average_clustering_mean"]
        status = "supported" if less_tree_like and more_clustered else ("partially supported" if more_clustered else "not supported")
        evidence = (
            f"From kappa={lower['varied_value']} to kappa={upper['varied_value']}, cyclomatic number increased={less_tree_like} "
            f"and clustering increased={more_clustered}."
        )
        records[2] = {
            "hypothesis": records[2]["hypothesis"],
            "status": status,
            "evidence": evidence,
        }

    ba_tail = tail_df[(tail_df["suite"] == "headline") & (tail_df["scenario_name"] == "ba_benchmark")]
    if not ba_tail.empty:
        preferred = ba_tail["preferred_model"].mode().iloc[0]
        heavy_tailed = preferred in {"power_law", "lognormal"}
        status = "supported" if heavy_tailed else "not supported"
        evidence = f"The dominant preferred tail model for the pooled BA benchmark distributions was '{preferred}'."
        records[3] = {
            "hypothesis": records[3]["hypothesis"],
            "status": status,
            "evidence": evidence,
        }

    return pd.DataFrame(records)


def save_example_network(paths: dict[str, Path], scenario_name: str, final_nodes: int, replication: int, result: dict[str, Any]) -> None:
    nodes = pd.DataFrame(
        {
            "node": range(result["positions"].shape[0]),
            "x": result["positions"][:, 0],
            "y": result["positions"][:, 1],
            "capacity": result["capacities"],
            "degree": result["degrees"],
        }
    )
    edges = pd.DataFrame(result["edges"], columns=["u", "v"])
    stem = f"{scenario_name}_N{final_nodes}_rep{replication:02d}"
    nodes.to_csv(paths["networks"] / f"{stem}_nodes.csv", index=False)
    edges.to_csv(paths["networks"] / f"{stem}_edges.csv", index=False)


def load_example_networks(network_dir: Path) -> list[dict[str, object]]:
    example_networks: list[dict[str, object]] = []
    for nodes_path in sorted(network_dir.glob("*_nodes.csv")):
        stem = nodes_path.name.replace("_nodes.csv", "")
        scenario_name = stem.split("_N", maxsplit=1)[0]
        edges_path = network_dir / f"{stem}_edges.csv"
        if not edges_path.exists():
            continue
        nodes = pd.read_csv(nodes_path)
        edges = pd.read_csv(edges_path)
        example_networks.append(
            {
                "scenario_name": scenario_name,
                "positions": nodes[["x", "y"]].to_numpy(),
                "edges": edges[["u", "v"]].to_numpy(),
            }
        )
    return example_networks


def finalize_outputs(
    paths: dict[str, Path],
    scenarios_df: pd.DataFrame,
    runs_df: pd.DataFrame,
    degree_df: pd.DataFrame,
    example_networks: list[dict[str, object]],
) -> None:
    summary_df = aggregate_summary(
        runs_df,
        group_cols=[
            "suite",
            "scenario_name",
            "final_nodes",
            "alpha",
            "beta",
            "phi",
            "kappa",
            "K",
            "K_label",
            "varied_parameter",
            "varied_value",
        ],
    )
    summary_df.to_csv(paths["root"] / "summary_by_scenario.csv", index=False)

    headline_summary = summary_df[summary_df["suite"] == "headline"].copy()
    sensitivity_summary = summary_df[summary_df["suite"] == "sensitivity"].copy()
    heterogeneous_summary = summary_df[summary_df["suite"] == "heterogeneous_capacity"].copy()
    tail_df = fit_tail_table(degree_df, ["suite", "scenario_name", "final_nodes"])
    tail_df.to_csv(paths["root"] / "tail_fits.csv", index=False)

    scenarios_df.to_csv(paths["tables"] / "table_01_scenarios.csv", index=False)
    headline_summary.to_csv(paths["tables"] / "table_02_headline_summary.csv", index=False)
    sensitivity_summary.to_csv(paths["tables"] / "table_03_sensitivity_summary.csv", index=False)
    tail_df.to_csv(paths["tables"] / "table_04_tail_fits.csv", index=False)

    write_latex_table(scenarios_df, paths["tables"] / "table_01_scenarios.tex")
    write_latex_table(headline_summary, paths["tables"] / "table_02_headline_summary.tex")
    write_latex_table(sensitivity_summary, paths["tables"] / "table_03_sensitivity_summary.tex")
    write_latex_table(tail_df, paths["tables"] / "table_04_tail_fits.tex")
    if not heterogeneous_summary.empty:
        heterogeneous_summary.to_csv(paths["tables"] / "table_05_heterogeneous_capacity.csv", index=False)
        write_latex_table(heterogeneous_summary, paths["tables"] / "table_05_heterogeneous_capacity.tex")

    generate_all_figures(
        summary_df=summary_df,
        degree_df=degree_df,
        example_networks=example_networks,
        output_dir=paths["figures"],
    )

    acceptance = evaluate_acceptance_checks(summary_df, tail_df)
    acceptance.to_csv(paths["root"] / "acceptance_checks.csv", index=False)

    (paths["text"] / "results_summary.md").write_text(
        build_results_summary(summary_df, tail_df, acceptance),
        encoding="utf-8",
    )
    (paths["text"] / "captions.md").write_text(build_captions(), encoding="utf-8")


def postprocess_existing_results(config_path: Path) -> None:
    config = load_config(config_path)
    output_root = Path(config["defaults"]["output_dir"]).resolve()
    paths = ensure_output_dirs(output_root)
    scenarios_df = pd.read_csv(paths["root"] / "scenarios.csv")
    runs_df = pd.read_csv(paths["root"] / "runs.csv")
    degree_df = pd.read_csv(paths["root"] / "degree_sequences.csv.gz")
    example_networks = load_example_networks(paths["networks"])
    finalize_outputs(paths, scenarios_df, runs_df, degree_df, example_networks)


def run_suite(config_path: Path, suite_names: list[str]) -> None:
    config = load_config(config_path)
    defaults = config["defaults"]
    output_root = Path(defaults["output_dir"]).resolve()
    paths = ensure_output_dirs(output_root)

    scenarios = expand_suites(config, suite_names)
    scenario_defs = []
    run_rows = []
    degree_rows = []
    example_networks: list[dict[str, object]] = []
    total_runs = int(scenarios["replications"].sum())
    completed_runs = 0

    print(f"Running {len(scenarios)} scenario definitions across suites: {', '.join(suite_names)}")
    for scenario in scenarios.to_dict(orient="records"):
        scenario_defs.append(scenario)
        params = build_growth_params(defaults, scenario)
        print(
            f"Scenario {scenario['suite']}/{scenario['scenario_name']} at N={scenario['final_nodes']} "
            f"for {scenario['replications']} replications"
        )
        for replication in range(int(scenario["replications"])):
            seed_payload = f"{scenario['suite']}|{scenario['scenario_name']}|{scenario['final_nodes']}|{replication}"
            seed = deterministic_seed(int(defaults["seed_base"]), seed_payload)
            result = run_growth(params, seed)
            metrics = compute_run_metrics(
                result["graph"],
                capacities=result["capacities"],
                edge_lengths=result["edge_lengths"],
                degree_threshold=int(defaults["degree_threshold"]),
                diameter_max_nodes=int(defaults["diameter_max_nodes"]),
            )
            row = dict(scenario)
            row.update(result["summary"])
            row.update(metrics)
            row["replication"] = replication
            row["seed"] = seed
            run_rows.append(row)
            completed_runs += 1
            if completed_runs % 25 == 0 or completed_runs == total_runs:
                print(f"Completed {completed_runs}/{total_runs} replications")

            degree_rows.extend(
                {
                    "suite": scenario["suite"],
                    "scenario_name": scenario["scenario_name"],
                    "final_nodes": scenario["final_nodes"],
                    "replication": replication,
                    "node": node,
                    "degree": degree,
                }
                for node, degree in enumerate(result["degrees"].tolist())
            )

            if (
                scenario["suite"] == "headline"
                and scenario["final_nodes"] == int(defaults["example_network_final_nodes"])
                and replication == 0
            ):
                save_example_network(paths, scenario["scenario_name"], scenario["final_nodes"], replication, result)
                example_networks.append(
                    {
                        "scenario_name": scenario["scenario_name"],
                        "positions": result["positions"],
                        "edges": result["edges"],
                    }
                )

        pd.DataFrame(run_rows).to_csv(paths["root"] / "runs_partial.csv", index=False)

    runs_df = pd.DataFrame(run_rows)
    scenarios_df = pd.DataFrame(scenario_defs)
    degree_df = pd.DataFrame(degree_rows)

    runs_df.to_csv(paths["root"] / "runs.csv", index=False)
    scenarios_df.to_csv(paths["root"] / "scenarios.csv", index=False)
    degree_df.to_csv(paths["root"] / "degree_sequences.csv.gz", index=False, compression="gzip")

    finalize_outputs(paths, scenarios_df, runs_df, degree_df, example_networks)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run generalized attachment experiments.")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("configs/benchmark.yaml"),
        help="Path to the YAML configuration file.",
    )
    parser.add_argument(
        "--suite",
        type=str,
        default=None,
        help="Comma-separated suite names to run. Defaults to config defaults.",
    )
    parser.add_argument(
        "--postprocess-only",
        action="store_true",
        help="Use existing CSV outputs to regenerate tables, figures, and text without rerunning simulations.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.postprocess_only:
        postprocess_existing_results(args.config)
    else:
        config = load_config(args.config)
        suite_names = (
            [name.strip() for name in args.suite.split(",")]
            if args.suite
            else list(config["default_suites"])
        )
        run_suite(args.config, suite_names)


if __name__ == "__main__":
    main()
