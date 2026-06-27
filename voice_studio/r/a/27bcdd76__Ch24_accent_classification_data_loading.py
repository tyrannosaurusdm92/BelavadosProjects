"""
Data loading and splitting functionality.
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from pathlib import Path
import glob


def load_metadata(data_dir, target_accents):
    """
    Load and filter metadata for target accents.
    
    Works with directory structure where each accent has its own folder:
    data/
      ├── mandarin/
      │   ├── mandarin1.mp3
      │   ├── mandarin2.mp3
      │   └── mandarin.csv (optional)
      ├── russian/
      └── spanish/
    
    Args:
        data_dir: Path to dataset directory containing accent folders
        target_accents: List of accent names to include (e.g., ['mandarin', 'russian', 'spanish'])
        
    Returns:
        Filtered DataFrame with columns: audio_path, native_language
    """
    data_dir = Path(data_dir)
    
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    
    all_files = []
    
    for accent in target_accents:
        accent_dir = data_dir / accent
        
        if not accent_dir.exists():
            print(f"Warning: Directory not found for accent '{accent}': {accent_dir}")
            continue
        
        # Find all .mp3 files in this accent's directory
        mp3_files = list(accent_dir.glob('*.mp3'))
        
        if not mp3_files:
            print(f"Warning: No .mp3 files found for accent '{accent}' in {accent_dir}")
            continue
        
        # Add each file to our list
        for mp3_file in mp3_files:
            all_files.append({
                'audio_path': str(mp3_file),
                'native_language': accent,
                'filename': mp3_file.stem  # filename without extension
            })
        
        print(f"Found {len(mp3_files)} files for {accent}")
    
    if not all_files:
        raise ValueError(f"No audio files found for any of the target accents: {target_accents}")
    
    # Create DataFrame
    df = pd.DataFrame(all_files)
    
    print(f"\nLoaded {len(df)} total samples for accents: {target_accents}")
    print(f"Distribution: {df['native_language'].value_counts().to_dict()}")
    
    return df


def create_splits(df, test_size, val_size, random_state):
    """
    Create stratified train/val/test splits.
    
    Args:
        df: DataFrame with 'native_language' column
        test_size: Fraction for test set (e.g., 0.15)
        val_size: Fraction for validation set (e.g., 0.15)
        random_state: Random seed for reproducibility
        
    Returns:
        Tuple of (train_df, val_df, test_df)
    """
    # First split: train+val vs test
    train_val_df, test_df = train_test_split(
        df,
        test_size=test_size,
        stratify=df['native_language'],
        random_state=random_state
    )
    
    # Second split: train vs val
    val_size_adjusted = val_size / (1 - test_size)
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=val_size_adjusted,
        stratify=train_val_df['native_language'],
        random_state=random_state
    )
    
    print(f"\nData splits created:")
    print(f"  Train: {len(train_df)} samples")
    print(f"  Val:   {len(val_df)} samples")
    print(f"  Test:  {len(test_df)} samples")
    
    return train_df, val_df, test_df


def get_split_info(train_df, val_df, test_df):
    """
    Get summary statistics for data splits.
    
    Returns:
        Dict with split sizes and distributions
    """
    return {
        'train_size': len(train_df),
        'val_size': len(val_df),
        'test_size': len(test_df),
        'train_distribution': train_df['native_language'].value_counts().to_dict(),
        'val_distribution': val_df['native_language'].value_counts().to_dict(),
        'test_distribution': test_df['native_language'].value_counts().to_dict(),
    }
