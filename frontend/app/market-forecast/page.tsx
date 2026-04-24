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
  "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",
  "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"
];
const MODEL_ID = "llama-3.1-8b-instant"

// --- TYPES ---
interface ForecastEntry {
  week: number;
  price: number;
  trend: string;
}

interface ProcessedData {
  date: Date;
  dateString: string;
  price: number;
  weekLabel: string;
  trend: string;
}

export default function MarketForecastPage() {
  const [cropName, setCropName] = useState<string>("")
  const [weeksToForecast, setWeeksToForecast] = useState<string>("4")
  const [processedForecast, setProcessedForecast] = useState<ProcessedData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string>("")

  const cropOptions = ["Wheat", "Rice", "Maize", "Soybean", "Cotton", "Sugarcane"]

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
            temperature: 0.3,
            max_tokens: 1024,
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

  // --- GENERATE FORECAST USING AI ---
  const generateForecast = async (crop: string, weeks: number): Promise<ProcessedData[]> => {
    const prompt = `
      Act as an agricultural market analyst specializing in Indian commodity markets.
      
      Generate a ${weeks}-week price forecast for ${crop} in the Indian market.
      
      Current date: ${new Date().toLocaleDateString()}
      
      Requirements:
      1. Generate realistic weekly prices in INR per quintal
      2. Prices should reflect current market trends and seasonal patterns
      3. For ${crop}, typical price range is ₹1500-₹5000 per quintal
      4. Include gradual price movements (not random spikes)
      
      CRITICAL INSTRUCTION: Return ONLY a valid JSON array with no additional text, markdown, or explanation.
      
      JSON Format:
      [
        {"week": 1, "price": 2450.50, "trend": "stable"},
        {"week": 2, "price": 2480.25, "trend": "up"},
        ...
      ]
      
      The "trend" field should be one of: "up", "down", "stable"
    `;

    const resultText = await callGroqAPI(prompt);
    
    // Clean and parse the JSON response
    let cleanJson = resultText.trim();
    cleanJson = cleanJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Extract JSON array if there's extra text
    const jsonMatch = cleanJson.match(/\[.*\]/s);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }
    
    console.log("[DEBUG] Parsed JSON:", cleanJson);
    
    const forecastData: ForecastEntry[] = JSON.parse(cleanJson);
    
    // Validate and process the forecast data
    if (!Array.isArray(forecastData) || forecastData.length === 0) {
      throw new Error("Invalid forecast data received");
    }
    
    // Convert to processed data with correct dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validatedData: ProcessedData[] = forecastData
      .slice(0, weeks)
      .map((entry, index) => {
        // Validate price
        let price = Number(entry.price);
        if (isNaN(price) || price <= 0) {
          price = 2000 + Math.random() * 1000; // Fallback price
        }
        
        // Clamp to realistic range
        price = Math.max(1000, Math.min(5000, price));
        
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + (index * 7));
        
        return {
          date: forecastDate,
          dateString: forecastDate.toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric", 
            year: "numeric" 
          }),
          price: Math.round(price * 100) / 100,
          weekLabel: index === 0 ? "This Week" : `Week ${index + 1}`,
          trend: entry.trend || "stable"
        };
      });
    
    return validatedData;
  };

  // --- GET AI MARKET INSIGHT ---
  const getAIInsight = async (crop: string, forecastData: ProcessedData[]) => {
    const priceContext = forecastData.map((d, i) => 
      `Week ${i+1} (${d.dateString}): ₹${d.price.toFixed(2)} - ${d.trend}`
    ).join(", ");
    
    const prompt = `
      Act as an agricultural market analyst.
      
      Crop: ${crop}
      Current date: ${new Date().toLocaleDateString()}
      
      Price Forecast:
      ${priceContext}
      
      Task:
      1. Analyze the overall price trend
      2. Identify if this is a good time to sell
      3. Consider seasonal factors for ${crop} in India
      4. Provide a clear recommendation: SELL NOW, HOLD, or WAIT
      
      Keep response concise (3-4 sentences). Be specific about price expectations.
    `;

    for (const key of GROQ_API_KEYS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${key}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            model: MODEL_ID, 
            messages: [{ role: "user", content: prompt }], 
            temperature: 0.3,
            max_tokens: 200
          })
        });
        
        if (res.ok) {
          const json = await res.json();
          setAiInsight(json.choices[0].message.content);
          return;
        }
      } catch (err) {
        console.error("AI Insight Error:", err);
      }
    }
    setAiInsight("Market analysis currently unavailable. Please check the price trends manually.");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setProcessedForecast([])
    setAiInsight("")

    try {
      const weeks = parseInt(weeksToForecast);
      if (isNaN(weeks) || weeks < 1 || weeks > 52) {
        throw new Error("Please enter a valid number of weeks (1-52)");
      }

      // Generate forecast using AI
      const forecastData = await generateForecast(cropName, weeks);
      setProcessedForecast(forecastData);
      
      // Get AI market insight
      await getAIInsight(cropName, forecastData);

    } catch (err) {
      console.error("Forecast Error:", err);
      if (err instanceof SyntaxError) {
        setError("Failed to generate forecast. Please try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      
      // Fallback: Generate some basic forecast data
      const fallbackData = generateFallbackForecast(cropName, parseInt(weeksToForecast));
      setProcessedForecast(fallbackData);
    } finally {
      setLoading(false)
    }
  }

  // Fallback forecast generator
  const generateFallbackForecast = (crop: string, weeks: number): ProcessedData[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const basePrice = crop === "Wheat" ? 2200 : 
                      crop === "Rice" ? 2500 : 
                      crop === "Maize" ? 1800 : 3000;
    
    return Array.from({ length: weeks }, (_, i) => {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + (i * 7));
      
      const randomVariation = (Math.random() - 0.5) * 200;
      const price = basePrice + randomVariation + (i * 25);
      
      return {
        date: forecastDate,
        dateString: forecastDate.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric" 
        }),
        price: Math.round(price * 100) / 100,
        weekLabel: i === 0 ? "This Week" : `Week ${i + 1}`,
        trend: "stable"
      };
    });
  };

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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            Market Price Forecast
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered price predictions for agricultural commodities in Indian markets
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
                    placeholder="1-52"
                    className="bg-input border-border"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !cropName} 
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 h-10 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> 
                      Generating...
                    </span>
                  ) : (
                    "Get Forecast"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2 mb-4"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
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
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">AI Market Analysis</h3>
                      <p className="text-sm text-muted-foreground">{aiInsight}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {processedForecast.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {item.dateString}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">
                          {item.weekLabel}
                          {item.trend && (
                            <span className={`ml-2 ${
                              item.trend === 'up' ? 'text-green-600' : 
                              item.trend === 'down' ? 'text-red-600' : 
                              'text-yellow-600'
                            }`}>
                              {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'} {item.trend}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ₹{item.price.toFixed(2)}
                        </p>
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
