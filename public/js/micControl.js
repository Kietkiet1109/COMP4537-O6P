let mediaRecorder;
let audioChunks = [];

document.addEventListener("DOMContentLoaded", function () {
    console.log("Script loaded and DOM fully initialized."); // Debugging

    const recordButton = document.getElementById("recordButton");
    if (!recordButton) {
        console.error("Record button not found!"); // Debugging
        return;
    }

    recordButton.addEventListener("click", async function () {
        console.log("Record button clicked."); // Debugging

        try {
            if (!mediaRecorder || mediaRecorder.state === "inactive") {
                console.log("Starting recording..."); // Debugging

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("Microphone access granted."); // Debugging

                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = event => {
                    console.log("Audio chunk received."); // Debugging
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    console.log("Recording stopped. Processing audio..."); // Debugging

                    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audioPlayback = document.getElementById("audioPlayback");

                    if (audioPlayback) {
                        console.log("Audio ready for playback:", audioUrl); // Debugging
                        audioPlayback.src = audioUrl;
                        audioPlayback.style.display = "block";
                    } else {
                        console.error("Audio playback element not found."); // Debugging
                    }
                };

                mediaRecorder.start();
                console.log("Recording started."); // Debugging
                this.innerText = "Stop Recording";
                this.classList.replace("btn-primary", "btn-danger");
            } else {
                console.log("Stopping recording..."); // Debugging
                mediaRecorder.stop();
                this.innerText = "Start Recording";
                this.classList.replace("btn-danger", "btn-primary");
            }
        } catch (err) {
            console.error("Error during recording:", err); // Debugging
        }
    });
});