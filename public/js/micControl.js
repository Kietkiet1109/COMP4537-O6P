// let mediaRecorder;
// let audioChunks = [];

// document.addEventListener("DOMContentLoaded", function () {
//     console.log("Script loaded and DOM fully initialized."); // Debugging

//     const recordButton = document.getElementById("recordButton");
//     if (!recordButton) {
//         console.error("Record button not found!"); // Debugging
//         return;
//     }

//     recordButton.addEventListener("click", async function () {
//         console.log("Record button clicked."); // Debugging

//         try {
//             if (!mediaRecorder || mediaRecorder.state === "inactive") {
//                 console.log("Starting recording..."); // Debugging

//                 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//                 console.log("Microphone access granted."); // Debugging

//                 mediaRecorder = new MediaRecorder(stream);
//                 audioChunks = [];

//                 mediaRecorder.ondataavailable = event => {
//                     console.log("Audio chunk received."); // Debugging
//                     audioChunks.push(event.data);
//                 };

//                 mediaRecorder.onstop = () => {
//                     console.log("Recording stopped. Processing audio..."); // Debugging

//                     const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
//                     const audioUrl = URL.createObjectURL(audioBlob);
//                     const audioPlayback = document.getElementById("audioPlayback");

//                     if (audioPlayback) {
//                         console.log("Audio ready for playback:", audioUrl); // Debugging
//                         audioPlayback.src = audioUrl;
//                         audioPlayback.style.display = "block";
//                     } else {
//                         console.error("Audio playback element not found."); // Debugging
//                     }
//                 };

//                 mediaRecorder.start();
//                 console.log("Recording started."); // Debugging
//                 this.innerText = "Stop Recording";
//                 this.classList.replace("btn-primary", "btn-danger");
//             } else {
//                 console.log("Stopping recording..."); // Debugging
//                 mediaRecorder.stop();
//                 this.innerText = "Start Recording";
//                 this.classList.replace("btn-danger", "btn-primary");
//             }
//         } catch (err) {
//             console.error("Error during recording:", err); // Debugging
//         }
//     });
// });
let mediaRecorder;
let audioChunks = [];

document.addEventListener("DOMContentLoaded", function ()
{
    console.log("Script loaded and DOM fully initialized."); // Debugging

    const recordButton = document.getElementById("recordButton");
    if (!recordButton)
    {
        console.error("Record button not found!"); // Debugging
        return;
    }

    recordButton.addEventListener("click", async function ()
    {
        console.log("Record button clicked."); // Debugging

        try
        {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
            {
                alert("Your browser does not support audio recording. Please try using a modern browser like Chrome or Firefox.");
                return;
            }

            if (!mediaRecorder || mediaRecorder.state === "inactive")
            {
                console.log("Starting recording..."); // Debugging

                // Request microphone access
                const permissionStatus = await navigator.permissions.query({ name: "microphone" });
                if (permissionStatus.state === "denied")
                {
                    alert("Microphone access is denied. Please enable it in your browser settings.");
                    return;
                } else if (permissionStatus.state === "prompt")
                {
                    alert("The browser will now ask for microphone access. Please grant permission.");
                }

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("Microphone access granted."); // Debugging

                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = event =>
                {
                    console.log("Audio chunk received."); // Debugging
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () =>
                {
                    console.log("Recording stopped. Processing audio..."); // Debugging

                    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Play back the recorded audio
                    const audioPlayback = document.getElementById("audioPlayback");
                    if (audioPlayback)
                    {
                        console.log("Audio ready for playback:", audioUrl); // Debugging
                        audioPlayback.src = audioUrl;
                        audioPlayback.style.display = "block";
                    } else
                    {
                        console.error("Audio playback element not found."); // Debugging
                    }

                    // Upload the audio file to the API
                    console.log("Uploading audio to the server..."); // Debugging
                    const formData = new FormData();
                    formData.append("audioFile", audioBlob, "recording.webm");

                    try
                    {
                        const response = await fetch("https://exo-engine.com/COMP4537/TermProject/LegoControl/api", {
                            method: "POST",
                            body: formData
                        });

                        if (response.ok)
                        {
                            const result = await response.json();
                            console.log("Server Response:", result); // Debugging
                            alert("Audio uploaded successfully!");
                        } else
                        {
                            console.error("Failed to upload audio:", response.status, response.statusText);
                            alert("Audio upload failed!");
                        }
                    } catch (uploadError)
                    {
                        console.error("Error uploading audio:", uploadError);
                        alert("An error occurred during upload.");
                    }
                };

                mediaRecorder.start();
                console.log("Recording started."); // Debugging
                this.innerText = "Stop Recording";
                this.classList.replace("btn-primary", "btn-danger");
            } else
            {
                console.log("Stopping recording..."); // Debugging
                mediaRecorder.stop();
                this.innerText = "Start Recording";
                this.classList.replace("btn-danger", "btn-primary");
            }
        } catch (err)
        {
            console.error("Error during recording:", err); // Debugging
            alert("An error occurred. Please check your microphone permissions and try again.");
        }
    });
});

