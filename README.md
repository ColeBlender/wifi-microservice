# WiFi Microservice

The **WiFi Microservice** is part of the **MGM Grand WiFi Simulation** project and handles the WiFi login process for guests. It communicates with the **Guests Microservice** using **gRPC** to validate guest details and increment their WiFi login count. This service interacts with the guest service to ensure that the user login experience is seamless and tracked.

## Features

- Provides a **gRPC** endpoint for managing WiFi logins.
- Communicates with the **Guests Microservice** to validate guest credentials and increment WiFi login counts.
- Uses **Supabase** indirectly via the **Guests Microservice** for guest information management.
- Dockerized for deployment.

## gRPC Endpoint

1. **Login**: Handles the WiFi login process for guests.
   - **Request**: `last_name`, `room_number`
   - **Response**: `success` (boolean)
