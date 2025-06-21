import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { userInput, recommendedFile } = await request.json();

    if (!userInput || typeof userInput !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let selectedAdventure = null;

    console.log('🚀 pocPlan API called with:', { userInput, recommendedFile });

    // If a specific file is recommended, try to load it first
    if (recommendedFile && typeof recommendedFile === 'string') {
      try {
        const adventurePath = path.join(process.cwd(), 'data', 'adventures', recommendedFile);
        console.log('📂 Attempting to load adventure file:', adventurePath);
        
        if (fs.existsSync(adventurePath)) {
          const fileContent = fs.readFileSync(adventurePath, 'utf8');
          selectedAdventure = JSON.parse(fileContent);
          console.log(`✅ Successfully loaded recommended adventure: ${recommendedFile}`);
          console.log('📋 Adventure summary:', {
            name: selectedAdventure.name,
            city: selectedAdventure.city,
            activity: selectedAdventure.activity,
            scheduleItems: selectedAdventure.schedule?.length || 0
          });
        } else {
          console.error(`❌ Adventure file does not exist: ${adventurePath}`);
        }
      } catch (error) {
        console.error(`❌ Error loading recommended adventure file: ${recommendedFile}`, error);
      }
    }

    // If no recommended file or loading failed, fall back to original matching logic
    if (!selectedAdventure) {
      console.log('🔄 Falling back to original matching logic...');
      
      // Load sample queries and adventures
      const sampleQueriesPath = path.join(process.cwd(), 'data', 'sample-queries.json');
      
      if (fs.existsSync(sampleQueriesPath)) {
        const sampleQueries = JSON.parse(fs.readFileSync(sampleQueriesPath, 'utf8'));

        // Simple keyword matching logic
        const input = userInput.toLowerCase();

        // CRITICAL: Check for Utah first
        if (input.includes('utah') || input.includes('moab')) {
          try {
            const adventurePath = path.join(process.cwd(), 'data', 'adventures', 'moab-utah.json');
            selectedAdventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
            console.log('🎯 Loaded Utah adventure via direct matching: moab-utah.json');
          } catch (error) {
            console.error('❌ Error loading Utah adventure file', error);
          }
        }

        // Try to match against sample queries if not Utah
        if (!selectedAdventure) {
          for (const queryData of sampleQueries.queries) {
            const queryWords = queryData.query.toLowerCase().split(' ');
            const inputWords = input.split(' ');
            
            // Check for keyword matches
            const matches = queryWords.filter(word => 
              inputWords.some(inputWord => 
                inputWord.includes(word) || word.includes(inputWord)
              )
            );
            
            if (matches.length >= 2) { // Require at least 2 matching keywords
              try {
                const adventurePath = path.join(process.cwd(), 'data', 'adventures', queryData.adventure_file);
                selectedAdventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
                console.log(`✅ Loaded adventure via query matching: ${queryData.adventure_file}`);
                break;
              } catch (error) {
                console.error(`❌ Error loading adventure file: ${queryData.adventure_file}`, error);
                continue;
              }
            }
          }
        }
      }

      // Fallback to location-based matching if no query match found
      if (!selectedAdventure) {
        const adventuresDir = path.join(process.cwd(), 'data', 'adventures');
        
        if (fs.existsSync(adventuresDir)) {
          const adventureFiles = fs.readdirSync(adventuresDir);
          
          for (const file of adventureFiles) {
            try {
              const adventurePath = path.join(adventuresDir, file);
              const adventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
              
              const input = userInput.toLowerCase();
              const cityMatch = input.includes(adventure.city.toLowerCase().split(',')[0].toLowerCase());
              const activityMatch = input.includes(adventure.activity.toLowerCase());
              const nameMatch = adventure.name.toLowerCase().includes(input) || 
                               input.includes(adventure.name.toLowerCase().split(' ')[0]);
              
              if (cityMatch || activityMatch || nameMatch) {
                selectedAdventure = adventure;
                console.log(`✅ Loaded adventure via location matching: ${file}`);
                break;
              }
            } catch (error) {
              console.error(`❌ Error loading adventure file: ${file}`, error);
              continue;
            }
          }
        }
      }
    }

    // Final fallback to first available adventure
    if (!selectedAdventure) {
      try {
        const adventurePath = path.join(process.cwd(), 'data', 'adventures', 'avon-colorado.json');
        selectedAdventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
        console.log('✅ Loaded fallback adventure: avon-colorado.json');
      } catch (error) {
        console.error('❌ Error loading fallback adventure', error);
        return new Response(
          JSON.stringify({ error: 'No adventures available' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('🎉 Final selected adventure:', {
      name: selectedAdventure?.name,
      city: selectedAdventure?.city,
      activity: selectedAdventure?.activity,
      scheduleItems: selectedAdventure?.schedule?.length || 0
    });

    // Validate the adventure data structure
    if (!selectedAdventure.name || !selectedAdventure.city || !selectedAdventure.schedule) {
      console.error('❌ Invalid adventure data structure:', selectedAdventure);
      return new Response(
        JSON.stringify({ error: 'Invalid adventure data' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📤 Returning adventure data to client');

    return new Response(
      JSON.stringify(selectedAdventure),
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
    console.error('❌ pocPlan API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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