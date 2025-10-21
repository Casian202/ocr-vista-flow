# Quick Start Guide - OCR Vista Flow

Get OCR Vista Flow running in under 5 minutes!

## Prerequisites

- Python 3.8+ (with `python3` and `pip` installed)
- Node.js 16+ (with `npm` installed)
- At least 2GB of free disk space

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Casian202/ocr-vista-flow.git
   cd ocr-vista-flow
   ```

2. **Start the application with the automated script:**
   ```bash
   ./start.sh
   ```
   
   The script will automatically:
   - Check for required dependencies (Python, Node.js, npm)
   - Set up the Python virtual environment for the backend
   - Install all frontend dependencies
   - Start the backend server on http://localhost:8000
   - Start the frontend development server on http://localhost:8080

3. **Access the application:**
   
   Open your browser and navigate to: **http://localhost:8080**

4. **Start processing documents:**
   - Click on "OCR Studio" in the sidebar
   - Upload a PDF document
   - Select language (or use auto-detect)
   - Click "Pornește OCR" to start processing

5. **Stop the application:**
   
   Press **Ctrl+C** in the terminal where start.sh is running

That's it! 🎉

## Alternative: Using Docker

If you prefer Docker:

```bash
docker compose up -d
```

Then access the application at **http://localhost**

## What Happens During Startup

When you run `./start.sh`, the script will:

1. **Check Prerequisites:**
   - Verify Python 3 is installed
   - Verify Node.js and npm are installed

2. **Setup Backend:**
   - Create a Python virtual environment (.venv) if it doesn't exist
   - Install all Python dependencies (Flask, OCRmyPDF, Docling, etc.)
   - Copy .env.example to backend/.env if needed

3. **Setup Frontend:**
   - Install all npm dependencies if node_modules doesn't exist
   - Copy .env.example to .env if needed

4. **Start Services:**
   - Launch the Flask backend server on port 8000
   - Launch the Vite development server on port 8080
   - Configure automatic proxy from frontend to backend for /api requests

5. **Manage Process:**
   - Keep both services running
   - Gracefully stop both services when you press Ctrl+C

## Accessing Services

- **Web Interface:** http://localhost:8080 (Vite dev server)
- **Backend API:** http://localhost:8000 (Flask server)
- **Health Check:** http://localhost:8000/api/health

## Managing the Application

### Stop the application:
Press **Ctrl+C** in the terminal where `start.sh` is running. This will gracefully stop both backend and frontend services.

### Restart the application:
Simply run `./start.sh` again.

### Manual startup (without start.sh):

If you prefer to start services manually:

**Backend:**
```bash
source .venv/bin/activate
python -m backend.app.main
```

**Frontend (in a new terminal):**
```bash
npm run dev
```

## Optional Configuration

### Environment Variables

Create a `.env` file in the root directory to customize settings:

```bash
cp .env.example .env
```

Available options:
- `MISTRAL_API_KEY` - Enable AI-powered document summarization
- `DATABASE_URL` - Custom database location (default: sqlite:///data/app.db)
- `VITE_SUPABASE_URL` - Enable authentication with Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase public key

**Note:** All settings are optional. The app works perfectly without any configuration!

## Features

### OCR Processing
- **Docling Engine:** Fast, modern OCR with layout preservation
- **OCRmyPDF Engine:** Traditional, reliable PDF processing
- **Multi-language support:** Romanian, English, German, Spanish, and more
- **Auto-rotation:** Automatically detects and rotates pages
- **Background removal:** Clean up scanned documents

### Document Management
- **Folders:** Organize documents in color-coded folders
- **Search:** Quickly find processed documents
- **Download:** Get processed PDFs instantly
- **Preview:** View documents directly in the browser

### Word Studio
- **PDF to Word conversion:** Transform PDFs into editable Word documents
- **Template system:** Create reusable document templates
- **Batch processing:** Convert multiple documents at once

## Troubleshooting

### Port already in use
If port 80 is already in use, edit `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # Change 80 to 8080 or any available port
```

### Backend not responding
Check backend logs:
```bash
docker compose logs backend
```

### Frontend build fails
Rebuild containers:
```bash
docker compose down
docker compose up -d --build
```

### Need more help?
Check the main [README.md](README.md) for detailed documentation.

## Next Steps

- Upload your first PDF document
- Create folders to organize documents
- Try the Word Studio for PDF to Word conversion
- Configure Mistral AI for automatic summarization
- Set up Supabase for user authentication

Enjoy using OCR Vista Flow! 🚀
