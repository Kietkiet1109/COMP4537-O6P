import torch
import librosa
import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from io import BytesIO

# FastAPI app setup
app = FastAPI()

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

# API endpoint to transcribe the audio
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Load audio file from API request
    audio_bytes = await file.read()
    audio_stream = BytesIO(audio_bytes)
    audio, sr = librosa.load(audio_stream, sr=None)

    # Use the pipeline to transcribe the audio
    result = pipe(audio)

    # Return the transcription text in the response
    return JSONResponse(content={"text": result['text']})

# Run the app using Uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
