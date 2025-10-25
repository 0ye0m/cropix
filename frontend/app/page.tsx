"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import dynamic from 'next/dynamic';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const MotionH1 = dynamic(() => import('framer-motion').then(mod => mod.motion.h1), { ssr: false });
const MotionSpan = dynamic(() => import('framer-motion').then(mod => mod.motion.span), { ssr: false });
const MotionP = dynamic(() => import('framer-motion').then(mod => mod.motion.p), { ssr: false });
const MotionFooter = dynamic(() => import('framer-motion').then(mod => mod.motion.footer), { ssr: false });

import { Sprout, TestTube, Camera, CloudSun, Leaf, Sun, Droplets, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="relative overflow-hidden">
        {/* Organic background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating leaves */}
          <MotionDiv
            className="absolute top-20 right-10 w-16 h-16 text-primary/20"
            animate={{ rotate: [0, 360], y: [-10, 10, -10] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Leaf className="w-full h-full animate-leaf-float" />
          </MotionDiv>

          <MotionDiv
            className="absolute top-40 left-20 w-12 h-12 text-accent/15"
            animate={{ rotate: [360, 0], x: [-5, 15, -5] }}
            transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
          >
            <Leaf className="w-full h-full animate-gentle-sway" />
          </MotionDiv>

          {/* Organic blob shapes */}
          <MotionDiv
            className="absolute top-32 right-1/4 w-64 h-64 bg-gradient-to-br from-primary/5 to-accent/10 organic-blob"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />

          <MotionDiv
            className="absolute bottom-20 left-1/3 w-48 h-48 bg-gradient-to-tl from-card/80 to-primary/5 organic-blob-2"
            animate={{
              scale: [1, 0.9, 1.05, 1],
              x: [0, 20, -10, 0],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 3 }}
          />

          {/* Subtle sun rays */}
          <MotionDiv
            className="absolute top-10 right-16 w-8 h-8 text-primary/30"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Sun className="w-full h-full" />
          </MotionDiv>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <MotionDiv
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <MotionDiv
              className="inline-flex items-center gap-2 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 120 }}
            >
              <Sprout className="w-4 h-4 text-primary animate-gentle-sway" />
              <span className="text-sm font-medium text-card-foreground">AI-Powered Agriculture</span>
            </MotionDiv>

            <MotionH1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
            >
              <Leaf className="inline-block w-10 h-10 mr-4 text-primary" />
              Smarter Farming{" "}
              <MotionSpan
                className="text-primary relative inline-block"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Starts Here
                <MotionDiv
                  className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-primary/30 to-accent/30 leaf-shape"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                />
              </MotionSpan>
            </MotionH1>

            <MotionP
              className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground mb-10 max-w-5xl mx-auto text-pretty leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
            >
              Cropix helps you find the best crops, detect diseases, predict markets, and plan ahead with{" "}
              <span className="text-primary font-semibold">AI-powered insights</span> for sustainable agriculture.
            </MotionP>

            <MotionDiv
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <Link href="#model-boxes">
                <MotionDiv
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.9, type: "spring", stiffness: 100 }}
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                  >
                    <MotionDiv
                      className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      <Sprout className="w-5 h-5" />
                      Get Started
                    </span>
                  </Button>
                </MotionDiv>
              </Link>

              <MotionDiv
                whileHover={{ scale: 1.02 }}
                className="text-muted-foreground text-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.1, type: "spring", stiffness: 100 }}
              >
                <span className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-primary" />
                  Free to use • No signup required
                </span>
              </MotionDiv>
            </MotionDiv>

            
          </MotionDiv>

          <MotionDiv
            id="model-boxes"
            className="mt-24 sm:mt-32"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6">
              {[
                {
                  icon: Sprout,
                  title: "Crop Yield Prediction",
                  description: "Predict crop yields based on various factors to optimize planning and resource allocation.",
                  color: "from-green-400/20 to-primary/20",
                  delay: 0,
                  href: "/crop-recommendation",
                },
                {
                  icon: TestTube,
                  title: "Fertilizer Guidance",
                  description: "Precise fertilizer recommendations to optimize your crop yield and soil health.",
                  color: "from-blue-400/20 to-primary/20",
                  delay: 0.1,
                  href: "/fertilizer-recommendation",
                },
                {
                  icon: Camera,
                  title: "Disease Detection",
                  description: "Upload crop images to instantly detect diseases and get treatment recommendations.",
                  color: "from-purple-400/20 to-primary/20",
                  delay: 0.2,
                  href: "/disease-detection",
                },
                {
                  icon: CloudSun,
                  title: "Weather Forecast",
                  description: "Stay ahead with accurate weather predictions.",
                  color: "from-blue-400/20 to-primary/20",
                  delay: 0.3,
                  href: "/weather-forecast",
                },
                {
                  icon: Leaf,
                  title: "Soil Based Crop Recommendation",
                  description: "Get recommendations for crops based on your soil conditions.",
                  color: "from-yellow-400/20 to-primary/20",
                  delay: 0.4,
                  href: "/soil-crop-recommendation",
                },
                {
                  icon: TrendingUp,
                  title: "Market Forecast",
                  description: "Stay ahead with accurate market price forecasts.",
                  color: "from-green-400/20 to-primary/20",
                  delay: 0.5,
                  href: "/market-forecast",
                },
              ].map((feature, index) => (
                <Link href={feature.href} key={index}>
                  <MotionDiv
                    className="group relative"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.8,
                      delay: 1.1 + feature.delay,
                      type: "spring",
                      stiffness: 100,
                    }}
                    whileHover={{ y: -10, scale: 1.03, transition: { duration: 0.3 } }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} organic-blob opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl`}
                    />

                    <div className="relative bg-card/80 backdrop-blur-sm p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 h-[250px] flex flex-col">
                      <MotionDiv
                        className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="w-8 h-8 text-primary" />
                      </MotionDiv>

                      <h3 className="text-xl font-bold text-card-foreground mb-2 group-hover:text-primary transition-colors duration-300 h-[30px]">
                        {feature.title}
                      </h3>

                      <p className="text-muted-foreground leading-relaxed text-sm flex-grow overflow-hidden h-[80px]">{feature.description}</p>
                    </div>
                  </MotionDiv>
                </Link>
              ))}
            </div>
          </MotionDiv>
        </div>

        {/* How Cropix Works Section */}
        <section className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-card to-background overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <MotionDiv
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 organic-blob"
              animate={{ scale: [1, 1.05, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <MotionDiv
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 organic-blob-2"
              animate={{ scale: [1, 0.95, 1], x: [0, 10, -10, 0] }}
              transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 5 }}
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <MotionH1
              className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
            >
              How Cropix Works
            </MotionH1>
            <MotionP
              className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Cropix harnesses the power of AI, utilizing models trained on vast agricultural datasets, to deliver accurate crop recommendations, detect diseases, forecast market trends, and offer personalized guidance for sustainable and productive farming.
            </MotionP>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <MotionDiv
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-left order-1 md:order-2"
              >
                <h3 className="text-3xl font-bold text-foreground mb-4">Data-Driven Insights</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Cropix gathers and processes extensive agricultural data, including historical crop yields, soil composition, and local weather patterns. This information is meticulously analyzed to provide a comprehensive understanding of your farm's unique environment.
                </p>
                <ul className="list-disc list-inside text-left text-muted-foreground space-y-2">
                  <li>Historical Data: Analyzing past performance for future predictions.</li>
                  <li>Soil Composition: Understanding nutrient levels and pH for optimal growth.</li>
                  <li>Weather Patterns: Utilizing local forecasts to guide planting and harvesting schedules.</li>
                </ul>
              </MotionDiv>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center mt-16 md:mt-24">
              <MotionDiv
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-left order-1 md:order-1"
              >
                <h3 className="text-3xl font-bold text-foreground mb-4">Advanced AI & Machine Learning</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Our platform employs advanced AI and machine learning models, specifically trained on vast agricultural datasets. These models learn from complex patterns to predict crop yields, recommend optimal fertilizers, detect plant diseases from images, and forecast market prices with high accuracy.
                </p>
                <ul className="list-disc list-inside text-left text-muted-foreground space-y-2">
                  <li>Predictive Models: Forecasting crop yields and market trends.</li>
                  <li>Image Recognition: Instantly identifying plant diseases from uploaded photos.</li>
                  <li>Recommendation Engines: Tailoring advice for fertilizers and crop types.</li>
                </ul>
              </MotionDiv>
            </div>
          </div>
        </section>
      </main>

      <MotionFooter
        className="relative bg-gradient-to-t from-card to-background border-t border-border/50 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <MotionDiv
            className="absolute bottom-0 left-1/4 w-32 h-32 bg-primary/5 organic-blob-2"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <MotionDiv
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.7 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">Cropix</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Empowering farmers with AI-driven insights for smarter, more sustainable agriculture.
              </p>
            </MotionDiv>

            

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.8, type: "spring", stiffness: 100 }}
            >
              <h4 className="text-lg font-bold text-foreground mb-6">Contact Us</h4>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden border-2 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get in Touch
                  </span>
                </Button>
              </Link>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.9, type: "spring", stiffness: 100 }}
            >
              <h4 className="text-lg font-bold text-foreground mb-6">About Us</h4>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden border-2 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Learn More
                  </span>
                </Button>
              </Link>
            </MotionDiv>
          </div>

          <MotionDiv
            className="mt-12 pt-8 border-t border-border/50 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
          >
            <p className="text-center text-sm text-gray-500">
              &copy; 2025 Cropix. All rights reserved. Made with 🌱 for farmers worldwide.
            </p>
          </MotionDiv>
        </div>
      </MotionFooter>
    </div>
  )
}
