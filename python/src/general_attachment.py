from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import networkx as nx
import numpy as np


VERY_LARGE = "very_large"


@dataclass(frozen=True)
class CapacityConfig:
    mode: str = "constant"
    params: dict[str, Any] | None = None

    def resolved_params(self) -> dict[str, Any]:
        return dict(self.params or {})


@dataclass(frozen=True)
class GrowthParams:
    final_nodes: int
    alpha: float
    beta: float
    phi: float
    kappa: int
    m0: int = 5
    eps: float = 1e-9
    impedance: str = "power"
    impedance_lambda: float = 1.0
    capacity: CapacityConfig = field(default_factory=CapacityConfig)


def _minimum_capacity_for_birth(m0: int, kappa: int, is_seed: bool) -> int:
    return (m0 - 1) if is_seed else kappa


def resolve_capacity_value(value: Any, final_nodes: int, m0: int, kappa: int) -> float:
    if isinstance(value, str):
        if value != VERY_LARGE:
            raise ValueError(f"Unsupported capacity sentinel: {value}")
        return float(final_nodes + m0 + kappa + 10)
    return float(value)


def validate_params(params: GrowthParams) -> None:
    if params.m0 < params.kappa + 1:
        raise ValueError("Seed size m0 must be at least kappa + 1.")
    if params.final_nodes < params.m0:
        raise ValueError("final_nodes must be at least m0.")
    if params.alpha < 0 or params.beta < 0 or params.phi < 0:
        raise ValueError("alpha, beta, and phi must all be non-negative.")
    if params.kappa < 1:
        raise ValueError("kappa must be at least 1.")
    if params.impedance not in {"power", "exponential"}:
        raise ValueError("impedance must be 'power' or 'exponential'.")

    if params.capacity.mode == "constant":
        raw_value = params.capacity.resolved_params().get("value", VERY_LARGE)
        value = resolve_capacity_value(raw_value, params.final_nodes, params.m0, params.kappa)
        if value < max(params.m0 - 1, params.kappa):
            raise ValueError(
                "Constant capacity must be at least max(m0 - 1, kappa) to respect initial degrees."
            )


def sample_capacity(
    rng: np.random.Generator,
    *,
    config: CapacityConfig,
    final_nodes: int,
    m0: int,
    kappa: int,
    minimum: int,
) -> float:
    params = config.resolved_params()
    mode = config.mode
    if mode == "constant":
        value = resolve_capacity_value(params.get("value", VERY_LARGE), final_nodes, m0, kappa)
    elif mode == "uniform":
        low = float(params["low"])
        high = float(params["high"])
        value = float(rng.uniform(low, high))
    elif mode == "lognormal":
        mean = float(params["mean"])
        sigma = float(params["sigma"])
        value = float(rng.lognormal(mean=mean, sigma=sigma))
    else:
        raise ValueError(f"Unsupported capacity mode: {mode}")
    return float(max(value, minimum))


def pairwise_distance(point: np.ndarray, points: np.ndarray) -> np.ndarray:
    deltas = points - point
    return np.sqrt(np.sum(deltas * deltas, axis=1))


def attachment_weights(
    degrees: np.ndarray,
    capacities: np.ndarray,
    costs: np.ndarray,
    *,
    alpha: float,
    beta: float,
    phi: float,
    eps: float,
    impedance: str = "power",
    impedance_lambda: float = 1.0,
) -> np.ndarray:
    remaining_capacity = np.maximum(capacities - degrees, 0.0)
    scale_term = np.power(degrees + eps, alpha)
    saturation_term = np.power(remaining_capacity, beta)
    if impedance == "power":
        cost_term = np.power(costs + eps, -phi)
    elif impedance == "exponential":
        cost_term = np.exp(-impedance_lambda * costs)
    else:
        raise ValueError(f"Unsupported impedance: {impedance}")
    weights = scale_term * saturation_term * cost_term
    return np.asarray(weights, dtype=float)


def attachment_probabilities(
    degrees: np.ndarray,
    capacities: np.ndarray,
    costs: np.ndarray,
    *,
    alpha: float,
    beta: float,
    phi: float,
    eps: float,
    impedance: str = "power",
    impedance_lambda: float = 1.0,
) -> tuple[np.ndarray, np.ndarray]:
    feasible = np.flatnonzero(capacities > degrees)
    if feasible.size == 0:
        return feasible, np.array([], dtype=float)

    weights = attachment_weights(
        degrees[feasible],
        capacities[feasible],
        costs[feasible],
        alpha=alpha,
        beta=beta,
        phi=phi,
        eps=eps,
        impedance=impedance,
        impedance_lambda=impedance_lambda,
    )
    total = float(weights.sum())
    if not np.isfinite(total) or total <= 0:
        weights = np.ones_like(weights, dtype=float)
        total = float(weights.sum())
    return feasible, weights / total


