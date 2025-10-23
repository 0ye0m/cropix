from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import os
import tensorflow as tf  # type: ignore
from tensorflow.keras.models import load_model  # type: ignore
from tensorflow.keras.preprocessing.image import ImageDataGenerator  # type: ignore
from sklearn.preprocessing import LabelEncoder
from dotenv import load_dotenv
import requests
import json
from sklearn.preprocessing import MinMaxScaler
from PIL import Image
import io
import base64
import uuid
import datetime # Add this line

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
CROP_YIELD_MODEL = joblib.load('Trained_models/CROP_YIELD_MODEL.joblib')
SOIL_CROP_RECOMMENDATION_MODEL = joblib.load('Trained_models/Soil_crop_recom.joblib')
DISEASE_DETECTION_MODEL = load_model('Trained_models/CNN/Disease_Detection_model[CNN].h5')
DISEASE_CLASSES = np.load('Trained_models/CNN/disease_classes.npy', allow_pickle=True)
FERTILIZER_RECOMMENDATION_MODEL = joblib.load('Trained_models/fertilizer_recommendation_model.joblib')

# Load LSTM Weather Forecast Model and preprocessing tools
load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
# OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
MARKET_MODEL_PATH = 'Trained_models/lstm_model.keras'
MARKET_DATA_PATH = 'Datasets/central_india_weekly_crop_prices.csv'


@app.get("/")
async def root():
    return {"message": "Welcome to the CROPIX API!"}


class CropYieldInput(BaseModel):
    Crop: str
    Season: str
    Area: float
    Fertilizer: float
    Crop_Year: int
    Pesticide: float
    Annual_Rainfall: float


@app.post("/predict_crop_yield/")
async def predict_crop_yield(input: CropYieldInput):
    df_input = pd.DataFrame([input.dict()])
    prediction = CROP_YIELD_MODEL.predict(df_input)[0]
    return {"predicted_yield": prediction.item()}


class SoilCropRecommendationInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


@app.post("/recommend_soil_crop/")
async def recommend_soil_crop(input: SoilCropRecommendationInput):
    df_input = pd.DataFrame([input.dict()])
    prediction_label = SOIL_CROP_RECOMMENDATION_MODEL.predict(df_input)[0]
    return {"recommended_crop": prediction_label}


class DiseaseDetectionInput(BaseModel):
    image_base64: str


@app.post("/detect_disease/")
async def detect_disease(input: DiseaseDetectionInput):
    try:
        # Decode the base64 string
        image_data = base64.b64decode(input.image_base64)
        image = Image.open(io.BytesIO(image_data))

        # Save temporarily in /tmp (Hugging Face writable dir)
        temp_filename = f"temp_image_{uuid.uuid4()}.png"
        temp_filepath = os.path.join("/tmp", temp_filename)
        image.save(temp_filepath)

        # Preprocess
        img = tf.keras.preprocessing.image.load_img(temp_filepath, target_size=(256, 256))  # type: ignore
        img_array = tf.keras.preprocessing.image.img_to_array(img)  # type: ignore
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0

        # Predict
        predictions = DISEASE_DETECTION_MODEL.predict(img_array)
        predicted_class_index = np.argmax(predictions)
        predicted_class = DISEASE_CLASSES[predicted_class_index]
        confidence = float(np.max(predictions))

        # Clean up
        os.remove(temp_filepath)

        return {"predicted_disease": predicted_class, "confidence": confidence}

    except Exception as e:
        return {"error": str(e)}


class LSTMWeatherForecastInput(BaseModel):
    city: str
    days: int


@app.post("/weather_forecast_lstm/")
async def weather_forecast_lstm(input: LSTMWeatherForecastInput):
    if not WEATHER_API_KEY:
        return {"error": "OpenWeather API key not found."}

    # Geocoding: Convert city name to latitude and longitude using OpenWeatherMap Geocoding API
    geocode_url = f"http://api.openweathermap.org/geo/1.0/direct?q={input.city}&limit=1&appid={WEATHER_API_KEY}"
    geocode_response = requests.get(geocode_url)
    geocode_response.raise_for_status()
    geocode_data = geocode_response.json()

    if not geocode_data:
        return {"error": f"Could not find coordinates for city: {input.city}"}

    lat = geocode_data[0]["lat"]
    lon = geocode_data[0]["lon"]

    # OpenWeatherMap One Call API 3.0 for 8-day daily forecast
    # The free tier of OpenWeatherMap One Call API 3.0 provides an 8-day daily forecast.
    # It also has a free limit of 1,000 calls/day.
    days_to_request = min(input.days, 8) # Cap days at 8 for OpenWeatherMap free tier
    url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=current,minutely,hourly,alerts&units=metric&appid={WEATHER_API_KEY}"

    response = requests.get(url)
    response.raise_for_status()
    data = response.json()["daily"]

    forecast_summary = []
    for day_data in data[:days_to_request]: # Limit to days_to_request
        date = datetime.fromtimestamp(day_data["dt"]).strftime("%Y-%m-%d")
        forecast_summary.append({
            "date": date,
            "min_temp_c": day_data["temp"]["min"],
            "max_temp_c": day_data["temp"]["max"],
            "avg_temp_c": (day_data["temp"]["day"] + day_data["temp"]["night"]) / 2, # Approximate average
            "avg_humidity": day_data["humidity"],
            "chance_of_rain": day_data["pop"] * 100, # Probability of precipitation
            "condition": day_data["weather"][0]["description"]
        })
    return {"forecast": forecast_summary, "city_name": input.city}


