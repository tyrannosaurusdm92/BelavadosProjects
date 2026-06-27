import streamlit as st
from audiorecorder import audiorecorder
import torchaudio
import torch
from transformers import Wav2Vec2Model, Wav2Vec2FeatureExtractor
import tempfile
import io
import os
import warnings

warnings.filterwarnings("ignore")
os.environ["STREAMLIT_DISABLE_WATCHDOG_WARNINGS"] = "true"

# ----- Classifiers -----
class Wav2VecClassifier(torch.nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.wav2vec = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")
        for param in self.wav2vec.parameters():
            param.requires_grad = False
        self.classifier = torch.nn.Sequential(
            torch.nn.Linear(self.wav2vec.config.hidden_size, 256),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(256, num_classes)
        )
    def forward(self, x):
        if x.ndim == 1:
            x = x.unsqueeze(0)
        outputs = self.wav2vec(x).last_hidden_state
        return self.classifier(outputs.mean(dim=1))

class Wav2VecRegionalClassifier(torch.nn.Module):
    def __init__(self, num_classes=14):
        super().__init__()
        self.wav2vec = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")
        for param in self.wav2vec.parameters():
            param.requires_grad = False
        self.classifier = torch.nn.Sequential(
            torch.nn.Linear(self.wav2vec.config.hidden_size, 256),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.4),
            torch.nn.Linear(256, num_classes)
        )
    def forward(self, x):
        if x.ndim == 1:
            x = x.unsqueeze(0)
        outputs = self.wav2vec(x).last_hidden_state
        return self.classifier(outputs.mean(dim=1))

@st.cache_resource
def load_models():
    native_model = Wav2VecClassifier()
    native_model.load_state_dict(torch.load("best_english_classifier_final.pt", map_location=torch.device("cpu")))
    native_model.eval()

    regional_model = Wav2VecRegionalClassifier(num_classes=14)
    regional_model.load_state_dict(torch.load("best_regional_model_aug_ft4.pt", map_location=torch.device("cpu")))
    regional_model.eval()

    extractor = Wav2Vec2FeatureExtractor.from_pretrained("facebook/wav2vec2-base")
    return native_model, regional_model, extractor

REGION_LABELS = [
    "Australia_NZ", "British_Isles", "Caribbean_Central_America", "ESE_Europe",
    "E_Asia", "Former_Soviet_Union", "Middle_East_N_Africa", "Nordic_Baltic",
    "North_America", "SE_Asia_Pacific", "S_Asia", "South_America",
    "Sub_Saharan_Africa", "W_Central_Europe"
]

native_model, regional_model, extractor = load_models()

# ----- UI -----
st.title("🎙️ English Accent & Region Classifier")
st.markdown("Please read the following passage aloud:")

st.markdown("""
> *Please call Stella. Ask her to bring these things with her from the store:  
Six spoons of fresh snow peas, five thick slabs of blue cheese, and maybe a snack for her brother Bob.  
We also need a small plastic snake and a big toy frog for the kids.  
She can scoop these things into three red bags, and we will go meet her Wednesday at the train station.*
""")

st.markdown("## 🎤 Record Your Voice Below:")
audio = audiorecorder("Click to record", "Click to stop")

if audio and not audio.empty():
    audio_bytes = io.BytesIO()
    audio.export(audio_bytes, format="wav")
    st.audio(audio_bytes.getvalue(), format="audio/wav")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        audio.export(tmp.name, format="wav")
        wav_path = tmp.name

    waveform, sample_rate = torchaudio.load(wav_path)
    waveform = waveform.squeeze(0)

    max_samples = 16000 * 10
    if waveform.shape[0] > max_samples:
        waveform = waveform[:max_samples]
    else:
        waveform = torch.nn.functional.pad(waveform, (0, max_samples - waveform.shape[0]))

    input_values = extractor(waveform.numpy(), sampling_rate=16000, return_tensors="pt").input_values

    with torch.no_grad():
        native_logits = native_model(input_values)
        native_pred = torch.argmax(native_logits, dim=1).item()
        native_conf = torch.nn.functional.softmax(native_logits, dim=1)[0][native_pred].item()

        regional_logits = regional_model(input_values)
        regional_pred = torch.argmax(regional_logits, dim=1).item()
        regional_conf = torch.nn.functional.softmax(regional_logits, dim=1)[0][regional_pred].item()

    native_label = "Native English Speaker" if native_pred == 1 else "Non-Native English Speaker"
    regional_label = REGION_LABELS[regional_pred]

    st.subheader(f"🗣️ Prediction: {native_label}")
    st.write(f"Confidence: {native_conf * 100:.2f}%")

    st.subheader(f"🌍 Predicted Region: {regional_label}")
    st.write(f"Confidence: {regional_conf * 100:.2f}%")
    
    st.write(f"")
    st.write(f"*This is a work in progress, predictions won't be fully accurate until Google gives me more compute units. See full project on my GitHub: https://github.com/frustin642/accent-prediction*")
