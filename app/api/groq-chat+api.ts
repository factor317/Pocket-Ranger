export async function POST(request: Request) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // List of available adventure files with enhanced keywords
    const availableAdventures = [
      { file: 'avon-colorado.json', keywords: ['avon', 'colorado', 'vail', 'beaver creek', 'skiing', 'mountain', 'high country', 'brewery', 'bison burger', 'denver', 'aspen'] },
      { file: 'moab-utah.json', keywords: ['moab', 'utah', 'red rock', 'arches', 'desert', 'delicate arch', 'canyonlands', 'hiking', 'rock formation', 'southwest'] },
      { file: 'glacier-montana.json', keywords: ['glacier', 'montana', 'national park', 'alpine', 'hidden lake', 'logan pass', 'going to the sun', 'mountains', 'wilderness'] },
      { file: 'lake-tahoe.json', keywords: ['tahoe', 'california', 'nevada', 'alpine lake', 'emerald bay', 'eagle falls', 'sierra nevada', 'crystal clear'] },
      { file: 'sedona-arizona.json', keywords: ['sedona', 'arizona', 'red rock', 'cathedral rock', 'bell rock', 'vortex', 'energy', 'spiritual', 'southwest'] },
      { file: 'asheville-north-carolina.json', keywords: ['asheville', 'north carolina', 'blue ridge', 'appalachian', 'brewery', 'looking glass falls', 'mountains', 'east coast'] },
      { file: 'olympic-washington.json', keywords: ['olympic', 'washington', 'peninsula', 'rainforest', 'hurricane ridge', 'temperate', 'pacific northwest', 'coastal'] },
      { file: 'acadia-maine.json', keywords: ['acadia', 'maine', 'bar harbor', 'cadillac mountain', 'coastal', 'lobster', 'atlantic', 'new england', 'lighthouse'] },
      { file: 'big-sur-california.json', keywords: ['big sur', 'california', 'mcway falls', 'bixby bridge', 'coastal', 'redwood', 'pacific', 'highway 1', 'monterey'] },
      { file: 'great-smoky-mountains.json', keywords: ['smoky mountains', 'tennessee', 'gatlinburg', 'laurel falls', 'cataract falls', 'appalachian', 'pigeon forge'] }
    ];

    // Groq API integration with Llama 3.1
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a helpful outdoor adventure planning assistant for Pocket Ranger. Your job is to understand user requests for outdoor activities and determine which adventure location best matches their request.

Available adventure locations:
1. avon-colorado.json - Avon, Colorado (hiking, breweries, bison burgers, Vail Valley, Beaver Creek, high country, mountain adventures)
2. moab-utah.json - Moab, Utah (red rock hiking, desert exploration, Arches National Park, Delicate Arch, canyonlands, southwestern desert)
3. glacier-montana.json - Glacier National Park, Montana (alpine lakes, mountain views, Hidden Lake, Logan Pass, wilderness, pristine nature)
4. lake-tahoe.json - Lake Tahoe, California (alpine hiking, scenic drives, Emerald Bay, Eagle Falls, crystal clear waters, Sierra Nevada)
5. sedona-arizona.json - Sedona, Arizona (red rock formations, energy vortexes, Cathedral Rock, Bell Rock, spiritual experiences)
6. asheville-north-carolina.json - Asheville, North Carolina (Blue Ridge Mountains, craft breweries, Looking Glass Falls, Appalachian culture)
7. olympic-washington.json - Olympic Peninsula, Washington (rainforests, coastal views, Hurricane Ridge, temperate climate, Pacific Northwest)
8. acadia-maine.json - Acadia National Park, Maine (coastal hiking, lobster dining, Cadillac Mountain, Atlantic coast, New England)
9. big-sur-california.json - Big Sur, California (coastal wilderness, McWay Falls, Bixby Bridge, redwood forests, Highway 1)
10. great-smoky-mountains.json - Great Smoky Mountains, Tennessee (waterfalls, mountain culture, Laurel Falls, Appalachian heritage)

CRITICAL: For queries mentioning Utah, desert, red rocks, or Moab, you MUST recommend "moab-utah.json".

Analyze the user's request and determine which adventure file best matches their interests. Consider:
- Geographic location mentioned (Utah = moab-utah.json)
- Activity type (hiking, breweries, coastal, desert, etc.)
- Specific landmarks or features mentioned
- Duration and difficulty preferences

Your response should include the exact filename and explain why this location matches their request. Always set shouldSearch to true.

