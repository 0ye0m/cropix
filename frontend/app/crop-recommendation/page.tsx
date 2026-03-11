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
  "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"  
];

const MODEL_ID = "llama-3.1-8b-instant"; // Updated Model ID

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
            temperature: 0.1, 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setRecommendation("")
    setShowResult(false)

    const prompt = `
      Act as an agricultural data scientist. Estimate the crop yield based on the following parameters:
      - Crop: ${formData.Crop}
      - Season: ${formData.Season}
      - Area: ${formData.Area} hectares
      - Fertilizer used: ${formData.Fertilizer} kg
      - Crop Year: ${formData.Crop_Year}
      - Pesticide used: ${formData.Pesticide} tonnes
      - Annual Rainfall: ${formData.Annual_Rainfall} mm

      Task: Estimate the yield in tonnes per hectare based on typical agricultural data for these inputs.
      CRITICAL INSTRUCTION: Return ONLY a single numeric value representing the yield (e.g., 2.5 or 5.8). No text, no units, no explanation.
    `;

    try {
      const resultText = await callGroqAPI(prompt);
      const numericValue = resultText.replace(/[^0-9.]/g, '');
      console.log("[DEBUG] Parsed Yield Value:", numericValue);
      
      setRecommendation(numericValue);
      setShowResult(true);
    } catch (err) {
      console.error("Error fetching crop yield prediction:", err);
      setRecommendation("Error");
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 text-balance leading-tight">
            Crop Yield Prediction
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-md mx-auto">
            Enter your agricultural data to predict crop yield with AI accuracy.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-green-700 font-bold">Crop & Farm Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="Crop">Crop Type</Label>
                    <Input id="Crop" type="text" placeholder="e.g., Wheat" value={formData.Crop} onChange={(e) => handleInputChange("Crop", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Season">Season</Label>
                    <Input id="Season" type="text" placeholder="e.g., Kharif" value={formData.Season} onChange={(e) => handleInputChange("Season", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Area">Area (hectares)</Label>
                    <Input id="Area" type="number" placeholder="Area" value={formData.Area} onChange={(e) => handleInputChange("Area", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Fertilizer">Fertilizer (kg)</Label>
                    <Input id="Fertilizer" type="number" placeholder="Fertilizer" value={formData.Fertilizer} onChange={(e) => handleInputChange("Fertilizer", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Crop_Year">Crop Year</Label>
                    <Input id="Crop_Year" type="number" placeholder="Year" value={formData.Crop_Year} onChange={(e) => handleInputChange("Crop_Year", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Pesticide">Pesticide (tonnes)</Label>
                    <Input id="Pesticide" type="number" placeholder="Pesticide" value={formData.Pesticide} onChange={(e) => handleInputChange("Pesticide", e.target.value)} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="Annual_Rainfall">Annual Rainfall (mm)</Label>
                    <Input id="Annual_Rainfall" type="number" placeholder="Rainfall" value={formData.Annual_Rainfall} onChange={(e) => handleInputChange("Annual_Rainfall", e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold">
                  {isLoading ? "Predicting..." : "Predict Yield"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {showResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="mt-8 border-2 border-green-300 bg-green-50 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-green-800 mb-2">
                    Predicted Crop Yield: {recommendation} tonnes/hectare
                  </h3>
                  <p className="text-green-700 leading-relaxed mb-4">
                    Based on your inputs, the predicted crop yield is approximately {recommendation} tonnes/hectare.
                  </p>
                  <Button onClick={() => setShowResult(false)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
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