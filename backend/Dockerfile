# provenance.fm backend — place at:  backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app

# system libs commonly needed for audio/ML deps (librosa, soundfile, mert)
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libsndfile1 ffmpeg \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5050
# compose overrides this, but it also works standalone:
CMD ["uvicorn", "provenance.app:app", "--host", "0.0.0.0", "--port", "5050"]
