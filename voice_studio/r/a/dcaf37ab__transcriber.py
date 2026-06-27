import whisper
from progress.bar import Bar
import os
from tqdm import tqdm

def transcribe_directory(directory,output_directory, fromStart=True):

    model = whisper.load_model("base")
    #use progress.bar to show progress


    

    for filename in tqdm(os.listdir(directory) ):
        
        if filename.lower().endswith(('.mp3')):
            #Check if already transcribed
            if  (not os.path.exists(os.path.join(output_directory, f"{filename}.txt"))) or fromStart==True :
                file_path = os.path.join(directory, filename)
                

                # Transcribe the audio
                result = model.transcribe(file_path, language="en", fp16=False)

                # Save the transcription
                with open(os.path.join(output_directory, f"{filename}.txt"), "w") as text_file:
                    text_file.write(result["text"])
def transcribe_file(file_path,output_directory):
    model = whisper.load_model("base")
    # Transcribe the audio
    result = model.transcribe(file_path, language="en", fp16=False)
    #save the transcription
    with open(output_directory, "w") as text_file:
        text_file.write(result["text"])


                    


if __name__ == "__main__":
    # directory = "0_SNR"
    # output_directory = "base_model_transcription "+directory  # Replace with your directory path
    # if not os.path.exists(output_directory):

        
    #     os.makedirs(output_directory)
    # transcribe_directory(directory,output_directory)
    # print("Transcription completed")
    transcribe_file("mp3s/haitian creole french3.mp3","base_model_transcription mp3s/haitian creole french3.mp3.txt")
    