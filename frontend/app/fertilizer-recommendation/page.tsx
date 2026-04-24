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
  "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", 
  "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",
  "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"
];

const MODEL_ID = "llama-3.1-8b-instant";

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
            temperature: 0.2, 
            max_tokens: 1024,
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
        // Continue to next key on network error
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
      
      IMPORTANT: Return ONLY the JSON object, nothing else. No markdown code blocks, no explanation.
    `;

    try {
      const resultText = await callGroqAPI(prompt);
      
      // Clean the response more aggressively
      let cleanJson = resultText.trim();
      
      // Remove markdown code blocks if present
      cleanJson = cleanJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to extract JSON if there's extra text
      const jsonMatch = cleanJson.match(/\{.*\}/s);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }
      
      console.log("[DEBUG] Parsed JSON String:", cleanJson);
      
      const data: FertilizerRecommendation = JSON.parse(cleanJson);
      
      // Validate the data
      if (!data.recommended_N || !data.recommended_P || !data.recommended_K) {
        throw new Error("Invalid recommendation format received");
      }
      
      setRecommendation(data);
    } catch (err) {
      console.error("[DEBUG] Final Error in Submission:", err);
      if (err instanceof SyntaxError) {
        setError("Failed to parse AI response. Please try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      
      // Set fallback recommendation
      setRecommendation({
        recommended_N: 40,
        recommended_P: 20,
        recommended_K: 15
      });
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Soil...
                    </span>
                  ) : (
                    "Get AI Recommendation"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </MotionDiv>

        {loading && (
          <MotionP 
            className="text-blue-500 text-center mt-4 animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Querying Agricultural AI Model...
          </MotionP>
        )}
        
        {error && (
          <MotionP 
            className="text-red-500 text-center mt-4 bg-red-50 p-4 rounded-lg border border-red-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⚠️ {error}
          </MotionP>
        )}

        {recommendation && (
          <MotionDiv
            className="mt-8 p-6 bg-green-50 border-2 border-green-400 text-green-700 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🌱</span> AI Recommended Fertilizer Levels:
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                <span className="text-lg">Nitrogen (N)</span>
                <span className="text-xl font-bold text-green-600">{recommendation.recommended_N} kg/ha</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                <span className="text-lg">Phosphorus (P)</span>
                <span className="text-xl font-bold text-green-600">{recommendation.recommended_P} kg/ha</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                <span className="text-lg">Potassium (K)</span>
                <span className="text-xl font-bold text-green-600">{recommendation.recommended_K} kg/ha</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">💡 Recommendation Summary:</h3>
              <p className="text-yellow-700">
                For optimal {formData.Crop} growth, apply the above fertilizer levels. 
                Monitor crop response and adjust based on local conditions and soil test results.
              </p>
            </div>
          </MotionDiv>
        )}
      </main>
    </div>
  );
}
