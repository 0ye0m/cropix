"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { Cloud, Thermometer, Droplets, Loader2, AlertTriangle, Wind } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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", 
  "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",
  "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"
];
const MODEL_ID = "llama-3.1-8b-instant"

// --- CROP KNOWLEDGE BASE (thresholds & alerts) ---
interface CropRule {
  condition: (day: ForecastDay) => boolean;
  message: string;
}

const CROP_THRESHOLDS: Record<string, Record<string, CropRule[]>> = {
  wheat: {
    germination: [
      { condition: (day) => day.max_temp_c > 30, message: "High temperature during germination may reduce emergence. Consider light irrigation to cool soil." },
      { condition: (day) => day.min_temp_c < 5, message: "Low temperature during germination can delay emergence. Protect with mulch if possible." },
      { condition: (day) => day.chance_of_rain > 70, message: "Heavy rain expected during germination – waterlogging risk. Ensure drainage." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 35, message: "Heat stress during vegetative growth. Irrigate to maintain soil moisture." },
      { condition: (day) => day.avg_humidity > 80, message: "High humidity may promote foliar diseases. Monitor for rust or mildew." }
    ],
    flowering: [
      { condition: (day) => day.max_temp_c > 32, message: "High temperature during flowering can reduce pollination. Provide shade or irrigation." },
      { condition: (day) => day.chance_of_rain > 60, message: "Rain during flowering may wash away pollen. Consider covering if feasible." }
    ],
    "grain filling": [
      { condition: (day) => day.max_temp_c > 35, message: "Extreme heat during grain filling reduces yield. Irrigate to reduce stress." },
      { condition: (day) => day.min_temp_c < 12, message: "Cool nights during grain filling slow down grain development." }
    ],
    maturity: [
      { condition: (day) => day.chance_of_rain > 50, message: "Rain near maturity may cause lodging or grain sprouting. Plan harvest accordingly." }
    ]
  },
  rice: {
    germination: [
      { condition: (day) => day.min_temp_c < 15, message: "Low temperature slows rice germination. Maintain shallow water layer." },
      { condition: (day) => day.max_temp_c > 38, message: "Very high temperature may inhibit germination. Provide light irrigation." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 36, message: "Heat stress in vegetative stage. Keep field flooded to cool plants." },
      { condition: (day) => day.avg_humidity < 50, message: "Low humidity may increase pest incidence. Monitor for planthoppers." }
    ],
    flowering: [
      { condition: (day) => day.max_temp_c > 35, message: "High temperature during flowering causes spikelet sterility. Maintain water depth." },
      { condition: (day) => day.chance_of_rain > 70, message: "Heavy rain during flowering can damage panicles. Ensure good drainage." }
    ],
    "grain filling": [
      { condition: (day) => day.min_temp_c < 18, message: "Cool nights during grain filling reduce grain weight." }
    ],
    maturity: []
  },
  maize: {
    germination: [
      { condition: (day) => day.min_temp_c < 10, message: "Cold soil delays maize germination. Consider postponing planting." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 38, message: "Extreme heat during vegetative stage – provide irrigation to avoid wilting." }
    ],
    flowering: [
      { condition: (day) => day.max_temp_c > 36, message: "Heat stress during silking can reduce pollination. Irrigate to cool canopy." },
      { condition: (day) => day.chance_of_rain > 60, message: "Rain during flowering may interfere with pollination." }
    ],
    "grain filling": [
      { condition: (day) => day.max_temp_c > 35, message: "High temperature during grain fill reduces kernel weight." }
    ],
    maturity: []
  },
  cotton: {
    germination: [
      { condition: (day) => day.min_temp_c < 14, message: "Low temperature delays cotton germination. Wait for warmer conditions." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 40, message: "Extreme heat may cause square shedding. Increase irrigation frequency." }
    ],
    flowering: [
      { condition: (day) => day.chance_of_rain > 50, message: "Rain during flowering can cause boll rot. Monitor fields." }
    ],
    "boll development": [
      { condition: (day) => day.max_temp_c > 38, message: "Heat stress during boll development reduces lint quality." }
    ],
    maturity: []
  }
};

// --- TYPES ---
interface ForecastDay {
  date: string;
  max_temp_c: number;
  min_temp_c: number;
  avg_temp_c: number;
  avg_humidity: number;
  wind_speed: number;
  condition: string;
  chance_of_rain: number;
}

