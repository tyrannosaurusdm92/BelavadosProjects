from pydub import AudioSegment
import math

class AudioMixer:
    def __init__(self, snr):
        self.snr = snr

    def mix_audio_files(self, file1, file2, output_file):
        # Load the audio files
        audio1 = AudioSegment.from_file(file1)
        audio2 = AudioSegment.from_file(file2)

        # Determine the length of the shortest audio file
        min_length = min(len(audio1), len(audio2))

        # Crop the audio files to the shortest length
        audio1 = audio1[:min_length]
        audio2 = audio2[:min_length]

        # Calculate the power (RMS) of the audio signals
        power1 = audio1.rms
        power2 = audio2.rms

        # Calculate the desired RMS of the noise signal based on SNR
        desired_noise_rms = power1 / math.sqrt(10 ** (self.snr / 10))

        # Calculate current noise RMS ratio
        current_noise_ratio = desired_noise_rms / (power2 if power2 != 0 else 1)

        # Calculate the gain needed to adjust the noise signal
        noise_gain = 20 * math.log10(current_noise_ratio)

        # Adjust the gain of the noise signal
        noise = audio2 - audio2.dBFS + noise_gain

        # Mix the audio files by overlaying the noise signal on audio1
        mixed_audio = audio1.overlay(noise)

        # Export the mixed audio to an MP3 file
        mixed_audio.export(output_file, format='mp3')