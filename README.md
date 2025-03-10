# Bargain Buddy v2

Bargin Buddy V2 is a project that aims to provide a platform for users to find and share deals on products. Bargain Buddy V2 ports the existing Bargain Buddy enpoints to a new API first architecture, as well as implements a React Frontend. The project is split into two main parts: the backend and the frontend. The backend is a RESTful API built with Django and DRF with JWT; and the frontend is a React application. The backend is responsible for handling all the business logic and data storage, while the frontend is responsible for displaying the data to the user and handling user interactions.

## Demo

A demo of the project can be found [here](https://bbuddy.webworkstt.com/)

## .env file

create an .env file in the root of the project with the following variables:

```bash
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=*
DB_HOST=db
DB_NAME=devdb
DB_USER=devuser
DB_PASS=devpass
DJANGO_SECRET_KEY="django-key-goes-here"
POSTGRES_DB=devdb
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass
DOMAIN='http://localhost:8000'
NOMINATIM_PASSWORD=nominatim_password
PBF_URL=https://download.geofabrik.de/central-america-latest.osm.pbf
```

## frontend/.env.development

create an .env.development file in the frontend directory with the following variables:

```bash
VITE_API_BASE_URL=http://192.168.1.104:8000/api

```

## Backend

The backend is a RESTful API built with Django and Django Rest Framework. The API is responsible for handling all the business logic and data storage. The API is built with JWT authentication.

## Frontend

The frontend is a React application that is responsible for displaying the data to the user and handling user interactions.

### Run with Docker

To run the backend with Docker, you need to have Docker installed on your machine. You can install Docker from [here](https://docs.docker.com/get-docker/).

1. Clone the repository
2. Navigate to the `backend` directory
3. Run the following command to build the Docker image:

   ```bash
   docker compose build
   ```

4. Run the following command to start the Docker container:

   ```bash
   docker compose up
   ```

5. The backend should now be running on `http://localhost:8000`
6. The frontend should now be running on `http://localhost:5173`
