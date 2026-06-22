# CommonAccent

A clean-up repository for the CommonAccent paper by Zuluaga-Gomez et al. This repo provides organized data splits and evaluation code to accompany the original work.

> **Paper:** Zuluaga-Gomez, J., Ahmed, S., Visockas, D., & Subakan, C. (2023). *CommonAccent: Exploring Large Acoustic Pretrained Models for Accent Classification Based on Common Voice.* Interspeech 2023. [[arXiv]](https://arxiv.org/abs/2305.18283)
>
> **Original repository:** [JuanPZuluaga/accent-recog-slt2022](https://github.com/JuanPZuluaga/accent-recog-slt2022/tree/main)

---

## Results

Evaluated on the paper's original test set using `wav2vec2-large-xlsr-53` fine-tuned for accent classification.

**Mean Accuracy: 91.80%**

| Accent | Accuracy |
|--------|:--------:|
| South Atlantic | 100.00% |
| American | 99.00% |
| Scottish | 99.00% |
| Welsh | 95.12% |
| Indian | 95.00% |
| Singaporean | 94.12% |
| Australian | 94.00% |
| British | 92.00% |
| Irish | 92.00% |
| Canadian | 90.00% |
| Philippine | 88.89% |
| Malaysian | 88.46% |
| African | 85.00% |
| New Zealand | 85.00% |
| Bermudian | 82.76% |
| Hong Kong | 73.33% |

> **Note on data leakage.** The original authors split by utterance count — not by speaker. Their procedure merges the original Common Voice train/dev/test splits into a single pool, then re-partitions by sampling up to 100 utterances per accent for dev and test. Since no speaker-level separation is enforced, the same speaker can appear in both train and test. Given that accent classifiers are likely to exploit speaker-specific cues (voice timbre, speaking rate, etc.), this may inflate the reported accuracies above what would be expected on truly held-out speakers. The high per-class numbers above should be interpreted with this caveat in mind.

---

## Overview

Accent classification over **16 English accents** using a fine-tuned `wav2vec2-large-xlsr-53` backbone, evaluated on [Mozilla Common Voice v11](https://commonvoice.mozilla.org/en/datasets).

| Split | Utterances | Duration |
|-------|:----------:|:--------:|
| Train | 45.5k | 51.7 hr |
| Dev | 1.1k | 1.3 hr |
| Test | 1.1k | 1.3 hr |

**Accents (16):** African · American · Australian · Bermudian · British · Canadian · Hong Kong · Indian · Irish · Malaysian · New Zealand · Philippine · Scottish · Singaporean · South Atlantic · Welsh

---

## Repository Structure

```
.
├── libs/
│   ├── model.py          # w2v2XLSRModel — SpeechBrain wav2vec2 + pooling + classifier
│   └── dataloader.py     # AccentDataset and accent_collate_fn
├── metadata/
│   ├── train.csv         # columns: audio_path, duration, text, subject_id, utt_id, accent
│   ├── dev.csv
│   └── test.csv
├── evaluation.ipynb      # per-accent and overall accuracy on the test set
└── feature.ipynb         # 1024-dim embedding extraction + t-SNE visualization
```

---

## Data

The preprocessed dataset (16 kHz WAV, normalized transcripts, curated accent labels) is available for download:

```bash
wget -O CommonVoice_v11.zip "https://drive.google.com/file/d/1v-7_cnmVvet99CGbAbXRZHSssiOL9W80/view?usp=sharing"
unzip CommonVoice_v11.zip
```

This produces a `data/` directory alongside the `metadata/` CSVs. The audio paths in the CSVs are absolute — update `audio_path` to match your local root if needed.

<details>
<summary>Rebuilding from raw Common Voice v11</summary>

1. Download Common Voice v11 (English) from the [Mozilla website](https://commonvoice.mozilla.org/en/datasets) and place it under `raw_data/`.
2. Run `preprocess.ipynb`, which:
   - Converts MP3 audio to 16 kHz WAV
   - Normalizes transcripts (uppercase, strips punctuation)
   - Remaps raw accent labels to the 16 canonical names
   - Writes processed audio to `data/` and metadata to `metadata/`

</details>

---

## Setup

Please refer to the original repository for environment setup: [JuanPZuluaga/accent-recog-slt2022](https://github.com/JuanPZuluaga/accent-recog-slt2022/tree/main)

---

## Evaluation

Run `evaluation.ipynb` to compute per-accent and overall accuracy on the test set.

The model (`w2v2XLSRModel` in `libs/model.py`) wraps three SpeechBrain modules:

| Module | Role |
|--------|------|
| `wav2vec2` | Contextual feature extraction |
| `avg_pool` | Statistics pooling over the time axis → 1024-dim vector |
| `output_mlp` | 16-class linear classifier |

---

## Feature Visualization

Run `feature.ipynb` to extract pooled 1024-dim embeddings for the test set and project them to 2D with t-SNE.

---

## Citation

If you use this code or data, please cite the original paper:

```bibtex
@article{zuluaga2023commonaccent,
  title={CommonAccent: Exploring Large Acoustic Pretrained Models for Accent Classification Based on Common Voice},
  author={Zuluaga-Gomez, Juan and Ahmed, Sara and Visockas, Danielius and Subakan, Cem},
  journal={Interspeech 2023},
  url={https://arxiv.org/abs/2305.18283},
  year={2023}
}
```
