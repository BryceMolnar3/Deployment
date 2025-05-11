#!/bin/bash

# Add Poetry to PATH
export PATH="/opt/render/project/poetry/bin:$PATH"

# Print current directory and contents for debugging
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Install dependencies
poetry install --no-dev

# Run migrations
poetry run python manage.py migrate

# Collect static files
poetry run python manage.py collectstatic --noinput

# Start Gunicorn
 