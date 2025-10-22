# CROPIX: Smart Agriculture Solutions

## Project Overview
CROPIX is an intelligent agricultural platform designed to empower farmers with data-driven insights for optimized crop management. This project leverages machine learning models to provide recommendations for crop selection, fertilizer application, and soil analysis, ultimately aiming to enhance yield, reduce waste, and promote sustainable farming practices.

## Created By
CROPIX was created by 2nd-year students of VIT Bhopal, India:
- **Rachit Tiwari**: ML Model Engineer (Backend Developer, developed LSTM and CNN models) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/rachit-tiwari-3319ba312/)
- **Shaikh Mohammad Warsi**: UI/UX Designer (Frontend Developer, designed UI/UX and developed KNN model) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shaikh-mohammad-warsi-141532271/)

## Features
- **Crop Recommendation**: Suggests suitable crops based on soil conditions and environmental factors.
- **Fertilizer Recommendation**: Recommends optimal fertilizer types and quantities for specific crops and soil.
- **Soil-Crop Recommendation**: Provides integrated recommendations considering both soil health and crop suitability.
- **Disease Detection**: (Implied from `Disease-Detection[CNN].py` and `CNN` folder) Identifies crop diseases using image analysis.
- **Market Forecast**: (Implied from `MARKET_Forecast[LSTM].py`) Predicts market trends for agricultural produce.
- **Weather Prediction**: (Implied from `Weather_Prediction.py`) Offers weather forecasts relevant to farming.
- **User-Friendly Interface**: A modern and responsive web application for easy interaction.

## Tech Stack

### Frontend
The frontend of CROPIX is a robust and interactive web application built with the following technologies:
- **Next.js**: A React framework for building performant and scalable web applications.
- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and maintainability.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **Radix UI**: A collection of unstyled, accessible UI components for building high-quality design systems.
- **Framer Motion**: A production-ready motion library for React to power animations.
- **Other Libraries**: `react-hook-form` for form management, `zod` for schema validation, `lucide-react` for icons, `date-fns` for date utilities, `recharts` for data visualization, and `next-themes` for theme management.

### Backend
The backend of CROPIX is a Python-based API that serves machine learning models and handles data processing:
- **FastAPI**: A modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints.
- **Uvicorn**: An ASGI web server, used to run FastAPI applications.
- **Machine Learning Libraries**:
    - **Keras / TensorFlow**: For deep learning models, particularly for disease detection (CNN) and market forecasting (LSTM).
    - **scikit-learn**: A comprehensive library for traditional machine learning algorithms, used for crop and fertilizer recommendations (e.g., Random Forest, KNN).
    - **XGBoost**: An optimized distributed gradient boosting library designed to be highly efficient, flexible, and portable, likely used for crop yield prediction.
    - **NumPy & Pandas**: Essential libraries for numerical operations and data manipulation.
    - **Matplotlib & Seaborn**: For data visualization and analysis (likely used during model development).
    - **Joblib**: For efficient saving and loading of Python objects, especially large NumPy arrays, used for trained machine learning models.

## How to Use CROPIX

Visit our website at [https://cropixbitlyfe.com](https://cropixbitlyfe.com) to access and utilize all the functions of CROPIX. CROPIX provides several powerful tools to assist farmers. Here's a quick guide on how to use each main feature:

### 1. Crop Recommendation
- **How to Use**: Navigate to the 'Crop Recommendation' section. Input your soil's nitrogen, phosphorus, and potassium levels, pH, rainfall, temperature, and humidity. The system will then suggest the best crops for your environment.

### 2. Fertilizer Recommendation
- **How to Use**: Go to the 'Fertilizer Recommendation' section. Select your crop and provide details about your soil's nutrient content. CROPIX will recommend the most effective fertilizer.

### 3. Soil-Crop Recommendation
- **How to Use**: In the 'Soil-Crop Recommendation' area, enter your soil parameters. The system will analyze this data to provide a comprehensive recommendation for both soil management and crop choices.

### 4. Disease Detection
- **How to Use**: Upload an image of your affected crop in the 'Disease Detection' section. Our AI model will analyze the image and provide a diagnosis, along with potential remedies.

### 5. Market Forecast
- **How to Use**: Visit the 'Market Forecast' section to view upcoming trends and price predictions for various crops.

### 6. Weather Prediction
- **How to Use**: Check the 'Weather Prediction' section for localized weather information and forecasts that can impact your farming activities.

By utilizing these features, you can make more informed decisions, improve crop yield, and enhance the sustainability of your farming practices.


## Local Installation

### Prerequisites
Before you begin, ensure you have the following installed:
- Git
- Node.js (LTS version recommended) and npm/yarn/pnpm
- Python 3.8+ and pip

### 1. Clone the Repository
```bash
git clone https://github.com/ShaikhWarsi/CropixFarming
cd Production---CROPIX
```

### 2. Backend Setup
Navigate to the `backend` directory, create a virtual environment, install dependencies, and set up environment variables.

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory and add any necessary environment variables (e.g., API keys, database connections). A `temp_images` folder is also present, which might be used for temporary storage of images for disease detection.

### 3. Frontend Setup
Navigate to the `frontend` directory and install dependencies.

```bash
cd ../frontend
pnpm install # or npm install or yarn install
```

## Running the Application

### 1. Run the Backend
From the `backend` directory, start the FastAPI server:

```bash
cd backend
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be accessible at `http://localhost:8000`.

### 2. Run the Frontend
From the `frontend` directory, start the Next.js development server:

```bash
cd frontend
pnpm run dev # or npm run dev or yarn dev
```
The frontend application will be accessible at `http://localhost:3000`.

## Project Structure

```
Production_CROPIX/
├── backend/                # FastAPI backend with ML models
│   ├── main.py             # Main FastAPI application
│   ├── requirements.txt    # Backend Python dependencies
│   ├── API_DOCUMENTATION.md # API endpoint documentation
│   ├── MODEL_DOCUMENTATION.md # Machine learning model documentation
│   ├── Trained_models/     # Stored machine learning models
│   └── ...
├── frontend/               # Next.js frontend application
│   ├── app/                # Next.js pages and routes
│   │   ├── crop-recommendation/
│   │   ├── fertilizer-recommendation/
│   │   ├── soil-crop-recommendation/
│   │   ├── disease-detection/
│   │   ├── market-forecast/
│   │   ├── weather-forecast/
│   │   └── ...
│   ├── components/         # React components (UI, navigation)
│   ├── public/             # Static assets
│   ├── styles/             # Global CSS
│   ├── package.json        # Frontend dependencies
│   └── ...
├── Datasets/               # Datasets used for training (e.g., CSV files)
├── MODELS/                 # Jupyter notebooks or scripts for model development
└── README.md               # This file
```

## Documentation
- [API Documentation](backend/API_DOCUMENTATION.md): Detailed information about the backend API endpoints.
- [Model Documentation](backend/MODEL_DOCUMENTATION.md): In-depth documentation for each machine learning model used in the project.
- [Contributing Guidelines](CONTRIBUTING.md): Information on how to contribute to the project.

## Contributing
We welcome contributions to CROPIX! Please refer to our [Contributing Guidelines](CONTRIBUTING.md) for more details on how to get involved.

## License
This project is licensed under the MIT License.
