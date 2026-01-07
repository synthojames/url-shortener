## URL Shortener

A full-stack URL shortening service with basic analytics. Create short links and track clicks

**Live Demo:** [https://shorten.syntho.moe](https://shorten.syntho.moe)

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Redis
- **Frontend:** Vanilla JavaScript, HTML, CSS

## Features

- Create short URLs
- Click analytics and statistics
- Fast redirects with Redis caching
- Responsive design

## Installation

# Clone the repository
git clone https://github.com/synthojames/url-shortener.git
cd url-shortener

# Start all services
docker-compose up -d

# Access the app
open http://localhost
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shorten` | Create short URL |
| GET | `/:shortCode` | Redirect to original URL |
| GET | `/api/stats/:shortCode` | View analytics |
| GET | `/api/urls` | List URLs |
| DELETE | `/api/urls/:shortCode` | Delete URL |
