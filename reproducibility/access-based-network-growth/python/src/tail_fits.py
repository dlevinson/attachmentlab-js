from __future__ import annotations

import math
from typing import Any

import numpy as np
import pandas as pd
from scipy import optimize, special, stats


def empirical_ccdf(degrees: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    values = np.asarray(degrees, dtype=int)
    values = values[values > 0]
    if values.size == 0:
        return np.array([], dtype=int), np.array([], dtype=float)
    support = np.unique(np.sort(values))
    ccdf = np.array([(values >= value).mean() for value in support], dtype=float)
    return support, ccdf


def _power_law_alpha_mle(sample: np.ndarray, kmin: int) -> float:
    objective = lambda alpha: -_power_law_loglikelihood(sample, float(alpha), kmin)
    fit = optimize.minimize_scalar(
        objective,
        bounds=(1.0 + 1e-8, 100.0),
        method="bounded",
        options={"xatol": 1e-10},
    )
    return float(fit.x) if fit.success else math.nan


def _power_law_loglikelihood(sample: np.ndarray, alpha: float, kmin: int) -> float:
    zeta = float(special.zeta(alpha, kmin))
    if not np.isfinite(zeta) or zeta <= 0:
        return math.nan
    return float(-alpha * np.sum(np.log(sample)) - sample.size * np.log(zeta))


def _power_law_ks(sample: np.ndarray, alpha: float, kmin: int) -> float:
    values, counts = np.unique(np.sort(sample), return_counts=True)
    empirical_cdf = np.cumsum(counts) / sample.size
    model_cdf = 1.0 - (special.zeta(alpha, values + 1) / special.zeta(alpha, kmin))
    return float(np.max(np.abs(empirical_cdf - model_cdf)))


def _fit_exponential(sample: np.ndarray, kmin: int) -> dict[str, float]:
    excess = np.asarray(sample, dtype=float) - kmin
    mean_excess = float(np.mean(excess))
    if mean_excess < 0:
        return {"lambda": math.nan, "loglik": math.nan, "aic": math.nan}
    if mean_excess == 0:
        return {"lambda": math.inf, "loglik": 0.0, "aic": 2.0}

    continuation_probability = mean_excess / (1.0 + mean_excess)
    loglik = float(
        sample.size * np.log1p(-continuation_probability)
        + np.sum(excess) * np.log(continuation_probability)
    )
    return {
        "lambda": float(-np.log(continuation_probability)),
        "loglik": loglik,
        "aic": float(2 - 2 * loglik),
    }


def _discrete_lognormal_pmf(
    support: np.ndarray,
    *,
    mu: float,
    sigma: float,
    kmin: int,
) -> np.ndarray:
    values = np.asarray(support, dtype=float)
    if sigma <= 0:
        return np.full(values.shape, math.nan, dtype=float)
    distribution = stats.lognorm(s=sigma, scale=np.exp(mu))
    lower = np.maximum(values - 0.5, np.finfo(float).tiny)
    upper = values + 0.5
    bin_mass = distribution.sf(lower) - distribution.sf(upper)
    tail_mass = float(distribution.sf(max(kmin - 0.5, np.finfo(float).tiny)))
    if not np.isfinite(tail_mass) or tail_mass <= 0:
        return np.full(values.shape, math.nan, dtype=float)
    return np.asarray(bin_mass / tail_mass, dtype=float)


def _fit_lognormal(sample: np.ndarray, kmin: int) -> dict[str, float]:
    try:
        values = np.asarray(sample, dtype=float)
        logs = np.log(values)
        initial_mu = float(np.mean(logs))
        initial_sigma = float(max(np.std(logs), 0.1))

        def negative_loglikelihood(parameters: np.ndarray) -> float:
            mu, log_sigma = (float(parameters[0]), float(parameters[1]))
            probabilities = _discrete_lognormal_pmf(
                values,
                mu=mu,
                sigma=float(np.exp(log_sigma)),
                kmin=kmin,
            )
            if np.any(~np.isfinite(probabilities)) or np.any(probabilities <= 0):
                return math.inf
            return float(-np.sum(np.log(probabilities)))

        fit = optimize.minimize(
            negative_loglikelihood,
            x0=np.array([initial_mu, np.log(initial_sigma)], dtype=float),
            method="L-BFGS-B",
            bounds=((-10.0, 20.0), (-5.0, 3.0)),
        )
        if not fit.success or not np.isfinite(fit.fun):
            raise ValueError("Discrete lognormal fit failed")
        mu = float(fit.x[0])
        sigma = float(np.exp(fit.x[1]))
        scale = float(np.exp(mu))
        loglik = float(-fit.fun)
        aic = float(4 - 2 * loglik)
        return {
            "sigma": sigma,
            "scale": scale,
            "loglik": loglik,
            "aic": aic,
        }
    except (ValueError, FloatingPointError, OverflowError):
        return {"sigma": math.nan, "scale": math.nan, "loglik": math.nan, "aic": math.nan}


def fit_tail_models(degrees: np.ndarray, min_tail_size: int = 20) -> dict[str, Any]:
    values = np.asarray(degrees, dtype=int)
    values = values[values > 0]
    if values.size < min_tail_size:
        return {
            "tail_n": int(values.size),
            "kmin": math.nan,
            "power_alpha": math.nan,
            "power_ks": math.nan,
            "power_loglik": math.nan,
            "power_aic": math.nan,
            "exp_lambda": math.nan,
            "exp_loglik": math.nan,
            "exp_aic": math.nan,
            "lognorm_sigma": math.nan,
            "lognorm_scale": math.nan,
            "lognorm_loglik": math.nan,
            "lognorm_aic": math.nan,
            "preferred_model": "insufficient_tail",
            "llr_power_vs_exp": math.nan,
            "llr_power_vs_lognorm": math.nan,
        }

    candidate_kmins = np.unique(values)
    best_result: dict[str, Any] | None = None
    for kmin in candidate_kmins:
        tail = values[values >= kmin]
        if tail.size < min_tail_size:
            continue
        alpha = _power_law_alpha_mle(tail.astype(float), int(kmin))
        ks = _power_law_ks(tail.astype(float), alpha, int(kmin))
        loglik = _power_law_loglikelihood(tail.astype(float), alpha, int(kmin))
        if not np.isfinite(alpha) or not np.isfinite(ks) or not np.isfinite(loglik):
            continue
        result = {
            "tail_n": int(tail.size),
            "kmin": int(kmin),
            "power_alpha": float(alpha),
            "power_ks": float(ks),
            "power_loglik": float(loglik),
            "power_aic": float(2 - 2 * loglik),
        }
        if best_result is None or result["power_ks"] < best_result["power_ks"]:
            best_result = result

    if best_result is None:
        return {
            "tail_n": int(values.size),
            "kmin": math.nan,
            "power_alpha": math.nan,
            "power_ks": math.nan,
            "power_loglik": math.nan,
            "power_aic": math.nan,
            "exp_lambda": math.nan,
            "exp_loglik": math.nan,
            "exp_aic": math.nan,
            "lognorm_sigma": math.nan,
            "lognorm_scale": math.nan,
            "lognorm_loglik": math.nan,
            "lognorm_aic": math.nan,
            "preferred_model": "fit_failed",
            "llr_power_vs_exp": math.nan,
            "llr_power_vs_lognorm": math.nan,
        }

    tail = values[values >= best_result["kmin"]].astype(float)
    exp_fit = _fit_exponential(tail, int(best_result["kmin"]))
    lognorm_fit = _fit_lognormal(tail, int(best_result["kmin"]))

    comparison = {
        "power_law": best_result["power_aic"],
        "exponential": exp_fit["aic"],
        "lognormal": lognorm_fit["aic"],
    }
    finite_comparison = {key: value for key, value in comparison.items() if np.isfinite(value)}
    preferred_model = min(finite_comparison, key=finite_comparison.get) if finite_comparison else "fit_failed"

    return {
        **best_result,
        "exp_lambda": exp_fit["lambda"],
        "exp_loglik": exp_fit["loglik"],
        "exp_aic": exp_fit["aic"],
        "lognorm_sigma": lognorm_fit["sigma"],
        "lognorm_scale": lognorm_fit["scale"],
        "lognorm_loglik": lognorm_fit["loglik"],
        "lognorm_aic": lognorm_fit["aic"],
        "preferred_model": preferred_model,
        "llr_power_vs_exp": (
            float(best_result["power_loglik"] - exp_fit["loglik"])
            if np.isfinite(exp_fit["loglik"])
            else math.nan
        ),
        "llr_power_vs_lognorm": (
            float(best_result["power_loglik"] - lognorm_fit["loglik"])
            if np.isfinite(lognorm_fit["loglik"])
            else math.nan
        ),
    }


def fit_tail_table(degree_df: pd.DataFrame, group_cols: list[str]) -> pd.DataFrame:
    records: list[dict[str, Any]] = []
    for keys, group in degree_df.groupby(group_cols):
        if not isinstance(keys, tuple):
            keys = (keys,)
        record = {column: value for column, value in zip(group_cols, keys)}
        record.update(fit_tail_models(group["degree"].to_numpy()))
        records.append(record)
    return pd.DataFrame(records)
