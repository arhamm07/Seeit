// Typing Animation Effect for Response Text
document.addEventListener('DOMContentLoaded', function() {
    // Function to simulate typing animation
    function typeText(element, text, speed = 30) {
        let index = 0;
        
        // Clear existing content
        element.textContent = '';
        
        // Create a cursor element
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        cursor.textContent = '|';
        element.appendChild(cursor);
        
        // Start typing animation
        function type() {
            if (index < text.length) {
                // Create a new text node with the next character
                const char = document.createTextNode(text.charAt(index));
                element.insertBefore(char, cursor);
                index++;
                
                // Random delay for more natural typing effect
                const randomDelay = speed + (Math.random() * 50 - 25);
                setTimeout(type, randomDelay);
            } else {
                // Typing complete, blink cursor
                cursor.classList.add('blink');
                
                // Remove cursor after a delay
                setTimeout(() => {
                    cursor.remove();
                }, 3000);
            }
        }
        
        // Start typing
        setTimeout(type, 500);
    }
    
    // Override the default response handling in the main script
    const originalSendPrompt = window.sendPrompt;
    
    if (originalSendPrompt) {
        window.sendPrompt = function() {
            const promptInput = document.getElementById('promptInput');
            const responseContent = document.querySelector('.response-content');
            
            // If prompt is empty, don't proceed
            if (!promptInput.value.trim()) return;
            
            // Show loading indicator
            responseContent.innerHTML = '<div class="loading-animation"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
            
            // Simulate API call delay (this would be replaced with actual API call)
            setTimeout(() => {
                // Get sample response (in a real app, this would come from the API)
                const sampleResponse = "I've analyzed your image and can provide detailed information about what I see. The visual elements show a well-composed scene with interesting details. The lighting creates a pleasant atmosphere, and the colors work harmoniously together. If you have any specific questions about elements in this image, please feel free to ask for more details.";
                
                // Clear loading indicator
                responseContent.innerHTML = '<p></p>';
                
                // Apply typing effect to the response
                typeText(responseContent.querySelector('p'), sampleResponse);
            }, 2000);
            
            // Clear the prompt input
            promptInput.value = '';
        };
    }
    
    // Add CSS for typing cursor
    const style = document.createElement('style');
    style.textContent = `
        .typing-cursor {
            display: inline-block;
            width: 2px;
            margin-left: 2px;
            background-color: var(--secondary-dark);
            animation: blink 1s step-end infinite;
        }
        
        .typing-cursor.blink {
            animation: blink 0.7s step-end infinite;
        }
        
        @keyframes blink {
            from, to { opacity: 1; }
            50% { opacity: 0; }
        }
        
        .loading-animation {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            padding: 20px;
        }
        
        .loading-animation .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary-color);
            animation: bounce 1.5s infinite ease-in-out;
        }
        
        .loading-animation .dot:nth-child(1) {
            animation-delay: 0s;
        }
        
        .loading-animation .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .loading-animation .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes bounce {
            0%, 100% {
                transform: translateY(0);
                opacity: 0.5;
            }
            50% {
                transform: translateY(-15px);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});
