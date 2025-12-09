FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Do NOT install python-dotenv unless needed locally
# Render injects secrets into environment automatically

COPY . .

ARG BACKEND_PORT=8000
ENV BACKEND_PORT=$BACKEND_PORT

EXPOSE $BACKEND_PORT

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload"]
