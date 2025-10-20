# Quick Start Guide - OCR Vista Flow

Get OCR Vista Flow running in under 5 minutes with Docker!

## Prerequisites

- Docker and Docker Compose installed on your system
- At least 2GB of free disk space

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Casian202/ocr-vista-flow.git
   cd ocr-vista-flow
   ```

2. **Start the application:**
   ```bash
   docker compose up -d
   ```

3. **Access the application:**
   
   Open your browser and navigate to: **http://localhost**

4. **Start processing documents:**
   - Click on "OCR Studio" in the sidebar
   - Upload a PDF document
   - Select language (or use auto-detect)
   - Click "Pornește OCR" to start processing

That's it! 🎉

## What Happens During Startup

When you run `docker compose up -d`, Docker will:

1. Build the backend container with:
   - Python 3.11
   - OCR engines (OCRmyPDF, Docling)
   - Tesseract OCR
   - All required dependencies

2. Build the frontend container with:
   - React + TypeScript application
   - Nginx web server

3. Create a persistent volume for:
   - SQLite database
   - Processed documents
   - OCR outputs

## Accessing Services

- **Web Interface:** http://localhost (port 80)
- **Backend API:** http://localhost:8000 (direct access for debugging)
- **Health Check:** http://localhost:8000/api/health

## Managing the Application

### View logs:
```bash
docker compose logs -f
```

### Stop the application:
```bash
docker compose down
```

### Stop and remove all data:
```bash
docker compose down -v
```

### Rebuild after code changes:
```bash
docker compose up -d --build
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
