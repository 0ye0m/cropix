# CROPIX: Smart Agriculture Solutions

## Project Overview
CROPIX is an intelligent agricultural platform designed to empower farmers with data-driven insights for optimized crop management. This project leverages machine learning models to provide recommendations for crop selection, fertilizer application, and soil analysis, ultimately aiming to enhance yield, reduce waste, and promote sustainable farming practices.

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

## Installation

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
├── Trained_models/         # Root level trained models (might be duplicated in backend)
└── README.md               # This file
```

## Contributing
We welcome contributions to CROPIX! Please feel free to fork the repository, create a new branch, and submit a pull request with your enhancements or bug fixes.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
