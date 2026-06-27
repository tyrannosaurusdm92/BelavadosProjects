"""
Audio feature extraction with caching.
"""

import librosa
import numpy as np
import joblib
from pathlib import Path
from tqdm import tqdm


def extract_features(audio_path, config):
    """
    Extract acoustic features from audio file
    
    Features extracted:
    - MFCCs (mean + std)
    - Chroma (mean + std)
    - Spectral contrast (mean + std)
    - Tonnetz (mean + std)
    - Zero crossing rate (mean + std)
    - Spectral centroid (mean + std)
    - Spectral rolloff (mean + std)
    - RMS energy (mean + std)
    
    Args:
        audio_path: Path to audio file
        config: Config object with feature parameters
        
    Returns:
        Feature vector (1D numpy array)
    """
    # Load audio
    y, sr = librosa.load(audio_path, sr=config.SAMPLE_RATE, duration=config.MAX_DURATION)
    
    features = []
    
    # MFCCs
    mfccs = librosa.feature.mfcc(
        y=y, sr=sr, n_mfcc=config.N_MFCC,
        n_fft=config.FRAME_LENGTH, hop_length=config.HOP_LENGTH
    )
    # Delta MFCCs (first derivative)
    mfcc_delta = librosa.feature.delta(mfccs)
    features.append(np.mean(mfcc_delta, axis=1))
    features.append(np.std(mfcc_delta, axis=1))
    
    # Delta-delta MFCCs (second derivative)
    mfcc_delta2 = librosa.feature.delta(mfccs, order=2)
    features.append(np.mean(mfcc_delta2, axis=1))
    features.append(np.std(mfcc_delta2, axis=1))

    features.append(np.mean(mfccs, axis=1))
    features.append(np.std(mfccs, axis=1))
    
    # Chroma
    chroma = librosa.feature.chroma_stft(
        y=y, sr=sr, n_fft=config.FRAME_LENGTH, hop_length=config.HOP_LENGTH,
        n_chroma=config.N_CHROMA
    )
    features.append(np.mean(chroma, axis=1))
    features.append(np.std(chroma, axis=1))
    
    # Spectral contrast
    contrast = librosa.feature.spectral_contrast(
        y=y, sr=sr, n_fft=config.FRAME_LENGTH, hop_length=config.HOP_LENGTH,
        n_bands=config.N_SPECTRAL_CONTRAST - 1
    )
    features.append(np.mean(contrast, axis=1))
    features.append(np.std(contrast, axis=1))
    
    # Tonnetz
    tonnetz = librosa.feature.tonnetz(y=y, sr=sr)
    features.append(np.mean(tonnetz, axis=1))
    features.append(np.std(tonnetz, axis=1))
    
    # Zero crossing rate
    zcr = librosa.feature.zero_crossing_rate(
        y, frame_length=config.FRAME_LENGTH, hop_length=config.HOP_LENGTH
    )
    features.append(np.array([np.mean(zcr), np.std(zcr)]))
    
    # Spectral centroid
    cent = librosa.feature.spectral_centroid(
        y=y, sr=sr, n_fft=config.FRAME_LENGTH, hop_length=config.HOP_LENGTH
    )
    features.append(np.array([np.mean(cent), np.std(cent)]))
    
    # Spectral rolloff
    rolloff = librosa.feature.spectral_rolloff(
        y=y, sr=sr, n_fft=config.FRAME_LENGTH, hop_length=config.HOP_LENGTH
    )
    features.append(np.array([np.mean(rolloff), np.std(rolloff)]))
    
    # RMS energy
    rms = librosa.feature.rms(
        y=y, frame_length=config.FRAME_LENGTH, hop_length=config.HOP_LENGTH
    )
    features.append(np.array([np.mean(rms), np.std(rms)]))
    
    return np.concatenate(features)


def extract_features_batch(df, config, cache_path=None, force_recompute=False):
    """
    Extract features for all files in DataFrame with caching
    
    Args:
        df: DataFrame with 'audio_path' and 'native_language' columns
        config: Config object
        cache_path: Path to cache file (optional, but recommended)
        force_recompute: If True, ignore cache and recompute
        
    Returns:
        Tuple of (X, y) where X is feature matrix, y is labels
    """
    # Check cache
    if cache_path and Path(cache_path).exists() and not force_recompute:
        print(f" Loading features from cache: {cache_path}")
        cached = joblib.load(cache_path)
        return cached['X'], cached['y']
    
    # Extract features
    print(f" Extracting features from {len(df)} files...")
    X = []
    y = []
    failed_files = []
    
    for idx, row in tqdm(df.iterrows(), total=len(df), desc="Extracting features"):
        try:
            features = extract_features(row['audio_path'], config)
            X.append(features)
            y.append(row['native_language'])
        except Exception as e:
            failed_files.append((row['audio_path'], str(e)))
    
    if failed_files:
        print(f" Failed to process {len(failed_files)} files:")
        for path, error in failed_files[:5]:  # Show first 5
            print(f"  {path}: {error}")
    
    X = np.array(X)
    y = np.array(y)
    
    print(f" Extracted features: {X.shape}")
    
    # Save cache
    if cache_path:
        Path(cache_path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({'X': X, 'y': y}, cache_path)
        print(f" Saved features to cache: {cache_path}")
    
    return X, y


def get_feature_info(X):
    """
    Get feature matrix statistics.
    
    Returns:
        Dict with feature statistics
    """
    return {
        'n_samples': X.shape[0],
        'n_features': X.shape[1],
        'feature_range': (float(X.min()), float(X.max())),
        'feature_mean': float(X.mean()),
        'feature_std': float(X.std()),
    }
