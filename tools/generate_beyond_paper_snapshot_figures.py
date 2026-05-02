from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE_ROOT = ROOT / ".cache"
MPL_CACHE = CACHE_ROOT / "matplotlib"
for path in (CACHE_ROOT, MPL_CACHE):
    path.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLBACKEND", "Agg")
os.environ.setdefault("MPLCONFIGDIR", str(MPL_CACHE))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_ROOT))

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import Normalize
import matplotlib.cm as cm


RESULT_ROOT = ROOT / "results" / "beyond_paper_focused_20260422_medium"
STATE_PATH = RESULT_ROOT / "representative_states.json"
FIGURE_ROOT = RESULT_ROOT / "figures"
BASELINE_STATE_PATH = ROOT / "results" / "research_program_20260407_medium" / "paper_replication" / "headline_representative_states.json"


def set_publication_style() -> None:
    plt.style.use("seaborn-v0_8-whitegrid")
    plt.rcParams.update(
        {
            "figure.dpi": 150,
            "savefig.dpi": 300,
            "font.size": 10,
            "axes.titlesize": 11,
            "axes.labelsize": 10,
            "legend.fontsize": 9,
            "xtick.labelsize": 9,
            "ytick.labelsize": 9,
            "axes.spines.top": False,
            "axes.spines.right": False,
        }
    )


def save_figure(fig: plt.Figure, stem: str) -> None:
    FIGURE_ROOT.mkdir(parents=True, exist_ok=True)
    fig.savefig(FIGURE_ROOT / f"{stem}.png", bbox_inches="tight")
    fig.savefig(FIGURE_ROOT / f"{stem}.pdf", bbox_inches="tight")
    plt.close(fig)


def load_states():
    payload = json.loads(STATE_PATH.read_text())
    return {state["scenarioId"]: state for state in payload["states"]}


def shared_access_norm() -> Normalize:
    values = []
    for path in (STATE_PATH, BASELINE_STATE_PATH):
        payload = json.loads(path.read_text())
        for state in payload["states"]:
            values.extend(node["accessGravity"] for node in state["nodes"])
    return Normalize(vmin=min(values), vmax=max(values))


def line_collection(edges, color="#bcc7d6", linewidth=0.4, alpha=0.65):
    segments = [
        [(edge["sourceX"], edge["sourceY"]), (edge["targetX"], edge["targetY"])]
        for edge in edges
    ]
    return LineCollection(segments, colors=color, linewidths=linewidth, alpha=alpha)


def draw_network(ax, state, title):
    ax.add_collection(line_collection(state["edges"]))
    base_nodes = [node for node in state["nodes"] if node["generatedBy"] != "split_crossing"]
    split_nodes = [node for node in state["nodes"] if node["generatedBy"] == "split_crossing"]
    if base_nodes:
        ax.scatter(
            [node["x"] for node in base_nodes],
            [node["y"] for node in base_nodes],
            s=[max(8, min(28, 8 + node["degree"])) for node in base_nodes],
            c="#2f5c8a",
            edgecolors="white",
            linewidths=0.25,
            alpha=0.95,
            zorder=3,
        )
    if split_nodes:
        ax.scatter(
            [node["x"] for node in split_nodes],
            [node["y"] for node in split_nodes],
            s=6,
            c="#f58518",
            edgecolors="none",
            alpha=0.75,
            zorder=4,
        )
    ax.set_title(title)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])


def draw_access(ax, state, title, metric, norm, cmap):
    ax.add_collection(line_collection(state["edges"], color="#d9e0ea", linewidth=0.35, alpha=0.55))
    values = [node[metric] for node in state["nodes"]]
    scatter = ax.scatter(
        [node["x"] for node in state["nodes"]],
        [node["y"] for node in state["nodes"]],
        s=[max(6, min(20, 6 + node["degree"] * 0.75)) for node in state["nodes"]],
        c=values,
        cmap=cmap,
        norm=norm,
        edgecolors="none",
        alpha=0.95,
        zorder=3,
        rasterized=len(state["nodes"]) > 3000,
    )
    ax.set_title(title)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    return scatter


def plot_planarity_gallery(states):
    set_publication_style()
    scenario_order = [
        ("planarity_free_none", "None"),
        ("planarity_free_reject", "Reject crossings"),
        ("planarity_free_split", "Split crossings"),
    ]
    fig, axes = plt.subplots(2, 3, figsize=(11.8, 7.8))
    norm = shared_access_norm()
    cmap = cm.get_cmap("viridis")
    last_scatter = None
    for col, (scenario_id, label) in enumerate(scenario_order):
        state = states[scenario_id]
        draw_network(axes[0, col], state, label)
        last_scatter = draw_access(axes[1, col], state, label, "accessGravity", norm, cmap)
    fig.suptitle("Planarity assumptions: graph structure and gravity accessibility", y=0.985)
    fig.text(0.015, 0.73, "Representative graph", rotation=90, va="center", fontsize=11)
    fig.text(0.015, 0.28, "Gravity accessibility", rotation=90, va="center", fontsize=11)
    fig.subplots_adjust(left=0.06, right=0.985, bottom=0.06, top=0.83, wspace=0.20, hspace=0.14)
    cbar = fig.colorbar(
        last_scatter,
        ax=axes.ravel().tolist(),
        orientation="horizontal",
        fraction=0.045,
        pad=0.06,
        aspect=35,
    )
    cbar.set_label("Gravity accessibility")
    cbar.ax.xaxis.set_label_position("top")
    cbar.ax.xaxis.set_ticks_position("top")
    save_figure(fig, "figure_extension_planarity_gallery")


def plot_access_gallery(states):
    set_publication_style()
    scenario_order = [
        ("interaction_reject_none", "Reject / no access"),
        ("interaction_split_target", "Split / target access"),
        ("interaction_split_both_seed", "Split / seed access"),
        ("interaction_split_both_opportunity", "Split / opportunity access"),
    ]
    fig, axes = plt.subplots(2, 4, figsize=(14.6, 7.9))
    norm = shared_access_norm()
    cmap = cm.get_cmap("viridis")
    last_scatter = None
    for col, (scenario_id, label) in enumerate(scenario_order):
        state = states[scenario_id]
        draw_network(axes[0, col], state, label)
        last_scatter = draw_access(axes[1, col], state, label, "accessGravity", norm, cmap)
    fig.suptitle("Accessibility semantics under split-planarity growth", y=0.985)
    fig.text(0.012, 0.73, "Representative graph", rotation=90, va="center", fontsize=11)
    fig.text(0.012, 0.28, "Gravity accessibility", rotation=90, va="center", fontsize=11)
    fig.subplots_adjust(left=0.055, right=0.988, bottom=0.06, top=0.83, wspace=0.16, hspace=0.14)
    cbar = fig.colorbar(
        last_scatter,
        ax=axes.ravel().tolist(),
        orientation="horizontal",
        fraction=0.045,
        pad=0.06,
        aspect=40,
    )
    cbar.set_label("Gravity accessibility")
    cbar.ax.xaxis.set_label_position("top")
    cbar.ax.xaxis.set_ticks_position("top")
    save_figure(fig, "figure_extension_access_gallery")


def main():
    states = load_states()
    plot_planarity_gallery(states)
    plot_access_gallery(states)


if __name__ == "__main__":
    main()
