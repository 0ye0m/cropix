"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import dynamic from 'next/dynamic';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const MotionH1 = dynamic(() => import('framer-motion').then(mod => mod.motion.h1), { ssr: false });
const MotionP = dynamic(() => import('framer-motion').then(mod => mod.motion.p), { ssr: false });

// --- TYPES & INTERFACES ---
interface FertilizerFormData {
  Crop: string;
  Current_N: string;
  Current_P: string;
  Current_K: string;
}

interface FertilizerRecommendation {
  recommended_N: number;
  recommended_P: number;
  recommended_K: number;
}

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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", // Primary Key
  "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"  // Fallback Key
];

const MODEL_ID = "llama-3.1-8b-instant"; // Updated Model ID

export default function FertilizerRecommendationPage() {
  const [formData, setFormData] = useState<FertilizerFormData>({
    Crop: "",
    Current_N: "",
    Current_P: "",
    Current_K: "",
  });
  const [recommendation, setRecommendation] = useState<FertilizerRecommendation | null>(null);
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
            model: MODEL_ID, // Using the updated model
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2, 
            max_tokens: 1024,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[DEBUG] Key #${i + 1} Failed: Status ${response.status}`, errorText);
          lastError = new Error(`API Error ${response.status}: ${errorText}`);
          continue; 
        }

        const data = await response.json();
        console.log("[DEBUG] API Response Success:", data);
        return data.choices[0].message.content;

      } catch (err) {
        if (err instanceof Error) {
            console.error(`[DEBUG] Network/Fetch Error with Key #${i + 1}:`, err);
            lastError = err;
        } else {
            lastError = new Error("Unknown error occurred");
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
      Act as an expert agricultural scientist. 
      A farmer is growing ${formData.Crop}. 
      Current soil nutrient levels are:
      - Nitrogen (N): ${formData.Current_N}
      - Phosphorus (P): ${formData.Current_P} 
      - Potassium (K): ${formData.Current_K}

      Task: Recommend the optimal nutrient levels (N, P, K) for this specific crop to maximize yield.
      
      CRITICAL INSTRUCTION: Return ONLY a valid JSON object with no additional text, markdown, or explanation. 
      The JSON keys must be: "recommended_N", "recommended_P", "recommended_K".
      
      Example Output: {"recommended_N": 40, "recommended_P": 20, "recommended_K": 15}
    `;

    try {
      const resultText = await callGroqAPI(prompt);
      
      const cleanJson = resultText.replace(/```json|```/g, '').trim();
      console.log("[DEBUG] Parsed JSON String:", cleanJson);
      
      const data: FertilizerRecommendation = JSON.parse(cleanJson);
      setRecommendation(data);
    } catch (err) {
      console.error("[DEBUG] Final Error in Submission:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <MotionH1
          className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6 text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Fertilizer Recommendation (AI Powered)
        </MotionH1>
        <MotionP
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Get precise fertilizer recommendations using advanced AI models to optimize your crop yield.
        </MotionP>

        <MotionDiv
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="border-2 border-border hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">Enter Soil and Crop Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="Crop">Crop Type</Label>
                    <Input
                      id="Crop"
                      type="text"
                      name="Crop"
                      value={formData.Crop}
                      onChange={handleChange}
                      placeholder="e.g., Wheat, Rice"
                      required
                      className="border-border focus:border-primary focus:ring-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Current_N">Current Nitrogen (N) in Soil</Label>
                    <Input
                      id="Current_N"
                      type="number"
                      name="Current_N"
                      value={formData.Current_N}
                      onChange={handleChange}
                      placeholder="Enter current Nitrogen content"
                      required
                      className="border-border focus:border-primary focus:ring-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Current_P">Current Phosphorus (P) in Soil</Label>
                    <Input
                      id="Current_P"
                      type="number"
                      name="Current_P"
                      value={formData.Current_P}
                      onChange={handleChange}
                      placeholder="Enter current Phosphorus content"
                      required
                      className="border-border focus:border-primary focus:ring-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Current_K">Current Potassium (K) in Soil</Label>
                    <Input
                      id="Current_K"
                      type="number"
                      name="Current_K"
                      value={formData.Current_K}
                      onChange={handleChange}
                      placeholder="Enter current Potassium content"
                      required
                      className="border-border focus:border-primary focus:ring-primary transition-colors"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md text-lg font-semibold transition-colors"
                >
                  {loading ? "Analyzing Soil..." : "Get AI Recommendation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </MotionDiv>

        {loading && <MotionP className="text-blue-500 text-center mt-4">Querying Agricultural AI Model...</MotionP>}
        {error && <MotionP className="text-red-500 text-center mt-4">Error: {error}</MotionP>}

        {recommendation && (
          <MotionDiv
            className="mt-8 p-6 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4">AI Recommended Fertilizer Levels:</h2>
            <p className="text-lg">Nitrogen (N): <span className="font-semibold">{recommendation.recommended_N}</span></p>
            <p className="text-lg">Phosphorus (P): <span className="font-semibold">{recommendation.recommended_P}</span></p>
            <p className="text-lg">Potassium (K): <span className="font-semibold">{recommendation.recommended_K}</span></p>
          </MotionDiv>
        )}
      </main>
    </div>
  );
}