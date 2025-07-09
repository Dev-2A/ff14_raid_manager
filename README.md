# FF14 Raid Manager Backend

This project implements the backend API for an FF14 Raid Management system, based on the provided design document.

## Features

- User Management (Signup, Login)
- Job Management
- Item Management
- Raid Party Management
- Player Management (with character nicknames, multi-party support)
- Gear Set Management (Starting and Best-in-Slot)
- Loot Distribution Logic (Eat and Go, One Item Per Week, BiS Needs, Player Item Priority, Core Algorithm)
- Raid Schedule Management
- Statistics related to loot distribution

## Setup and Running

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a Python virtual environment:**
    *   Windows:
        ```bash
        python -m venv .venv
        .\.venv\Scripts\activate
        ```
    *   macOS/Linux:
        ```bash
        python3 -m venv .venv
        source ./.venv/bin/activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install "fastapi[all]" sqlalchemy
    ```

4.  **Run the FastAPI application:**
    ```bash
    uvicorn main:app --reload
    ```

    The API documentation will be available at `http://127.0.0.1:8000/docs`.

## Database

This project uses SQLite for simplicity. The database file (`raid_manager.db`) will be created in the `backend/` directory upon first run.
