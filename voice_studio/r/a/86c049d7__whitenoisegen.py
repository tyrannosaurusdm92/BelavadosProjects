import numpy as np
import soundfile as sf
if __name__ == "__main__":
    # Set the duration in seconds
    duration = 100

    # Set the sample rate (number of samples per second)
    sample_rate = 44100

    # Calculate the total number of samples
    total_samples = duration * sample_rate

    # Generate white noise
    white_noise = np.random.normal(0, 1, total_samples)

    # Scale the white noise to the desired range (-1 to 1)
    white_noise = white_noise / np.max(np.abs(white_noise))


    

    # Set the output file name
    output_file = 'white_noise.mp3'

    # Convert the white noise to 16-bit PCM audio
    white_noise_pcm = (white_noise * 32767).astype(np.int16)

    # Save the white noise as an MP3 file
    sf.write(output_file, white_noise_pcm, sample_rate, format='mp3')