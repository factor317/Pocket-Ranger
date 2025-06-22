export async function GET(request: Request) {
  try {
    console.log('🔍 DEBUG: Starting adventure debug endpoint');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {}
    };

    // 1. Check data directory structure
    console.log('📁 DEBUG: Checking data directory structure...');
    const dataDir = path.join(process.cwd(), 'data');
    const adventuresDir = path.join(dataDir, 'adventures');
    
    debugInfo.checks.dataDirectory = {
      exists: fs.existsSync(dataDir),
      path: dataDir
    };
    
    debugInfo.checks.adventuresDirectory = {
      exists: fs.existsSync(adventuresDir),
      path: adventuresDir
    };

    // 2. List all adventure files
    if (fs.existsSync(adventuresDir)) {
      const files = fs.readdirSync(adventuresDir);
      debugInfo.checks.adventureFiles = {
        count: files.length,
        files: files,
        jsonFiles: files.filter(f => f.endsWith('.json'))
      };
      
      console.log(`📋 DEBUG: Found ${files.length} files in adventures directory:`, files);
    } else {
      debugInfo.checks.adventureFiles = {
        error: 'Adventures directory does not exist'
      };
    }

    // 3. Test loading each adventure file
    debugInfo.checks.fileValidation = {};
    
    if (fs.existsSync(adventuresDir)) {
      const jsonFiles = fs.readdirSync(adventuresDir).filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(adventuresDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          
          debugInfo.checks.fileValidation[file] = {
            status: 'valid',
            hasName: !!parsed.name,
            hasCity: !!parsed.city,
            hasActivity: !!parsed.activity,
            hasSchedule: !!parsed.schedule,
            scheduleLength: parsed.schedule?.length || 0,
            structure: {
              name: parsed.name,
              city: parsed.city,
              activity: parsed.activity,
              scheduleItems: parsed.schedule?.length || 0
            }
          };
          
          console.log(`✅ DEBUG: ${file} is valid with ${parsed.schedule?.length || 0} schedule items`);
        } catch (error) {
          debugInfo.checks.fileValidation[file] = {
            status: 'invalid',
            error: error.message
          };
          console.error(`❌ DEBUG: ${file} is invalid:`, error.message);
        }
      }
    }

    // 4. Check sample queries mapping
    const sampleQueriesPath = path.join(dataDir, 'sample-queries.json');
    debugInfo.checks.sampleQueries = {
      exists: fs.existsSync(sampleQueriesPath)
    };
    
    if (fs.existsSync(sampleQueriesPath)) {
      try {
        const content = fs.readFileSync(sampleQueriesPath, 'utf8');
        const queries = JSON.parse(content);
        
        debugInfo.checks.sampleQueries.valid = true;
        debugInfo.checks.sampleQueries.count = queries.queries?.length || 0;
        debugInfo.checks.sampleQueries.mappings = {};
        
        // Check if each referenced adventure file exists
        if (queries.queries) {
          for (const query of queries.queries) {
            const adventureFile = query.adventure_file;
            const adventurePath = path.join(adventuresDir, adventureFile);
            
            debugInfo.checks.sampleQueries.mappings[adventureFile] = {
              exists: fs.existsSync(adventurePath),
              query: query.query
            };
          }
        }
        
        console.log(`📋 DEBUG: Sample queries file contains ${queries.queries?.length || 0} mappings`);
      } catch (error) {
        debugInfo.checks.sampleQueries.valid = false;
        debugInfo.checks.sampleQueries.error = error.message;
        console.error('❌ DEBUG: Sample queries file is invalid:', error.message);
      }
    }

    // 5. Test AI recommendations file
    const aiRecommendationsPath = path.join(dataDir, 'ai-sample-adventures.json');
    debugInfo.checks.aiRecommendations = {
      exists: fs.existsSync(aiRecommendationsPath)
    };
    
    if (fs.existsSync(aiRecommendationsPath)) {
      try {
        const content = fs.readFileSync(aiRecommendationsPath, 'utf8');
        const recommendations = JSON.parse(content);
        
        debugInfo.checks.aiRecommendations.valid = true;
        debugInfo.checks.aiRecommendations.count = recommendations.recommendations?.length || 0;
        debugInfo.checks.aiRecommendations.searchQueries = recommendations.recommendations?.map((r: any) => ({
          title: r.title,
          searchQuery: r.searchQuery
        })) || [];
        
        console.log(`🤖 DEBUG: AI recommendations file contains ${recommendations.recommendations?.length || 0} recommendations`);
      } catch (error) {
        debugInfo.checks.aiRecommendations.valid = false;
        debugInfo.checks.aiRecommendations.error = error.message;
        console.error('❌ DEBUG: AI recommendations file is invalid:', error.message);
      }
    }

    // 6. Test specific adventure loading scenarios
    debugInfo.checks.testScenarios = {};
    
    const testCases = [
      { input: 'hiking near Madison', expectedFile: 'avon-colorado.json' },
      { input: 'utah desert adventure', expectedFile: 'moab-utah.json' },
      { input: 'Moab red rocks', expectedFile: 'moab-utah.json' },
      { input: 'Colorado mountains', expectedFile: 'avon-colorado.json' },
      { input: 'Glacier National Park', expectedFile: 'glacier-montana.json' }
    ];
    
    for (const testCase of testCases) {
      try {
        // Simulate the pocPlan API logic
        const result = await simulatePocPlanLogic(testCase.input, adventuresDir, sampleQueriesPath);
        
        debugInfo.checks.testScenarios[testCase.input] = {
          expectedFile: testCase.expectedFile,
          actualFile: result.selectedFile,
          matches: result.selectedFile === testCase.expectedFile,
          adventure: result.adventure ? {
            name: result.adventure.name,
            city: result.adventure.city,
            activity: result.adventure.activity
          } : null,
          method: result.method
        };
        
        console.log(`🧪 DEBUG: Test "${testCase.input}" -> ${result.selectedFile} (expected: ${testCase.expectedFile})`);
      } catch (error) {
        debugInfo.checks.testScenarios[testCase.input] = {
          error: error.message
        };
        console.error(`❌ DEBUG: Test case failed for "${testCase.input}":`, error.message);
      }
    }

    console.log('✅ DEBUG: Adventure debug completed successfully');
    
    return new Response(
      JSON.stringify(debugInfo, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('❌ DEBUG: Adventure debug endpoint failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Debug endpoint failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

async function simulatePocPlanLogic(userInput: string, adventuresDir: string, sampleQueriesPath: string) {
  const fs = await import('fs');
  const path = await import('path');
  
  let selectedAdventure = null;
  let selectedFile = null;
  let method = 'none';

  console.log(`🔍 SIMULATE: Testing input "${userInput}"`);

  // CRITICAL: Check for Utah first
  const input = userInput.toLowerCase();
  if (input.includes('utah') || input.includes('moab')) {
    try {
      const adventurePath = path.join(adventuresDir, 'moab-utah.json');
      if (fs.existsSync(adventurePath)) {
        selectedAdventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
        selectedFile = 'moab-utah.json';
        method = 'utah-priority';
        console.log('🎯 SIMULATE: Utah priority match - moab-utah.json');
      }
    } catch (error) {
      console.error('❌ SIMULATE: Error loading Utah adventure file', error);
    }
  }

  // Try sample queries matching if not Utah
  if (!selectedAdventure && fs.existsSync(sampleQueriesPath)) {
    try {
      const sampleQueries = JSON.parse(fs.readFileSync(sampleQueriesPath, 'utf8'));
      
      for (const queryData of sampleQueries.queries) {
        const queryWords = queryData.query.toLowerCase().split(' ');
        const inputWords = input.split(' ');
        
        const matches = queryWords.filter(word => 
          inputWords.some(inputWord => 
            inputWord.includes(word) || word.includes(inputWord)
          )
        );
        
        if (matches.length >= 2) {
          try {
            const adventurePath = path.join(adventuresDir, queryData.adventure_file);
            if (fs.existsSync(adventurePath)) {
              selectedAdventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
              selectedFile = queryData.adventure_file;
              method = 'query-matching';
              console.log(`✅ SIMULATE: Query match - ${queryData.adventure_file}`);
              break;
            }
          } catch (error) {
            console.error(`❌ SIMULATE: Error loading adventure file: ${queryData.adventure_file}`, error);
            continue;
          }
        }
      }
    } catch (error) {
      console.error('❌ SIMULATE: Error reading sample queries', error);
    }
  }

  // Location-based matching fallback
  if (!selectedAdventure && fs.existsSync(adventuresDir)) {
    const adventureFiles = fs.readdirSync(adventuresDir);
    
    for (const file of adventureFiles) {
      try {
        const adventurePath = path.join(adventuresDir, file);
        const adventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
        
        const cityMatch = input.includes(adventure.city.toLowerCase().split(',')[0].toLowerCase());
        const activityMatch = input.includes(adventure.activity.toLowerCase());
        const nameMatch = adventure.name.toLowerCase().includes(input) || 
                         input.includes(adventure.name.toLowerCase().split(' ')[0]);
        
        if (cityMatch || activityMatch || nameMatch) {
          selectedAdventure = adventure;
          selectedFile = file;
          method = 'location-matching';
          console.log(`✅ SIMULATE: Location match - ${file}`);
          break;
        }
      } catch (error) {
        console.error(`❌ SIMULATE: Error loading adventure file: ${file}`, error);
        continue;
      }
    }
  }

  // Final fallback
  if (!selectedAdventure) {
    try {
      const adventurePath = path.join(adventuresDir, 'avon-colorado.json');
      if (fs.existsSync(adventurePath)) {
        selectedAdventure = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
        selectedFile = 'avon-colorado.json';
        method = 'fallback';
        console.log('✅ SIMULATE: Fallback - avon-colorado.json');
      }
    } catch (error) {
      console.error('❌ SIMULATE: Error loading fallback adventure', error);
    }
  }

  return {
    selectedFile,
    adventure: selectedAdventure,
    method
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}