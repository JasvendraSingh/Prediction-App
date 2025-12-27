FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ARG BACKEND_PORT=8000
ENV BACKEND_PORT=$BACKEND_PORT

EXPOSE $BACKEND_PORT

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]