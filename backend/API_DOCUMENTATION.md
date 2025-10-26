# API Documentation

**Base URL:** `https://yamxxx1-backendcropix.hf.space`

This document provides an overview of the API endpoints available in the CROPIX backend.

## Endpoints

### 1. Crop Recommendation
- **URL:** `/crop-recommend`
- **Method:** `POST`
- **Description:** Recommends the best crop to grow based on soil nutrients and environmental conditions.
- **Request Body:**
  ```json
  {
    "N": 90,  // Nitrogen content
    "P": 42,  // Phosphorus content
    "K": 43,  // Potassium content
    "temperature": 20.879744, // Temperature in Celsius
    "humidity": 82.002744,    // Humidity in %
    "ph": 6.502985,           // pH value of the soil
    "rainfall": 202.935536    // Rainfall in mm
  }
  ```
- **Response:**
  ```json
  {
    "recommended_crop": "rice"
  }
  ```

### 2. Fertilizer Recommendation
- **URL:** `/fertilizer-recommend`
- **Method:** `POST`
- **Description:** Recommends the best fertilizer based on soil nutrients, crop type, and environmental conditions.
- **Request Body:**
  ```json
  {
    "N": 90,  // Nitrogen content
    "P": 42,  // Phosphorus content
    "K": 43,  // Potassium content
    "crop_type": "rice", // Type of crop
    "soil_type": "loamy", // Type of soil
    "moisture": 30, // Soil moisture in %
    "temperature": 20.879744, // Temperature in Celsius
    "humidity": 82.002744 // Humidity in %
  }
  ```
- **Response:**
  ```json
  {
    "recommended_fertilizer": "urea"
  }
  ```

### 3. Soil-Crop Recommendation
- **URL:** `/soil-crop-recommend`
- **Method:** `POST`
- **Description:** Recommends suitable crops for a given soil type.
- **Request Body:**
  ```json
  {
    "soil_type": "sandy"
  }
  ```
- **Response:**
  ```json
  {
    "recommended_crops": ["maize", "groundnut", "watermelon"]
  }
  ```

### 4. Disease Detection
- **URL:** `/disease-detect`
- **Method:** `POST`
- **Description:** Detects plant diseases from an uploaded image.
- **Request Body:** `multipart/form-data` with a file field named `file` containing the image.
- **Response:**
  ```json
  {
    "disease": "Early Blight",
    "confidence": 0.95
  }
  ```

### 5. Market Price Forecast
- **URL:** `/market-forecast`
- **Method:** `POST`
- **Description:** Forecasts future market prices for a given crop.
- **Request Body:**
  ```json
  {
    "crop_name": "rice",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31"
  }
  ```
- **Response:**
  ```json
  {
    "forecast": [
      {"date": "2023-01-01", "price": 1500},
      {"date": "2023-01-02", "price": 1510}
    ]
  }
  ```

### 6. Weather Forecast
- **URL:** `/weather-forecast`
- **Method:** `GET`
- **Description:** Provides weather forecast for a given location.
- **Query Parameters:**
  - `city`: Name of the city (e.g., "Mumbai")
- **Response:**
  ```json
  {
    "city": "Mumbai",
    "temperature": 28,
    "condition": "Sunny",
    "humidity": 70
  }
  ```


## Authentication

Currently, no authentication is required for these endpoints.
