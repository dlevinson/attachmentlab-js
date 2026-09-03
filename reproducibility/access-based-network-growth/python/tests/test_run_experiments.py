from src.run_experiments import build_growth_params


def test_build_growth_params_handles_nan_optional_fields_in_mixed_capacity_suites() -> None:
    defaults = {
        "m0": 5,
        "eps": 1e-9,
        "impedance": "power",
        "impedance_lambda": 1.0,
        "capacity_mode": "constant",
    }

    constant_scenario = {
        "final_nodes": 100,
        "alpha": 1.0,
        "beta": 1.0,
        "phi": 1.0,
        "kappa": 2,
        "K": 16,
        "capacity_mode": float("nan"),
        "capacity_params": float("nan"),
        "impedance": float("nan"),
        "impedance_lambda": float("nan"),
    }

    heterogeneous_scenario = {
        "final_nodes": 100,
        "alpha": 1.0,
        "beta": 1.0,
        "phi": 1.0,
        "kappa": 2,
        "K": "uniform_8_24",
        "capacity_mode": "uniform",
        "capacity_params": {"low": 8, "high": 24},
        "impedance": "power",
        "impedance_lambda": 1.0,
    }

    params_constant = build_growth_params(defaults, constant_scenario)
    params_heterogeneous = build_growth_params(defaults, heterogeneous_scenario)

    assert params_constant.capacity.mode == "constant"
    assert params_constant.capacity.params == {"value": 16}
    assert params_constant.impedance == "power"
    assert params_constant.impedance_lambda == 1.0

    assert params_heterogeneous.capacity.mode == "uniform"
    assert params_heterogeneous.capacity.params == {"low": 8, "high": 24}
    assert params_heterogeneous.impedance == "power"
    assert params_heterogeneous.impedance_lambda == 1.0
