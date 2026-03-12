🌾 CROPIX: Smart Agriculture Solutions
Next.jsFastAPIAILicense

📖 Project Overview
CROPIX is an intelligent agricultural platform designed to empower farmers with data-driven insights for optimized crop management. By combining traditional Machine Learning models with cutting-edge Large Language Models (LLMs) via Groq, CROPIX provides real-time, context-aware recommendations for crop selection, fertilizer application, and soil analysis.

The Goal: Enhance yield, reduce resource waste, and promote sustainable farming practices through precision agriculture.

✨ Key Features
1. 🌱 Crop Recommendation
Suggests the most suitable crops based on soil composition (N, P, K) and environmental factors (Temperature, Humidity, pH, Rainfall).

Tech: Uses supervised learning algorithms trained on agricultural datasets.
AI Enhancement: Falls back to Llama 3.1 via Groq API for broad reasoning if local models are uncertain.
2. 🧪 Fertilizer Recommendation
Recommends optimal fertilizer types and quantities.

Input: Crop type and current soil nutrient levels.
Output: Specific N, P, K requirements to balance soil health.
Intelligence: Uses LLMs to calculate deficits and recommend exact dosage, replacing simple lookup tables with dynamic reasoning.
3. 📈 Crop Yield Prediction
Predicts the expected yield (tonnes/hectare) based on farming inputs.

Inputs: Crop type, Season, Area, Fertilizer usage, Pesticide usage, and Rainfall.
Logic: Analyzes historical trends and resource efficiency ratios to estimate output.
4. 🌿 Disease Detection
Identifies crop diseases using image analysis.

Tech: Convolutional Neural Networks (CNN) built with TensorFlow/Keras.
Usage: Upload an image of the affected leaf to get a diagnosis and remedy.
5. 📉 Market Forecast & Weather Prediction
Market: Uses LSTM (Long Short-Term Memory) networks to predict price trends.
Weather: Aggregates meteorological data to assist in planning sowing and harvesting.
🧠 Tech Stack & Architecture
CROPIX uses a Hybrid Intelligence Architecture:

Local ML Models: Fast and efficient for structured data (Crop/Yield predictions).
Cloud LLM (Groq): Used for complex reasoning, natural language explanations, and fallback reliability.
Frontend
Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS, Radix UI
Animation: Framer Motion
State: React Hooks, React Hook Form
Backend
Framework: FastAPI (Python)
ML Ops:
scikit-learn & XGBoost for tabular data.
TensorFlow/Keras for Deep Learning (CNN, LSTM).
AI Integration: Groq API (Llama 3.1 Models) for inference.
🧪 Test Cases & Validation
To verify the system is functioning correctly, use the following test inputs. These are designed to trigger specific logic in both the ML models and the AI fallback system.

Test 1: Fertilizer Recommendation
Scenario: Testing the system's ability to recommend high nitrogen for a heavy feeder.

Parameter	Input Value	Expected Outcome
Crop	Rice	Rice is a heavy nitrogen feeder.
Current N	15	System detects Nitrogen is low.
Current P	20	Moderate levels.
Current K	10	Low levels.
Result	High N Recommendation	AI should recommend N levels > 60-80 to correct the deficit.
Scenario: Testing logic for Legumes (Nitrogen Fixers).

Parameter	Input Value	Expected Outcome
Crop	Chickpea	Legumes fix their own nitrogen.
Current N	20	Low input.
Result	Low N Recommendation	AI should recognize Chickpea needs less Nitrogen than Rice, focusing on Phosphorus instead.
Test 2: Soil Crop Recommendation
Scenario: Tropical Wet Conditions.

Parameter	Input Value	Expected Outcome
Temperature	30°C	High temp.
Humidity	90%	Very high humidity.
Rainfall	2500 mm	High water availability.
pH	6.2	Slightly acidic.
Result	Rice	Ideal conditions for Paddy/Rice cultivation.
Scenario: Dry/Cool Conditions.

Parameter	Input Value	Expected Outcome
Temperature	18°C	Cool.
Humidity	45%	Low.
Rainfall	500 mm	Low.
Result	Wheat / Barley	Suitable for Rabi crops that prefer cooler, drier weather.
Test 3: Yield Prediction
Scenario: High Yield Expectation.

Parameter	Input Value	Expected Outcome
Crop	Rice	-
Fertilizer	200 kg	High inputs.
Rainfall	2200 mm	Ideal water.
Result	High Value	Yield prediction should be > 3.5 tonnes/hectare.
🚀 Local Installation
Prerequisites
Git
Node.js (v18+)
Python (3.9+)
Groq API Key (Get one free at console.groq.com)
1. Clone the Repository
git clone https://github.com/0ye0m/cropixcd cropix
2. Backend Setup
Navigate to the backend directory and set up the Python environment.

bash

cd backend

# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
Environment Variables:
Create a .env file in the backend/ directory (if your backend uses keys directly). However, in this architecture, the API keys are managed in the Frontend environment for client-side AI calls.

3. Frontend Setup
Navigate to the frontend directory and configure the AI keys.

bash

cd ../frontend

# Install dependencies
pnpm install 
# or npm install

# Create environment file
touch .env.local
Configure .env.local:
Add your Groq API keys to ensure the recommendation system works. The application uses a fallback mechanism, so add both primary and backup keys if available.

env

# Optional: If you want to move keys out of code
NEXT_PUBLIC_GROQ_KEY_1="gsk_your_primary_key_here"
NEXT_PUBLIC_GROQ_KEY_2="gsk_your_fallback_key_here"
(Note: The current implementation expects keys in the code, but for production, environment variables are recommended).

⚡ Running the Application
1. Start the Backend Server
The backend serves the ML models for yield and disease detection.

bash

cd backend
# Ensure venv is active
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
Backend runs on http://localhost:8000

2. Start the Frontend Server
The frontend handles the UI and Groq API integration.

bash

cd frontend
pnpm run dev
Frontend runs on http://localhost:3000

📁 Project Structure
text

CROPIX/
├── backend/                # 🐍 FastAPI & ML Logic
│   ├── main.py             # Entry point for API
│   ├── requirements.txt    # Python dependencies
│   ├── Trained_models/     # Serialized .pkl / .h5 models
│   ├── temp_images/        # Storage for disease detection uploads
│   └── ...
│
├── frontend/               # ⚛️ Next.js Application
│   ├── app/                # App Router Pages
│   │   ├── fertilizer-recommendation/ # AI-Driven Fertilizer Logic
│   │   ├── crop-recommendation/       # ML-Driven Crop Logic
│   │   ├── disease-detection/         # CNN Model Integration
│   │   └── ...
│   ├── components/         # Reusable UI Components
│   ├── lib/                # Utils and Helpers
│   └── package.json
│
├── Datasets/               # 📊 Raw Data (CSVs)
├── MODELS/                 # 📓 Jupyter Notebooks (Model Training)
└── README.md               # 📄 Documentation
