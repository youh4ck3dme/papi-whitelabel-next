import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Funkcia na získanie LLM klienta (lazy loading)
const getLLM = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  });
};

const bookingAssistantPrompt = PromptTemplate.fromTemplate(`
  You are a helpful booking assistant for {tenantName}.
  The user wants to book a service. Help them find the best time and service.

  Available services:
  {services}

  Available time slots for {date}:
  {timeSlots}

  User query: {query}

  Respond in {language} and be concise.
`);

export const getAIBookingResponse = async (
  tenantName: string,
  services: string,
  timeSlots: string,
  query: string,
  language: string = 'en'
) => {
  const llm = getLLM();
  
  if (!llm) {
    return "AI Assistant is not configured. Please check your OpenAI API key in .env.";
  }

  const chain = RunnableSequence.from([
    bookingAssistantPrompt,
    llm,
    new StringOutputParser(),
  ]);

  const response = await chain.invoke({
    tenantName,
    services,
    timeSlots,
    query,
    language,
    date: new Date().toISOString().split('T')[0],
  });
  
  return response;
};
