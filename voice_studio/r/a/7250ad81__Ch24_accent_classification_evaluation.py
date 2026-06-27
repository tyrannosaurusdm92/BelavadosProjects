"""
Model evaluation and statistical testing.
"""

import numpy as np
from sklearn.metrics import f1_score, accuracy_score, classification_report, confusion_matrix
from scipy import stats
from statsmodels.stats.contingency_tables import mcnemar


def calculate_per_accent_f1(y_true, y_pred, accents):
    """
    Calculate F1 score for each accent class.
    
    Args:
        y_true: True labels
        y_pred: Predicted labels
        accents: List of accent names
        
    Returns:
        Dict mapping accent to F1 score
    """
    per_accent = {}
    for accent in accents:
        mask = y_true == accent
        if mask.sum() > 0:
            # F1 for this accent vs all others
            per_accent[accent] = f1_score(
                y_true[mask], 
                y_pred[mask], 
                labels=[accent], 
                average='macro',
                zero_division=0
            )
    return per_accent


def evaluate_model_full(model, X_test, y_test, accents):
    """
    Complete model evaluation with all metrics
    
    Args:
        model: Trained model
        X_test, y_test: Test data
        accents: List of accent names
        
    Returns:
        Dict with all evaluation metrics
    """
    y_pred = model.predict(X_test)
    
    return {
        'predictions': y_pred,
        'accuracy': accuracy_score(y_test, y_pred),
        'macro_f1': f1_score(y_test, y_pred, average='macro'),
        'weighted_f1': f1_score(y_test, y_pred, average='weighted'),
        'per_accent_f1': calculate_per_accent_f1(y_test, y_pred, accents),
        'confusion_matrix': confusion_matrix(y_test, y_pred, labels=accents),
        'classification_report': classification_report(y_test, y_pred, target_names=accents),
    }


def mcnemar_test(y_true, y_pred_1, y_pred_2):
    """
    Perform McNemar's test to compare two models.
    
    Tests if two models make statistically different predictions.
    
    Args:
        y_true: True labels
        y_pred_1: Predictions from model 1
        y_pred_2: Predictions from model 2
        
    Returns:
        Dict with test results
    """
    # Create contingency table
    correct_1 = (y_pred_1 == y_true)
    correct_2 = (y_pred_2 == y_true)
    
    # Count disagreements
    n_01 = np.sum(~correct_1 & correct_2)  # Model 1 wrong, Model 2 correct
    n_10 = np.sum(correct_1 & ~correct_2)  # Model 1 correct, Model 2 wrong
    
    # McNemar test
    table = np.array([[0, n_01], [n_10, 0]])
    
    try:
        result = mcnemar(table, exact=True)
        p_value = result.pvalue
        statistic = result.statistic
    except:
        # If exact test fails, use chi-square approximation
        result = mcnemar(table, exact=False, correction=True)
        p_value = result.pvalue
        statistic = result.statistic
    
    return {
        'statistic': float(statistic),
        'p_value': float(p_value),
        'significant': p_value < 0.05,
        'n_model1_wrong_model2_correct': int(n_01),
        'n_model1_correct_model2_wrong': int(n_10),
    }


def paired_ttest(scores_1, scores_2):
    """
    Perform paired t-test to compare model scores.
    
    Args:
        scores_1: Array of scores from model 1
        scores_2: Array of scores from model 2
        
    Returns:
        Dict with test results
    """
    t_stat, p_value = stats.ttest_rel(scores_1, scores_2)
    
    return {
        't_statistic': float(t_stat),
        'p_value': float(p_value),
        'significant': p_value < 0.05,
        'mean_diff': float(np.mean(scores_1) - np.mean(scores_2)),
    }


def compare_to_benchmark(model, X_test, y_test, benchmark_model, accents):
    """
    Complete comparison against benchmark including statistical tests.
    
    Args:
        model: Calc trained model
        X_test, y_test: Test data
        benchmark_model: Benchmark model to compare against
        accents: List of accent names
        
    Returns:
        Dict with comparison results
    """
    # Get predictions
    y_pred = model.predict(X_test)
    y_pred_benchmark = benchmark_model.predict(X_test)
    
    # Metrics
    Calc_f1 = f1_score(y_test, y_pred, average='macro')
    benchmark_f1 = f1_score(y_test, y_pred_benchmark, average='macro')
    
    Calc_acc = accuracy_score(y_test, y_pred)
    benchmark_acc = accuracy_score(y_test, y_pred_benchmark)
    
    # Per-accent F1
    Calc_per_accent = calculate_per_accent_f1(y_test, y_pred, accents)
    benchmark_per_accent = calculate_per_accent_f1(y_test, y_pred_benchmark, accents)
    
    # Statistical tests
    mcnemar_result = mcnemar_test(y_test, y_pred, y_pred_benchmark)
    
    return {
        'Calc_f1': Calc_f1,
        'benchmark_f1': benchmark_f1,
        'Calc_accuracy': Calc_acc,
        'benchmark_accuracy': benchmark_acc,
        'f1_improvement': Calc_f1 - benchmark_f1,
        'accuracy_improvement': Calc_acc - benchmark_acc,
        'beats_benchmark': Calc_f1 > benchmark_f1,
        'Calc_per_accent_f1': Calc_per_accent,
        'benchmark_per_accent_f1': benchmark_per_accent,
        'mcnemar': mcnemar_result,
    }
