"""
Model training and selection.
"""

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import BaggingClassifier
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.metrics import f1_score, accuracy_score


def train_logistic_regression(X_train, y_train, X_val, y_val, config):
    """
    Train L2-regularized logistic regression with grid search
    
    Args:
        X_train, y_train: Training data
        X_val, y_val: Validation data
        config: Config object
        
    Returns:
        Dict with trained model and performance metrics
    """
    print("\n Training Logistic Regression with Grid Search...")
    
    # Grid search over C values
    param_grid = {'C': config.LR_C_VALUES}
    
    base_model = LogisticRegression(
        penalty='l2',
        solver='lbfgs',
        max_iter=1000,
        random_state=config.RANDOM_STATE
    )
    
    cv = StratifiedKFold(n_splits=config.N_FOLDS, shuffle=True, random_state=config.RANDOM_STATE)
    
    grid_search = GridSearchCV(
        base_model,
        param_grid,
        cv=cv,
        scoring='f1_macro',
        n_jobs=-1,
        verbose=0
    )
    
    grid_search.fit(X_train, y_train)
    
    # Best model
    best_model = grid_search.best_estimator_
    
    # Evaluate
    train_pred = best_model.predict(X_train)
    val_pred = best_model.predict(X_val)
    
    train_f1 = f1_score(y_train, train_pred, average='macro')
    val_f1 = f1_score(y_val, val_pred, average='macro')
    
    print(f"  Best C: {grid_search.best_params_['C']}")
    print(f"  Train F1: {train_f1:.4f}")
    print(f"  Val F1: {val_f1:.4f}")
    
    return {
        'model': best_model,
        'name': 'Logistic Regression (L2)',
        'best_params': grid_search.best_params_,
        'train_f1': train_f1,
        'val_f1': val_f1,
    }


def train_bagging_ensemble(X_train, y_train, X_val, y_val, config):
    """
    Train bagging ensemble with logistic regression base estimators.
    
    Args:
        X_train, y_train: Training data
        X_val, y_val: Validation data
        config: Config object
        
    Returns:
        Dict with trained model and performance metrics
    """
    print("\n Training Bagging Ensemble...")
    
    base_estimator = LogisticRegression(
        max_iter=1000,
        random_state=config.RANDOM_STATE
    )
    
    model = BaggingClassifier(
        estimator=base_estimator,
        n_estimators=config.BAGGING_N_ESTIMATORS,
        random_state=config.RANDOM_STATE,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_pred = model.predict(X_train)
    val_pred = model.predict(X_val)
    
    train_f1 = f1_score(y_train, train_pred, average='macro')
    val_f1 = f1_score(y_val, val_pred, average='macro')
    
    print(f"  N estimators: {config.BAGGING_N_ESTIMATORS}")
    print(f"  Train F1: {train_f1:.4f}")
    print(f"  Val F1: {val_f1:.4f}")
    
    return {
        'model': model,
        'name': 'Bagging Ensemble',
        'best_params': {'n_estimators': config.BAGGING_N_ESTIMATORS},
        'train_f1': train_f1,
        'val_f1': val_f1,
    }


def select_best_model(models, X_test, y_test):
    """
    Select best model based on test F1 score.
    
    Args:
        models: List of model dicts (from train_* functions)
        X_test, y_test: Test data
        
    Returns:
        Dict with best model and all test results
    """
    print("\n Evaluating models on test set...")
    
    results = []
    
    for model_info in models:
        model = model_info['model']
        y_pred = model.predict(X_test)
        test_acc = accuracy_score(y_test, y_pred)
        test_f1 = f1_score(y_test, y_pred, average='macro')
        
        results.append({
            'name': model_info['name'],
            'model': model,
            'train_f1': model_info['train_f1'],
            'val_f1': model_info['val_f1'],
            'test_f1': test_f1,
            'test_accuracy': test_acc,
            'best_params': model_info['best_params'],
        })
        
        print(f"  {model_info['name']}: Test F1={test_f1:.4f}, Accuracy={test_acc:.4f}")
    
    # Select best by test F1
    best = max(results, key=lambda x: x['test_f1'])
    
    print(f"\n Best model: {best['name']} (Test F1: {best['test_f1']:.4f})")
    
    return {
        'best_model': best,
        'all_results': results,
    }
