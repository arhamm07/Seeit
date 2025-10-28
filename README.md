# Seeit 👁️

An AI-powered visual assistant that helps you understand images through natural language. Upload an image, ask questions, and get intelligent responses powered by LLaVA vision model with multilingual support.

## 🌟 Features

- **Visual Intelligence**: Upload images and ask questions about them using advanced AI vision models
- **Voice Input**: Use voice commands to interact with the assistant
- **Text-to-Speech**: Listen to AI responses in multiple languages
- **Multilingual Support**: Supports English, Spanish, French, German, Chinese, Japanese, and Russian
- **Real-time Processing**: Fast image analysis and response generation
- **User Feedback System**: Rate responses and provide feedback for continuous improvement
- **Modern UI**: Beautiful, responsive interface with particle effects and smooth animations
- **Admin Dashboard**: Monitor user feedback and system performance

## 🛠️ Tech Stack

### Backend
- **Flask**: Python web framework for API endpoints
- **LLaVA Model**: Vision-language model for image understanding
- **gTTS**: Google Text-to-Speech for audio generation
- **Deep Translator**: Multi-language translation support
- **Flask-CORS**: Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: Custom styling with animations and effects
- **Font Awesome**: Icon library
- **Particles.js**: Interactive background effects
- **Web Speech API**: Voice recognition capabilities

## 📁 Project Structure

```
Seeit/
├── Backend/
│   ├── main.py              # Flask application with API endpoints
│   ├── requirements.txt     # Python dependencies
│   ├── audio/              # Temporary audio file storage
│   ├── feedback/           # User feedback data
│   └── instance/           # Flask instance folder
├── Frontend/
│   ├── index.html          # Main application page
│   ├── admin.html          # Admin dashboard
│   ├── script.js           # Main application logic
│   ├── styles.css          # Main stylesheet
│   ├── particles.js        # Background particle effects
│   ├── tilt-effect.js      # 3D tilt animations
│   ├── typing-effect.js    # Typing animation effects
│   ├── voice-commands.js   # Voice recognition logic
│   └── theme-overrides.css # Theme customizations
├── Procfile                # Deployment configuration
├── render.yaml             # Render.com deployment config
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- pip (Python package manager)
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Seeit
   ```

2. **Install Python dependencies**
   ```bash
   cd Backend
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python main.py
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`
   - The backend API will be available at `http://localhost:5000/api`

## 🔌 API Endpoints

### POST `/api/process-image`
Process an image with a text prompt
- **Body**: `{ "image": "base64_encoded_image", "prompt": "your question", "lang": "en-US" }`
- **Response**: `{ "success": true, "response": "AI response text" }`

### POST `/api/text-to-speech`
Convert text to speech audio
- **Body**: `{ "text": "text to convert", "lang": "en-US" }`
- **Response**: `{ "success": true, "audio_url": "/api/audio/{id}" }`

### GET `/api/audio/{file_id}`
Retrieve generated audio file
- **Response**: Audio file (MP3)

### POST `/api/feedback`
Submit user feedback
- **Body**: `{ "prompt": "...", "response": "...", "rating": "positive/negative", "comment": "...", "language": "en-US" }`
- **Response**: `{ "success": true, "message": "Feedback submitted successfully" }`

### GET `/api/admin/feedback`
View all feedback (requires authentication)
- **Auth**: Basic Auth (username: admin, password: seeit2025)
- **Response**: `{ "success": true, "feedback": [...] }`

## 🌐 Deployment

The application is configured for deployment on Render.com:

1. **Automatic Deployment**: Push to main branch triggers deployment
2. **Environment**: Python 3.10.0
3. **Build Command**: `pip install -r Backend/requirements.txt`
4. **Start Command**: `cd Backend && python main.py`

## 🎨 Features in Detail

### Image Processing
- Drag-and-drop image upload
- Camera capture support
- Support for PNG, JPG, JPEG, and GIF formats
- Maximum file size: 16MB

### Voice Interaction
- Voice-to-text for prompt input
- Text-to-speech for AI responses
- Multi-language voice support

### Language Support
- English (en-US)
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- Chinese (zh-CN)
- Japanese (ja-JP)
- Russian (ru-RU)

### Admin Features
- View all user feedback
- Monitor response ratings
- Track usage patterns
- Basic authentication protection

## 🔒 Security

- CORS enabled for cross-origin requests
- Basic authentication for admin endpoints
- Temporary file cleanup (5-minute expiry)
- File type validation for uploads
- Request size limits (16MB max)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

© 2025 Seeit AI Inc. All rights reserved.

## 🐛 Known Issues

- Temporary audio files are stored in system temp directory
- Admin credentials are hardcoded (should use environment variables)
- LLaVA endpoint is currently using a RunPod proxy

## 🔮 Future Enhancements

- User authentication system
- Conversation history
- Multiple image comparison
- Advanced image editing features
- Mobile app version
- API rate limiting
- Database integration for feedback storage

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.