class WeatherForecastInput(BaseModel):
    city: str
    days: int


@app.post("/weather_forecast/")
async def weather_forecast(input: WeatherForecastInput):
    if not WEATHER_API_KEY:
        return {"error": "OpenWeather API key not found."}

    # Geocoding: Convert city name to latitude and longitude using OpenWeatherMap Geocoding API
    geocode_url = f"http://api.openweathermap.org/geo/1.0/direct?q={input.city}&limit=1&appid={WEATHER_API_KEY}"
    geocode_response = requests.get(geocode_url)
    geocode_response.raise_for_status()
    geocode_data = geocode_response.json()

    if not geocode_data:
        return {"error": f"Could not find coordinates for city: {input.city}"}

    lat = geocode_data[0]["lat"]
    lon = geocode_data[0]["lon"]

    # OpenWeatherMap One Call API 3.0 for 8-day daily forecast
    # The free tier of OpenWeatherMap One Call API 3.0 provides an 8-day daily forecast.
    # It also has a free limit of 1,000 calls/day.
    days_to_request = min(input.days, 8) # Cap days at 8 for OpenWeatherMap free tier
    url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=current,minutely,hourly,alerts&units=metric&appid={WEATHER_API_KEY}"

    response = requests.get(url)
    response.raise_for_status()
    data = response.json()["daily"]

    forecast_summary = []
    for day_data in data[:days_to_request]: # Limit to days_to_request
        date = datetime.fromtimestamp(day_data["dt"]).strftime("%Y-%m-%d")
        forecast_summary.append({
            "date": date,
            "min_temp_c": day_data["temp"]["min"],
            "max_temp_c": day_data["temp"]["max"],
            "avg_temp_c": (day_data["temp"]["day"] + day_data["temp"]["night"]) / 2, # Approximate average
            "avg_humidity": day_data["humidity"],
            "chance_of_rain": day_data["pop"] * 100, # Probability of precipitation
            "condition": day_data["weather"][0]["description"]
        })
    return {"forecast": forecast_summary, "city_name": input.city}


class FertilizerRecommendationInput(BaseModel):
    Crop: str
    Current_N: float
    Current_P: float
    Current_K: float


@app.post("/recommend_fertilizer/")
async def recommend_fertilizer(input: FertilizerRecommendationInput):
    df_input = pd.DataFrame([input.dict()])
    prediction = FERTILIZER_RECOMMENDATION_MODEL.predict(df_input)[0]
    return {
        "recommended_N": prediction[0].item(),
        "recommended_P": prediction[1].item(),
        "recommended_K": prediction[2].item()
    }


class MarketPriceForecastInput(BaseModel):
    crop_name: str
    weeks_to_forecast: int


@app.post("/forecast_market_prices/")
async def forecast_market_prices(input: MarketPriceForecastInput):
    model = load_model(MARKET_MODEL_PATH)
    df_historical = pd.read_csv(MARKET_DATA_PATH, index_col='Date', parse_dates=True)

    if input.crop_name not in df_historical.columns:
        return {"error": f"Crop '{input.crop_name}' not found in historical data."}

    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df_historical)

    n_steps = 8  # Must match training config
    n_features = df_historical.shape[1]
    last_known_data = scaled_data[-n_steps:]
    current_batch = last_known_data.reshape((1, n_steps, n_features))

    forecast = []
    for _ in range(input.weeks_to_forecast):
        current_pred = model.predict(current_batch, verbose=0)[0]
        forecast.append(current_pred)
        current_batch = np.append(current_batch[:, 1:, :], [[current_pred]], axis=1)

    forecast_prices = scaler.inverse_transform(forecast)
    last_historical_date = df_historical.index[-1]
    future_dates = pd.to_datetime(
        [last_historical_date + pd.Timedelta(weeks=i) for i in range(1, input.weeks_to_forecast + 1)]
    )

    df_forecast = pd.DataFrame(forecast_prices, index=future_dates, columns=df_historical.columns)

    return {"forecast": df_forecast[[input.crop_name]].round(2).to_dict()}


# Reload models at bottom (ensure availability)
DISEASE_DETECTION_MODEL = tf.keras.models.load_model("Trained_models/CNN/Disease_Detection_model[CNN].h5")
DISEASE_CLASSES = np.load("Trained_models/CNN/disease_classes.npy", allow_pickle=True)
