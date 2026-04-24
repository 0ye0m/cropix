"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { motion } from "framer-motion"

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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", 
  "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",
  "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"
];

const MODEL_ID = "llama-3.1-8b-instant";

export default function FormPage() {
  const [formData, setFormData] = useState({
    Crop: "",
    Season: "",
    Area: "",
    Fertilizer: "",
    Crop_Year: "",
    Pesticide: "",
    Annual_Rainfall: "",
  })
  const [recommendation, setRecommendation] = useState<string>("")
  const [showResult, setShowResult] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // --- DIRECT GROQ API CALL (No Backend) ---
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
            temperature: 0.1,
            max_tokens: 50,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error(`[DEBUG] Key #${i + 1} Failed: Status ${response.status}`, errorData);
          
          // If rate limited, try next key
          if (response.status === 429) {
            console.log(`[DEBUG] Rate limited on key #${i + 1}, trying next key...`);
            continue;
          }
          
          lastError = new Error(`API Error: ${response.status}`);
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
        // Continue to next key on network error
        continue;
      }
    }

    throw lastError || new Error("All API keys failed. Please try again later.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setRecommendation("")
    setShowResult(false)
    setError("")

    const prompt = `
      Act as an agricultural data scientist. Based on the following parameters, estimate the crop yield in tonnes per hectare:
      
      - Crop: ${formData.Crop}
      - Season: ${formData.Season}
      - Area: ${formData.Area} hectares
      - Fertilizer used: ${formData.Fertilizer} kg
      - Crop Year: ${formData.Crop_Year}
      - Pesticide used: ${formData.Pesticide} tonnes
      - Annual Rainfall: ${formData.Annual_Rainfall} mm

      IMPORTANT: Return ONLY a single numeric value (like 3.5 or 5.2). No text, no units, no explanation. Just the number.
    `;

    try {
      const resultText = await callGroqAPI(prompt);
      // Extract just the numeric value from the response
      const numericValue = resultText.trim().replace(/[^0-9.]/g, '');
      
      if (!numericValue || isNaN(parseFloat(numericValue))) {
        throw new Error("Invalid response format");
      }
      
      console.log("[DEBUG] Parsed Yield Value:", numericValue);
      
      setRecommendation(numericValue);
      setShowResult(true);
    } catch (err) {
      console.error("Error fetching crop yield prediction:", err);
      setError("Failed to predict yield. Please check your inputs and try again.");
      
      // Fallback: Set a default recommendation based on common crop yields
      const defaultYield = "4.5";
      setRecommendation(defaultYield);
      setShowResult(true);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 text-balance leading-tight">
            Crop Yield Prediction
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-md mx-auto">
            Enter your agricultural data to predict crop yield with AI accuracy.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-green-700 font-bold">
                Crop & Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="Crop">Crop Type</Label>
                    <Input 
                      id="Crop" 
                      type="text" 
                      placeholder="e.g., Wheat" 
                      value={formData.Crop} 
                      onChange={(e) => handleInputChange("Crop", e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Season">Season</Label>
                    <Input 
                      id="Season" 
                      type="text" 
                      placeholder="e.g., Kharif" 
                      value={formData.Season} 
                      onChange={(e) => handleInputChange("Season", e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Area">Area (hectares)</Label>
                    <Input 
                      id="Area" 
                      type="number" 
                      placeholder="Area" 
                      value={formData.Area} 
                      onChange={(e) => handleInputChange("Area", e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Fertilizer">Fertilizer (kg)</Label>
                    <Input 
                      id="Fertilizer" 
                      type="number" 
                      placeholder="Fertilizer" 
                      value={formData.Fertilizer} 
                      onChange={(e) => handleInputChange("Fertilizer", e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Crop_Year">Crop Year</Label>
                    <Input 
                      id="Crop_Year" 
                      type="number" 
                      placeholder="Year" 
                      value={formData.Crop_Year} 
                      onChange={(e) => handleInputChange("Crop_Year", e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Pesticide">Pesticide (tonnes)</Label>
                    <Input 
                      id="Pesticide" 
                      type="number" 
                      placeholder="Pesticide" 
                      value={formData.Pesticide} 
                      onChange={(e) => handleInputChange("Pesticide", e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="Annual_Rainfall">Annual Rainfall (mm)</Label>
                    <Input 
                      id="Annual_Rainfall" 
                      type="number" 
                      placeholder="Rainfall" 
                      value={formData.Annual_Rainfall} 
                      onChange={(e) => handleInputChange("Annual_Rainfall", e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Predicting...
                    </span>
                  ) : (
                    "Predict Yield"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {showResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className={`mt-8 border-2 shadow-lg backdrop-blur-sm ${
              error ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
            }`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  {error ? (
                    <>
                      <h3 className="text-xl font-bold text-red-800 mb-2">
                        Prediction Error
                      </h3>
                      <p className="text-red-700 leading-relaxed mb-4">
                        {error}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        Predicted Crop Yield
                      </h3>
                      <p className="text-4xl font-bold text-green-600 mb-4">
                        {recommendation} <span className="text-lg">tonnes/hectare</span>
                      </p>
                      <p className="text-green-700 leading-relaxed mb-4">
                        Based on your inputs for {formData.Crop} during {formData.Season} season, 
                        the estimated yield is approximately {recommendation} tonnes per hectare.
                      </p>
                    </>
                  )}
                  <Button 
                    onClick={() => {
                      setShowResult(false)
                      setError("")
                    }} 
                    variant="outline" 
                    className={`${
                      error 
                        ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white' 
                        : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                    }`}
                  >
                    Predict Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}
