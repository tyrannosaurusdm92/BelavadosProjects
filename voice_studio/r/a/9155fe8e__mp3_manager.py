import os
from mutagen.mp3 import MP3
from mixer import AudioMixer
from tqdm import tqdm


def delete_duplicate_mp3s(directory):
    mp3_files = [file for file in os.listdir(directory) if file.endswith('.mp3')]
    removed_files = []
    unremoved_files = []

    for mp3_file in mp3_files:
        if '_' in mp3_file:
            identifier = mp3_file.split('_')[0]
            if identifier+'.mp3' in mp3_files:
                #compare the filesizes
                file1 = os.path.join(directory, mp3_file)
                file2 = os.path.join(directory, identifier+'.mp3')
                if os.path.getsize(file1) == os.path.getsize(file2):
                    #move the files to a folder called duplicates
                    duplicate_directory = os.path.join(directory, 'duplicates')
                    os.makedirs(duplicate_directory, exist_ok=True)
                    os.rename(file1, os.path.join(duplicate_directory, mp3_file))

                    print(f"Removed {mp3_file} because it is a duplicate of {identifier}.mp3")
                    removed_files.append(mp3_file)
                else:
                    print(f"did not remove {mp3_file} because it is a different file size than {identifier}.mp3")
                    unremoved_files.append(mp3_file)
    return removed_files, unremoved_files
def longest_mp3(directory):
    mp3_files = [file for file in os.listdir(directory) if file.endswith('.mp3')]
    longest_mp3 = ''
    longest_duration = 0
    for mp3_file in mp3_files:
        duration = MP3(os.path.join(directory, mp3_file)).info.length
        if duration > longest_duration:
            longest_duration = duration
            longest_mp3 = mp3_file
    return longest_mp3, longest_duration
def mix_audio_files(ratio, output_directory):
    mixer = AudioMixer(ratio)
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
    for file in tqdm(os.listdir('mp3s')):
        if file.endswith('.mp3'):
            
            output_file = os.path.join(output_directory, file)
            
                
            file_2 = 'white_noise.mp3'
            mixer.mix_audio_files('mp3s/'+file, file_2, output_file)

# Usage example

if __name__ == "__main__":
    directory = 'mp3s'
    removed_files, unremoved_files =delete_duplicate_mp3s(directory)
    print(f"Removed files: {removed_files}")
    print(f"Unremoved files: {unremoved_files}")
    longest_mp3_name, longest_duration = longest_mp3(directory)
    print(f"The longest mp3 is {longest_mp3_name} and is {longest_duration} seconds long")
    mix_audio_files(-10, '-10_SNR/')

