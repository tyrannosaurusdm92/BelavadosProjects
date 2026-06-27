"""
Utility functions for setup and helpers.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import random
import numpy as np
import json
from pathlib import Path


def setup_plotting_style():
    """Configure matplotlib and seaborn style."""
    try:
        plt.style.use('seaborn-v0_8-darkgrid')
    except:
        plt.style.use('seaborn-darkgrid')
    
    sns.set_palette("husl")
    plt.rcParams['figure.figsize'] = (10, 6)
    plt.rcParams['font.size'] = 11


def set_seed(seed):
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass


def save_results(results, filepath):
    """
    Save results to JSON file.
    
    Args:
        results: Dict to save
        filepath: Path to save JSON
    """
    # Create directory if needed
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    
    # Convert numpy types and skip non-serializable objects
    def convert(obj):
        # Skip model objects and other non-serializable types
        if hasattr(obj, 'predict'):  # It's a model
            return f"<Model: {obj.__class__.__name__}>"
        elif hasattr(obj, '__module__') and 'sklearn' in obj.__module__:
            return f"<Sklearn object: {obj.__class__.__name__}>"
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: convert(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert(item) for item in obj]
        elif isinstance(obj, (str, int, float, bool, type(None))):
            return obj
        else:
            # For other types, try to convert to string
            try:
                return str(obj)
            except:
                return f"<Non-serializable: {type(obj).__name__}>"
    
    results_converted = convert(results)
    
    with open(filepath, 'w') as f:
        json.dump(results_converted, f, indent=2)
    
    print(f" Results saved to: {filepath}")
