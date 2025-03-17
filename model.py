import os
import http.server
import socketserver
from http import HTTPStatus
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import torch
import librosa
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import uvicorn
from io import BytesIO
from fastapi.middleware.wsgi import WSGIMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

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

# Update with the audio send from server API
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Load audio file from API request
    audio_bytes = await file.read()
    audio_stream = BytesIO(audio_bytes)
    audio, sr = librosa.load(audio_stream, sr=16000)

    # Transcribe the audio
    result = pipe({"array": audio, "sampling_rate": sr}, return_timestamps=True)
    return JSONResponse(content={"text": result["text"]})

# Custom HTTP Server Handler to use FastAPI with http.server
class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Simple response for GET requests
        self.send_response(HTTPStatus.OK)
        self.end_headers()

if __name__ == "__main__":
    port = int(os.getenv('PORT', 80))

    # Create the HTTP server, with FastAPI as the application
    httpd = socketserver.TCPServer(('', port), Handler)

    # Start FastAPI app as an ASGI application in the background
    from fastapi import FastAPI
    from uvicorn import Config, Server

    config = Config(app, host="0.0.0.0", port=8000)
    server = Server(config=config)

    # Run both custom HTTP server and FastAPI server
    try:
        # Start the FastAPI application in a separate thread or process
        server.run()
    except Exception as e:
        print(f"Error running server: {e}")
