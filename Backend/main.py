from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import base64
import os
import requests
import logging
import uuid
import tempfile
import threading
import time
import json
from datetime import datetime
from gtts import gTTS
from deep_translator import GoogleTranslator

# Configure logging to output to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Initialize Flask app
app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# No need to initialize translator globally as we'll create it when needed

# Configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
LLAVA_ENDPOINT = "https://3zx1tm2yxu5cq8-11434.proxy.runpod.net/api/generate"

# Use system temp directory for temporary files
TEMP_DIR = tempfile.gettempdir()

# Dictionary to keep track of temporary files and their creation times
temp_files = {}

# Time in seconds after which temporary files should be deleted (5 minutes)
TEMP_FILE_EXPIRY = 300

# Function to clean up old temporary files
def cleanup_temp_files():
    """Remove temporary files that are older than TEMP_FILE_EXPIRY seconds"""
    current_time = time.time()
    files_to_remove = []
    
    # Identify files to remove
    for file_path, creation_time in temp_files.items():
        if current_time - creation_time > TEMP_FILE_EXPIRY:
            files_to_remove.append(file_path)
    
    # Remove the files
    for file_path in files_to_remove:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"[CLEANUP] Removed temporary file: {file_path}")
            del temp_files[file_path]
        except Exception as e:
            print(f"[ERROR] Failed to remove temporary file {file_path}: {str(e)}")

# Start a background thread to periodically clean up temporary files
def start_cleanup_thread():
    while True:
        cleanup_temp_files()
        time.sleep(60)  # Check every minute

