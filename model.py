import os
import sys
import json
import torch
import librosa
import warnings
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
warnings.filterwarnings("ignore", category=FutureWarning)

# Set device and torch dtype
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# print(torch.cuda.get_device_name(), file=sys.stderr)

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
    generate_kwargs={"task": "transcribe", "language": "en", "forced_decoder_ids": None}
)

def transcribe_audio(audio_path):
    """
    Transcribes an audio file and returns the transcription as a JSON object.

    Args:
        audio_path (str): Path to the audio file.

    Returns:
        dict: Transcription result in JSON format or None in case of an error.
    """
    try:
        # Ensure the file exists
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Load the audio file
        audio, sr = librosa.load(audio_path, sr=None)

        # Perform transcription using the pipeline
        result = pipe(audio)
        return {"text": result['text']}
    except Exception as ex:
        print(json.dumps({"error": str(ex)}), file=sys.stderr)
        return None

if __name__ == "__main__":
    try:
        # Get the audio file path from command-line arguments
        if len(sys.argv) < 2:
            raise ValueError("No audio file path provided. Usage: python model.py <audio_path>")

        audio_path = sys.argv[1]

        # Transcribe the audio file
        transcription = transcribe_audio(audio_path)
        
        # Output the transcription in JSON format
        if transcription:
            print(json.dumps(transcription))  # Outputs transcription to stdout for Node.js to read
        else:
            sys.exit(1)  # Exit with an error code if transcription failed

    except Exception as main_ex:
        # Handle any unexpected errors
        print(json.dumps({"error": str(main_ex)}), file=sys.stderr)
        sys.exit(1)
