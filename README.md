# Prediction App

A learning project to practice Docker and CI/CD.

## Overview

**Prediction App** is a web-based application for predicting UEFA Champions League, UEFA Europa League and UEFA Conference League match outcomes during league rounds. The app is designed for educational purposes and demonstrates integration of data scraping, cloud storage, and modern deployment techniques.

- **Backend:** Python (FastAPI)
- **Frontend:** React
- **Data Source:** Scraped from [fbref.com](https://fbref.com/)
- **Cloud Storage:** Pinata Cloud
- **Deployment:** Codespaces, Docker, and CI/CD workflows

## Features

- Scrapes match and team data from fbref.com
- Stores and retrieves data using Pinata Cloud
- Lets users predict match outcomes for UEFA Champions/Europa/Conference League rounds
- Generates and allows downloading a PDF of user predictions
- Runs seamlessly in GitHub Codespaces
- Uses Docker for containerization
- Includes CI/CD setup for automated builds and deployment

## Getting Started

### Prerequisites

- [GitHub Codespaces](https://github.com/features/codespaces) or local Docker setup
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) for frontend
- Python 3.x for backend
- Pinata Cloud account for data access

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JasvendraSingh/Prediction-App.git
   cd Prediction-App
   ```

2. **Run with Docker**
   ```bash
   docker-compose up
   ```

   Or, open in **GitHub Codespaces** for instant cloud development.

3. **Configure Pinata Cloud**
   - Add your Pinata API keys/secrets in the backend `.env` file.

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

## Usage

- Visit the web app in your browser (local or Codespaces URL).
- Select match rounds and enter your predictions.
- Download the PDF summary of your prediction at the end.

## Learning Goals

- Practice using Docker for development and deployment
- Implement CI/CD with GitHub Actions
- Use Codespaces for cloud-based coding
- Integrate third-party APIs (Pinata Cloud)

## License

This project is for educational purposes.
