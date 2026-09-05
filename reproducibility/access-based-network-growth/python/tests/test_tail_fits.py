import math

import numpy as np

from src.tail_fits import (
    _discrete_lognormal_pmf,
    _fit_exponential,
    fit_tail_models,
)


def test_exponential_fit_uses_geometric_likelihood_on_integer_support() -> None:
    sample = np.array([2, 2, 3, 4, 4, 4, 7], dtype=float)
    kmin = 2
    mean_excess = float(np.mean(sample - kmin))
    continuation_probability = mean_excess / (1.0 + mean_excess)
    expected_lambda = -math.log(continuation_probability)
    expected_loglik = float(
        sample.size * math.log1p(-continuation_probability)
        + np.sum(sample - kmin) * math.log(continuation_probability)
    )

    fit = _fit_exponential(sample, kmin)

    assert math.isclose(fit["lambda"], expected_lambda, rel_tol=1e-12)
    assert math.isclose(fit["loglik"], expected_loglik, rel_tol=1e-12)


def test_discretized_lognormal_is_normalized_on_the_selected_tail() -> None:
    support = np.arange(3, 100_000, dtype=float)
    probabilities = _discrete_lognormal_pmf(support, mu=1.7, sigma=0.65, kmin=3)
    assert np.all(probabilities > 0)
    assert math.isclose(float(probabilities.sum()), 1.0, rel_tol=0, abs_tol=1e-9)


def test_synthetic_geometric_tail_prefers_discrete_exponential() -> None:
    rng = np.random.default_rng(1643)
    degrees = 2 + rng.geometric(p=0.2, size=30_000) - 1
    fit = fit_tail_models(degrees, min_tail_size=1_000)
    assert fit["preferred_model"] == "exponential"


def test_synthetic_zipf_tail_prefers_power_law() -> None:
    rng = np.random.default_rng(913)
    degrees = rng.zipf(a=2.5, size=12_000)
    fit = fit_tail_models(degrees, min_tail_size=200)
    assert fit["preferred_model"] == "power_law"


def test_endpoint_reports_counts_without_boundary_fits() -> None:
    fit = fit_tail_models(np.repeat(16, 40))
    assert fit["tail_n"] == 40 and fit["kmin"] == 16
    assert fit["preferred_model"] == "endpoint"
    for key in ("power_alpha", "power_aic", "exp_aic", "lognorm_aic"):
        assert math.isnan(fit[key])


def test_two_value_support_reports_counts_without_model_ranking() -> None:
    fit = fit_tail_models(np.array([15] * 18 + [16] * 4))
    assert fit["tail_n"] == 22 and fit["kmin"] == 15
    assert fit["preferred_model"] == "two_values"
    for key in ("power_alpha", "power_aic", "exp_aic", "lognorm_aic"):
        assert math.isnan(fit[key])
