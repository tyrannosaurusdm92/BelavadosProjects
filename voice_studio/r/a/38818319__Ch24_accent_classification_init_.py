"""
Accent Classification Package

"""

__version__ = "1.0.0"
__author__ = "Ahmed Abyadh"

from .config import config
from .utils import setup_plotting_style, set_seed, save_results
from .data_loading import load_metadata, create_splits, get_split_info
from .features import extract_features, extract_features_batch, get_feature_info
from .preprocessing import augment_data, standardize_features, select_features, find_best_k
from .models import train_logistic_regression, train_bagging_ensemble, select_best_model
from .evaluation import evaluate_model_full, mcnemar_test, paired_ttest, compare_to_benchmark
from .visualization import (
    plot_benchmark_comparison, 
    plot_per_accent_f1, 
    plot_confusion_matrix,
    plot_all_models_comparison,
    plot_feature_selection_results
)

__all__ = [
    'config',
    'setup_plotting_style',
    'set_seed',
    'save_results',
    'load_metadata',
    'create_splits',
    'get_split_info',
    'extract_features',
    'extract_features_batch',
    'get_feature_info',
    'augment_data',
    'standardize_features',
    'select_features',
    'find_best_k',
    'train_logistic_regression',
    'train_bagging_ensemble',
    'select_best_model',
    'evaluate_model_full',
    'mcnemar_test',
    'paired_ttest',
    'compare_to_benchmark',
    'plot_benchmark_comparison',
    'plot_per_accent_f1',
    'plot_confusion_matrix',
    'plot_all_models_comparison',
    'plot_feature_selection_results',
]
