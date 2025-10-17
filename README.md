# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4cfc416e-773b-464f-82cd-72a7b5367f01

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4cfc416e-773b-464f-82cd-72a7b5367f01) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4cfc416e-773b-464f-82cd-72a7b5367f01) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Backend & OCR processing

The application expune un API FastAPI (vezi `backend/app`) care rulează motoarele OCR [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) și [Docling](https://github.com/docling-project/docling). Serviciul gestionează:

- cozi de procesare pentru fișiere PDF cu salvarea rezultatelor și a rezumatelor generate cu Mistral AI (dacă `MISTRAL_API_KEY` este setat);
- configurarea motorului OCR implicit din consola de administrare;
- generarea și conversia documentelor `.docx` în Word Studio.

Endpoint-urile API sunt montate sub `/api` și sunt consumate din interfața React prin `@tanstack/react-query`.

### Rulare locală

```sh
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend
npm install
npm run dev
```

Setează variabila `MISTRAL_API_KEY` dacă dorești rezumate automate ale textului OCR.

## Deploy cu Docker + Nginx

Repo-ul include o stivă completă Docker Compose care publică frontend-ul prin Nginx (cu `server_name ocr.casianhome.org`) și API-ul FastAPI.

```sh
docker compose build
docker compose up -d
```

La prima pornire serviciul backend instalează dependențele OCR și creează baza de date SQLite în volumul `backend-data`. Frontend-ul comunică cu API-ul prin `/api` (vezi `.env.example`).
