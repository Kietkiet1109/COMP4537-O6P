document.addEventListener("DOMContentLoaded", async function () {
    const recordButton = document.getElementById("recordButton");

    let mediaRecorder;
    let audioChunks = [];

    if (recordButton) {
        recordButton.addEventListener("click", async function () {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    alert("Your browser does not support audio recording.");
                    return;
                }

                if (!mediaRecorder || mediaRecorder.state === "inactive") {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];

                    mediaRecorder.ondataavailable = event => {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                        const audioUrl = URL.createObjectURL(audioBlob);

                        // Convert WebM to MP3 using ffmpeg.wasm
                        const { createFFmpeg, fetchFile } = FFmpeg;
                        const ffmpeg = createFFmpeg({ log: true });
                        await ffmpeg.load();

                        ffmpeg.FS("writeFile", "input.webm", await fetchFile(audioBlob));
                        await ffmpeg.run("-i", "input.webm", "output.mp3");
                        const mp3Data = ffmpeg.FS("readFile", "output.mp3");

                        const mp3Blob = new Blob([mp3Data.buffer], { type: "audio/mp3" });
                        const mp3Url = URL.createObjectURL(mp3Blob);

                        // Play MP3 audio
                        const audioPlayback = document.getElementById("audioPlayback");
                        if (audioPlayback) {
                            audioPlayback.src = mp3Url;
                            audioPlayback.style.display = "block";
                        }

                        // Upload MP3 to the server
                        const formData = new FormData();
                        formData.append("audioFile", mp3Blob, "recording.mp3");

                        try {
                            const response = await fetch("https://exo-engine.com/COMP4537/TermProject/LegoControl/api", {
                                method: "POST",
                                body: formData
                            });

                            if (response.ok) {
                                const result = await response.json();
                                document.getElementById("result").innerHTML = `Command: ${result.transcription}`;
                                alert("MP3 uploaded successfully!");
                            } else {
                                console.error("Failed to upload MP3:", response.status, response.statusText);
                                alert("MP3 upload failed!");
                            }
                        } catch (uploadError) {
                            console.error("Error uploading MP3:", uploadError);
                            alert("An error occurred during upload.");
                        }
                    };

                    mediaRecorder.start();
                    console.log("Recording started.");
                    this.innerText = "Stop Recording";
                    this.classList.replace("btn-primary", "btn-danger");
                } else {
                    console.log("Stopping recording...");
                    mediaRecorder.stop();
                    this.innerText = "Start Recording";
                    this.classList.replace("btn-danger", "btn-primary");
                }
            } catch (err) {
                console.error("Error during recording:", err);
                alert("An error occurred. Please check your microphone permissions and try again.");
            }
        });
    }

});
