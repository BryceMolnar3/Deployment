#!/bin/bash

# Print environment information
echo "Environment Information:"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "Python version:"
/usr/bin/python3 --version
echo "Poetry version:"
/opt/render/project/poetry/bin/poetry --version

# Print Poetry environment information
echo "Poetry environment information:"
/opt/render/project/poetry/bin/poetry env info

# Install dependencies
echo "Installing dependencies..."
/opt/render/project/poetry/bin/poetry install --no-dev

# Run migrations
echo "Running migrations..."
/opt/render/project/poetry/bin/poetry run python manage.py migrate

# Collect static files
echo "Collecting static files..."
/opt/render/project/poetry/bin/poetry run python manage.py collectstatic --noinput

# Start Gunicorn
echo "Starting Gunicorn..."
/opt/render/project/poetry/bin/poetry run gunicorn collation_backend.wsgi:application --bind 0.0.0.0:$PORT

# Add Poetry to PATH
export PATH="/opt/render/project/poetry/bin:$PATH"

# Print current directory and contents for debugging
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Run migrations
poetry run python manage.py migrate

# Collect static files
poetry run python manage.py collectstatic --noinput

# Start Gunicorn
poetry run gunicorn collation_backend.wsgi:application --bind 0.0.0.0:$PORT
 