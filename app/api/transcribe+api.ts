export async function POST(request: Request) {
  try {
    const { audio, format } = await request.json();

    if (!audio || typeof audio !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid audio data provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // BorgCloud Speech-to-Text API integration
    const borgCloudResponse = await fetch('https://api.borgcloud.com/v1/speech/transcribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BORGCLOUD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: audio,
        format: format || 'wav',
        language: 'en-US',
        model: 'general',
        enable_automatic_punctuation: true,
        enable_speaker_diarization: false,
      }),
    });

    if (!borgCloudResponse.ok) {
      console.error('BorgCloud API error:', borgCloudResponse.status, borgCloudResponse.statusText);
      
      // Fallback to mock transcription for development
      if (process.env.NODE_ENV === 'development') {
        return new Response(
          JSON.stringify({
            text: "I want to go hiking this Saturday, somewhere with a waterfall, not too far from Brookfield",
            confidence: 0.95,
            duration: 3.2,
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

      throw new Error('Speech-to-text service unavailable');
    }

    const transcriptionData = await borgCloudResponse.json();

    return new Response(
      JSON.stringify({
        text: transcriptionData.text || transcriptionData.transcript,
        confidence: transcriptionData.confidence || 0.9,
        duration: transcriptionData.duration || 0,
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
    console.error('Transcription API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to transcribe audio' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
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