import { NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai/generate";

export async function POST(request: Request) {
  try {
    // -----------------------------------------
    // 1. Read request
    // -----------------------------------------
    const body = await request.json();

    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 2. Build conversation
    // -----------------------------------------
    const conversation = messages
      .map(
        (message: {
          role: string;
          content: string;
        }) => {
          const role =
            message.role === "assistant"
              ? "StudyBuddy"
              : "Student";

          return `${role}: ${message.content}`;
        }
      )
      .join("\n\n");

    // -----------------------------------------
    // 3. StudyBuddy system prompt
    // -----------------------------------------
    const prompt = `
You are StudyBuddy, the AI study assistant inside ThinkSync.

Your job is to help students learn better.

You can help with:

- Data Structures and Algorithms
- C++
- Programming
- Digital Electronics
- Engineering Mathematics
- Engineering subjects
- Exam preparation
- Concept explanations
- Quiz generation
- Study plans
- Revision

Rules:

1. Explain concepts clearly and simply.
2. Use examples when useful.
3. For programming questions, provide correct code and explain the logic.
4. For exam questions, focus on important points.
5. For quiz requests, create useful questions and answers.
6. For study plans, create realistic schedules.
7. Be friendly and encouraging.
8. Don't unnecessarily make answers extremely long.
9. Always answer the student's latest question.
10. Never return an empty response.

Here is the conversation:

${conversation}

Respond directly to the student's latest message.
`;

    // -----------------------------------------
    // 4. Call AI (NVIDIA first, Gemini fallback)
    // -----------------------------------------
    console.log("StudyBuddy: Generating response...");

    const { text: reply, provider } = await generateWithFallback(
      prompt,
      {
        temperature: 0.7,
        maxTokens: 1000,
      }
    );

    console.log(`StudyBuddy: Response generated via ${provider}.`);
    console.log("StudyBuddy response:", reply);

    // -----------------------------------------
    // 5. Send response to frontend
    // -----------------------------------------
    return NextResponse.json({
      reply,
    });
  } catch (error: unknown) {
    // -----------------------------------------
    // 6. Detailed error handling
    // -----------------------------------------
    console.error("========== STUDYBUDDY ERROR ==========");
    console.error(error);
    console.error("======================================");

    let errorMessage = "Unable to connect to StudyBuddy.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}