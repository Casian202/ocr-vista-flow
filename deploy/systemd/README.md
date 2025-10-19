# Systemd unit files

This folder contains a sample `ocr-backend.service` unit that runs the Flask
backend with Gunicorn on port `8000`. Adjust the filesystem paths to match the
location where you clone the repository and the Python virtual environment you
create for the backend.

After copying the file to `/etc/systemd/system/ocr-backend.service`, reload
systemd and enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ocr-backend.service
```

The service expects the backend's environment variables to live in
`/opt/ocr-vista-flow/backend/.env` by default. You can generate a starting file
from `backend/.env.example`.
