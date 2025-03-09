# Bargain Buddy v2

Bargain Buddy V2 ports the existing Bargain Buddy enpoints to a new API first architecture, as well as implements a React Frontend. The project is split into two main parts: the backend and the frontend. The backend is a RESTful API built with Django and DRF with JWT; and the frontend is a React application. The backend is responsible for handling all the business logic and data storage, while the frontend is responsible for displaying the data to the user and handling user interactions.

## Backend

The backend is a RESTful API built with Django and Django Rest Framework. The API is responsible for handling all the business logic and data storage. The API is built with JWT authentication.

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
