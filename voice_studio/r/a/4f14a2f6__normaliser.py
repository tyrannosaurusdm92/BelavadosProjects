import string
from num2words import num2words
import os
import jiwer
class Normaliser:

    def normalise(self, text):
        text = self.normalize_numbers(text)
        text = self.remove_punctuation(text)
        text = self.remove_filler_words(text)
        text = self.lower_case(text)
        text = self.normalise_whitespace(text)
        return text

    def normalize_numbers(self, text):
        words = []
        for word in text.split():
            if word.isdigit():
                words.append(num2words(int(word)))
            else:
                words.append(word)
        return ' '.join(words)
    def remove_punctuation(self, text):
        return text.translate(str.maketrans('', '', string.punctuation))
    def remove_filler_words(self,text):
        filler_word_directory = "filler_words.txt"
        with open(filler_word_directory, "r") as file:
            filler_words = file.read().splitlines()
        words = []
        for word in text.split():
            if word not in filler_words:
                words.append(word)
        return ' '.join(words)
    def lower_case(self, text):
        return text.lower()
    def normalise_whitespace(self, text):
        return " ".join(text.split())



if __name__ == "__main__":
    # text1 = "Please call Stella.  Ask her to bring these things with her from the store:  Six spoons of fresh snow peas, five thick slabs of blue cheese, and maybe a snack for her brother Bob.  We also need a small plastic snake and a big toy frog for the kids.  She can scoop these things into three red bags, and we will go meet her Wednesday at the train station."
    # text = "The price is 100 dollars"
    # normaliser = Normaliser()
    # print(normaliser.normalise(text1))
    current_SNR = "mp3s" #values are "mp3s", "40_SNR", "30_SNR", "20_SNR", "10_SNR", "0_SNR", "-10_SNR".
    directory = "base_model_transcription"+" "+current_SNR
    new_directory = "normalised_transcriptions"+" "+current_SNR
    if not os.path.exists(new_directory):
        os.makedirs(new_directory)
    files = os.listdir(directory)
    for txt_file in files:
        with open(os.path.join(directory, txt_file), "r") as file:
            text = file.read()
            # text=normaliser.normalise(text)
            
            with open(os.path.join(new_directory, txt_file), "w") as file:
                file.write(text)
            