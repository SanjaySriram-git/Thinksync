import { NextResponse } from "next/server";

type ShoppingRequirements = {
  query: string;
  category: string | null;
  budget: {
    min: number | null;
    max: number | null;
  };
  purpose: string | null;
  preferences: string[];
};

function extractBudget(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/₹/g, "");

  const underMatch = normalized.match(
    /(?:under|below|less than|upto|up to)\s*(?:rs\.?|inr)?\s*(\d+)/
  );

  if (underMatch) {
    return {
      min: null,
      max: Number(underMatch[1]),
    };
  }

  const betweenMatch = normalized.match(
    /between\s*(?:rs\.?|inr)?\s*(\d+)\s*(?:and|-)\s*(?:rs\.?|inr)?\s*(\d+)/
  );

  if (betweenMatch) {
    return {
      min: Number(betweenMatch[1]),
      max: Number(betweenMatch[2]),
    };
  }

  return {
    min: null,
    max: null,
  };
}

function extractCategory(text: string) {
  const categories = [
    "laptop",
    "phone",
    "mobile",
    "smartphone",
    "headphones",
    "earbuds",
    "tablet",
    "watch",
    "camera",
    "television",
    "tv",
    "monitor",
    "keyboard",
    "mouse",
  ];

  const lowerText = text.toLowerCase();

  const found = categories.find((category) =>
    lowerText.includes(category)
  );

  if (!found) return null;

  if (["phone", "mobile", "smartphone"].includes(found)) {
    return "smartphone";
  }

  if (["television", "tv"].includes(found)) {
    return "tv";
  }

  return found;
}

function extractPurpose(text: string) {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("coding") ||
    lowerText.includes("programming") ||
    lowerText.includes("developer") ||
    lowerText.includes("development")
  ) {
    return "coding";
  }

  if (
    lowerText.includes("gaming") ||
    lowerText.includes("game") ||
    lowerText.includes("gaming laptop")
  ) {
    return "gaming";
  }

  if (
    lowerText.includes("office") ||
    lowerText.includes("work") ||
    lowerText.includes("business")
  ) {
    return "work";
  }

  if (
    lowerText.includes("student") ||
    lowerText.includes("college") ||
    lowerText.includes("study")
  ) {
    return "study";
  }

  if (
    lowerText.includes("editing") ||
    lowerText.includes("video editing") ||
    lowerText.includes("photo editing")
  ) {
    return "editing";
  }

  return null;
}

function extractPreferences(text: string) {
  const lowerText = text.toLowerCase();

  const possiblePreferences = [
    "lightweight",
    "portable",
    "long battery",
    "good battery",
    "battery life",
    "high performance",
    "performance",
    "fast",
    "oled",
    "amoled",
    "large screen",
    "small screen",
    "good camera",
    "5g",
    "wireless",
    "bluetooth",
  ];

  return possiblePreferences.filter((preference) =>
    lowerText.includes(preference)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query = body?.query;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Query is required",
        },
        { status: 400 }
      );
    }

    const requirements: ShoppingRequirements = {
      query,
      category: extractCategory(query),
      budget: extractBudget(query),
      purpose: extractPurpose(query),
      preferences: extractPreferences(query),
    };

    return NextResponse.json({
      success: true,
      requirements,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to understand shopping request",
      },
      { status: 500 }
    );
  }
}