interface WeatherData {
  city_name: string;
  forecast: ForecastDay[];
}

export default function WeatherForecastPage() {
  const [location, setLocation] = useState<string>("")
  const [days, setDays] = useState<number>(6)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string>("")
  const [selectedCrop, setSelectedCrop] = useState<string>("")
  const [selectedStage, setSelectedStage] = useState<string>("")
  const [cropAlerts, setCropAlerts] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
  }

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setDays(1);
      setWarning(null);
      return;
    }
    const newDays = parseInt(rawValue, 10);
    if (isNaN(newDays)) {
      setDays(1);
      setWarning(null);
      return;
    }
    if (newDays > 6) {
      setDays(6);
      setWarning("Maximum 6-day forecast available. Displaying 6 days.");
    } else if (newDays < 1) {
      setDays(1);
      setWarning(null);
    } else {
      setDays(newDays);
      setWarning(null);
    }
  };

  // --- CROP ALERT GENERATION ---
  useEffect(() => {
    if (!weatherData || !selectedCrop || !selectedStage) {
      setCropAlerts([]);
      return;
    }
    const rules = CROP_THRESHOLDS[selectedCrop]?.[selectedStage];
    if (!rules || rules.length === 0) {
      setCropAlerts([]);
      return;
    }
    const alerts: string[] = [];
    weatherData.forecast.forEach(day => {
      rules.forEach(rule => {
        if (rule.condition(day)) {
          const msg = `[${day.date}] ${rule.message}`;
          if (!alerts.includes(msg)) alerts.push(msg);
        }
      });
    });
    setCropAlerts(alerts);
  }, [weatherData, selectedCrop, selectedStage]);

  // --- GROQ API CALL (Single function for all API calls) ---
  const callGroqAPI = async (prompt: string, maxTokens: number = 2000): Promise<string> => {
    let lastError: Error | null = null;

    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
      const key = GROQ_API_KEYS[i];
      
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
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) continue;
          const errorData = await response.json().catch(() => null);
          console.error(`Key #${i + 1} Failed:`, errorData);
          continue;
        }

        const data = await response.json();
        return data.choices[0].message.content;

      } catch (err) {
        console.error(`Network Error with Key #${i + 1}:`, err);
        if (err instanceof Error) lastError = err;
        continue;
      }
    }
    throw lastError || new Error("All API keys failed");
  };

  // --- GENERATE WEATHER FORECAST ---
  const generateWeatherForecast = async (city: string, daysCount: number): Promise<WeatherData> => {
    const today = new Date();
    const dates = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const prompt = `
      Generate a ${daysCount}-day weather forecast for ${city}, India starting from ${today.toISOString().split('T')[0]}.
      
      Dates: ${dates.join(', ')}
      
      Return ONLY a JSON object (no markdown, no explanation):
      {
        "city_name": "${city}",
        "forecast": [
          {
            "date": "YYYY-MM-DD",
            "max_temp_c": number,
            "min_temp_c": number,
            "avg_temp_c": number,
            "avg_humidity": number (0-100),
            "wind_speed": number (km/h),
            "condition": "Sunny/Partly Cloudy/Cloudy/Rain/etc",
            "chance_of_rain": number (0-100)
          }
        ]
      }
      
      Generate exactly ${daysCount} entries with realistic Indian weather data.
    `;

    const resultText = await callGroqAPI(prompt);
    let cleanJson = resultText.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = cleanJson.match(/\{.*\}/s);
    if (jsonMatch) cleanJson = jsonMatch[0];
    
    return JSON.parse(cleanJson);
  };

  // --- FALLBACK WEATHER ---
  const generateFallbackWeather = (city: string, daysCount: number): WeatherData => {
    const today = new Date();
    const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Clear", "Light Rain"];
    
    const forecast = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const baseTemp = 28 + Math.random() * 8;
      
      return {
        date: date.toISOString().split('T')[0],
        max_temp_c: Math.round((baseTemp + 3) * 10) / 10,
        min_temp_c: Math.round((baseTemp - 8) * 10) / 10,
        avg_temp_c: Math.round((baseTemp - 2) * 10) / 10,
        avg_humidity: Math.round(45 + Math.random() * 35),
        wind_speed: Math.round((5 + Math.random() * 20) * 10) / 10,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        chance_of_rain: Math.round(Math.random() * 50)
      };
    });
    
    return { city_name: city, forecast };
  };

  // --- GET AI INSIGHT ---
  const getAIInsight = async (data: WeatherData) => {
    const cropContext = selectedCrop && selectedStage
      ? `Farmer is growing ${selectedCrop} at ${selectedStage} stage.`
      : "";

    const prompt = `
      Analyze this ${data.forecast.length}-day weather forecast for ${data.city_name}:
      ${JSON.stringify(data.forecast)}
      ${cropContext}
      
      Provide 3-4 sentences of agricultural advice. Mention any risks and recommended actions.
    `;

    try {
      const insight = await callGroqAPI(prompt, 200);
      setAiInsight(insight);
    } catch {
      setAiInsight("Monitor local weather conditions and adjust farming activities accordingly.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWeatherData(null);
    setAiInsight("");
    setWarning(null);
    setCropAlerts([]);

    try {
      // ONLY use Groq API - NO backend calls
      const data = await generateWeatherForecast(location, days);
      setWeatherData(data);
      getAIInsight(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Could not generate forecast. Using estimated data.");
      const fallbackData = generateFallbackWeather(location, days);
      setWeatherData(fallbackData);
      setWarning("Using estimated weather data. Results may vary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Weather Forecast</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-generated weather predictions with crop‑specific agricultural advisories.
          </p>
        </motion.div>

        <Card className="border-border shadow-lg mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (City)</Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={handleChange}
                    placeholder="e.g., Nagpur, Mumbai, Delhi"
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Days (1-6)</Label>
                  <Input
                    id="days"
                    type="number"
                    value={days}
                    onChange={handleDaysChange}
                    min="1"
                    max="6"
                    required
                    className="bg-input border-border"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !location} 
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 h-10 disabled:opacity-50"
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

        {warning && (
          <div className="text-yellow-600 dark:text-yellow-400 text-center mb-4 text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
            ⚠️ {warning}
          </div>
        )}
        
        {error && (
          <div className="text-destructive text-center mb-4 bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        {weatherData && (
          <div className="grid grid-cols-1 gap-8">
            {/* Crop Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Crop (optional)</Label>
                <Select value={selectedCrop} onValueChange={(v) => { setSelectedCrop(v); setSelectedStage(""); }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Choose crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Growth Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage} disabled={!selectedCrop}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCrop && Object.keys(CROP_THRESHOLDS[selectedCrop] || {}).map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Crop Alerts */}
            <AnimatePresence>
              {cropAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                >
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">
                        Alerts for {selectedCrop} ({selectedStage})
                      </h3>
                      <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-200 space-y-1">
                        {cropAlerts.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chart */}
            <motion.div
              className="bg-card rounded-2xl shadow-lg border border-border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-bold mb-4 text-center">Temperature Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weatherData.forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="min_temp_c" stroke="#8884d8" name="Min °C" strokeWidth={2} />
                  <Line type="monotone" dataKey="max_temp_c" stroke="#82ca9d" name="Max °C" strokeWidth={2} />
                  <Line type="monotone" dataKey="avg_temp_c" stroke="#ffc658" name="Avg °C" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* AI Insight */}
            <AnimatePresence>
              {aiInsight && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-primary/10 border border-primary/30 rounded-lg p-4"
                >
                  <div className="flex gap-3">
                    <Cloud className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h3 className="font-bold text-primary mb-1">AI Agricultural Insight</h3>
                      <p className="text-sm">{aiInsight}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forecast Cards */}
            <motion.div
              className="bg-card rounded-2xl shadow-lg border border-border p-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Cloud className="w-6 h-6 text-primary" />
                {weatherData.forecast.length}-Day Forecast for {weatherData.city_name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weatherData.forecast.map((day, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="bg-muted/50 border border-border p-4 rounded-lg text-center"
                  >
                    <p className="font-bold mb-2">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex justify-center gap-3 text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-red-500" />{day.max_temp_c}°
                      </span>
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-blue-500" />{day.min_temp_c}°
                      </span>
                    </div>
                    <div className="flex justify-center gap-3 text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-4 h-4 text-cyan-500" />{day.avg_humidity}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="w-4 h-4 text-gray-500" />{day.wind_speed}
                      </span>
                    </div>
                    <p className="font-medium">{day.condition}</p>
                    <p className="text-xs text-muted-foreground mt-1">Rain: {day.chance_of_rain}%</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}
