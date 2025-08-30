import { NextRequest, NextResponse } from 'next/server'
// Import fs and path for potential file saving (optional, for debugging)
// import fs from 'fs/promises';
// import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { image: imageDataUrl, prompt: userPrompt } = await req.json();

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Extract base64 string and determine image type
    const [header, base64Data] = imageDataUrl.split(',');
    const mimeType = header.match(/data:(.*?);/)?.[1];

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: 'Invalid image data URL' }, { status: 400 });
    }

    // Convert base64 to a Buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // For now, we will use a generic prompt. The userPrompt can be integrated later if needed.
    const prompt = userPrompt || "What is in this image? Provide a detailed description and identify any prominent objects, brands, or styles. Suggest similar items or categories for shopping. If it's a landmark, identify it and its location.";

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llava', // Use the Llava model
        prompt: prompt,
        images: [base64Data], // Send base64 image data directly
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.json();
      console.error('Failed to get response from Ollama:', errorData);
      throw new Error(`Failed to get response from Ollama: ${errorData.error || ollamaResponse.statusText}`);
    }

    const data = await ollamaResponse.json();
    
    // Llava's response will be in data.response
    const llavaAnalysis = data.response || 'No detailed analysis available from Llava.';

    // Now, send Llava's analysis back to Ollama (or another LLM) to extract keywords for search
    const keywordExtractionPrompt = `Given the following image analysis, extract 3-5 keywords that would be most useful for a web search to find similar products, identify the object, or locate information about it. Prioritize product-related terms, brands, styles, and specific object names. Respond with only the comma-separated keywords.

Image Analysis: ${llavaAnalysis}

Keywords:`;

    const keywordExtractionResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llava', // Using llava for text processing
        prompt: keywordExtractionPrompt,
        stream: false,
      }),
    });

    if (!keywordExtractionResponse.ok) {
      console.error('Failed to extract keywords from Ollama.');
      // Proceed without keywords if extraction fails
      return NextResponse.json({
        analysis: llavaAnalysis,
        searchQuery: '',
        searchUrl: '',
      });
    }

    const keywordData = await keywordExtractionResponse.json();
    const keywordsRaw = keywordData.response || '';
    const keywords = keywordsRaw.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);

    // Construct a search query and a simulated Google Shopping URL
    const searchQuery = keywords.length > 0 ? keywords.join(' ') : "visual search item";
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=shop`;

    return NextResponse.json({
      analysis: llavaAnalysis,
      searchQuery: searchQuery,
      searchUrl: searchUrl,
    });
  } catch (error) {
    console.error('Image analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
} 