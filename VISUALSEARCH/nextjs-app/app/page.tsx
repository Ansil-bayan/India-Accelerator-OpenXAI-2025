'use client'

import { useState } from 'react'
import { Camera, Upload, Eye, Search } from 'lucide-react'

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [prompt, setPrompt] = useState<string>("") // New state for user prompt
  const [searchQuery, setSearchQuery] = useState<string | null>(null) // New state for search query
  const [searchUrl, setSearchUrl] = useState<string | null>(null)     // New state for search URL
  const [isDragOver, setIsDragOver] = useState(false) // New state for drag over effect

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setAnalysis(null)
      }
      reader.readAsDataURL(file)
    }
  }

  // New drag and drop handlers
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setAnalysis(null);
        setSearchQuery(null);
        setSearchUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return
    
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage, prompt: prompt }), // Send base64 and prompt
      })
      
      const data = await response.json()
      setAnalysis(data.analysis)
      setSearchQuery(data.searchQuery) // Set search query from API response
      setSearchUrl(data.searchUrl)     // Set search URL from API response
    } catch (error) {
      console.error('Error analyzing image:', error)
      setAnalysis('Error analyzing image. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen p-8 text-game-text-light bg-game-bg-dark font-space-mono">
      <div className="max-w-7xl mx-auto rounded-xl shadow-lg bg-game-card-bg p-8 lg:p-12 border border-game-border-color transform transition-transform duration-300 hover:scale-[1.005] hover:shadow-game-glow">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-press-start-2p mb-3 tracking-wide" style={{ color: 'var(--game-primary-accent)', textShadow: 'var(--game-shadow-glow)' }}>
            🔍 <span className="text-game-secondary-accent">Visual</span>Search
          </h1>
          <p className="text-base lg:text-lg text-game-text-medium max-w-2xl mx-auto mt-4">Upload an image of anything let us do the rest.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Upload Section */}
          <div className="bg-game-input-bg rounded-lg p-6 border border-game-border-color shadow-lg transform transition-transform duration-200 hover:scale-[1.01] hover:shadow-game-glow">
            <h2 className="text-xl font-press-start-2p mb-5 text-game-primary-accent" style={{ textShadow: 'var(--game-shadow-glow)' }}>Upload Image</h2>
            
            <div className="space-y-6">
              <label 
                className={`flex flex-col items-center justify-center w-full h-64 border-2 ${isDragOver ? 'border-game-secondary-accent bg-game-bg-medium' : 'border-game-border-color'} border-dashed rounded-md cursor-pointer bg-game-input-bg hover:bg-game-bg-medium transition-all duration-200 group shadow-inner`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selectedImage ? (
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="max-h-56 max-w-full rounded-md object-contain border border-game-border-color shadow-md"
                    />
                  ) : (
                    <>
                      <Upload className="w-14 h-14 mb-3 text-game-text-medium group-hover:text-game-secondary-accent transition-colors duration-200" />
                      <p className="mb-1 text-sm text-game-text-medium">
                        <span className="font-bold text-game-primary-accent">Upload</span> or drag-and-drop your image 
                      </p>
                      <p className="text-xs text-game-text-medium opacity-70">PNG, JPG, JPEG (Max 10MB)</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
              
              {/* New prompt input field */}
              <input
                type="text"
                placeholder="e.g.'Where can I buy sunglasses like this one?','What is this landmark and in what city was this taken?'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 rounded-md bg-game-input-bg text-black placeholder-game-text-medium focus:outline-none focus:ring-1 focus:ring-game-secondary-accent border border-game-border-color shadow-sm"
              />

              {selectedImage && (
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center space-x-2 bg-game-primary-accent hover:bg-game-primary-accent disabled:bg-gray-700 disabled:text-game-text-medium text-game-bg-dark px-6 py-2.5 rounded-md font-bold text-base transition-all duration-200 shadow-md hover:shadow-[var(--game-button-glow)] hover:border-2 hover:border-game-secondary-accent focus:outline-none focus:ring-2 focus:ring-game-primary-accent focus:ring-opacity-50" style={{ textShadow: 'var(--game-button-glow)' }}
                >
                  <Search size={20} />
                  <span>{isAnalyzing ? 'Searching...' : 'Search'}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Analysis Results */}
          <div className="bg-game-input-bg rounded-lg p-6 border border-game-border-color shadow-lg transform transition-transform duration-200 hover:scale-[1.01] hover:shadow-game-glow">
            <h2 className="text-xl font-press-start-2p mb-5 text-game-secondary-accent" style={{ textShadow: 'var(--game-shadow-glow)' }}>Results</h2>
            
            {analysis ? (
              <div className="bg-game-card-bg rounded-md p-5 border border-game-border-color max-h-64 overflow-y-auto custom-scrollbar shadow-inner">
                <p className="text-game-text-light leading-relaxed whitespace-pre-wrap mb-4 text-sm">{analysis}</p>
                {searchQuery && searchUrl && (
                  <div className="mt-5 pt-4 border-t border-game-border-color">
                    <h3 className="text-lg font-space-mono font-bold text-game-primary-accent mb-3">For more:</h3>
                    <p className="text-game-text-medium mb-2 text-sm">For more results, type this in google: </p>
                    <a 
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 bg-game-secondary-accent hover:bg-game-secondary-accent disabled:bg-gray-700 disabled:text-game-text-medium text-game-bg-dark px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 shadow-md hover:shadow-[var(--game-button-glow)] hover:border-2 hover:border-game-primary-accent focus:outline-none focus:ring-2 focus:ring-game-secondary-accent focus:ring-opacity-50" style={{ textShadow: 'var(--game-button-glow)' }}
                    >
                      <span>{searchQuery}</span>
                      <Search size={16} />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-game-text-medium py-10">
                <Camera size={60} className="mx-auto mb-5 text-game-primary-accent" />
                <p className="text-base">Find out what's in the image and get the best deals!</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <div className="bg-game-card-bg rounded-lg p-7 border border-game-border-color shadow-lg transform transition-transform duration-200 hover:scale-[1.005] hover:shadow-game-glow">
            <h3 className="text-2xl font-press-start-2p mb-3 text-game-primary-accent" style={{ textShadow: 'var(--game-shadow-glow)' }}>Ask Questions Like</h3>
            <p className="font-bold text-game-primary-accent">What does this company do and how to apply for a job there?</p>
            <p className="font-bold text-game-primary-accent">What is the name of the broken part from my blender?</p>
            <p className="font-bold text-game-primary-accent">What style of chair is this and where can i buy one like it?</p>
            <p className="font-bold text-game-primary-accent">What is this landmark and in what city was this taken?</p>
          </div>
        </div>
      </div>
    </main>
  )
} 