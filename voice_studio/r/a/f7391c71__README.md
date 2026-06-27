GET MODELS HERE: https://drive.google.com/drive/folders/1ovwXbu2vD4fK-OnfOC6-1aufIo-S-vPE?usp=drive_link

# English Accent Classifier (Streamlit App)

This app allows users to record their voice reading a standard passage and predicts whether they are a **native English speaker** and their **region of origin** using a fine-tuned Wav2Vec2 model. This interface and the model it runs on was produced as a Data Science Capstone Project at Southern Connecticut State University.

Author: Justin Frandsen

## Features

- Record voice directly in browser (via `streamlit-audiorecorder`)
- Play back your recording
- Run inference using a PyTorch model
- Streamlit UI, deployable anywhere

## Setup

1. Clone the repo
2. Unzip models from google drive folder and add the 2 .pt files to accent-interface folder
3. Install dependencies:

```bash
pip install -r requirements.txt
