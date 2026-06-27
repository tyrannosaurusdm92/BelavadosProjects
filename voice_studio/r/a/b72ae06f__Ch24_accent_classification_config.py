"""
Configuration for accent classification
"""

class Config:
    """All experiment parameters."""
    
    # ==================== PATHS ====================
    DATA_DIR = '/content/drive/MyDrive/Fall25/EE502/FinalProjects/Ch24/data'
    PROJECT_DIR = '/content/drive/MyDrive/Fall25/EE502/FinalProjects/Ch24/accent_classification'
    CACHE_DIR = '/content/drive/MyDrive/Fall25/EE502/FinalProjects/Ch24/accent_classification/cache'
    RESULTS_DIR = '/content/drive/MyDrive/Fall25/EE502/FinalProjects/Ch24/accent_classification/results'
    
    # ==================== DATA ====================
    TARGET_ACCENTS = ['mandarin', 'russian', 'spanish']
    SAMPLE_RATE = 16000
    MAX_DURATION = 10.0  # seconds
    
    # ==================== FEATURES ====================
    # MFCC parameters
    N_MFCC = 40
    
    # Chroma parameters
    N_CHROMA = 12
    
    # Spectral contrast parameters
    N_SPECTRAL_CONTRAST = 7
    
    # Tonnetz parameters
    N_TONNETZ = 6
    
    # Frame parameters
    FRAME_LENGTH = 2048
    HOP_LENGTH = 512
    
    # ==================== PREPROCESSING ====================
    # Feature selection - try these k values
    FEATURE_SELECTION_K_VALUES = [10, 11, 12, 13 ,14]

    # Data augmentation
    #AUGMENT_NOISE_LEVEL = 0.005
    AUGMENT_NOISE_LEVEL = 0.001

    AUGMENT_COPIES_PER_SAMPLE = 2  # Original + 1 augmented = 2 total
    
    # ==================== MODEL TRAINING ====================
    # Logistic Regression - regularization values to try
    #LR_C_VALUES = [0.001, 0.01, 0.1, 1.0, 10.0]
    LR_C_VALUES = [0.1, 1.0, 10.0, 100.0, 1000.0]
    
    # Bagging parameters
    BAGGING_N_ESTIMATORS = 50
    
    # Cross-validation
    N_FOLDS = 5
    
    # ==================== DATA SPLITS ====================
    TEST_SIZE = 0.15
    VAL_SIZE = 0.15
    RANDOM_STATE = 42
    
    def to_dict(self):
        """Convert config to dictionary for logging."""
        return {k: v for k, v in self.__class__.__dict__.items() 
                if not k.startswith('_') and not callable(v)}


# Create singleton instance
config = Config()
