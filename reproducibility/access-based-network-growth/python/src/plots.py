from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from src.tail_fits import empirical_ccdf


SCENARIO_LABELS = {
    "ba_benchmark": "BA limiting case",
    "capacity_only": "Capacity only",
    "spatial_only": "Spatial only",
    "general_model": "Access-based model",
}

K_SORT_ORDER = {
    "8": 8,
    "16": 16,
    "32": 32,
    "64": 64,
    "very_large": 10**9,
}


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


def _save_figure(fig: plt.Figure, output_dir: Path, stem: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(output_dir / f"{stem}.png", bbox_inches="tight")
    fig.savefig(output_dir / f"{stem}.pdf", bbox_inches="tight")
    plt.close(fig)


def _sort_one_factor_frame(frame: pd.DataFrame, parameter: str) -> pd.DataFrame:
    sorted_frame = frame.copy()
    if parameter == "K":
        sorted_frame["_sort_key"] = sorted_frame["varied_value"].map(lambda value: K_SORT_ORDER.get(str(value), 10**12))
    else:
        sorted_frame["_sort_key"] = pd.to_numeric(sorted_frame["varied_value"], errors="coerce")
    sorted_frame = sorted_frame.sort_values("_sort_key")
    return sorted_frame.drop(columns="_sort_key")


def plot_example_networks(example_networks: list[dict[str, object]], output_dir: Path) -> None:
    set_publication_style()
    fig, axes = plt.subplots(2, 2, figsize=(11, 9))
    for axis, network in zip(axes.flatten(), example_networks):
        positions = network["positions"]
        edges = network["edges"]
        scenario_name = str(network["scenario_name"])
        axis.scatter(positions[:, 0], positions[:, 1], s=12, color="#1f77b4", alpha=0.9)
        for edge in edges:
            p1 = positions[edge[0]]
            p2 = positions[edge[1]]
            axis.plot([p1[0], p2[0]], [p1[1], p2[1]], color="#4f4f4f", linewidth=0.4, alpha=0.35)
        axis.set_title(SCENARIO_LABELS.get(scenario_name, scenario_name))
        axis.set_xlabel("x")
        axis.set_ylabel("y")
        axis.set_aspect("equal")
    for axis in axes.flatten()[len(example_networks) :]:
        axis.set_visible(False)
    _save_figure(fig, output_dir, "figure_01_example_networks")


def plot_headline_ccdf(degree_df: pd.DataFrame, output_dir: Path) -> None:
    set_publication_style()
    fig, ax = plt.subplots(figsize=(7.5, 5.5))
    max_n = degree_df.groupby("scenario_name")["final_nodes"].max().to_dict()
    scenario_order = ("ba_benchmark", "spatial_only", "capacity_only", "general_model")
    for scenario_name in scenario_order:
        group = degree_df[degree_df["scenario_name"] == scenario_name]
        if group.empty:
            continue
        subset = group[group["final_nodes"] == max_n[scenario_name]]
        support, ccdf = empirical_ccdf(subset["degree"].to_numpy())
        if support.size == 0:
            continue
        ax.plot(
            support,
            ccdf,
            marker="o",
            markersize=3,
            linewidth=1.4,
            label=SCENARIO_LABELS.get(str(scenario_name), str(scenario_name)),
        )
    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_xlabel("Degree k")
    ax.set_ylabel(r"Fraction of nodes with degree $\geq k$")
    ax.set_title("Degree CCDFs across four scenarios")
    ax.legend(frameon=True)
    _save_figure(fig, output_dir, "figure_02_degree_ccdf")


def plot_mean_edge_length_vs_phi(summary_df: pd.DataFrame, output_dir: Path) -> None:
    subset = summary_df[summary_df["varied_parameter"] == "phi"].copy()
    if subset.empty:
        return
    set_publication_style()
    fig, ax = plt.subplots(figsize=(7.0, 4.8))
    subset = _sort_one_factor_frame(subset, "phi")
    ax.plot(subset["varied_value"], subset["mean_edge_length_mean"], marker="o", color="#d62728")
    ax.set_xlabel(r"$\phi$")
    ax.set_ylabel("Mean edge length")
    ax.set_title("Mean edge length declines as distance deterrence rises")
    _save_figure(fig, output_dir, "figure_03_mean_edge_length_vs_phi")


def plot_capacity_heatmap(summary_df: pd.DataFrame, output_dir: Path, metric: str, stem: str, title: str) -> None:
    subset = summary_df[summary_df["suite"] == "beta_k_heatmap"].copy()
    if subset.empty:
        return
    set_publication_style()
    ordered_columns = sorted(subset["K_label"].astype(str).unique(), key=lambda value: K_SORT_ORDER.get(value, 10**12))
    pivot = subset.pivot_table(index="beta", columns="K_label", values=metric).sort_index().reindex(columns=ordered_columns)
    fig, ax = plt.subplots(figsize=(6.8, 5.0))
    image = ax.imshow(pivot.to_numpy(), cmap="viridis", aspect="auto")
    # The archived very_large setting resolves to 1017 at N=1000, m0=5, kappa=2.
    ax.set_xticks(np.arange(pivot.shape[1]), labels=["1017" if str(label) == "very_large" else str(label) for label in pivot.columns])
    ax.set_yticks(np.arange(pivot.shape[0]), labels=[str(label) for label in pivot.index])
    ax.set_xlabel("Capacity K")
    ax.set_ylabel(r"$\beta$")
    ax.set_title(title)
    cbar = fig.colorbar(image, ax=ax)
    cbar.ax.set_ylabel(metric.replace("_", " "))
    _save_figure(fig, output_dir, stem)


def plot_clustering_vs_kappa(summary_df: pd.DataFrame, output_dir: Path) -> None:
    subset = summary_df[summary_df["varied_parameter"] == "kappa"].copy()
    if subset.empty:
        return
    set_publication_style()
    fig, ax = plt.subplots(figsize=(7.0, 4.8))
    subset = _sort_one_factor_frame(subset, "kappa")
    ax.plot(subset["varied_value"], subset["average_clustering_mean"], marker="o", color="#2ca02c")
    ax.set_xlabel(r"$\kappa$")
    ax.set_ylabel("Average clustering")
    ax.set_title("Clustering rises with multiple initial attachments")
    _save_figure(fig, output_dir, "figure_05_clustering_vs_kappa")


def plot_connectedness_vs_phi(summary_df: pd.DataFrame, output_dir: Path) -> None:
    subset = summary_df[summary_df["varied_parameter"] == "phi"].copy()
    if subset.empty:
        return
    set_publication_style()
    subset = _sort_one_factor_frame(subset, "phi")
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8))
    axes[0].plot(subset["varied_value"], subset["largest_component_share_mean"], marker="o", color="#1f77b4")
    axes[0].set_xlabel(r"$\phi$")
    axes[0].set_ylabel("Largest component share")
    axes[0].set_title("Connectedness")
    axes[1].plot(
        subset["varied_value"],
        subset["average_shortest_path_lcc_mean"],
        marker="o",
        color="#9467bd",
    )
    axes[1].set_xlabel(r"$\phi$")
    axes[1].set_ylabel("Average shortest path (LCC)")
    axes[1].set_title("Path length on largest component")
    _save_figure(fig, output_dir, "figure_07_connectedness_vs_phi")


