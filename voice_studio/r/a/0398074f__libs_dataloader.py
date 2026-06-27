import os
import torch
import librosa
import pandas as pd
from torch.utils.data import Dataset, DataLoader


ACCENTS_EN = [
    "american",
    "british",
    "australian",
    "indian",
    "canadian",
    "bermudian",
    "scottish",
    "african",
    "irish",
    "newzealand",
    "welsh",
    "malaysian",
    "philippine",
    "singaporean",
    "hongkong",
    "southatlantic",
]

id2label = {i: label for i, label in enumerate(ACCENTS_EN)}
label2id = {label: i for i, label in enumerate(ACCENTS_EN)}


class AccentDataset(Dataset):
    def __init__(
        self,
        csv_file,
        accents=ACCENTS_EN,
        data_root=None,
        target_sr=16000,
    ):
        self.data = pd.read_csv(csv_file)
        self.data = self.data[self.data["accent"].isin(accents)].reset_index(drop=True)
        self.data_root = data_root
        self.target_sr = target_sr

        self.id2label = {i: label for i, label in enumerate(accents)}
        self.label2id = {label: i for i, label in enumerate(accents)}

    def __len__(self):
        return len(self.data)

    def load_audio(self, audio_path):
        wav, _ = librosa.load(audio_path, sr=self.target_sr)
        return torch.from_numpy(wav).float()

    def __getitem__(self, idx):
        row = self.data.iloc[idx]

        audio_path = row["audio_path"]
        if self.data_root is not None:
            audio_path = os.path.join(self.data_root, audio_path)

        accent = row["accent"]
        label_id = self.label2id[accent]

        wav = self.load_audio(audio_path)

        return {
            "wav": wav,
            "label": label_id,
            "accent": accent,
            "audio_path": audio_path,
        }


def accent_collate_fn(batch):
    wavs = [item["wav"] for item in batch]
    labels = torch.tensor([item["label"] for item in batch], dtype=torch.long)

    lengths = torch.tensor([wav.shape[0] for wav in wavs], dtype=torch.float32)
    max_len = int(lengths.max().item())

    padded_wavs = torch.zeros(len(wavs), max_len, dtype=torch.float32)

    for i, wav in enumerate(wavs):
        padded_wavs[i, : wav.shape[0]] = wav

    # SpeechBrain expects relative waveform lengths in [0, 1]
    wav_lens = lengths / max_len

    accents = [item["accent"] for item in batch]
    audio_paths = [item["audio_path"] for item in batch]

    return {
        "wavs": padded_wavs,      # [B, Tmax]
        "wav_lens": wav_lens,    # [B]
        "labels": labels,        # [B]
        "accents": accents,
        "audio_paths": audio_paths,
    }