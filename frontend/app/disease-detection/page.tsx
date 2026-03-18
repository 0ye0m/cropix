"use client"

import type React from "react"
import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Upload, CheckCircle, AlertTriangle, Loader2, Leaf, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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",
  "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"
]
const MODEL_ID = "llama-3.1-8b-instant"

interface DiagnosisResult {
  disease: string;
  confidence: number;
}

// Allow ANY structure from AI to prevent crashes
interface AIAnalysis {
  verification: string; 
  diagnosis: string;
  treatment: any; 
  prevention: any;
}

const extractJson = (text: string): string => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
};

export default function DiseaseDetectionPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [backendResult, setBackendResult] = useState<DiagnosisResult | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setUploadedImage(base64)
        runHybridAnalysis(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const runHybridAnalysis = async (imageData: string) => {
    setIsAnalyzing(true)
    setError(null)
    setBackendResult(null)
    setAiAnalysis(null)

    try {
      setStatusMessage("🔬 Scanning leaf patterns...")
      const base64Image = imageData.split(",")[1]
      
      const backendResponse = await fetch("https://yamxxx1-BackendCropix.hf.space/detect_disease/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64Image }),
      })

      if (!backendResponse.ok) throw new Error("Backend failed")
      const backendData = await backendResponse.json()
      if (backendData.error) throw new Error(backendData.error)

      const cnnPrediction: DiagnosisResult = {
        disease: backendData.predicted_disease,
        confidence: backendData.confidence
      }
      setBackendResult(cnnPrediction)

      setStatusMessage("🧠 AI generating plan...")
      await getAIAnalysis(cnnPrediction)

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getAIAnalysis = async (cnnResult: DiagnosisResult) => {
    const prompt = `
      You are an agricultural expert. Generate a treatment plan for "${cnnResult.disease}".
      Return STRICT JSON format:
      {
        "verification": "Confirmed",
        "diagnosis": "${cnnResult.disease}",
        "treatment": {
          "chemical": "Specific chemicals",
          "organic": "Organic options",
          "instructions": "How to apply"
        },
        "prevention": "Tips to prevent recurrence"
      }
    `;

    for (const key of GROQ_API_KEYS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          })
        });

        if (!res.ok) continue;

        const data = await res.json();
        const content = data.choices[0].message.content;
        const cleanJson = extractJson(content);
        const parsed = JSON.parse(cleanJson);
        setAiAnalysis(parsed);
        return;

      } catch (err) { console.warn("Retry...", err); }
    }
    throw new Error("AI failed to generate plan.");
  }

  // --- THE FIX: SAFE RENDER HELPER ---
  // This function recursively renders ANY data type safely (String, Object, Array)
  const safeRender = (data: any): React.ReactNode => {
    if (data === null || data === undefined) return null;
    
    // 1. If it's a simple string or number, render it directly
    if (typeof data === 'string' || typeof data === 'number') {
      return <span>{data}</span>;
    }

    // 2. If it's an array, map over it safely
    if (Array.isArray(data)) {
      return (
        <ul className="list-disc pl-5 space-y-1">
          {data.map((item, i) => <li key={i}>{safeRender(item)}</li>)}
        </ul>
      );
    }

    // 3. If it's an object, render keys nicely
    if (typeof data === 'object') {
      return (
        <div className="space-y-2 mt-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-muted/50 p-2 rounded">
              <span className="font-semibold capitalize text-foreground mr-2">{key.replace(/_/g, ' ')}:</span>
              <div className="text-muted-foreground ml-2">
                {safeRender(value)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return String(data);
  };

  const resetState = () => {
    setUploadedImage(null)
    setBackendResult(null)
    setAiAnalysis(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">AI Disease Detection</h1>
          <p className="text-lg text-muted-foreground">Hybrid Intelligence Analysis</p>
        </motion.div>

        {!uploadedImage ? (
          <motion.div className="bg-card border shadow-lg rounded-2xl p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-12 hover:border-primary cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Upload Crop Image</h3>
                  <p className="text-muted-foreground">Click to select</p>
                </label>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <motion.div className="bg-card border shadow-lg rounded-2xl p-4 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <img src={uploadedImage} alt="Crop" className="max-h-[400px] rounded-lg object-contain" />
            </motion.div>

            {isAnalyzing && (
              <Card className="bg-blue-50 dark:bg-blue-950/30">
                <CardContent className="p-6 flex items-center gap-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Analyzing...</p>
                    <p className="text-sm text-blue-700">{statusMessage}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <p>Error: {error}</p>
              </div>
            )}

            {!isAnalyzing && backendResult && aiAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Model Detection */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="h-full bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Leaf className="w-5 h-5 text-green-600" /> Model Detection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Predicted Disease</span>
                        <p className="text-xl font-bold text-foreground">{backendResult.disease}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Confidence</span>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                          <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${backendResult.confidence * 100}%` }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* AI Analysis */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="h-full border-green-400 bg-green-50 dark:bg-green-900/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-green-600" /> Expert Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Status:</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-200 text-green-800">
                            {aiAnalysis.verification}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Diagnosis:</span>
                          <p className="text-foreground">{aiAnalysis.diagnosis}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Action Plan */}
                <motion.div className="md:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Card className="bg-card shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-primary">
                        <CheckCircle className="w-5 h-5" /> Recommended Action Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">🧪 Treatment</h4>
                        {/* USE SAFE RENDER HERE */}
                        <div className="text-muted-foreground">
                          {safeRender(aiAnalysis.treatment)}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg mt-4">
                        <h4 className="font-semibold text-foreground mb-1">🛡️ Prevention</h4>
                        {/* USE SAFE RENDER HERE */}
                        <div className="text-muted-foreground">
                          {safeRender(aiAnalysis.prevention)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

              </div>
            )}

            {!isAnalyzing && (
              <div className="text-center mt-8">
                <Button onClick={resetState} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Scan Another Image
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}