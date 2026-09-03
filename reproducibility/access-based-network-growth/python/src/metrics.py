from __future__ import annotations

import math
from typing import Any

import networkx as nx
import numpy as np


def degree_gini(degrees: np.ndarray) -> float:
    values = np.asarray(degrees, dtype=float)
    if values.size == 0 or np.allclose(values.sum(), 0.0):
        return 0.0
    sorted_values = np.sort(values)
    n = sorted_values.size
    cumulative = np.arange(1, n + 1, dtype=float)
    return float((2 * np.sum(cumulative * sorted_values)) / (n * np.sum(sorted_values)) - (n + 1) / n)


def degree_centralization(degrees: np.ndarray) -> float:
    values = np.asarray(degrees, dtype=float)
    n = values.size
    if n <= 2:
        return 0.0
    max_degree = float(values.max(initial=0.0))
    numerator = np.sum(max_degree - values)
    denominator = (n - 1) * (n - 2)
    return float(numerator / denominator) if denominator else 0.0


def _safe_average_shortest_path_length(graph: nx.Graph) -> float:
    if graph.number_of_nodes() <= 1:
        return 0.0
    try:
        return float(nx.average_shortest_path_length(graph))
    except (nx.NetworkXError, ZeroDivisionError):
        return math.nan


def _safe_diameter(graph: nx.Graph, *, max_nodes: int) -> float:
    if graph.number_of_nodes() <= 1:
        return 0.0
    if graph.number_of_nodes() > max_nodes:
        return math.nan
    try:
        return float(nx.diameter(graph))
    except (nx.NetworkXError, ZeroDivisionError):
        return math.nan


def _safe_assortativity(graph: nx.Graph) -> float:
    if graph.number_of_edges() == 0:
        return math.nan
    try:
        value = nx.degree_assortativity_coefficient(graph)
    except (nx.NetworkXError, ZeroDivisionError, FloatingPointError):
        return math.nan
    if np.isnan(value):
        return math.nan
    return float(value)


def _edge_length_distribution_summary(edge_lengths: np.ndarray) -> dict[str, float]:
    if edge_lengths.size == 0:
        return {
            "edge_length_p10": 0.0,
            "edge_length_p25": 0.0,
            "edge_length_p50": 0.0,
            "edge_length_p75": 0.0,
            "edge_length_p90": 0.0,
        }
    return {
        "edge_length_p10": float(np.quantile(edge_lengths, 0.10)),
        "edge_length_p25": float(np.quantile(edge_lengths, 0.25)),
        "edge_length_p50": float(np.quantile(edge_lengths, 0.50)),
        "edge_length_p75": float(np.quantile(edge_lengths, 0.75)),
        "edge_length_p90": float(np.quantile(edge_lengths, 0.90)),
    }


def compute_run_metrics(
    graph: nx.Graph,
    *,
    capacities: np.ndarray,
    edge_lengths: np.ndarray,
    degree_threshold: int = 10,
    diameter_max_nodes: int = 2000,
) -> dict[str, Any]:
    node_count = graph.number_of_nodes()
    edge_count = graph.number_of_edges()
    degrees = np.array([graph.degree(node) for node in graph.nodes()], dtype=float)

    if node_count == 0:
        return {
            "mean_degree": 0.0,
            "max_degree": 0.0,
            "degree_gini": 0.0,
            "share_at_capacity": 0.0,
            "connected_components": 0,
            "largest_component_size": 0,
            "largest_component_share": 0.0,
            "average_clustering": 0.0,
            "average_shortest_path_lcc": math.nan,
            "diameter_lcc": math.nan,
            "degree_assortativity": math.nan,
            "mean_edge_length": 0.0,
            "median_edge_length": 0.0,
            "total_network_length": 0.0,
            "degree_centralization": 0.0,
            "fraction_degree_1": 0.0,
            "fraction_degree_ge_threshold": 0.0,
            "cyclomatic_number": 0.0,
            **_edge_length_distribution_summary(edge_lengths),
        }

    components = list(nx.connected_components(graph))
    largest_component_nodes = max(components, key=len)
    largest_component = graph.subgraph(largest_component_nodes).copy()
    at_capacity = degrees >= np.asarray(capacities, dtype=float) - 1e-9

    metrics = {
        "mean_degree": float((2 * edge_count) / node_count),
        "max_degree": float(degrees.max(initial=0.0)),
        "degree_gini": degree_gini(degrees),
        "share_at_capacity": float(np.mean(at_capacity)),
        "connected_components": int(len(components)),
        "largest_component_size": int(largest_component.number_of_nodes()),
        "largest_component_share": float(largest_component.number_of_nodes() / node_count),
        "average_clustering": float(nx.average_clustering(graph)) if edge_count else 0.0,
        "average_shortest_path_lcc": _safe_average_shortest_path_length(largest_component),
        "diameter_lcc": _safe_diameter(largest_component, max_nodes=diameter_max_nodes),
        "degree_assortativity": _safe_assortativity(graph),
        "mean_edge_length": float(np.mean(edge_lengths)) if edge_lengths.size else 0.0,
        "median_edge_length": float(np.median(edge_lengths)) if edge_lengths.size else 0.0,
        "total_network_length": float(np.sum(edge_lengths)) if edge_lengths.size else 0.0,
        "degree_centralization": degree_centralization(degrees),
        "fraction_degree_1": float(np.mean(degrees == 1)),
        "fraction_degree_ge_threshold": float(np.mean(degrees >= degree_threshold)),
        "cyclomatic_number": float(edge_count - node_count + len(components)),
    }
    metrics.update(_edge_length_distribution_summary(edge_lengths))
    return metrics
