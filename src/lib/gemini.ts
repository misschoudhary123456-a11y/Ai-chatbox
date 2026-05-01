import { GoogleGenAI, GenerateContentParameters } from "@google/genai";
import { Message, ChatMode } from "../types";

export class GeminiService {
  private ai: any;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private getSystemPrompt(mode: ChatMode): string {
    const basePrompt = "Your name is Zoya, a highly intelligent and friendly AI assistant. You speak in a mix of Hindi and English (Hinglish) to be more relatable to Indian students. Always be encouraging.";
    
    switch (mode) {
      case 'study':
        return `${basePrompt} You are currently in STUDY MODE. Act as a dedicated and patient BCA/Engineering professor. 
        Your goal is to make the student an expert. When explaining Math, DBMS, or Programming:
        1. Start with a simplified high-level Concept Definition.
        2. Provide a detailed 'Step-by-Step' logic flow using numbered lists.
        3. ALWAYS include a 'Real-World Example' and a short 'Case Study' (e.g., how Amazon handles DBMS for millions of orders, or how NASA uses specific Math for navigation).
        4. Focus on core BCA subjects: Calculus/Discrete Math, DBMS Normalization/SQL, Data Structures/OOPS.
        5. If the topic involves code, provide a robust code snippet.
        6. CRITICAL: All code comments MUST be in Hindi (written in Hinglish script) to help the student understand the logic.
        7. End with a one-sentence summary or a quick tip for exams.
        Prioritize clarity and never give short or lazy answers. If the student asks about a specific topic, dive deep into its practical application.`;
      case 'exam':
        return `${basePrompt} You are currently in EXAM MODE.
        1. Present ONE challenging multiple-choice question at a time related to BCA subjects (Math, DBMS, Programming).
        2. Format options as: A) ..., B) ..., C) ..., D) ...
        3. WAIT for the user to answer.
        4. FEEDBACK LOGIC:
           - If CORRECT: Congratulate the user enthusiastically (e.g., "Shandaar! Correct answer!").
           - If INCORRECT: Clearly state the correct answer.
           - IN BOTH CASES: Provide a detailed 'Logic Breakdown'. Explain EXACTLY why the correct options is right and, if they picked the wrong one, explain why that specific choice was incorrect.
           - Use real-world analogies in the explanation to reinforce the concept.
        5. After providing feedback, ask if they are ready for the next question.`;
      case 'guide':
        return `${basePrompt} You are currently in GUIDE MODE. Your purpose is to teach the user how to use Zoya AI effectively.
        Explain the following features:
        1. Normal Chat: For general conversation and quick help.
        2. Study Mode: Deep dives into BCA subjects with logic breakdowns and real-world examples.
        3. Exam Mode: Interactive quizzes with confetti celebrations and detailed logic feedback.
        4. Pencil AI: Upload images or drawings for step-by-step solutions.
        5. Voice & Video Calls: Simulated interactive sessions for a more personal touch.
        
        PROMPT ENGINEERING TIPS:
        - Be Specific: Instead of "Explain DBMS", try "Explain DBMS Normalization with a library example".
        - Give Context: Mention your specific course or difficulty level.
        - Ask for Format: "Use a table", "Write a code snippet", or "Use an analogy".
        - Iterative Refinement: If the first answer isn't perfect, ask follow-up questions.
        
        Always encourage the user to experiment with different modes!`;
      case 'pencil':
        return `${basePrompt} You are currently in PENCIL AI MODE. A user has sent a drawing or a handwritten note. Analyze it carefully and solve the problem step-by-step as a teacher would on a blackboard.`;
      default:
        return `${basePrompt} You are in NORMAL MODE. Act as a smart friend and helper. You can talk about anything, but if the user asks a technical question, give a helpful and concise answer.`;
    }
  }

  async chat(messages: Message[], mode: ChatMode, fileData?: { data: string, mimeType: string }): Promise<string> {
    if (!this.ai) throw new Error("API Key not found. Please set it in Settings.");

    // Maintain context of last 10 messages
    const context = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = this.getSystemPrompt(mode);

    const parts: any[] = [{ text: messages[messages.length - 1].content }];
    
    if (fileData) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data.split(',')[1] // Remove prefix
        }
      });
    }

    const params: GenerateContentParameters = {
      model: "gemini-3.1-pro-preview",
      contents: [
        { role: 'user', parts: [{ text: `System Instruction: ${systemInstruction}` }] },
        ...context.map(c => ({ role: c.role, parts: c.parts }))
      ],
      config: {
        temperature: 0.7,
      }
    };

    const response = await this.ai.models.generateContent(params);
    return response.text || "I'm sorry, I couldn't generate a response.";
  }

  async generateVideo(prompt: string, onProgress?: (msg: string) => void): Promise<string> {
    // Use process.env.API_KEY for Veo models as per guidelines
    const apiKey = (process.env as any).API_KEY || this.apiKey;
    const ai = new GoogleGenAI({ apiKey });
    
    onProgress?.("Starting video generation...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    onProgress?.("Video is being generated. This may take a few minutes...");
    
    const maxRetries = 60; // 10 minutes total (10s intervals)
    let retries = 0;

    while (!operation.done && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      retries++;
      onProgress?.(`Processing... (${Math.round((retries / maxRetries) * 100)}%)`);
    }

    if (!operation.done) {
      throw new Error("Video generation timed out.");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed: No download link returned.");
    }

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}
