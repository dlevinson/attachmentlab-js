import numpy as np

from src.general_attachment import (
    CapacityConfig,
    GrowthParams,
    attachment_probabilities,
    run_growth,
    sample_capacity,
)


def test_probabilities_sum_to_one_over_feasible_nodes() -> None:
    degrees = np.array([3, 1, 2, 4], dtype=float)
    capacities = np.array([3, 4, 5, 4], dtype=float)
    costs = np.array([0.2, 0.5, 0.7, 0.9], dtype=float)
    feasible, probabilities = attachment_probabilities(
        degrees,
        capacities,
        costs,
        alpha=1.0,
        beta=1.0,
        phi=1.0,
        eps=1e-9,
    )
    assert feasible.tolist() == [1, 2]
    assert np.isclose(probabilities.sum(), 1.0)
    assert np.all(probabilities >= 0)


def test_no_node_exceeds_capacity() -> None:
    params = GrowthParams(
        final_nodes=40,
        alpha=1.0,
        beta=1.0,
        phi=0.5,
        kappa=2,
        m0=5,
        capacity=CapacityConfig(mode="constant", params={"value": 8}),
    )
    result = run_growth(params, seed=101)
    assert np.all(result["degrees"] <= result["capacities"] + 1e-9)


def test_uniform_capacity_draws_inclusive_integer_ceilings() -> None:
    rng = np.random.default_rng(611)
    draws = [
        sample_capacity(
            rng,
            config=CapacityConfig(mode="uniform", params={"low": 8, "high": 24}),
            final_nodes=1000,
            m0=5,
            kappa=2,
            minimum=2,
        )
        for _ in range(2_000)
    ]
    assert all(float(draw).is_integer() for draw in draws)
    assert min(draws) == 8
    assert max(draws) == 24


def test_lognormal_capacity_draws_integer_ceilings() -> None:
    rng = np.random.default_rng(814)
    draws = [
        sample_capacity(
            rng,
            config=CapacityConfig(
                mode="lognormal",
                params={"mean": 2.647588722239781, "sigma": 0.5},
            ),
            final_nodes=1000,
            m0=5,
            kappa=2,
            minimum=2,
        )
        for _ in range(2_000)
    ]
    assert all(float(draw).is_integer() for draw in draws)
    assert min(draws) >= 2


def test_no_duplicate_edges() -> None:
    params = GrowthParams(
        final_nodes=30,
        alpha=1.0,
        beta=1.0,
        phi=1.0,
        kappa=3,
        m0=5,
        capacity=CapacityConfig(mode="constant", params={"value": 16}),
    )
    result = run_growth(params, seed=202)
    edge_tuples = {tuple(sorted(edge)) for edge in result["edges"].tolist()}
    assert len(edge_tuples) == result["edges"].shape[0]


def test_ba_special_case_runs_to_completion() -> None:
    params = GrowthParams(
        final_nodes=50,
        alpha=1.0,
        beta=0.0,
        phi=0.0,
        kappa=2,
        m0=5,
        capacity=CapacityConfig(mode="constant", params={"value": "very_large"}),
    )
    result = run_growth(params, seed=303)
    expected_edges = (params.m0 * (params.m0 - 1)) // 2 + (params.final_nodes - params.m0) * params.kappa
    assert result["summary"]["early_terminated"] is False
    assert result["summary"]["termination_reason"] == "completed"
    assert result["summary"]["final_node_count"] == params.final_nodes
    assert result["summary"]["final_edge_count"] == expected_edges


def test_truncation_and_early_stop_logic() -> None:
    truncation_params = GrowthParams(
        final_nodes=15,
        alpha=1.0,
        beta=1.0,
        phi=0.0,
        kappa=3,
        m0=5,
        capacity=CapacityConfig(mode="constant", params={"value": 5}),
    )
    truncation_result = run_growth(truncation_params, seed=404)
    assert truncation_result["summary"]["truncation_events"] >= 1

    stop_params = GrowthParams(
        final_nodes=10,
        alpha=1.0,
        beta=1.0,
        phi=0.0,
        kappa=2,
        m0=3,
        capacity=CapacityConfig(mode="constant", params={"value": 2}),
    )
    stop_result = run_growth(stop_params, seed=505)
    assert stop_result["summary"]["early_terminated"] is True
    assert stop_result["summary"]["termination_reason"] == "no_feasible_nodes"
    assert stop_result["summary"]["final_node_count"] == stop_params.m0
