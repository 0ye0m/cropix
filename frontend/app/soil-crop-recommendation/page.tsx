"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { motion } from "framer-motion";

// --- TYPES ---
interface SoilFormData {
  N: string;
  P: string;
  K: string;
  temperature: string;
  humidity: string;
  ph: string;
  rainfall: string;
  [key: string]: string;
}

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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", 
  "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"  
];

const MODEL_ID = "llama-3.1-8b-instant"; // Updated Model ID

export default function SoilCropRecommendationPage() {
  const [formData, setFormData] = useState<SoilFormData>({
    N: "", P: "", K: "", temperature: "", humidity: "", ph: "", rainfall: "",
  });
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- GROQ API INTEGRATION ---
  const callGroqAPI = async (prompt: string): Promise<string> => {
    let lastError: Error | null = null;

    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
      const key = GROQ_API_KEYS[i];
      console.log(`%c[DEBUG] Attempting Groq API Call with Key #${i + 1}`, 'color: blue; font-weight: bold;');

      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3, 
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[DEBUG] Key #${i + 1} Failed: Status ${response.status}`, errorText);
          lastError = new Error(`API Error ${response.status}`);
          continue; 
        }

        const data = await response.json();
        console.log("[DEBUG] API Response Success:", data);
        return data.choices[0].message.content;

      } catch (err) {
        if (err instanceof Error) {
            console.error(`[DEBUG] Network/Fetch Error with Key #${i + 1}:`, err);
            lastError = err;
        }
      }
    }

    throw lastError || new Error("All API keys failed.");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendation(null);

    const prompt = `
      Act as an expert agronomist. Analyze the following soil and weather conditions:
      - Nitrogen: ${formData.N}
      - Phosphorus: ${formData.P}
      - Potassium: ${formData.K}
      - Temperature: ${formData.temperature}°C
      - Humidity: ${formData.humidity}%
      - pH Level: ${formData.ph}
      - Rainfall: ${formData.rainfall} mm

      Task: Determine the single best crop to grow in these conditions.
      Instruction: Return ONLY the name of the crop as a single string. Do not add punctuation or explanations.
    `;

    try {
      const crop = await callGroqAPI(prompt);
      setRecommendation(crop);
    } catch (err) {
       if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 text-balance leading-tight">
            Soil Crop Recommendation
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-md mx-auto">
            Get recommendations for the best crop to grow based on your soil conditions using AI.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-green-700 font-bold">Enter Soil Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "N", label: "Nitrogen (N)", placeholder: "Enter Nitrogen content" },
                    { id: "P", label: "Phosphorus (P)", placeholder: "Enter Phosphorus content" },
                    { id: "K", label: "Potassium (K)", placeholder: "Enter Potassium content" },
                    { id: "temperature", label: "Temperature (°C)", placeholder: "Enter temperature" },
                    { id: "humidity", label: "Humidity (%)", placeholder: "Enter humidity" },
                    { id: "ph", label: "pH Value", placeholder: "Enter pH value" },
                    { id: "rainfall", label: "Rainfall (mm)", placeholder: "Enter rainfall" },
                  ].map((item) => (
                    <div key={item.id}>
                      <Label htmlFor={item.id} className="text-sm font-medium text-gray-700">{item.label}</Label>
                      <Input
                        id={item.id} 
                        type="number" 
                        name={item.id} 
                        value={formData[item.id]} 
                        onChange={handleChange} 
                        placeholder={item.placeholder}
                        className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                        required
                      />
                    </div>
                  ))}
                </div>
                <Button
                  type="submit" disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 text-base sm:text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? "Analyzing..." : "Get Recommendation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="mt-8 border-2 border-red-300 bg-red-50 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6"><p className="text-red-700 text-center">Error: {error}</p></CardContent>
            </Card>
          </motion.div>
        )}

        {recommendation && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="mt-8 border-2 border-green-300 bg-green-50 shadow-lg animate-in slide-in-from-bottom-4 duration-500 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">Recommendation:</h2>
                  <p className="text-green-700 leading-relaxed">
                    The recommended crop for your soil conditions is: <span className="font-semibold">{recommendation}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}