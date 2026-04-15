import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'fs';
import path from 'path';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Locate and read the content-library.json file
  const libraryPath = path.join(process.cwd(), 'database', 'content-library.json');
  const libraryData = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));

  // 2. Format the library data into a simple list for the AI to read
  const availableContent = libraryData.map((item: any) => 
    `- ${item.title} (${item.type}): ${item.description} [Category: ${item.category}]`
  ).join('\n');

  const result = streamText({
    model: google('gemini-1.5-flash'),
    // 3. Inject the library data into the system prompt
    system: `You are the BITStream AI Concierge. Your primary job is to recommend media from our specific library.
    
    HERE IS THE CURRENT BITSTREAM LIBRARY:
    ${availableContent}
    
    GUIDELINES:
    - Only recommend items from the list above.
    - If a user asks for something we don't have, politely suggest the closest match from our library.
    - Be enthusiastic about campus media!
    - Keep recommendations concise (1-2 sentences).`,
    messages,
  });

  return result.toDataStreamResponse();
}