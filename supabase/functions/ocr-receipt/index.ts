import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_CLOUD_VISION_API_KEY = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TextAnnotation {
  description: string;
  boundingPoly?: {
    vertices: Array<{ x?: number; y?: number }>;
  };
}

interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: TextAnnotation[];
    error?: { message: string };
  }>;
}

interface OcrTextLine {
  text: string;
  score: number;
  frame: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Group words into lines based on vertical position (y-coordinate proximity)
 */
function groupWordsIntoLines(annotations: TextAnnotation[]): OcrTextLine[] {
  if (annotations.length <= 1) {
    // Only the full text annotation exists, split by newlines
    if (annotations.length === 1) {
      const fullText = annotations[0].description;
      return fullText
        .split("\n")
        .filter((line) => line.trim())
        .map((line, index) => ({
          text: line.trim(),
          score: 0.95,
          frame: { top: index * 20, left: 0, width: 300, height: 20 },
        }));
    }
    return [];
  }

  // Skip the first annotation (full text block), use individual words
  const words = annotations.slice(1);

  // Group words by their vertical center position
  const lineThreshold = 15; // Pixels of vertical tolerance for same line
  const lineGroups: Map<number, TextAnnotation[]> = new Map();

  for (const word of words) {
    if (!word.boundingPoly?.vertices?.length) continue;

    const vertices = word.boundingPoly.vertices;
    const minY = Math.min(...vertices.map((v) => v.y ?? 0));
    const maxY = Math.max(...vertices.map((v) => v.y ?? 0));
    const centerY = (minY + maxY) / 2;

    // Find existing line group within threshold
    let foundLine = false;
    for (const [lineY] of lineGroups) {
      if (Math.abs(centerY - lineY) < lineThreshold) {
        lineGroups.get(lineY)!.push(word);
        foundLine = true;
        break;
      }
    }

    if (!foundLine) {
      lineGroups.set(centerY, [word]);
    }
  }

  // Convert groups to lines, sorting words by x position
  const lines: OcrTextLine[] = [];

  const sortedLineYs = [...lineGroups.keys()].sort((a, b) => a - b);

  for (const lineY of sortedLineYs) {
    const lineWords = lineGroups.get(lineY)!;

    // Sort words by x position (left to right)
    lineWords.sort((a, b) => {
      const aX = Math.min(
        ...(a.boundingPoly?.vertices?.map((v) => v.x ?? 0) ?? [0])
      );
      const bX = Math.min(
        ...(b.boundingPoly?.vertices?.map((v) => v.x ?? 0) ?? [0])
      );
      return aX - bX;
    });

    // Combine words into line text
    const text = lineWords.map((w) => w.description).join(" ");

    // Calculate bounding frame for the entire line
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const word of lineWords) {
      if (!word.boundingPoly?.vertices) continue;
      for (const vertex of word.boundingPoly.vertices) {
        minX = Math.min(minX, vertex.x ?? 0);
        minY = Math.min(minY, vertex.y ?? 0);
        maxX = Math.max(maxX, vertex.x ?? 0);
        maxY = Math.max(maxY, vertex.y ?? 0);
      }
    }

    lines.push({
      text,
      score: 0.95, // Google Vision doesn't provide word-level confidence
      frame: {
        left: minX === Infinity ? 0 : minX,
        top: minY === Infinity ? 0 : minY,
        width: maxX === -Infinity ? 0 : maxX - minX,
        height: maxY === -Infinity ? 0 : maxY - minY,
      },
    });
  }

  return lines;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (!GOOGLE_CLOUD_VISION_API_KEY) {
      throw new Error("Google Cloud Vision API key not configured");
    }

    const { image, mimeType } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "Image data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Google Cloud Vision API
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;

    const visionResponse = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: image },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json().catch(() => ({}));
      console.error("Google Vision API error:", JSON.stringify(errorData));
      const errorMessage =
        errorData?.error?.message || `HTTP ${visionResponse.status}`;
      throw new Error(`Google Vision API: ${errorMessage}`);
    }

    const visionData: VisionApiResponse = await visionResponse.json();

    // Check for API errors in response
    if (visionData.responses[0]?.error) {
      throw new Error(visionData.responses[0].error.message);
    }

    const textAnnotations = visionData.responses[0]?.textAnnotations ?? [];

    // Get the full raw text (first annotation contains complete text with newlines)
    const fullText = textAnnotations[0]?.description ?? "";

    // Transform to PaddleOcrResponse format
    const lines = groupWordsIntoLines(textAnnotations);

    const processingTimeMs = Date.now() - startTime;

    console.log(
      `OCR processed: ${lines.length} lines in ${processingTimeMs}ms (mimeType: ${mimeType || "unknown"})\n\nFull raw text:\n${fullText}`
    );

    return new Response(
      JSON.stringify({
        lines,
        fullText,
        processingTimeMs,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ocr-receipt function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