def _complete_graph_seed(
    positions: np.ndarray,
    m0: int,
) -> tuple[list[tuple[int, int]], list[float], np.ndarray]:
    edges: list[tuple[int, int]] = []
    edge_lengths: list[float] = []
    degrees = np.zeros(m0, dtype=int)
    for i in range(m0):
        for j in range(i + 1, m0):
            edges.append((i, j))
            distance = float(np.linalg.norm(positions[i] - positions[j]))
            edge_lengths.append(distance)
            degrees[i] += 1
            degrees[j] += 1
    return edges, edge_lengths, degrees


def run_growth(params: GrowthParams, seed: int) -> dict[str, Any]:
    validate_params(params)
    rng = np.random.default_rng(seed)

    positions = np.zeros((params.final_nodes, 2), dtype=float)
    capacities = np.zeros(params.final_nodes, dtype=float)
    degrees = np.zeros(params.final_nodes, dtype=int)

    positions[: params.m0] = rng.random((params.m0, 2))
    for node in range(params.m0):
        capacities[node] = sample_capacity(
            rng,
            config=params.capacity,
            final_nodes=params.final_nodes,
            m0=params.m0,
            kappa=params.kappa,
            minimum=_minimum_capacity_for_birth(params.m0, params.kappa, is_seed=True),
        )

    edges, edge_lengths, seed_degrees = _complete_graph_seed(positions, params.m0)
    degrees[: params.m0] = seed_degrees

    truncation_events = 0
    total_missing_links = 0
    termination_reason = "completed"
    active_nodes = params.m0

    for new_node in range(params.m0, params.final_nodes):
        feasible_initial = np.flatnonzero(capacities[:active_nodes] > degrees[:active_nodes])
        if feasible_initial.size == 0:
            termination_reason = "no_feasible_nodes"
            break

        node_position = rng.random(2)
        node_capacity = sample_capacity(
            rng,
            config=params.capacity,
            final_nodes=params.final_nodes,
            m0=params.m0,
            kappa=params.kappa,
            minimum=_minimum_capacity_for_birth(params.m0, params.kappa, is_seed=False),
        )

        chosen_targets: list[int] = []
        distances = pairwise_distance(node_position, positions[:active_nodes])

        links_to_add = min(params.kappa, feasible_initial.size)
        if feasible_initial.size < params.kappa:
            truncation_events += 1
            total_missing_links += params.kappa - feasible_initial.size

        for _ in range(links_to_add):
            available_mask = capacities[:active_nodes] > degrees[:active_nodes]
            if chosen_targets:
                available_mask[np.array(chosen_targets, dtype=int)] = False
            feasible = np.flatnonzero(available_mask)
            if feasible.size == 0:
                break

            weights = attachment_weights(
                degrees[feasible],
                capacities[feasible],
                distances[feasible],
                alpha=params.alpha,
                beta=params.beta,
                phi=params.phi,
                eps=params.eps,
                impedance=params.impedance,
                impedance_lambda=params.impedance_lambda,
            )
            total_weight = float(weights.sum())
            if not np.isfinite(total_weight) or total_weight <= 0:
                probabilities = np.full(feasible.shape[0], 1.0 / feasible.shape[0])
            else:
                probabilities = weights / total_weight

            target = int(rng.choice(feasible, p=probabilities))
            chosen_targets.append(target)
            edges.append((new_node, target))
            edge_lengths.append(float(distances[target]))
            degrees[target] += 1

        if feasible_initial.size >= params.kappa and len(chosen_targets) < params.kappa:
            truncation_events += 1
            total_missing_links += params.kappa - len(chosen_targets)

        positions[new_node] = node_position
        capacities[new_node] = node_capacity
        degrees[new_node] = len(chosen_targets)
        active_nodes = new_node + 1

    graph = nx.Graph()
    graph.add_nodes_from(range(active_nodes))
    graph.add_edges_from(edges)

    return {
        "graph": graph,
        "positions": positions[:active_nodes].copy(),
        "capacities": capacities[:active_nodes].copy(),
        "degrees": degrees[:active_nodes].copy(),
        "edges": np.asarray(edges, dtype=int) if edges else np.zeros((0, 2), dtype=int),
        "edge_lengths": np.asarray(edge_lengths, dtype=float),
        "summary": {
            "final_node_count": int(active_nodes),
            "final_edge_count": int(len(edges)),
            "early_terminated": bool(active_nodes < params.final_nodes),
            "termination_reason": termination_reason,
            "truncation_events": int(truncation_events),
            "total_missing_links": int(total_missing_links),
        },
    }
