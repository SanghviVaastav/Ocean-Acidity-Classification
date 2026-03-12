services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=sqlite:///./predictions.db