def plot_sensitivity_panels(summary_df: pd.DataFrame, output_dir: Path) -> None:
    subset = summary_df[summary_df["suite"] == "sensitivity"].copy()
    if subset.empty:
        return
    set_publication_style()
    fig, axes = plt.subplots(2, 3, figsize=(13, 8))
    panels = [
        ("alpha", "max_degree_mean", "Max degree"),
        ("beta", "share_at_capacity_mean", "Share at capacity"),
        ("phi", "mean_edge_length_mean", "Mean edge length"),
        ("kappa", "average_clustering_mean", "Average clustering"),
        ("K", "degree_gini_mean", "Degree Gini"),
    ]
    for axis, (parameter, metric, ylabel) in zip(axes.flatten(), panels):
        frame = _sort_one_factor_frame(subset[subset["varied_parameter"] == parameter], parameter)
        if frame.empty:
            axis.set_visible(False)
            continue
        if parameter == "K":
            x_positions = np.arange(frame.shape[0])
            axis.plot(x_positions, frame[metric], marker="o")
            axis.set_xticks(x_positions, labels=frame["varied_value"].astype(str).replace("very_large", "1017"))
        else:
            axis.plot(pd.to_numeric(frame["varied_value"], errors="coerce"), frame[metric], marker="o")
        axis.set_xlabel(parameter)
        axis.set_ylabel(ylabel)
        axis.set_title(f"Sensitivity to {parameter}")
    axes.flatten()[-1].set_visible(False)
    _save_figure(fig, output_dir, "figure_08_sensitivity_panels")


def generate_all_figures(
    *,
    summary_df: pd.DataFrame,
    degree_df: pd.DataFrame,
    example_networks: list[dict[str, object]],
    output_dir: Path,
) -> None:
    if example_networks:
        plot_example_networks(example_networks, output_dir)
    if not degree_df.empty:
        plot_headline_ccdf(degree_df[degree_df["suite"] == "headline"], output_dir)
    plot_mean_edge_length_vs_phi(summary_df, output_dir)
    plot_capacity_heatmap(
        summary_df,
        output_dir,
        metric="share_at_capacity_mean",
        stem="figure_04_share_at_capacity_heatmap",
        title="Share of saturated nodes by capacity and saturation strength",
    )
    plot_clustering_vs_kappa(summary_df, output_dir)
    plot_capacity_heatmap(
        summary_df,
        output_dir,
        metric="max_degree_mean",
        stem="figure_06a_max_degree_heatmap",
        title="Max degree by capacity and saturation strength",
    )
    plot_capacity_heatmap(
        summary_df,
        output_dir,
        metric="degree_gini_mean",
        stem="figure_06b_degree_gini_heatmap",
        title="Degree inequality by capacity and saturation strength",
    )
    plot_connectedness_vs_phi(summary_df, output_dir)
    plot_sensitivity_panels(summary_df, output_dir)
    plot_capacity_heatmap(
        summary_df,
        output_dir,
        metric="largest_component_share_mean",
        stem="figure_09_connectedness_heatmap",
        title="Connectedness heatmap over beta-K parameter space",
    )
