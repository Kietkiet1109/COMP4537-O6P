// Send a command to EV3
function sendEV3Command(command) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(command);
        console.log(`Sent to EV3: ${command}`);
    } else {
        console.log('WebSocket not connected');
    }
}

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
                    return alert("Your browser does not support audio recording.");                

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
                } 
                else
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
                        const response = await fetch('https://exo-engine.com/COMP4537/TermProject/LegoControl/api/v3/currentUser', {
                            method: 'GET',
                            headers: { "Authorization": `Bearer ${ localStorage.getItem("authToken") }`}
                        });

                        if (!response.ok)                        
                            return alert("Unable to fetch user data.");                        

                        const res = await response.json();
                        console.log("User data:", res);
                        // Upload WAV to the server
                        const formData = new FormData();
                        formData.append("audioFile", blob, "recording.wav");
                        formData.append("apiKey", res.user.apiKey); // Add API key to the request body

                        try
                        {
                            const jwtToken = localStorage.getItem("authToken");
                            if (!jwtToken)
                            {
                                window.location.href = "/";
                                return alert("You are not logged in. Redirecting to login...");
                            }

                            const uploadResponse = await fetch("https://exo-engine.com/COMP4537/TermProject/LegoControl/api/v3", {
                                method: "POST",
                                headers: { "Authorization": `Bearer ${ jwtToken }`},
                                body: formData // Include API key in the request body
                            });

                            if (uploadResponse.ok)
                            {
                                const result = await uploadResponse.json();
                                document.getElementById("result").innerHTML = `Command: ${ result.transcription }`;
                                setTimeout(() => {
                                    sendEV3Command(result.transcription);
                                }, 2000);
                                alert("WAV uploaded successfully!");
                            } 
                            else
                            {
                                console.error("Failed to upload WAV:", uploadResponse.status, uploadResponse.statusText);
                                alert("WAV upload failed!");
                            }
                        } 
                        catch (uploadError)
                        {
                            console.error("Error uploading WAV:", uploadError);
                            alert("An error occurred during upload.");
                        }
                    });

                    this.innerText = "Start Recording";
                    this.classList.replace("btn-danger", "btn-primary");
                }
            } 
            catch (err)
            {
                console.error("Error during recording:", err);
                alert("An error occurred. Please check your microphone permissions and try again.");
            }
        });
    }
});