Example: For "Hiking in utah, 4 days, casual dining" you should recommend "moab-utah.json" because Utah is specifically mentioned and Moab is Utah's premier hiking destination.`
          },
          ...conversationHistory,
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent matching
        max_tokens: 300,
        top_p: 1,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqResponse.status, groqResponse.statusText);
      
      // Enhanced fallback logic for development
      const fallbackFile = getFallbackFile(message, availableAdventures);
      
      return new Response(
        JSON.stringify({
          response: `I'd love to help you plan your adventure! Let me search our adventure database for the perfect match for your request!`,
          shouldSearch: true,
          recommendedFile: fallbackFile,
          extractedInfo: extractAdventureInfo(message)
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    const aiData = await groqResponse.json();
    const aiResponse = aiData.choices[0]?.message?.content || '';

    console.log('Groq AI Response:', aiResponse);

    // Analyze the AI response to extract the recommended file
    const recommendedFile = extractRecommendedFile(aiResponse, message, availableAdventures);
    
    console.log('Recommended file:', recommendedFile);
    
    // Always trigger search for adventure data
    const shouldSearch = true;
    const extractedInfo = extractAdventureInfo(message);

    return new Response(
      JSON.stringify({
        response: aiResponse,
        shouldSearch,
        recommendedFile,
        extractedInfo,
        conversationId: Date.now().toString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Groq Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process message' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

function getFallbackFile(userMessage: string, availableAdventures: any[]): string {
  const messageLower = userMessage.toLowerCase();
  
  // Priority matching for specific locations
  if (messageLower.includes('utah') || messageLower.includes('moab')) {
    return 'moab-utah.json';
  }
  if (messageLower.includes('colorado') || messageLower.includes('avon')) {
    return 'avon-colorado.json';
  }
  if (messageLower.includes('montana') || messageLower.includes('glacier')) {
    return 'glacier-montana.json';
  }
  
  // Score-based matching for other cases
  let bestMatch = { file: 'avon-colorado.json', score: 0 };
  
  for (const adventure of availableAdventures) {
    let score = 0;
    for (const keyword of adventure.keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { file: adventure.file, score };
    }
  }
  
  return bestMatch.file;
}

function extractRecommendedFile(aiResponse: string, userMessage: string, availableAdventures: any[]): string {
  // First, check if AI response mentions a specific file
  for (const adventure of availableAdventures) {
    if (aiResponse.toLowerCase().includes(adventure.file.toLowerCase())) {
      console.log(`Found file in AI response: ${adventure.file}`);
      return adventure.file;
    }
  }

  // Check for location names in AI response
  const responseLower = aiResponse.toLowerCase();
  if (responseLower.includes('moab') || responseLower.includes('utah')) {
    console.log('Found Utah/Moab in AI response');
    return 'moab-utah.json';
  }
  if (responseLower.includes('avon') || responseLower.includes('colorado')) {
    console.log('Found Colorado/Avon in AI response');
    return 'avon-colorado.json';
  }

  // Fallback to analyzing user message
  console.log('Using fallback file matching for user message:', userMessage);
  return getFallbackFile(userMessage, availableAdventures);
}

function extractAdventureInfo(message: string): any {
  const info: any = {};
  const lowerMessage = message.toLowerCase();

  // Extract activity type
  const activities = ['hiking', 'fishing', 'camping', 'climbing', 'biking', 'kayaking'];
  for (const activity of activities) {
    if (lowerMessage.includes(activity)) {
      info.activity = activity;
      break;
    }
  }

  // Extract location mentions
  const locations = [
    'avon', 'colorado', 'moab', 'utah', 'glacier', 'montana',
    'tahoe', 'california', 'sedona', 'arizona', 'asheville',
    'north carolina', 'olympic', 'washington', 'acadia', 'maine',
    'big sur', 'smoky mountains', 'tennessee'
  ];
  
  for (const location of locations) {
    if (lowerMessage.includes(location)) {
      info.location = location;
      break;
    }
  }

  // Extract features
  const features = [];
  if (lowerMessage.includes('waterfall')) features.push('waterfall');
  if (lowerMessage.includes('brewery') || lowerMessage.includes('beer')) features.push('brewery');
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('dining')) features.push('dining');
  if (lowerMessage.includes('lake')) features.push('lake');
  if (lowerMessage.includes('mountain')) features.push('mountain');
  if (lowerMessage.includes('desert')) features.push('desert');
  if (lowerMessage.includes('red rock')) features.push('red rock');
  
  if (features.length > 0) {
    info.features = features;
  }

  // Extract timeframe
  if (lowerMessage.includes('saturday') || lowerMessage.includes('weekend')) {
    info.timeframe = 'weekend';
  } else if (lowerMessage.includes('week') || lowerMessage.includes('days')) {
    info.timeframe = 'multi-day';
  } else {
    info.timeframe = 'day trip';
  }

  return info;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}