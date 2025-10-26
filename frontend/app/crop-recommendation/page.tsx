"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { motion } from "framer-motion" // Import motion

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
  const [recommendation, setRecommendation] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNextStep = () => {
    setStep((prev) => prev + 1)
  }

  const handlePrevStep = () => {
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setRecommendation("")
    setShowResult(false)

    try {
      const response = await fetch("https://yamxxx1-BackendCropix.hf.space/predict_crop_yield/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Crop: formData.Crop,
          Season: formData.Season,
          Area: parseFloat(formData.Area),
          Fertilizer: parseFloat(formData.Fertilizer),
          Crop_Year: parseInt(formData.Crop_Year),
          Pesticide: parseFloat(formData.Pesticide),
          Annual_Rainfall: parseFloat(formData.Annual_Rainfall),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw predicted_yield from backend:", data.predicted_yield);
      setRecommendation(data.predicted_yield);
      setShowResult(true);
    } catch (error) {
      console.error("Error fetching crop yield prediction:", error);
      setRecommendation("Error: Unable to get recommendation.");
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
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
            Enter your agricultural data to predict crop yield with high accuracy.
          </p>
        </motion.div>

        {/* Form Card */}
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
                {/* Crop Type */}
                <div className="space-y-2">
                  <Label htmlFor="Crop" className="text-sm font-medium text-gray-700">
                    Crop Type
                  </Label>
                  <Input
                    id="Crop"
                    type="text"
                    placeholder="e.g., Wheat, Rice"
                    value={formData.Crop}
                    onChange={(e) => handleInputChange("Crop", e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                    required
                  />
                </div>

                {/* Season */}
                <div className="space-y-2">
                  <Label htmlFor="Season" className="text-sm font-medium text-gray-700">
                    Season
                  </Label>
                  <Input
                    id="Season"
                    type="text"
                    placeholder="e.g., Kharif, Rabi"
                    value={formData.Season}
                    onChange={(e) => handleInputChange("Season", e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                    required
                  />
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <Label htmlFor="Area" className="text-sm font-medium text-gray-700">
                    Area (hectares)
                  </Label>
                  <Input
                    id="Area"
                    type="number"
                    placeholder="Enter farm area in hectares"
                    value={formData.Area}
                    onChange={(e) => handleInputChange("Area", e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                    required
                  />
                </div>

                {/* Fertilizer */}
                <div className="space-y-2">
                  <Label htmlFor="Fertilizer" className="text-sm font-medium text-gray-700">
                    Fertilizer (kg)
                  </Label>
                  <Input
                    id="Fertilizer"
                    type="number"
                    placeholder="Enter fertilizer amount in tonnes"
                    value={formData.Fertilizer}
                    onChange={(e) => handleInputChange("Fertilizer", e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                    required
                  />
                </div>

                {/* Crop Year */}
                <div className="space-y-2">
                  <Label htmlFor="Crop_Year" className="text-sm font-medium text-gray-700">
                    Crop Year
                  </Label>
                  <Input
                    id="Crop_Year"
                    type="number"
                    placeholder="Enter crop year"
                    value={formData.Crop_Year}
                    onChange={(e) => handleInputChange("Crop_Year", e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                    required
                  />
                </div>

                {/* Pesticide */}
                <div className="space-y-2">
                  <Label htmlFor="Pesticide" className="text-sm font-medium text-gray-700">
                    Pesticide (tonnes)
                  </Label>
                  <Input
                    id="Pesticide"
                    type="number"
                    placeholder="Enter pesticide amount in tonnes"
                    value={formData.Pesticide}
                    onChange={(e) => handleInputChange("Pesticide", e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                    required
                  />
                </div>

                {/* Annual Rainfall */}
                <div className="space-y-2">
                  <Label htmlFor="Annual_Rainfall" className="text-sm font-medium text-gray-700">
                    Annual Rainfall (mm)
                  </Label>
                  <Input
                    id="Annual_Rainfall"
                    type="number"
                    placeholder="Enter annual rainfall in mm"
                    value={formData.Annual_Rainfall}
                    onChange={(e) => handleInputChange("Annual_Rainfall", e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 hover:border-green-400"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 text-base sm:text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Predicting...
                    </div>
                  ) : (
                    "Predict Yield"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Card */}
        {showResult && (typeof recommendation === 'number' || typeof recommendation === 'string') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="mt-8 border-2 border-green-300 bg-green-50 shadow-lg animate-in slide-in-from-bottom-4 duration-500 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">
                    Predicted Crop Yield: {typeof recommendation === 'number' ? recommendation.toFixed(2) : recommendation} tonnes/hectare
                  </h3>
                  <p className="text-green-700 leading-relaxed mb-4">
                    Based on your inputs, the predicted crop yield is approximately {typeof recommendation === 'number' ? recommendation.toFixed(2) : recommendation} tonnes/hectare.
                  </p>
                  <Button
                    onClick={() => setShowResult(false)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors"
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
