import { NextResponse } from "next/server";
import { generateWithFallback, stripCodeFence } from "@/lib/ai/generate";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const topic = body?.topic?.trim();
    const numberOfQuestions = Number(body?.numberOfQuestions || 5);

    if (!topic) {
      return NextResponse.json(
        { error: "Please enter a quiz topic." },
        { status: 400 }
      );
    }

    const safeQuestionCount = Math.min(
      Math.max(numberOfQuestions, 1),
      10
    );

    const prompt = `
You are ThinkSync's AI Quiz Generator.

Create a quiz for a college student.

Topic:
${topic}

Number of questions:
${safeQuestionCount}

Requirements:
- Create exactly ${safeQuestionCount} multiple-choice questions.
- Each question must have 4 options.
- Only one option must be correct.
- Questions should test understanding, not just memorization.
- Keep the difficulty suitable for a B.Tech student.
- Include a short explanation for every correct answer.

Return ONLY valid JSON.
Do not use markdown.
Do not add any text before or after the JSON.

Use exactly this structure:

{
  "topic": "${topic}",
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation"
    }
  ]
}

Important:
- correctAnswer must be the zero-based index of the correct option.
- 0 means the first option.
- 1 means the second option.
- 2 means the third option.
- 3 means the fourth option.
`;

    // -----------------------------------------
    // Call AI (NVIDIA first, Gemini fallback)
    // -----------------------------------------
    const { text: rawText, provider } = await generateWithFallback(
      prompt,
      {
        temperature: 0.7,
        maxTokens: 2048,
      }
    );

    console.log(`Quiz: Response generated via ${provider}.`);

    const text = stripCodeFence(rawText);

    let quiz;

    try {
      quiz = JSON.parse(text);
    } catch {
      console.error("Invalid JSON returned by AI:");
      console.error(text);

      return NextResponse.json(
        {
          error: "The AI returned an invalid quiz format.",
        },
        { status: 500 }
      );
    }

    if (
      !quiz ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Quiz generation failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      quiz,
    });
  } catch (error: unknown) {
    console.error("========== QUIZ ERROR ==========");
    console.error(error);
    console.error("================================");

    let errorMessage = "Unable to generate the quiz.";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}