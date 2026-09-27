import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { getApprovedMedia } from '@/backend/content/repository';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 1. Load the approved media library (JSON file locally, Cloudinary on Vercel)
  const library = await getApprovedMedia();

  // 2. Format the library data into a simple list for the AI to read
  const availableContent = library
    .map((item) => `- ${item.title} (/video/${item.slug}): ${item.description} [Category: ${item.category}]`)
    .join('\n');

  const result = streamText({
    model: google(process.env.GEMINI_MODEL || 'gemini-flash-latest'),
    // 3. Inject the library data into the system prompt
    system: `You are the BITStream AI Concierge. Your primary job is to recommend media from our specific library.

    HERE IS THE CURRENT BITSTREAM LIBRARY:
    ${availableContent || '(the library is empty right now)'}

    GUIDELINES:
    - Only recommend items from the list above.
    - If a user asks for something we don't have, politely suggest the closest match from our library.
    - Be enthusiastic about campus media!
    - Keep recommendations concise (1-2 sentences).`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
