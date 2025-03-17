import os
import json
import torch
import librosa
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Set device and torch dtype
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Load model and processor
model_id = "openai/whisper-large-v3"
model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
)
model.to(device)
processor = AutoProcessor.from_pretrained(model_id)

# Set up pipeline
pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    torch_dtype=torch_dtype,
    device=device,
)

## Function to transcribe audio file
def transcribe_audio(audio_path):
    # Load audio file
    audio, sr = librosa.load(audio_path, sr=None)

    # Use the pipeline to transcribe the audio
    result = pipe(audio)

    # Create a JSON response with the transcription result
    transcription = {
        "text": result['text']
    }

    return transcription


# File system event handler for new audio files
class AudioFileHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        # Only process .mp3 and .webm files
        if event.src_path.endswith(('.mp3', '.webm')):
            transcription = transcribe_audio(event.src_path)

            # Output the transcription as JSON
            json.dumps(transcription, indent=4)


# Set up observer to monitor the folder for new files
upload_folder = '../uploads'
event_handler = AudioFileHandler()
observer = Observer()
observer.schedule(event_handler, path=upload_folder, recursive=False)

# Start monitoring the folder
observer.start()

try:
    while True:
        pass  # Keep the script running
except KeyboardInterrupt:
    observer.stop()
observer.join()
