# WBCS Preparation Planner

A 2-year WBCS Civil Service preparation planner for working professionals with Electrical Engineering optional, built with Django.

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Copy env file and configure
cp .env.example .env

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

Visit http://127.0.0.1:8000 to see the planner.

## Deployment (Heroku)

```bash
heroku create
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(50))")
heroku config:set DEBUG=False
git push heroku main
```
