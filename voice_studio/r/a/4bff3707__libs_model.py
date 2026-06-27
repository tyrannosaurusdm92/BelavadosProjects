import os
import torch
import glob
import pandas as pd
import librosa
import torch.nn as nn
import numpy as np
from torch.utils.data import Dataset, DataLoader
from IPython.display import Audio, display
from speechbrain.pretrained.interfaces import foreign_class

class w2v2XLSRModel(nn.Module):
    def __init__(self):
        super().__init__()
        model = foreign_class(source="Jzuluaga/accent-id-commonaccent_xlsr-en-english", pymodule_file="custom_interface.py", classname="CustomEncoderWav2vec2Classifier")
        self.wav2vec2 = model.mods.wav2vec2
        self.avg_pool = model.mods.avg_pool
        self.output_mlp = model.mods.output_mlp

    def forward(self, wavs, wav_lens=None):
        """
        wavs: Tensor [B, T]
        wav_lens: Tensor [B], relative lengths in [0, 1]
        """
        if wav_lens is None:
            wav_lens = torch.ones(wavs.shape[0], device=wavs.device)

        # [B, T] -> [B, T', 1024]
        feats = self.wav2vec2(wavs, wav_lens)

        # [B, T', 1024] -> [B, 1024]
        pooled = self.avg_pool(feats, wav_lens)

        # Sometimes StatisticsPooling returns [B, 1, D]
        if pooled.dim() == 3:
            pooled = pooled.squeeze(1)

        # [B, 1024] -> [B, 16]
        logits = self.output_mlp(pooled)
        probs = torch.softmax(logits, dim=-1)
        return logits, probs, pooled