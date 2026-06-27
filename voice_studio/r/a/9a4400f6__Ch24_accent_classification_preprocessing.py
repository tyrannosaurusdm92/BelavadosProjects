"""
Data preprocessing: augmentation, scaling, feature selection.
"""

import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score


def augment_data(X, y, config):
    """
    Augment training data with noise.
    
    Args:
        X: Feature matrix
        y: Labels
        config: Config object with augmentation parameters
        
    Returns:
        Tuple of (X_augmented, y_augmented)
    """
    X_aug = []
    y_aug = []
    
    noise_level = config.AUGMENT_NOISE_LEVEL
    
    for x, label in zip(X, y):
        # Original sample
        X_aug.append(x)
        y_aug.append(label)
        
        # Add augmented copy with noise
        for _ in range(config.AUGMENT_COPIES_PER_SAMPLE - 1):
            noisy = x + np.random.normal(0, noise_level, x.shape)
            X_aug.append(noisy)
            y_aug.append(label)
    
    X_aug = np.array(X_aug)
    y_aug = np.array(y_aug)
    
    print(f" Augmented data: {X.shape[0]} → {X_aug.shape[0]} samples")
    
    return X_aug, y_aug


def standardize_features(X_train, X_val, X_test):
    """
    Standardize features using training set statistics.
    
    Args:
        X_train, X_val, X_test: Feature matrices
        
    Returns:
        Tuple of (X_train_scaled, X_val_scaled, X_test_scaled, scaler)
    """
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    print(f" Features standardized (mean=0, std=1)")
    
    return X_train_scaled, X_val_scaled, X_test_scaled, scaler


def select_features(X_train, y_train, X_val, X_test, k):
    """
    Select top k features using ANOVA F-test.
    
    Args:
        X_train, y_train: Training data
        X_val, X_test: Validation and test data
        k: Number of features to select
        
    Returns:
        Tuple of (X_train_selected, X_val_selected, X_test_selected, selector)
    """
    selector = SelectKBest(f_classif, k=k)
    X_train_selected = selector.fit_transform(X_train, y_train)
    X_val_selected = selector.transform(X_val)
    X_test_selected = selector.transform(X_test)
    
    return X_train_selected, X_val_selected, X_test_selected, selector


def find_best_k(X_train, y_train, X_val, y_val, X_test, y_test, k_values, config):
    """
    Find best number of features k using validation set.
    
    Tests each k value with a simple logistic regression model
    and selects the k that gives best validation F1 score.
    
    Args:
        X_train, y_train, X_val, y_val, X_test, y_test: Data splits
        k_values: List of k values to try (e.g., [10, 12, 15, 20])
        config: Config object
        
    Returns:
        Dict with best k and results for all k values
    """
    print(f"\n Testing feature selection with k values: {k_values}")
    
    results = []
    
    for k in k_values:
        # Select features
        X_tr_k, X_val_k, X_te_k, selector = select_features(
            X_train, y_train, X_val, X_test, k
        )
        
        # Train simple LR model
        model = LogisticRegression(max_iter=1000, random_state=config.RANDOM_STATE)
        model.fit(X_tr_k, y_train)
        
        # Evaluate
        val_f1 = f1_score(y_val, model.predict(X_val_k), average='macro')
        test_f1 = f1_score(y_test, model.predict(X_te_k), average='macro')
        
        results.append({
            'k': k,
            'val_f1': val_f1,
            'test_f1': test_f1,
        })
        
        print(f"  k={k:2d}: Val F1={val_f1:.4f}, Test F1={test_f1:.4f}")
    
    # Find best k by validation F1
    best_result = max(results, key=lambda x: x['val_f1'])
    
    print(f" Best k: {best_result['k']} (Val F1: {best_result['val_f1']:.4f})")
    
    return {
        'best_k': best_result['k'],
        'best_val_f1': best_result['val_f1'],
        'all_results': results,
    }
