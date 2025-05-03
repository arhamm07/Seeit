document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const cameraBtn = document.querySelector('.camera-btn');
    const removeBtn = document.querySelector('.remove-btn');
    const micBtn = document.querySelector('.mic-btn');
    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.querySelector('.send-btn');
    const responseContent = document.querySelector('.response-content');
    const fontControlBtn = document.querySelector('.font-control-btn');
    const languageBtn = document.querySelector('.language-btn');
    const readAloudBtn = document.querySelector('.read-aloud-btn');
    const thumbsUpBtn = document.querySelector('.thumbs-up');
    const thumbsDownBtn = document.querySelector('.thumbs-down');
    
    // Webcam variables
    let stream = null;
    let videoElement = null;
    let isWebcamActive = false;
    
    // Speech recognition variables
    let recognition = null;
    let isListening = false;
    
    // Speech synthesis variables
    let speechSynthesis = window.speechSynthesis;
    let speechUtterance = null;
    let isSpeaking = false;
    
    // Font and language variables
    let currentFontSize = 'medium';
    let currentLanguage = 'en-US';
    const availableFontSizes = ['small', 'medium', 'large'];
    const availableLanguages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'es-ES', name: 'Spanish' },
        { code: 'fr-FR', name: 'French' },
        { code: 'de-DE', name: 'German' },
        { code: 'zh-CN', name: 'Chinese (Simplified)' },
        { code: 'ja-JP', name: 'Japanese' },
        { code: 'ru-RU', name: 'Russian' }
    ];

    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLanguage;
        
        recognition.onresult = function(event) {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
                
            promptInput.value = transcript;
        };
        
        recognition.onend = function() {
            isListening = false;
            micBtn.style.color = '#ccc';
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            isListening = false;
            micBtn.style.color = '#ccc';
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            alert('Speech recognition error: ' + event.error);
        };
    }

    // Handle file upload via button
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle remove button click
    removeBtn.addEventListener('click', removeUploadedImage);

    // Handle file selection
    fileInput.addEventListener('change', handleFileSelect);

    // Handle drag and drop
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('active');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('active');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // Click on drop area to select file
    dropArea.addEventListener('click', () => {
        if (!isWebcamActive) {
            fileInput.click();
        } else {
            capturePhoto();
        }
    });

    // Camera button functionality
    cameraBtn.addEventListener('click', toggleWebcam);

    // Microphone button functionality
    micBtn.addEventListener('click', toggleSpeechRecognition);

    // Font control button functionality
    fontControlBtn.addEventListener('click', toggleFontSizeMenu);

    // Language button functionality
    languageBtn.addEventListener('click', toggleLanguageMenu);

    // Read aloud button functionality
    readAloudBtn.addEventListener('click', toggleReadAloud);

    // Feedback buttons functionality
    thumbsUpBtn.addEventListener('click', () => {
        thumbsUpBtn.style.color = '#4CAF50';
        thumbsDownBtn.style.color = '#ccc';
        
        // Get the current prompt and response
        const prompt = promptInput.value.trim() || 'No prompt available';
        const responseText = responseContent.textContent.trim();
        
        // Send feedback to the backend
        sendFeedback('positive', prompt, responseText);
    });

    thumbsDownBtn.addEventListener('click', () => {
        thumbsDownBtn.style.color = '#F44336';
        thumbsUpBtn.style.color = '#ccc';
        
        // Get the current prompt and response
        const prompt = promptInput.value.trim() || 'No prompt available';
        const responseText = responseContent.textContent.trim();
        
        // Send feedback to the backend
        sendFeedback('negative', prompt, responseText);
    });

    // Function to send feedback to the backend
    function sendFeedback(rating, prompt, response) {
        fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rating: rating,
                prompt: prompt,
                response: response,
                language: currentLanguage
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Show a subtle notification
                const feedbackMsg = document.createElement('div');
                feedbackMsg.className = 'feedback-message';
                feedbackMsg.textContent = 'Thank you for your feedback!';
                document.querySelector('.feedback-container').appendChild(feedbackMsg);
                
                // Remove the message after 3 seconds
                setTimeout(() => {
                    feedbackMsg.remove();
                }, 3000);
            }
        })
        .catch(error => {
            console.error('Error sending feedback:', error);
            // Silently fail - don't bother the user with feedback submission errors
        });
    }

    // Send prompt
    sendBtn.addEventListener('click', sendPrompt);
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrompt();
        }
    });

    // Speech Recognition Functions
    function toggleSpeechRecognition() {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }
        
        if (isListening) {
            stopSpeechRecognition();
        } else {
            startSpeechRecognition();
        }
    }
    
    function startSpeechRecognition() {
        try {
            recognition.start();
            isListening = true;
            micBtn.style.color = '#6c5ce7';
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            promptInput.placeholder = 'Listening...';
        } catch (error) {
            console.error('Speech recognition error:', error);
            alert('Could not start speech recognition. Please try again.');
        }
    }
    
    function stopSpeechRecognition() {
        if (isListening) {
            recognition.stop();
            isListening = false;
            micBtn.style.color = '#ccc';
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            promptInput.placeholder = 'Enter your prompt here...';
        }
    }

    // Font Size Control Functions
    function toggleFontSizeMenu() {
        console.log('Font button clicked');
        
        // Remove any existing menus
        removeFontSizeMenu();
        removeLanguageMenu();
        
        // Create the font size menu
        const fontMenu = document.createElement('div');
        fontMenu.className = 'dropdown-menu font-size-menu';
        fontMenu.style.position = 'absolute';
        fontMenu.style.top = '30px';
        fontMenu.style.right = '0';
        fontMenu.style.zIndex = '1000';
        
        // Add font size options
        for (const size of availableFontSizes) {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            if (size === currentFontSize) {
                option.classList.add('active');
            }
            option.textContent = capitalizeFirstLetter(size);
            option.onclick = function() {
                setFontSize(size);
                removeFontSizeMenu();
            };
            fontMenu.appendChild(option);
        }
        
        // Add the menu to the DOM
        document.querySelector('.response-controls').appendChild(fontMenu);
        
        // Add event listener to close the menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 100);
    }
    
    function removeFontSizeMenu() {
        const menu = document.querySelector('.font-size-menu');
        if (menu) {
            menu.remove();
            document.removeEventListener('click', handleOutsideClick);
        }
    }
    
    function setFontSize(size) {
        console.log('Setting font size to:', size);
        currentFontSize = size;
        
        // Remove any existing font size classes
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        
        // Add the new font size class to the body
        document.body.classList.add('font-' + size);
        
        // Store the preference in localStorage for persistence
        localStorage.setItem('preferredFontSize', size);
        
        // Visual feedback
        fontControlBtn.style.color = '#6c5ce7';
        setTimeout(() => {
            fontControlBtn.style.color = '#888';
        }, 500);
    }
    
    // Language Selection Functions
    function toggleLanguageMenu() {
        console.log('Language button clicked');
        
        // Remove any existing menus
        removeLanguageMenu();
        removeFontSizeMenu();
        
        // Create the language menu
        const langMenu = document.createElement('div');
        langMenu.className = 'dropdown-menu language-menu';
        langMenu.style.position = 'absolute';
        langMenu.style.top = '30px';
        langMenu.style.right = '0';
        langMenu.style.zIndex = '1000';
        
        // Add language options
        for (const lang of availableLanguages) {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            if (lang.code === currentLanguage) {
                option.classList.add('active');
            }
            option.textContent = lang.name;
            option.onclick = function() {
                setLanguage(lang.code);
                removeLanguageMenu();
            };
            langMenu.appendChild(option);
        }
        
        // Add the menu to the DOM
        document.querySelector('.response-controls').appendChild(langMenu);
        
        // Add event listener to close the menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 100);
    }
    
    function removeLanguageMenu() {
        const menu = document.querySelector('.language-menu');
        if (menu) {
            menu.remove();
            document.removeEventListener('click', handleOutsideClick);
        }
    }
    
    function setLanguage(langCode) {
        console.log('Setting language to:', langCode);
        currentLanguage = langCode;
        
        // Set the language attribute on the html element
        document.documentElement.lang = langCode.split('-')[0];
        
        // Update speech recognition language if available
        if (recognition) {
            recognition.lang = langCode;
        }
        
        // Store the preference in localStorage for persistence
        localStorage.setItem('preferredLanguage', langCode);
        
        // Update any text elements that need translation
        updateUILanguage(langCode);
        
        // Visual feedback
        languageBtn.style.color = '#6c5ce7';
        setTimeout(() => {
            languageBtn.style.color = '#888';
        }, 500);
    }
    
    // Function to update UI text based on selected language
    function updateUILanguage(langCode) {
        // This is a simplified implementation
        // In a real app, you would use a proper i18n library
        const translations = {
            'en-US': {
                mainTitle: 'Ask AI Assistant',
                subtitle: 'Upload an image, ask through AI or input a prompt',
                visualInput: 'Visual Input',
                uploadPrompt: 'Just drag, select or upload an image',
                promptPlaceholder: 'Enter your prompt here...',
                uploadBtn: 'Upload',
                cameraBtn: 'Camera',
                takePhotoBtn: 'Take Photo',
                closeCamera: 'Close Camera',
                responseTitle: 'Response',
                noResponse: 'Submit a prompt to see the response...',
                feedbackQuestion: 'Was this response helpful?',
                copyright: ' 2025 Seeit AI Inc. All rights reserved.',
                exploreBtn: 'Explore'
            },
            'es-ES': {
                mainTitle: 'Preguntar al Asistente de IA',
                subtitle: 'Sube una imagen, pregunta a través de IA o introduce un texto',
                visualInput: 'Entrada Visual',
                uploadPrompt: 'Arrastra, selecciona o sube una imagen',
                promptPlaceholder: 'Ingresa tu consulta aquí...',
                uploadBtn: 'Subir',
                cameraBtn: 'Cámara',
                takePhotoBtn: 'Tomar Foto',
                closeCamera: 'Cerrar Cámara',
                responseTitle: 'Respuesta',
                noResponse: 'Envía una consulta para ver la respuesta...',
                feedbackQuestion: '¿Fue útil esta respuesta?',
                copyright: ' 2025 Seeit AI Inc. Todos los derechos reservados.',
                exploreBtn: 'Explorar'
            },
            'fr-FR': {
                mainTitle: 'Demander à l\'Assistant IA',
                subtitle: 'Téléchargez une image, posez une question via l\'IA ou saisissez une requête',
                visualInput: 'Entrée Visuelle',
                uploadPrompt: 'Glissez, sélectionnez ou téléchargez une image',
                promptPlaceholder: 'Entrez votre demande ici...',
                uploadBtn: 'Télécharger',
                cameraBtn: 'Caméra',
                takePhotoBtn: 'Prendre Photo',
                closeCamera: 'Fermer Caméra',
                responseTitle: 'Réponse',
                noResponse: 'Soumettez une demande pour voir la réponse...',
                feedbackQuestion: 'Cette réponse a-t-elle été utile?',
                copyright: ' 2025 Seeit AI Inc. Tous droits réservés.',
                exploreBtn: 'Explorer'
            },
            'de-DE': {
                mainTitle: 'KI-Assistent Fragen',
                subtitle: 'Laden Sie ein Bild hoch, fragen Sie über KI oder geben Sie eine Anfrage ein',
                visualInput: 'Visuelle Eingabe',
                uploadPrompt: 'Ziehen, wählen oder laden Sie ein Bild hoch',
                promptPlaceholder: 'Geben Sie Ihre Anfrage hier ein...',
                uploadBtn: 'Hochladen',
                cameraBtn: 'Kamera',
                takePhotoBtn: 'Foto Aufnehmen',
                closeCamera: 'Kamera Schließen',
                responseTitle: 'Antwort',
                noResponse: 'Stellen Sie eine Anfrage, um die Antwort zu sehen...',
                feedbackQuestion: 'War diese Antwort hilfreich?',
                copyright: ' 2025 Seeit AI Inc. Alle Rechte vorbehalten.',
                exploreBtn: 'Erkunden'
            },
            'zh-CN': {
                mainTitle: '询问AI助手',
                subtitle: '上传图像，通过AI提问或输入提示',
                visualInput: '视觉输入',
                uploadPrompt: '拖动、选择或上传图像',
                promptPlaceholder: '在此输入您的提示...',
                uploadBtn: '上传',
                cameraBtn: '相机',
                takePhotoBtn: '拍照',
                closeCamera: '关闭相机',
                responseTitle: '回复',
                noResponse: '提交提示以查看回复...',
                feedbackQuestion: '这个回答有帮助吗？',
                copyright: ' 2025 Seeit AI Inc. 保留所有权利。',
                exploreBtn: '探索'
            },
            'ja-JP': {
                mainTitle: 'AIアシスタントに質問する',
                subtitle: '画像をアップロード、AIに質問、またはプロンプトを入力',
                visualInput: '視覚入力',
                uploadPrompt: '画像をドラッグ、選択、またはアップロード',
                promptPlaceholder: 'ここにプロンプトを入力...',
                uploadBtn: 'アップロード',
                cameraBtn: 'カメラ',
                takePhotoBtn: '写真を撮る',
                closeCamera: 'カメラを閉じる',
                responseTitle: '応答',
                noResponse: '応答を表示するにはプロンプトを送信してください...',
                feedbackQuestion: 'この回答は役に立ちましたか？',
                copyright: ' 2025 Seeit AI Inc. 全著作権所有。',
                exploreBtn: '探索'
            },
            'ru-RU': {
                mainTitle: 'Спросить ИИ-ассистента',
                subtitle: 'Загрузите изображение, задайте вопрос через ИИ или введите запрос',
                visualInput: 'Визуальный ввод',
                uploadPrompt: 'Перетащите, выберите или загрузите изображение',
                promptPlaceholder: 'Введите ваш запрос здесь...',
                uploadBtn: 'Загрузить',
                cameraBtn: 'Камера',
                takePhotoBtn: 'Сделать фото',
                closeCamera: 'Закрыть камеру',
                responseTitle: 'Ответ',
                noResponse: 'Отправьте запрос, чтобы увидеть ответ...',
                feedbackQuestion: 'Был ли этот ответ полезным?',
                copyright: ' 2025 Seeit AI Inc. Все права защищены.',
                exploreBtn: 'Исследовать'
            }
        };
        
        // Default to English if translation not available
        const texts = translations[langCode] || translations['en-US'];
        
        // Update UI elements with translated text
        try {
            // Main headings
            const mainTitleElement = document.querySelector('h2');
            if (mainTitleElement) {
                mainTitleElement.textContent = texts.mainTitle;
            }
            
            const subtitleElement = document.querySelector('.subtitle');
            if (subtitleElement) {
                subtitleElement.textContent = texts.subtitle;
            }
            
            // Tab
            const tabElement = document.querySelector('.tab-btn');
            if (tabElement) {
                tabElement.textContent = texts.visualInput;
            }
            
            // Upload area text
            const uploadPromptElement = document.querySelector('.upload-placeholder p');
            if (uploadPromptElement) {
                uploadPromptElement.textContent = texts.uploadPrompt;
            }
            
            // Buttons
            const uploadBtnElement = document.querySelector('.upload-btn');
            if (uploadBtnElement) {
                // Preserve the icon
                const icon = uploadBtnElement.querySelector('i').outerHTML;
                uploadBtnElement.innerHTML = icon + ' ' + texts.uploadBtn;
            }
            
            const cameraBtnElement = document.querySelector('.camera-btn');
            if (cameraBtnElement && !isWebcamActive) {
                // Preserve the icon
                const icon = cameraBtnElement.querySelector('i').outerHTML;
                cameraBtnElement.innerHTML = icon + ' ' + texts.cameraBtn;
            } else if (cameraBtnElement && isWebcamActive) {
                // If webcam is active, use the close camera text
                const icon = '<i class="fas fa-times"></i>';
                cameraBtnElement.innerHTML = icon + ' ' + texts.closeCamera;
            }
            
            // Update capture button if it exists
            const captureBtnElement = document.querySelector('.capture-btn');
            if (captureBtnElement) {
                captureBtnElement.textContent = texts.takePhotoBtn;
            }
            
            // Prompt placeholder
            const promptInputElement = document.getElementById('promptInput');
            if (promptInputElement) {
                promptInputElement.placeholder = texts.promptPlaceholder;
            }
            
            // Response title
            const responseTitleElement = document.querySelector('.response-header h3');
            if (responseTitleElement) {
                responseTitleElement.textContent = texts.responseTitle;
            }
            
            // Response placeholder
            const responsePlaceholderElement = document.querySelector('.response-placeholder');
            if (responsePlaceholderElement) {
                responsePlaceholderElement.textContent = texts.noResponse;
            }
            
            // Feedback question
            const feedbackQuestionElement = document.querySelector('.feedback-container p');
            if (feedbackQuestionElement) {
                feedbackQuestionElement.textContent = texts.feedbackQuestion;
            }
            
            // Footer copyright
            const copyrightElement = document.querySelector('footer p');
            if (copyrightElement) {
                copyrightElement.innerHTML = texts.copyright;
            }
            
            // Explore button
            const exploreBtnElement = document.querySelector('.explore-btn');
            if (exploreBtnElement) {
                exploreBtnElement.textContent = texts.exploreBtn;
            }
            
            console.log('UI language updated to:', langCode);
        } catch (error) {
            console.error('Error updating UI language:', error);
        }
    }
    
    function handleOutsideClick(e) {
        if (!e.target.closest('.dropdown-menu') && 
            !e.target.closest('.font-control-btn') && 
            !e.target.closest('.language-btn')) {
            removeFontSizeMenu();
            removeLanguageMenu();
        }
    }

    // Text-to-Speech Functions
    function toggleReadAloud() {
        if (isSpeaking) {
            stopSpeaking();
        } else {
            startSpeaking();
        }
    }
    
    function startSpeaking() {
        // Get text content, handling both plain text and HTML content
        const textToRead = responseContent.textContent.trim();
        console.log('Text to read:', textToRead);
        
        if (!textToRead || textToRead === 'Submit a prompt to see the response...' || textToRead === 'Processing your request...') {
            alert('No content to read');
            return;
        }
        
        // Cancel any ongoing speech
        stopSpeaking();
        
        // Show loading state on the button
        isSpeaking = true;
        readAloudBtn.style.color = '#3498db'; // Use our blue theme color
        readAloudBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Use our backend TTS API instead of browser's speech synthesis
        fetch('/api/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: textToRead,
                lang: currentLanguage.split('-')[0] // Convert 'en-US' to 'en' for gTTS
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Create an audio element to play the speech
                const audioElement = new Audio(data.audio_url);
                
                // Store the audio element for stopping later
                window.currentAudio = audioElement;
                
                // Set up event handlers
                audioElement.onplay = function() {
                    isSpeaking = true;
                    readAloudBtn.style.color = '#3498db'; // Use our blue theme color
                    readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                };
                
                audioElement.onended = function() {
                    isSpeaking = false;
                    readAloudBtn.style.color = '#888';
                    readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    window.currentAudio = null;
                };
                
                audioElement.onerror = function(event) {
                    console.error('Audio playback error', event);
                    isSpeaking = false;
                    readAloudBtn.style.color = '#888';
                    readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    window.currentAudio = null;
                };
                
                // Start playing
                audioElement.play();
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('TTS Error:', error);
            alert('Error generating speech: ' + error.message);
            isSpeaking = false;
            readAloudBtn.style.color = '#888';
            readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        });
    }
    
    function stopSpeaking() {
        // Stop any browser speech synthesis (from the old implementation)
        if (speechSynthesis && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        // Stop any audio element that's playing (from our new implementation)
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio.currentTime = 0;
            window.currentAudio = null;
        }
        
        // Reset the button state
        isSpeaking = false;
        readAloudBtn.style.color = '#888';
        readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }

    // Webcam functions
    function toggleWebcam() {
        if (isWebcamActive) {
            stopWebcam();
        } else {
            startWebcam();
        }
    }

    function startWebcam() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // First, clear the drop area
            dropArea.innerHTML = '';
            
            // Create video element
            videoElement = document.createElement('video');
            videoElement.setAttribute('autoplay', '');
            videoElement.setAttribute('playsinline', '');
            videoElement.style.width = '100%';
            videoElement.style.height = 'auto';
            videoElement.style.borderRadius = '4px';
            dropArea.appendChild(videoElement);
            
            // Create capture button with translated text and icon
            const captureBtn = document.createElement('button');
            const texts = getTranslationForCurrentLanguage();
            captureBtn.innerHTML = `<i class="fas fa-camera"></i> ${texts.takePhotoBtn}`;
            captureBtn.className = 'capture-btn';
            captureBtn.addEventListener('click', capturePhoto);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'webcam-controls';
            buttonContainer.appendChild(captureBtn);
            dropArea.appendChild(buttonContainer);
            
            // Get webcam stream
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(mediaStream) {
                    stream = mediaStream;
                    videoElement.srcObject = mediaStream;
                    videoElement.play();
                    isWebcamActive = true;
                    
                    // Update camera button text based on current language
                    const texts = getTranslationForCurrentLanguage();
                    cameraBtn.innerHTML = '<i class="fas fa-times"></i> ' + texts.closeCamera;
                })
                .catch(function(error) {
                    console.error('Error accessing webcam:', error);
                    alert('Could not access webcam. Please check permissions.');
                    stopWebcam();
                });
        } else {
            alert('Your browser does not support webcam access.');
        }
    }

    function stopWebcam() {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            stream = null;
        }
        
        // Reset the drop area
        dropArea.innerHTML = `
            <div class="upload-placeholder">
                <div class="upload-icon">
                    <i class="fas fa-image"></i>
                </div>
                <p>${getTranslationForCurrentLanguage().uploadPrompt}</p>
            </div>
        `;
        
        isWebcamActive = false;
        
        // Update camera button text based on current language
        const texts = getTranslationForCurrentLanguage();
        cameraBtn.innerHTML = '<i class="fas fa-camera"></i> ' + texts.cameraBtn;
    }
    
    function capturePhoto() {
        if (!isWebcamActive || !videoElement) return;
        
        // Create a canvas element to capture the photo
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        // Draw the video frame to the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to image
        const imageDataUrl = canvas.toDataURL('image/png');
        
        // Stop the webcam
        stopWebcam();
        
        // Display the captured image
        dropArea.innerHTML = `<img src="${imageDataUrl}" alt="Captured Image" style="max-width: 100%; max-height: 300px; border-radius: 4px;">`;
        
        // Show the remove button
        removeBtn.style.display = 'flex';
        
        // You can now use imageDataUrl as your input for the AI processing
        console.log('Photo captured and ready for processing');
    }

    // Helper function to get translations for current language
    function getTranslationForCurrentLanguage() {
        const translations = {
            'en-US': {
                uploadPrompt: 'Just drag, select or upload an image',
                cameraBtn: 'Camera',
                closeCamera: 'Close Camera',
                takePhotoBtn: 'Take Photo'
            },
            'es-ES': {
                uploadPrompt: 'Arrastra, selecciona o sube una imagen',
                cameraBtn: 'Cámara',
                closeCamera: 'Cerrar Cámara',
                takePhotoBtn: 'Tomar Foto'
            },
            'fr-FR': {
                uploadPrompt: 'Glissez, sélectionnez ou téléchargez une image',
                cameraBtn: 'Caméra',
                closeCamera: 'Fermer Caméra',
                takePhotoBtn: 'Prendre Photo'
            },
            'de-DE': {
                uploadPrompt: 'Ziehen, wählen oder laden Sie ein Bild hoch',
                cameraBtn: 'Kamera',
                closeCamera: 'Kamera Schließen',
                takePhotoBtn: 'Foto Aufnehmen'
            },
            'zh-CN': {
                uploadPrompt: '拖动、选择或上传图像',
                cameraBtn: '相机',
                closeCamera: '关闭相机',
                takePhotoBtn: '拍照'
            },
            'ja-JP': {
                uploadPrompt: '画像をドラッグ、選択、またはアップロード',
                cameraBtn: 'カメラ',
                closeCamera: 'カメラを閉じる',
                takePhotoBtn: '写真を撮る'
            },
            'ru-RU': {
                uploadPrompt: 'Перетащите, выберите или загрузите изображение',
                cameraBtn: 'Камера',
                closeCamera: 'Закрыть камеру',
                takePhotoBtn: 'Сделать фото'
            }
        };
        
        return translations[currentLanguage] || translations['en-US'];
    }

    // Functions
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) {
            handleFiles(files);
        }
    }

    function handleFiles(files) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Display the uploaded image in the drop area
                dropArea.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" style="max-width: 100%; max-height: 300px; border-radius: 4px;">`;
                
                // Show the remove button
                removeBtn.style.display = 'flex';
            };
            
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file');
        }
    }

    function sendPrompt() {
        const prompt = promptInput.value.trim();
        
        if (prompt) {
            // Show loading spinner only (no text)
            responseContent.innerHTML = '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>';
            
            // Get the image if one is uploaded
            let imageData = null;
            const uploadedImage = dropArea.querySelector('img');
            if (uploadedImage) {
                imageData = uploadedImage.src;
            }
            
            // If no image is provided, alert the user
            if (!imageData) {
                responseContent.innerHTML = '<p class="error">Please upload or capture an image first.</p>';
                return;
            }
            
            // Make API call to our backend
            fetch('/api/process-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    prompt: prompt,
                    lang: currentLanguage // Pass the full language code to the backend
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Create a properly formatted response that works well with text-to-speech
                    responseContent.innerHTML = '';
                    const paragraph = document.createElement('p');
                    paragraph.textContent = data.response; // Use textContent for proper encoding
                    responseContent.appendChild(paragraph);
                } else {
                    responseContent.innerHTML = '';
                    const errorParagraph = document.createElement('p');
                    errorParagraph.className = 'error';
                    errorParagraph.textContent = `Error: ${data.error || 'Unknown error occurred'}`;
                    responseContent.appendChild(errorParagraph);
                }
                promptInput.value = '';
            })
            .catch(error => {
                console.error('Error:', error);
                responseContent.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            });
        }
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Function to remove the uploaded or captured image
    function removeUploadedImage() {
        // Reset the drop area to its original state
        dropArea.innerHTML = `
            <div class="upload-placeholder">
                <div class="upload-icon">
                    <i class="fas fa-image"></i>
                </div>
                <p>Just drag, select or upload an image</p>
            </div>
        `;
        
        // Hide the remove button
        removeBtn.style.display = 'none';
        
        // Reset the file input
        fileInput.value = '';
    }

    // Add CSS for font sizes and dropdown menus
    const style = document.createElement('style');
    style.textContent = `
        .font-small {
            font-size: 14px;
        }
        
        .font-small h2 {
            font-size: 16px;
        }
        
        .font-small h3 {
            font-size: 14px;
        }
        
        .font-small p, .font-small input, .font-small textarea, .font-small button {
            font-size: 12px;
        }
        
        .font-medium {
            font-size: 16px;
        }
        
        .font-medium h2 {
            font-size: 18px;
        }
        
        .font-medium h3 {
            font-size: 16px;
        }
        
        .font-medium p, .font-medium input, .font-medium textarea, .font-medium button {
            font-size: 14px;
        }
        
        .font-large {
            font-size: 18px;
        }
        
        .font-large h2 {
            font-size: 22px;
        }
        
        .font-large h3 {
            font-size: 18px;
        }
        
        .font-large p, .font-large input, .font-large textarea, .font-large button {
            font-size: 16px;
        }
        
        .webcam-controls {
            position: absolute;
            bottom: 10px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            padding: 10px;
        }
        
        .capture-btn {
            background-color: #00b894;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 15px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0, 184, 148, 0.25);
            transition: all 0.3s ease;
        }
        
        .capture-btn:hover {
            background-color: #00a383;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 184, 148, 0.35);
        }
        
        .dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            background-color: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            z-index: 1000;
            min-width: 150px;
            max-height: 300px;
            overflow-y: auto;
            padding: 6px 0;
        }
        
        .menu-container {
            position: relative;
            display: inline-block;
        }
        
        .dropdown-item {
            padding: 8px 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .dropdown-item:hover {
            background-color: #f8fafc;
            color: #00b894;
        }
        
        .dropdown-item.active {
            background-color: #e6fffa;
            color: #00b894;
            font-weight: 500;
        }
        
        .response-controls {
            position: relative;
        }
        
        .loading-spinner-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 150px;
            width: 100%;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(52, 152, 219, 0.2);
            border-radius: 50%;
            border-top-color: #3498db;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
        
        .feedback-message {
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4CAF50;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            opacity: 0;
            animation: fadeInOut 3s ease-in-out forwards;
        }
        
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 10px); }
            15% { opacity: 1; transform: translate(-50%, 0); }
            85% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -10px); }
        }
    `;
    document.head.appendChild(style);

    // Load saved preferences if available
    function loadSavedPreferences() {
        // Load font size preference
        const savedFontSize = localStorage.getItem('preferredFontSize');
        if (savedFontSize && availableFontSizes.includes(savedFontSize)) {
            setFontSize(savedFontSize);
        } else {
            setFontSize('medium'); // Default
        }
        
        // Load language preference
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
            setLanguage(savedLanguage);
        } else {
            setLanguage('en-US'); // Default
        }
    }

    // Initialize preferences
    loadSavedPreferences();
    
    // Create the logo dynamically (since we don't have the actual logo file)
    createLogo();
});

// Function to create a simple SVG logo - disabled since we now use inline SVG
function createLogo() {
    // This function is now disabled since we're using an inline SVG in the HTML
    // Keeping the function but not executing its code to avoid breaking anything
    return;
    
    /* Original code commented out
    const logoContainer = document.querySelector('.logo');
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 60 20');
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '5');
    text.setAttribute('y', '15');
    text.setAttribute('fill', '#00b894');
    text.setAttribute('font-weight', 'bold');
    text.textContent = 'SEEIT';
    
    svg.appendChild(text);
    
    // Replace the img with our SVG
    logoContainer.innerHTML = '';
    logoContainer.appendChild(svg);
    */
}
