import os
import pandas as pd
import jiwer
from normaliser import Normaliser

class WERCalculator:
    def __init__(self, folder_path):
        self.folder_path = folder_path
        self.stock_phrase = "Please call Stella.  Ask her to bring these things with her from the store:  Six spoons of fresh snow peas, five thick slabs of blue cheese, and maybe a snack for her brother Bob.  We also need a small plastic snake and a big toy frog for the kids.  She can scoop these things into three red bags, and we will go meet her Wednesday at the train station."

    def calculate_wer(self):
        results = []
        transformation = jiwer.Compose([
            jiwer.ToLowerCase(),
            jiwer.RemoveMultipleSpaces(),
            jiwer.RemovePunctuation(),
            jiwer.Strip(),
            jiwer.ReduceToListOfListOfWords()
        ])
        for file_name in os.listdir(self.folder_path):
            if file_name.endswith(".txt"):
                file_path = os.path.join(self.folder_path, file_name)
                with open(file_path, "r") as file:
                    transcribed_text = file.read()
                    wer = jiwer.wer(self.stock_phrase, transcribed_text, truth_transform=transformation, hypothesis_transform=transformation)
                    transcription_length = len(transcribed_text.split())
                    results.append({"file_name": file_name, "wer": wer, "transcription_length": transcription_length})
        return pd.DataFrame(results)

# Example usage
if __name__ == "__main__":
    SNR = "mp3s" #values are "mp3s", "40_SNR", "30_SNR", "20_SNR", "10_SNR", "0_SNR", "-10_SNR".
    folder_path = "base_model_transcription "+SNR
    wer_calculator = WERCalculator(folder_path)