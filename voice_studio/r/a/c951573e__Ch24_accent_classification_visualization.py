"""
Visualization functions for results.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np


def plot_benchmark_comparison(Calc_f1, benchmark_f1, model_name='Calc Model', benchmark_name='Benchmark'):
    """
    Bar chart comparing F1 scores.
    
    Args:
        Calc_f1: F1 score of Calc model
        benchmark_f1: F1 score of benchmark
        model_name: Name of Calc model
        benchmark_name: Name of benchmark model
        
    Returns:
        Figure object
    """
    fig, ax = plt.subplots(figsize=(8, 6))
    
    models = [model_name, benchmark_name]
    f1_scores = [Calc_f1, benchmark_f1]
    colors = ['#2ecc71' if Calc_f1 > benchmark_f1 else '#e74c3c', '#95a5a6']
    
    bars = ax.bar(models, f1_scores, color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add value labels on bars
    for bar, score in zip(bars, f1_scores):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{score:.4f}', ha='center', va='bottom', fontsize=12, fontweight='bold')
    
    ax.set_ylabel('Macro F1 Score', fontsize=12, fontweight='bold')
    ax.set_title('Model Performance Comparison', fontsize=14, fontweight='bold')
    ax.set_ylim(0, 1.0)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    
    plt.tight_layout()
    return fig


def plot_per_accent_f1(Calc_scores, benchmark_scores, accents):
    """
    Grouped bar chart for per-accent F1 scores.
    
    Args:
        Calc_scores: Dict mapping accent to F1 score (Calc model)
        benchmark_scores: Dict mapping accent to F1 score (benchmark)
        accents: List of accent names
        
    Returns:
        Figure object
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    
    x = np.arange(len(accents))
    width = 0.35
    
    Calc_f1_values = [Calc_scores.get(acc, 0) for acc in accents]
    benchmark_f1_values = [benchmark_scores.get(acc, 0) for acc in accents]
    
    bars1 = ax.bar(x - width/2, Calc_f1_values, width, 
                   label='Calc Model', color='#3498db', alpha=0.8, edgecolor='black')
    bars2 = ax.bar(x + width/2, benchmark_f1_values, width,
                   label='Benchmark', color='#e74c3c', alpha=0.8, edgecolor='black')
    
    # Add value labels
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                    f'{height:.3f}', ha='center', va='bottom', fontsize=10)
    
    ax.set_ylabel('F1 Score', fontsize=12, fontweight='bold')
    ax.set_title('Per-Accent F1 Score Comparison', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels([acc.capitalize() for acc in accents], fontsize=11)
    ax.legend(fontsize=11)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_ylim(0, 1.1)
    
    plt.tight_layout()
    return fig


def plot_confusion_matrix(cm, accents, title='Confusion Matrix'):
    """
    Heatmap of confusion matrix.
    
    Args:
        cm: Confusion matrix (2D array)
        accents: List of accent names
        title: Plot title
        
    Returns:
        Figure object
    """
    fig, ax = plt.subplots(figsize=(8, 6))
    
    # Create heatmap
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=[acc.capitalize() for acc in accents],
                yticklabels=[acc.capitalize() for acc in accents],
                ax=ax, cbar_kws={'label': 'Count'},
                linewidths=0.5, linecolor='gray')
    
    ax.set_ylabel('True Label', fontsize=12, fontweight='bold')
    ax.set_xlabel('Predicted Label', fontsize=12, fontweight='bold')
    ax.set_title(title, fontsize=14, fontweight='bold')
    
    plt.tight_layout()
    return fig


def plot_all_models_comparison(all_results):
    """
    Compare all trained models across train/val/test sets.
    
    Args:
        all_results: List of dicts with keys 'name', 'train_f1', 'val_f1', 'test_f1'
        
    Returns:
        Figure object
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    
    models = [r['name'] for r in all_results]
    x = np.arange(len(models))
    width = 0.25
    
    train_f1s = [r['train_f1'] for r in all_results]
    val_f1s = [r['val_f1'] for r in all_results]
    test_f1s = [r['test_f1'] for r in all_results]
    
    bars1 = ax.bar(x - width, train_f1s, width, label='Train F1', alpha=0.8, color='#3498db')
    bars2 = ax.bar(x, val_f1s, width, label='Val F1', alpha=0.8, color='#2ecc71')
    bars3 = ax.bar(x + width, test_f1s, width, label='Test F1', alpha=0.8, color='#e74c3c')
    
    # Add value labels
    for bars in [bars1, bars2, bars3]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                    f'{height:.3f}', ha='center', va='bottom', fontsize=9, rotation=0)
    
    ax.set_ylabel('F1 Score', fontsize=12, fontweight='bold')
    ax.set_title('All Models Performance Comparison', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(models, rotation=15, ha='right', fontsize=10)
    ax.legend(fontsize=11)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_ylim(0, 1.1)
    
    plt.tight_layout()
    return fig


def plot_feature_selection_results(results):
    """
    Plot validation and test F1 scores for different k values.
    
    Args:
        results: List of dicts with 'k', 'val_f1', 'test_f1'
        
    Returns:
        Figure object
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    
    k_values = [r['k'] for r in results]
    val_f1s = [r['val_f1'] for r in results]
    test_f1s = [r['test_f1'] for r in results]
    
    ax.plot(k_values, val_f1s, marker='o', linewidth=2, markersize=8, 
            label='Validation F1', color='#2ecc71')
    ax.plot(k_values, test_f1s, marker='s', linewidth=2, markersize=8,
            label='Test F1', color='#e74c3c')
    
    # Mark best k
    best_idx = np.argmax(val_f1s)
    best_k = k_values[best_idx]
    ax.axvline(best_k, color='gray', linestyle='--', alpha=0.5, label=f'Best k={best_k}')
    
    ax.set_xlabel('Number of Features (k)', fontsize=12, fontweight='bold')
    ax.set_ylabel('F1 Score', fontsize=12, fontweight='bold')
    ax.set_title('Feature Selection: F1 vs Number of Features', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11)
    ax.grid(alpha=0.3, linestyle='--')
    
    plt.tight_layout()
    return fig
