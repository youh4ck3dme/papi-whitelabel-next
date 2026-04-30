import * as dotenv from 'dotenv';
dotenv.config(); // Musí byť prvý!

import { getAIBookingResponse } from './src/lib/ai';

async function testAI() {
  console.log('🚀 Spúšťam opravný test AI asistenta...');
  
  const tenantName = "WhitelabelDesign Hair Design";
  const services = "- Strihanie (30 min, $20)\n- Farbenie (90 min, $50)\n- Styling (45 min, $30)";
  const timeSlots = "9:00, 10:00, 11:00, 14:00, 15:00";
  const query = "Ahoj, kedy máte voľno v piatok na strihanie?";

  try {
    const response = await getAIBookingResponse(
      tenantName,
      services,
      timeSlots,
      query,
      "sk"
    );

    console.log('\n🤖 AI ODPOVEĎ:');
    console.log('-----------------------------------');
    console.log(response);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('❌ Test zlyhal:', error);
  }
}

testAI();
