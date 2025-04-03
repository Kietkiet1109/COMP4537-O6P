document.addEventListener("DOMContentLoaded", async function ()
{
    const recordButton = document.getElementById("recordButton");

    let recorder; // Recorder.js instance
    let audioContext; // AudioContext instance
    let isRecording = false;

    if (recordButton)
    {
        recordButton.addEventListener("click", async function ()
        {
            try
            {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
                {
                    alert("Your browser does not support audio recording.");
                    return;
                }

                if (!isRecording)
                {
                    // Start recording
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const input = audioContext.createMediaStreamSource(stream);

                    recorder = new Recorder(input, { numChannels: 1 }); // Mono channel
                    recorder.record();

                    isRecording = true;
                    console.log("Recording started.");
                    this.innerText = "Stop Recording";
                    this.classList.replace("btn-primary", "btn-danger");
                } else
                {
                    // Stop recording and process the WAV file
                    recorder.stop();
                    isRecording = false;
                    console.log("Recording stopped.");

                    recorder.exportWAV(async (blob) =>
                    {
                        const wavUrl = URL.createObjectURL(blob);

                        // Play WAV audio
                        const audioPlayback = document.getElementById("audioPlayback");
                        if (audioPlayback)
                        {
                            audioPlayback.src = wavUrl;
                            audioPlayback.style.display = "block";
                        }

                        // Retrieve user details from the server
                        const response = await fetch('/api/v3/currentUser', {
                            method: 'GET',
                            headers: {
                                "Authorization": `Bearer ${ localStorage.getItem("authToken") }`
                            }
                        });

                        if (!response.ok)
                        {
                            alert("Unable to fetch user data.");
                            return;
                        }

                        const user = await response.json();

                        // Upload WAV to the server
                        const formData = new FormData();
                        formData.append("audioFile", blob, "recording.wav");
                        formData.append("key", user.apiKey); // Add API key to the request body

                        try
                        {
                            const uploadResponse = await fetch("https://exo-engine.com/COMP4537/TermProject/LegoControl/api/v3", {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${ localStorage.getItem("authToken") }`
                                },
                                body: formData
                            });

                            if (uploadResponse.ok)
                            {
                                const result = await uploadResponse.json();
                                document.getElementById("result").innerHTML = `Command: ${ result.transcription }`;
                                alert("WAV uploaded successfully!");
                            } else
                            {
                                console.error("Failed to upload WAV:", uploadResponse.status, uploadResponse.statusText);
                                alert("WAV upload failed!");
                            }
                        } catch (uploadError)
                        {
                            console.error("Error uploading WAV:", uploadError);
                            alert("An error occurred during upload.");
                        }
                    });

                    this.innerText = "Start Recording";
                    this.classList.replace("btn-danger", "btn-primary");
                }
            } catch (err)
            {
                console.error("Error during recording:", err);
                alert("An error occurred. Please check your microphone permissions and try again.");
            }
        });
    }
});