cleanup_thread = threading.Thread(target=start_cleanup_thread, daemon=True)
cleanup_thread.start()

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_from_directory('../Frontend', 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory('../Frontend', path)

@app.route('/api/process-image', methods=['POST'])
def process_image():
    """
    Process an image with a prompt using the LLaVA model
    Accepts:
    - image: base64 encoded image
    - prompt: text prompt to send with the image
    - lang: language code (optional, default: 'en-US')
    """
    try:
        data = request.json
        
        if not data or 'image' not in data or 'prompt' not in data:
            return jsonify({'error': 'Missing image or prompt'}), 400
            
        image_data = data['image']
        prompt = data['prompt']
        target_lang = data.get('lang', 'en-US')
        
        # If the image is a data URL, extract the base64 part
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Log the request (without the image data for brevity)
        print(f"\n[REQUEST] Processing image with prompt: '{prompt}' in language: '{target_lang}'")
        logging.info(f"Processing request with prompt: {prompt} in language: {target_lang}")
        
        # Prepare the request payload for LLaVA
        payload = {
            "model": "llava",
            "prompt": prompt,
            "images": [image_data],
            "stream": False
        }
        
        # Make the request to LLaVA API
        response = requests.post(
            LLAVA_ENDPOINT,
            json=payload,
            timeout=60  # Increased timeout for image processing
        )
        
        # Check if the request was successful
        response.raise_for_status()
        result = response.json()
        
        # Get the response text
        response_text = result.get('response', 'No response in output')
        
        # Translate the response if a different language is requested
        if target_lang != 'en-US':
            try:
                # Map frontend language codes to deep_translator language codes
                lang_map = {
                    'en-US': 'en',
                    'es-ES': 'es',
                    'fr-FR': 'fr',
                    'de-DE': 'de',
                    'zh-CN': 'zh-CN',
                    'ja-JP': 'ja',
                    'ru-RU': 'ru'
                }
                
                # Get the correct language code for translation
                dest_lang = lang_map.get(target_lang, target_lang.split('-')[0].lower())
                
                # Translate the response
                print(f"[TRANSLATION] Translating response to {dest_lang}")
                translator = GoogleTranslator(source='en', target=dest_lang)
                response_text = translator.translate(response_text)
                print(f"[TRANSLATION] Translation completed")
            except Exception as e:
                print(f"[WARNING] Translation failed: {str(e)}. Using original response.")
                logging.warning(f"Translation failed: {str(e)}. Using original response.")
        
        # Log the successful response
        print(f"[SUCCESS] Response received from LLaVA API and processed")
        logging.info(f"Successful response received from LLaVA API and processed")
        
        # Return the response to the frontend
        return jsonify({
            'success': True,
            'response': response_text
        })
        
    except requests.exceptions.RequestException as e:
        error_message = f"API Request failed: {str(e)}"
        if hasattr(e, 'response') and e.response:
            error_message += f" Response content: {e.response.text}"
        
        print(f"[ERROR] {error_message}")
        logging.error(error_message)
        return jsonify({'error': error_message}), 500
        
    except Exception as e:
        error_message = f"Error processing request: {str(e)}"
        print(f"[ERROR] {error_message}")
        logging.error(error_message)
        return jsonify({'error': str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech using gTTS and return an audio file
    Accepts:
    - text: The text to convert to speech
    - lang: The language code (default: 'en-US')
    """
    try:
        data = request.json
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text parameter'}), 400
            
        text = data['text']
        lang = data.get('lang', 'en-US')
        
        # Map frontend language codes to gTTS language codes if needed
        lang_map = {
            'en-US': 'en',
            'es-ES': 'es',
            'fr-FR': 'fr',
            'de-DE': 'de',
            'zh-CN': 'zh-CN',
            'ja-JP': 'ja',
            'ru-RU': 'ru'
        }
        
        # Get the correct language code for TTS
        tts_lang = lang_map.get(lang, lang.split('-')[0])
        
        print(f"\n[TTS] Converting text to speech: '{text[:50]}...' in language '{tts_lang}'")
        
        # Generate a unique filename in the system temp directory
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}.mp3"
        temp_filepath = os.path.join(TEMP_DIR, filename)
        
        # Generate the speech
        tts = gTTS(text=text, lang=tts_lang, slow=False)
        tts.save(temp_filepath)
        
        # Add the file to our tracking dictionary with current timestamp
        temp_files[temp_filepath] = time.time()
        
        print(f"[TTS] Audio saved to temporary file: {temp_filepath}")
        
        # Return the URL to the audio file
        audio_url = f"/api/audio/{unique_id}"
        return jsonify({
            'success': True,
            'audio_url': audio_url
        })
        
    except Exception as e:
        error_message = f"Error generating speech: {str(e)}"
        print(f"[ERROR] {error_message}")
        logging.error(error_message)
        return jsonify({'error': error_message}), 500

@app.route('/api/audio/<file_id>')
def serve_audio(file_id):
    """
    Serve the generated audio files from temporary storage
    """
    try:
        # Find the file in the temp directory
        filename = f"{file_id}.mp3"
        filepath = os.path.join(TEMP_DIR, filename)
        
        print(f"[DEBUG] Serving audio file: {filename} from {TEMP_DIR}")
        
        if not os.path.exists(filepath):
            print(f"[ERROR] Audio file not found: {filepath}")
            return jsonify({'error': 'Audio file not found'}), 404
            
        # Reset the expiry time since the file is being accessed
        temp_files[filepath] = time.time()
        
        # Serve the file
        return send_file(filepath, mimetype='audio/mpeg')
    except Exception as e:
        print(f"[ERROR] Error serving audio file: {str(e)}")
        return jsonify({'error': f'Error serving audio file: {str(e)}'}), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """
    Submit user feedback for a response
    Accepts:
    - prompt: The original prompt
    - response: The model's response
    - rating: 'positive' or 'negative'
    - comment: Optional user comment
    - language: The language used
    """
    try:
        data = request.json
        
        if not data or 'rating' not in data:
            return jsonify({'error': 'Missing required feedback data'}), 400
        
        # Create a feedback entry
        feedback_entry = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'prompt': data.get('prompt', ''),
            'response': data.get('response', ''),
            'rating': data.get('rating', ''),
            'comment': data.get('comment', ''),
            'language': data.get('language', 'en-US')
        }
        
        # Load existing feedback
        feedback_file = os.path.join(BASE_DIR, 'feedback', 'feedback.json')
        try:
            with open(feedback_file, 'r') as f:
                feedback_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            feedback_data = []
        
        # Add new feedback and save
        feedback_data.append(feedback_entry)
        with open(feedback_file, 'w') as f:
            json.dump(feedback_data, f, indent=2)
        
        print(f"[FEEDBACK] Received {feedback_entry['rating']} feedback")
        logging.info(f"Received {feedback_entry['rating']} feedback")
        
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
        
    except Exception as e:
        error_message = f"Error submitting feedback: {str(e)}"
        print(f"[ERROR] {error_message}")
        logging.error(error_message)
        return jsonify({'error': error_message}), 500

@app.route('/api/admin/feedback', methods=['GET'])
def view_feedback():
    """
    View all feedback (protected with basic auth)
    """
    # Simple basic auth check
    auth = request.authorization
    if not auth or auth.username != 'admin' or auth.password != 'seeit2025':
        return jsonify({'error': 'Unauthorized access'}), 401
    
    try:
        # Load feedback data
        feedback_file = os.path.join(BASE_DIR, 'feedback', 'feedback.json')
        try:
            with open(feedback_file, 'r') as f:
                feedback_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            feedback_data = []
        
        return jsonify({'success': True, 'feedback': feedback_data})
        
    except Exception as e:
        error_message = f"Error retrieving feedback: {str(e)}"
        print(f"[ERROR] {error_message}")
        logging.error(error_message)
        return jsonify({'error': error_message}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Seeit Backend Server Starting")
    print("API Endpoint: http://localhost:5000")
    
    # Get port from environment variable for Render compatibility
    port = int(os.environ.get("PORT", 5000))
    
    # Use 0.0.0.0 to bind to all interfaces for cloud hosting
    app.run(host='0.0.0.0', port=port)
