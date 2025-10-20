# OCR Vista Flow

Aplicatia oferă o interfață web pentru procesarea documentelor PDF cu OCR,
rezumarea textului folosind Mistral AI și generarea de documente Word.
Frontend-ul este construit în React + Vite, iar backend-ul este un serviciu
Flask expus prin Gunicorn.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind, @tanstack/react-query
- **Backend:** Flask, SQLModel (SQLite), OCRmyPDF, Docling, python-docx
- **AI:** Integrare opțională cu Mistral (`MISTRAL_API_KEY`)
- **Reverse proxy:** Nginx

## Deploy cu Docker (Recomandat)

Modul cel mai simplu de a porni aplicația este prin Docker Compose:

### 1. Pregătește fișierul .env (opțional)

Aplicația funcționează și fără variabile de mediu personalizate, dar poți crea un fișier `.env` în directorul rădăcină pentru a configura setările:

```bash
cp .env.example .env
# Editează .env cu setările tale (opțional):
# - MISTRAL_API_KEY pentru rezumate automate AI
# - VITE_SUPABASE_URL și VITE_SUPABASE_PUBLISHABLE_KEY pentru autentificare (opțional)
```

**Notă:** Autentificarea este opțională. Dacă nu configurezi Supabase, aplicația va funcționa fără autentificare, permițând acces direct la toate funcționalitățile.

### 2. Pornește aplicația cu Docker Compose

```bash
docker compose up -d
```

Aceasta va:
- Construi imaginea backend-ului cu toate dependențele Python și OCR
- Construi imaginea frontend-ului și o va servi prin Nginx
- Crea un volum persistent pentru datele aplicației
- Expune aplicația pe portul 80

### 3. Accesează aplicația

Deschide browser-ul la: **http://localhost**

Backend-ul rulează pe portul 8000 (expus și pentru debugging), iar Nginx face proxy către acesta pentru toate request-urile `/api/`.

### 4. Oprește aplicația

```bash
docker compose down
```

Pentru a șterge și volumele de date:

```bash
docker compose down -v
```

## Configurare locală (fără Docker)

### 1. Backend

```bash
./scripts/setup_backend.sh          # creează mediul virtual și instalează dependențele
# Exemplu dacă repo-ul este în alt director: ./scripts/setup_backend.sh --root /opt/ocr-vista-flow
source .venv/bin/activate
python -m backend.app.main          # pornește serverul pe http://127.0.0.1:8000
```

Scriptul `scripts/setup_backend.sh` rulează pașii necesari pentru configurarea
backend-ului (crearea mediului virtual, instalarea dependențelor și copierea
fișierului `.env` dacă lipsește), evitând erorile întâlnite pe sisteme
Debian/Ubuntu configurate cu PEP 668. Poate lucra direct din directorul
depozitului sau poate primi explicit calea repo-ului prin `--root` și un alt
interpretor Python cu `--python`. Backend-ul creează directoarele necesare în
folderul `data/` și initializează automat baza de date SQLite definită în
`DATABASE_URL`.

### 2. Frontend

```bash
npm install
npm run dev
```

Interfața din dezvoltare va rula pe http://localhost:5173 și va face proxy
către backend prin `/api`.

## Deploy fără Docker (cu Nginx existent)

1. **Clonează proiectul pe server** (de exemplu în `/opt/ocr-vista-flow`).
   Dacă repo-ul se află deja în altă locație (de ex. `/root/ocr-vista-flow`),
   folosește acea cale în toate comenzile de mai jos.
2. **Creează un mediu virtual Python** și instalează dependențele:

   ```bash
   cd /opt/ocr-vista-flow    # înlocuiește cu calea reală a repo-ului
   ./scripts/setup_backend.sh
   source .venv/bin/activate
   ```

3. **Construiește frontend-ul și publică-l într-un director servit de Nginx**:

   ```bash
   cd /opt/ocr-vista-flow    # înlocuiește cu calea reală a repo-ului
   npm ci
   npm run build
   sudo mkdir -p /var/www/ocr-vista-flow/current
   sudo rsync -a dist/ /var/www/ocr-vista-flow/current/
   ```

4. **Configurează Gunicorn prin systemd** cu scriptul dedicat. Acesta randă
   șablonul `deploy/systemd/ocr-backend.service.template`, personalizează căile
   și activează serviciul:

   ```bash
   # Înlocuiește $(pwd) cu calea repo-ului dacă rulezi din alt director
   sudo ./scripts/install_backend_service.sh --root "$(pwd)"
   # Pentru o verificare înainte de instalare:
   ./scripts/install_backend_service.sh --root "$(pwd)" --dry-run
   ```

   Scriptul acceptă opțiuni pentru numărul de workeri, adresa de bind, utilizator
   și locația fișierului `.env` (vezi `--help`).

5. **Actualizează Nginx** cu `deploy/nginx.conf`. Acesta servește fișierele
   statice din `/var/www/ocr-vista-flow/current` și face proxy către backend-ul
   care rulează pe `127.0.0.1:8000`:

   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/ocr-vista-flow.conf
   sudo ln -sf /etc/nginx/sites-available/ocr-vista-flow.conf \
       /etc/nginx/sites-enabled/ocr-vista-flow.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Actualizează aplicația** rulând din nou pașii de build pentru frontend și
   repornind serviciul Gunicorn după fiecare upgrade al backend-ului:

   ```bash
   sudo systemctl restart ocr-backend.service
   sudo rsync -a dist/ /var/www/ocr-vista-flow/current/
   sudo systemctl reload nginx
   ```

## Variabile de mediu importante

Backend-ul citește valorile din `backend/.env`:

- `DATABASE_URL` – locația bazei de date (implicit SQLite în `data/app.db`)
- `DATA_DIR` – directorul unde se salvează fișierele generate
- `API_PREFIX` – prefixul public al API-ului (implicit `/api`)
- `FRONTEND_ORIGINS` – listează origin-urile permise (separate prin virgulă)
- `MISTRAL_API_KEY` – cheie opțională pentru rezumate automate

Frontend-ul folosește `.env` din rădăcina proiectului (`.env.example`) pentru a
configura `VITE_API_BASE_URL` (implicit `/api`).

## Teste rapide

```bash
npm run build           # verifică build-ul frontend-ului
python -m compileall backend/app  # verifică erori de sintaxă în backend
```

Aceste comenzi sunt rulate și în CI pentru a preveni erorile evidente de build.
