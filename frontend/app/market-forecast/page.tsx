"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { motion } from "framer-motion"
import { TrendingUp, CalendarDays, Loader2, Sparkles, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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",
  "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"
]
const MODEL_ID = "llama-3.1-8b-instant"

// --- TYPES ---
interface MarketForecastResponse {
  forecast?: {
    [cropName: string]: {
      [date: string]: number
    }
  }
  error?: string
}

interface ProcessedData {
  date: Date;
  dateString: string;
  price: number;
  weekLabel: string;
}

export default function MarketForecastPage() {
  const [cropName, setCropName] = useState<string>("")
  const [weeksToForecast, setWeeksToForecast] = useState<string>("4")
  const [processedForecast, setProcessedForecast] = useState<ProcessedData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string>("")

  const cropOptions = ["Wheat", "Rice", "Maize", "Soybean"]

  // --- GROQ API INTEGRATION ---
  const getAIInsight = async (crop: string, prices: number[]) => {
    // We send the prices explicitly labeled as "Upcoming Weeks" to the AI
    const priceContext = prices.map((p, i) => `Week ${i+1}: ₹${p.toFixed(2)}`).join(", ");
    
    const prompt = `
      Act as an agricultural market analyst. 
      A user has requested a price forecast for ${crop}.
      
      The following are the predicted prices for the upcoming weeks starting today (${new Date().toLocaleDateString()}):
      ${priceContext}
      
      Validation Task:
      1. Are these prices realistic for ${crop} in the Indian market (typical range ₹1000-₹5000)? 
      2. If they seem unrealistically high or low, mention it might be an anomaly.
      
      Analysis Task:
      1. Analyze the trend (upward, downward, or stable).
      2. Provide a clear "BUY", "HOLD", or "SELL" recommendation for a farmer.
      
      Keep the response concise (3-4 sentences). Do not add greetings.
    `;

    for (const key of GROQ_API_KEYS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: MODEL_ID, messages: [{ role: "user", content: prompt }], temperature: 0.3 })
        });
        if (res.ok) {
          const json = await res.json();
          setAiInsight(json.choices[0].message.content);
          return;
        }
      } catch (err) {
        console.error("AI Error:", err);
      }
    }
    setAiInsight("AI analysis unavailable.");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setProcessedForecast([])
    setAiInsight("")

    try {
      const response = await fetch("https://yamxxx1-BackendCropix.hf.space/forecast_market_prices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop_name: cropName, weeks_to_forecast: parseInt(weeksToForecast) }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data: MarketForecastResponse = await response.json()
      
      if (data.error) throw new Error(data.error)
      if (!data.forecast || !data.forecast[cropName]) throw new Error("Invalid data structure received from backend.")
      
      // --- DATA PROCESSING & VALIDATION ---
      const rawEntries = Object.entries(data.forecast[cropName]);
      const requestedWeeks = parseInt(weeksToForecast);
      
      // Check if we received enough data
      if (rawEntries.length < requestedWeeks) {
        console.warn(`Backend returned only ${rawEntries.length} weeks instead of requested ${requestedWeeks}`);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize time

      const validatedData: ProcessedData[] = [];

      // We iterate through the values (prices) sequentially.
      // We IGNORE the backend keys (dates) because they are incorrect (2025).
      // We map them to correct future dates starting from today.
      rawEntries.forEach(([_, price], index) => {
        // Stop if we have enough weeks
        if (index >= requestedWeeks) return;

        const numPrice = Number(price);

        // Validate Price
        if (isNaN(numPrice) || numPrice <= 0) {
          console.warn(`Invalid price detected at index ${index}: ${price}`);
          return; // Skip invalid entry
        }

        // Calculate Correct Date (Today + (index * 7) days)
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + (index * 7));

        validatedData.push({
          date: forecastDate,
          dateString: forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          price: numPrice,
          weekLabel: index === 0 ? "This Week" : `Week ${index + 1}`
        });
      });

      if (validatedData.length === 0) {
        throw new Error("No valid price data could be processed.");
      }

      setProcessedForecast(validatedData);
      
      // Send validated prices to AI
      const pricesOnly = validatedData.map(d => d.price);
      getAIInsight(cropName, pricesOnly);

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">Market Price Forecast</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Accurate future price predictions aligned to current dates.
          </p>
        </motion.div>

        <Card className="border-border shadow-lg mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Crop Name</Label>
                  <Select value={cropName} onValueChange={setCropName}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select a crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropOptions.map((crop) => (
                        <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeks">Weeks to Forecast</Label>
                  <Input
                    id="weeks"
                    type="number"
                    value={weeksToForecast}
                    onChange={(e) => setWeeksToForecast(e.target.value)}
                    min="1"
                    max="52"
                    className="bg-input border-border"
                  />
                </div>
                <Button type="submit" disabled={loading || !cropName} className="w-full md:w-auto bg-green-600 hover:bg-green-700 h-10">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Get Forecast"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <p>Error: {error}</p>
          </div>
        )}

        {processedForecast.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-border shadow-lg overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <CardTitle className="text-foreground">
                    {processedForecast.length}-Week Forecast for {cropName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* AI Insight */}
                {aiInsight && (
                  <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">AI Market Analysis</h3>
                      <p className="text-sm text-muted-foreground">{aiInsight}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {processedForecast.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {item.dateString}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">{item.weekLabel}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{item.price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Per Quintal</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}