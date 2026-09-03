from __future__ import annotations

import os
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("MPLCONFIGDIR", str(ROOT / ".cache" / "matplotlib"))

import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Circle, FancyArrowPatch

OUTDIR = ROOT / "results" / "transport_extensions" / "corrected_access_comparison" / "figures"
OUTDIR.mkdir(parents=True, exist_ok=True)


BLUE = "#4C78A8"
DARK = "#23364D"
ORANGE = "#F58518"
RED = "#E45756"
GREEN = "#54A24B"
GREY = "#B9C2CF"
PURPLE = "#7A4EAB"


def node(ax, x, y, r=0.045, fc=BLUE, ec="white", lw=1.5, z=3):
    ax.add_patch(Circle((x, y), r, facecolor=fc, edgecolor=ec, linewidth=lw, zorder=z))


def edge(ax, x1, y1, x2, y2, color=DARK, lw=2.2, ls="-", alpha=1.0, z=1):
    ax.add_line(Line2D([x1, x2], [y1, y2], color=color, linewidth=lw, linestyle=ls, alpha=alpha, zorder=z))


def arrow_label(ax, x1, y1, x2, y2, text, color=DARK):
    ax.add_patch(
        FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=12, lw=1.3, color=color, zorder=4)
    )
    ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.04, text, ha="center", va="bottom", fontsize=9, color=color)


def planarity_panel(ax, kind: str):
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect("equal")
    ax.axis("off")

    pts = {
        "tl": (0.2, 0.8),
        "tr": (0.8, 0.8),
        "bl": (0.2, 0.2),
        "br": (0.8, 0.2),
    }

    # Frame links
    edge(ax, *pts["tl"], *pts["tr"], color=GREY, lw=1.7)
    edge(ax, *pts["bl"], *pts["br"], color=GREY, lw=1.7)

    if kind == "none":
        edge(ax, *pts["tl"], *pts["br"], color=BLUE, lw=2.8)
        edge(ax, *pts["bl"], *pts["tr"], color=RED, lw=2.8)
    elif kind == "reject":
        edge(ax, *pts["tl"], *pts["br"], color=BLUE, lw=2.8)
        edge(ax, 0.28, 0.28, 0.72, 0.72, color=RED, lw=2.6, ls="--", alpha=0.9)
    elif kind == "split":
        center = (0.5, 0.5)
        edge(ax, *pts["tl"], *center, color=BLUE, lw=2.8)
        edge(ax, *center, *pts["br"], color=BLUE, lw=2.8)
        edge(ax, *pts["bl"], *center, color=ORANGE, lw=2.8)
        edge(ax, *center, *pts["tr"], color=ORANGE, lw=2.8)
        node(ax, *center, r=0.055, fc=ORANGE, ec="white", lw=1.6, z=5)

    for x, y in pts.values():
        node(ax, x, y, fc=BLUE)


def access_panel(ax, kind: str):
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect("equal")
    ax.axis("off")

    xs = [0.2, 0.5, 0.8]
    ys = [0.2, 0.5, 0.8]
    grid = [(x, y) for y in ys for x in xs]

    for y in ys:
        edge(ax, xs[0], y, xs[-1], y, color=GREY, lw=1.1, alpha=0.9)
    for x in xs:
        edge(ax, x, ys[0], x, ys[-1], color=GREY, lw=1.1, alpha=0.9)

    center = (0.5, 0.5)
    for x, y in grid:
        fc = BLUE
        radius = 0.04
        if kind == "network" and (x, y) == center:
            fc = GREEN
            radius = 0.07
        elif kind == "seed" and (x, y) in [(0.2, 0.8), (0.8, 0.8)]:
            fc = RED
            radius = 0.06
        elif kind == "opportunity" and (x, y) in [(0.8, 0.5), (0.8, 0.8)]:
            fc = PURPLE
            radius = 0.06
        elif kind == "none":
            fc = BLUE
        node(ax, x, y, r=radius, fc=fc, ec="white", lw=1.3)

    if kind == "none":
        ax.text(0.5, 0.92, "no access weighting", ha="center", va="center", fontsize=9, color=DARK)
    elif kind == "network":
        arrow_label(ax, 0.18, 0.52, 0.42, 0.52, "prefer high current access", color=GREEN)
    elif kind == "seed":
        ax.text(0.5, 0.92, "reinforce original seeds", ha="center", va="center", fontsize=9, color=RED)
    elif kind == "opportunity":
        ax.text(0.5, 0.92, "reinforce exogenous opportunity", ha="center", va="center", fontsize=9, color=PURPLE)


def main():
    fig = plt.figure(figsize=(14, 7.5), facecolor="white")
    gs = fig.add_gridspec(2, 1, height_ratios=[1, 1.08], hspace=0.30)

    gs_top = gs[0].subgridspec(1, 3, wspace=0.24)
    ax1 = fig.add_subplot(gs_top[0, 0])
    ax2 = fig.add_subplot(gs_top[0, 1])
    ax3 = fig.add_subplot(gs_top[0, 2])

    planarity_panel(ax1, "none")
    planarity_panel(ax2, "reject")
    planarity_panel(ax3, "split")

    ax1.set_title("retain crossings", fontsize=12, fontweight="bold", pad=10)
    ax2.set_title("reject crossings", fontsize=12, pad=10)
    ax3.set_title("split crossings", fontsize=12, pad=10)

    gs_bottom = gs[1].subgridspec(1, 4, wspace=0.24)
    bx1 = fig.add_subplot(gs_bottom[0, 0])
    bx2 = fig.add_subplot(gs_bottom[0, 1])
    bx3 = fig.add_subplot(gs_bottom[0, 2])
    bx4 = fig.add_subplot(gs_bottom[0, 3])

    access_panel(bx1, "none")
    access_panel(bx2, "network")
    access_panel(bx3, "seed")
    access_panel(bx4, "opportunity")

    bx1.set_title("reject / no access", fontsize=12, fontweight="bold", pad=10)
    bx2.set_title("split / target access", fontsize=12, pad=10)
    bx3.set_title("split / seed", fontsize=12, pad=10)
    bx4.set_title("split / opportunity", fontsize=12, pad=10)

    fig.text(0.02, 0.90, "A", fontsize=16, fontweight="bold", color="black", ha="left", va="top")
    fig.text(0.02, 0.44, "B", fontsize=16, fontweight="bold", color="black", ha="left", va="top")

    pdf_path = OUTDIR / "figure_extension_design_schematic.pdf"
    png_path = OUTDIR / "figure_extension_design_schematic.png"
    fig.savefig(pdf_path, bbox_inches="tight")
    fig.savefig(png_path, dpi=220, bbox_inches="tight")
    print(f"wrote {pdf_path}")
    print(f"wrote {png_path}")


if __name__ == "__main__":
    main()
