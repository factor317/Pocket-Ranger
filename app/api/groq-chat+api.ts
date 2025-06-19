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
            content: `You are a helpful outdoor adventure planning assistant for Pocket Ranger. Your job is to understand user requests for outdoor activities and extract key information to help plan their adventure.

Extract the following information from user requests:
- Activity type (hiking, fishing, camping, etc.)
- Location preferences (city, state, region)
- Duration (day trip, weekend, week, etc.)
- Difficulty preferences (easy, moderate, challenging)
- Special requirements (waterfalls, breweries, restaurants, etc.)
- Group size and composition
- Time of year/season

Respond in a conversational, enthusiastic tone. If the user's request is unclear, ask clarifying questions. Always aim to be helpful and encouraging about their outdoor adventure plans.

Available adventure locations in our database:
- Avon, Colorado (hiking, breweries, bison burgers)
- Moab, Utah (red rock hiking, desert exploration)
- Glacier National Park, Montana (alpine lakes, mountain views)
- Lake Tahoe, California (alpine hiking, scenic drives)
- Sedona, Arizona (red rock formations, energy vortexes)
- Asheville, North Carolina (Blue Ridge Mountains, craft breweries)
- Olympic Peninsula, Washington (rainforests, coastal views)
- Acadia National Park, Maine (coastal hiking, lobster dining)
- Big Sur, California (coastal wilderness, redwood forests)
- Great Smoky Mountains, Tennessee (waterfalls, mountain culture)

If a user mentions a location not in our database, suggest the closest match or ask if they'd be interested in similar alternatives.`
          },
          ...conversationHistory,
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqResponse.status, groqResponse.statusText);
      
      // Fallback response for development
      if (process.env.NODE_ENV === 'development') {
        return new Response(
          JSON.stringify({
            response: "I'd love to help you plan a hiking adventure! It sounds like you're looking for a scenic hike with a waterfall near Brookfield. Let me search our adventure database for the perfect match for your Saturday adventure!",
            shouldSearch: true,
            extractedInfo: {
              activity: 'hiking',
              location: 'Brookfield',
              features: ['waterfall'],
              timeframe: 'Saturday',
              duration: 'day trip'
            }
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

      throw new Error('AI service unavailable');
    }

    const aiData = await groqResponse.json();
    const aiResponse = aiData.choices[0]?.message?.content || '';

    // Analyze if we should trigger a search
    const shouldSearch = analyzeForSearch(message, aiResponse);
    const extractedInfo = extractAdventureInfo(message);

    return new Response(
      JSON.stringify({
        response: aiResponse,
        shouldSearch,
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

function analyzeForSearch(userMessage: string, aiResponse: string): boolean {
  const searchTriggers = [
    'find', 'search', 'recommend', 'suggest', 'plan', 'adventure',
    'hiking', 'fishing', 'camping', 'explore', 'visit', 'go to'
  ];
  
  const message = userMessage.toLowerCase();
  return searchTriggers.some(trigger => message.includes(trigger));
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
    'big sur', 'smoky mountains', 'tennessee', 'brookfield'
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
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food')) features.push('dining');
  if (lowerMessage.includes('lake')) features.push('lake');
  if (lowerMessage.includes('mountain')) features.push('mountain');
  
  if (features.length > 0) {
    info.features = features;
  }

  // Extract timeframe
  if (lowerMessage.includes('saturday') || lowerMessage.includes('weekend')) {
    info.timeframe = 'weekend';
  } else if (lowerMessage.includes('week')) {
    info.timeframe = 'week';
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