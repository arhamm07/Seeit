// Voice Command Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const micBtn = document.querySelector('.mic-btn');
    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.querySelector('.send-btn');
    const uploadBtn = document.querySelector('.upload-btn');
    const cameraBtn = document.querySelector('.camera-btn');
    const readAloudBtn = document.querySelector('.read-aloud-btn');
    
    // Voice command indicator
    const voiceIndicator = document.createElement('div');
    voiceIndicator.className = 'voice-command-indicator';
    voiceIndicator.innerHTML = `
        <div class="voice-waves">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>
        <p>Listening for commands...</p>
    `;
    document.body.appendChild(voiceIndicator);
    
    // Voice recognition setup
    let recognition;
    let isListening = false;
    let isCommandMode = false;
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Handle recognition results
        recognition.onresult = function(event) {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            if (isCommandMode) {
                // Process as voice command
                processVoiceCommand(transcript.toLowerCase());
            } else {
                // Process as regular speech input
                promptInput.value = transcript;
            }
        };
        
        // Handle recognition end
        recognition.onend = function() {
            isListening = false;
            micBtn.style.color = '';
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceIndicator.classList.remove('active');
            
            if (isCommandMode) {
                isCommandMode = false;
                voiceIndicator.querySelector('p').textContent = 'Command mode ended';
                setTimeout(() => {
                    voiceIndicator.classList.remove('active');
                }, 1500);
            }
        };
        
        // Handle recognition errors
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            isListening = false;
            isCommandMode = false;
            micBtn.style.color = '';
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceIndicator.classList.remove('active');
        };
    }
    
    // Process voice commands
    function processVoiceCommand(command) {
        console.log('Voice command:', command);
        voiceIndicator.querySelector('p').textContent = `Command: "${command}"`;
        
        // Define command patterns
        if (command.includes('send') || command.includes('submit')) {
            // Send the prompt
            sendBtn.click();
            speak('Sending your prompt');
        } 
        else if (command.includes('upload') || command.includes('image')) {
            // Trigger upload
            uploadBtn.click();
            speak('Opening file upload');
        } 
        else if (command.includes('camera') || command.includes('photo') || command.includes('picture')) {
            // Trigger camera
            cameraBtn.click();
            speak('Opening camera');
        } 
        else if (command.includes('read') || command.includes('speak')) {
            // Read aloud
            readAloudBtn.click();
            speak('Reading response aloud');
        } 
        else if (command.includes('clear')) {
            // Clear the prompt
            promptInput.value = '';
            speak('Cleared input');
        } 
        else {
            // Unknown command
            speak('Sorry, I didn\'t understand that command');
        }
    }
    
    // Text-to-speech feedback
    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 0.8;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Double-tap mic button to enter command mode
    let tapCount = 0;
    let tapTimer;
    
    micBtn.addEventListener('click', function(e) {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }
        
        tapCount++;
        
        if (tapCount === 1) {
            tapTimer = setTimeout(() => {
                // Single tap - regular speech input
                tapCount = 0;
                toggleSpeechInput();
            }, 300);
        } else if (tapCount === 2) {
            // Double tap - voice command mode
            clearTimeout(tapTimer);
            tapCount = 0;
            toggleCommandMode();
        }
    });
    
    // Toggle regular speech input
    function toggleSpeechInput() {
        if (isListening) {
            stopListening();
        } else {
            startListening(false);
        }
    }
    
    // Toggle command mode
    function toggleCommandMode() {
        if (isListening) {
            stopListening();
        } else {
            startListening(true);
        }
    }
    
    // Start listening
    function startListening(commandMode) {
        try {
            recognition.start();
            isListening = true;
            isCommandMode = commandMode;
            
            micBtn.style.color = commandMode ? '#e74c3c' : '#3498db';
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            
            voiceIndicator.classList.add('active');
            voiceIndicator.querySelector('p').textContent = commandMode ? 
                'Listening for commands...' : 'Listening...';
            
            if (commandMode) {
                speak('Voice command mode activated');
            }
        } catch (error) {
            console.error('Speech recognition error:', error);
        }
    }
    
    // Stop listening
    function stopListening() {
        if (isListening) {
            recognition.stop();
        }
    }
    
    // Add CSS for voice command indicator
    const style = document.createElement('style');
    style.textContent = `
        .voice-command-indicator {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(52, 152, 219, 0.9);
            backdrop-filter: blur(10px);
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .voice-command-indicator.active {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        .voice-waves {
            display: flex;
            align-items: center;
            height: 30px;
        }
        
        .voice-waves span {
            display: block;
            width: 3px;
            height: 100%;
            margin: 0 2px;
            background-color: white;
            border-radius: 3px;
            animation: wave 1s infinite ease-in-out;
        }
        
        .voice-waves span:nth-child(1) { animation-delay: 0.0s; }
        .voice-waves span:nth-child(2) { animation-delay: 0.1s; }
        .voice-waves span:nth-child(3) { animation-delay: 0.2s; }
        .voice-waves span:nth-child(4) { animation-delay: 0.3s; }
        .voice-waves span:nth-child(5) { animation-delay: 0.4s; }
        
        @keyframes wave {
            0%, 100% { height: 5px; }
            50% { height: 20px; }
        }
        
        .voice-command-indicator p {
            margin: 0;
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);
    
    // Add tooltip to mic button
    const tooltip = document.createElement('div');
    tooltip.className = 'mic-tooltip';
    tooltip.textContent = 'Tip: Double-tap for voice commands';
    micBtn.appendChild(tooltip);
    
    // Add CSS for tooltip
    const tooltipStyle = document.createElement('style');
    tooltipStyle.textContent = `
        .mic-btn {
            position: relative;
        }
        
        .mic-tooltip {
            position: absolute;
            bottom: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: 10;
        }
        
        .mic-btn:hover .mic-tooltip {
            opacity: 1;
        }
    `;
    document.head.appendChild(tooltipStyle);
});
