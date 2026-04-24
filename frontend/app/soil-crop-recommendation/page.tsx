"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { motion } from "framer-motion";
import { Loader2, Sprout, AlertTriangle, CheckCircle2, Droplets, Thermometer, FlaskConical } from "lucide-react";

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

interface CropRecommendation {
  crop: string;
  confidence: string;
  reason: string;
  alternativeCrops: string[];
}

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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", 
  "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",
  "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"
];

const MODEL_ID = "llama-3.1-8b-instant";

export default function SoilCropRecommendationPage() {
  const [formData, setFormData] = useState<SoilFormData>({
    N: "", P: "", K: "", temperature: "", humidity: "", ph: "", rainfall: "",
  });
  const [recommendation, setRecommendation] = useState<CropRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- DIRECT GROQ API CALL ---
  const callGroqAPI = async (prompt: string): Promise<string> => {
    let lastError: Error | null = null;

    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
      const key = GROQ_API_KEYS[i];
      console.log(`[DEBUG] Attempting Groq API Call with Key #${i + 1}`);

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
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error(`[DEBUG] Key #${i + 1} Failed: Status ${response.status}`, errorData);
          
          if (response.status === 429) {
            console.log(`[DEBUG] Rate limited on key #${i + 1}, trying next key...`);
            continue;
          }
          
          lastError = new Error(`API Error ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log("[DEBUG] API Response Success:", data);
        return data.choices[0].message.content;

      } catch (err) {
        console.error(`[DEBUG] Network/Fetch Error with Key #${i + 1}:`, err);
        if (err instanceof Error) {
          lastError = err;
        }
        continue;
      }
    }

    throw lastError || new Error("All API keys failed. Please try again later.");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendation(null);

    // Validate inputs
    const ph = parseFloat(formData.ph);
    const temp = parseFloat(formData.temperature);
    const humidity = parseFloat(formData.humidity);
    
    if (ph < 0 || ph > 14) {
      setError("pH value must be between 0 and 14");
      setLoading(false);
      return;
    }
    
    if (temp < -10 || temp > 50) {
      setError("Temperature must be between -10°C and 50°C");
      setLoading(false);
      return;
    }
    
    if (humidity < 0 || humidity > 100) {
      setError("Humidity must be between 0% and 100%");
      setLoading(false);
      return;
    }

    const prompt = `
      Act as an expert agronomist. Analyze the following soil and weather conditions:
      - Nitrogen (N): ${formData.N} kg/ha
      - Phosphorus (P): ${formData.P} kg/ha
      - Potassium (K): ${formData.K} kg/ha
      - Temperature: ${formData.temperature}°C
      - Humidity: ${formData.humidity}%
      - pH Level: ${formData.ph}
      - Rainfall: ${formData.rainfall} mm

      Task: 
      1. Determine the single best crop to grow in these conditions
      2. Provide a confidence level (High/Medium/Low)
      3. Give a brief reason for the recommendation
      4. Suggest 2 alternative crops

      CRITICAL INSTRUCTION: Return ONLY a valid JSON object with no additional text, markdown, or explanation.
      
      JSON Format:
      {
        "crop": "Wheat",
        "confidence": "High",
        "reason": "Optimal pH and nitrogen levels for wheat cultivation",
        "alternativeCrops": ["Barley", "Maize"]
      }
    `;

    try {
      const resultText = await callGroqAPI(prompt);
      
      // Clean and parse JSON response
      let cleanJson = resultText.trim();
      cleanJson = cleanJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON if there's extra text
      const jsonMatch = cleanJson.match(/\{.*\}/s);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }
      
      console.log("[DEBUG] Parsed JSON:", cleanJson);
      
      const data: CropRecommendation = JSON.parse(cleanJson);
      
      // Validate the response
      if (!data.crop) {
        throw new Error("Invalid recommendation format");
      }
      
      setRecommendation(data);
      
    } catch (err) {
      console.error("[DEBUG] Error:", err);
      if (err instanceof SyntaxError) {
        setError("Failed to parse AI response. Please try again.");
        
        // Fallback recommendation based on soil conditions
        setRecommendation(getFallbackRecommendation(formData));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback recommendation logic
  const getFallbackRecommendation = (data: SoilFormData): CropRecommendation => {
    const ph = parseFloat(data.ph);
    const temp = parseFloat(data.temperature);
    const rainfall = parseFloat(data.rainfall);
    
    let crop = "Wheat";
    let reason = "Based on general soil conditions";
    
    if (ph >= 5.5 && ph <= 7.0 && temp >= 20 && temp <= 30 && rainfall >= 500) {
      crop = "Rice";
      reason = "Suitable pH and high rainfall ideal for rice";
    } else if (ph >= 6.0 && ph <= 7.5 && temp >= 15 && temp <= 25) {
      crop = "Wheat";
      reason = "Moderate temperature and pH suitable for wheat";
    } else if (ph >= 5.8 && ph <= 7.0 && temp >= 18 && temp <= 35) {
      crop = "Maize";
      reason = "Warm temperature and good soil conditions for maize";
    } else if (ph >= 6.0 && ph <= 7.0 && temp >= 20 && temp <= 30) {
      crop = "Soybean";
      reason = "Optimal conditions for soybean cultivation";
    }
    
    return {
      crop,
      confidence: "Medium",
      reason,
      alternativeCrops: ["Barley", "Sorghum"]
    };
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <Sprout className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 text-balance leading-tight">
            Soil Crop Recommendation
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-md mx-auto">
            Get AI-powered recommendations for the best crop to grow based on your soil conditions.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-green-700 font-bold flex items-center gap-2">
                <FlaskConical className="w-6 h-6" />
                Enter Soil Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="N" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Nitrogen (N) kg/ha
                    </Label>
                    <Input
                      id="N"
                      type="number"
                      name="N"
                      value={formData.N}
                      onChange={handleChange}
                      placeholder="e.g., 40"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="P" className="text-sm font-medium text-gray-700">
                      Phosphorus (P) kg/ha
                    </Label>
                    <Input
                      id="P"
                      type="number"
                      name="P"
                      value={formData.P}
                      onChange={handleChange}
                      placeholder="e.g., 20"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="K" className="text-sm font-medium text-gray-700">
                      Potassium (K) kg/ha
                    </Label>
                    <Input
                      id="K"
                      type="number"
                      name="K"
                      value={formData.K}
                      onChange={handleChange}
                      placeholder="e.g., 15"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Thermometer className="w-4 h-4" />
                      Temperature (°C)
                    </Label>
                    <Input
                      id="temperature"
                      type="number"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="e.g., 25"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      required
                      min="-10"
                      max="50"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="humidity" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Droplets className="w-4 h-4" />
                      Humidity (%)
                    </Label>
                    <Input
                      id="humidity"
                      type="number"
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleChange}
                      placeholder="e.g., 65"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      required
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ph" className="text-sm font-medium text-gray-700">
                      pH Value
                    </Label>
                    <Input
                      id="ph"
                      type="number"
                      name="ph"
                      value={formData.ph}
                      onChange={handleChange}
                      placeholder="e.g., 6.5"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      required
                      min="0"
                      max="14"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rainfall" className="text-sm font-medium text-gray-700">
                      Rainfall (mm)
                    </Label>
                    <Input
                      id="rainfall"
                      type="number"
                      name="rainfall"
                      value={formData.rainfall}
                      onChange={handleChange}
                      placeholder="e.g., 800"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 text-base sm:text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Soil Conditions...
                    </span>
                  ) : (
                    "Get Recommendation"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <Card className="mt-8 border-2 border-red-300 bg-red-50 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">Error: {error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {recommendation && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="mt-8 border-2 border-green-300 bg-green-50 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">
                    Recommended Crop
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      {recommendation.crop}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(recommendation.confidence)} bg-white border`}>
                      {recommendation.confidence} Confidence
                    </span>
                  </div>
                  
                  {recommendation.reason && (
                    <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                      <h3 className="font-semibold text-green-800 mb-1">Why this crop?</h3>
                      <p className="text-green-700">{recommendation.reason}</p>
                    </div>
                  )}
                  
                  {recommendation.alternativeCrops && recommendation.alternativeCrops.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h3 className="font-semibold text-green-800 mb-2">Alternative Options</h3>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {recommendation.alternativeCrops.map((crop, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!loading && !error && !recommendation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-gray-500"
          >
            <p>Enter your soil parameters and click "Get Recommendation" to see AI-powered crop suggestions.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
