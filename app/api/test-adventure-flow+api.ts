export async function POST(request: Request) {
  try {
    const { testCase } = await request.json();
    
    console.log('🧪 TEST FLOW: Starting adventure flow test for:', testCase);
    
    const testResults: any = {
      testCase,
      timestamp: new Date().toISOString(),
      steps: {}
    };

    // Step 1: Test Groq Chat API
    console.log('🤖 TEST FLOW: Step 1 - Testing Groq Chat API');
    try {
      const groqResponse = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: testCase,
          conversationHistory: []
        })
      });
      
      const groqData = await groqResponse.json();
      
      testResults.steps.groqChat = {
        status: groqResponse.ok ? 'success' : 'error',
        statusCode: groqResponse.status,
        response: groqData.response,
        shouldSearch: groqData.shouldSearch,
        recommendedFile: groqData.recommendedFile,
        extractedInfo: groqData.extractedInfo
      };
      
      console.log('✅ TEST FLOW: Groq Chat API response:', {
        shouldSearch: groqData.shouldSearch,
        recommendedFile: groqData.recommendedFile
      });
      
      // Step 2: Test POC Plan API with recommended file
      if (groqData.shouldSearch) {
        console.log('🎯 TEST FLOW: Step 2 - Testing POC Plan API');
        
        const pocPlanResponse = await fetch('/api/pocPlan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userInput: testCase,
            recommendedFile: groqData.recommendedFile
          })
        });
        
        const pocPlanData = await pocPlanResponse.json();
        
        testResults.steps.pocPlan = {
          status: pocPlanResponse.ok ? 'success' : 'error',
          statusCode: pocPlanResponse.status,
          adventure: pocPlanData.error ? null : {
            name: pocPlanData.name,
            city: pocPlanData.city,
            activity: pocPlanData.activity,
            scheduleLength: pocPlanData.schedule?.length || 0
          },
          error: pocPlanData.error
        };
        
        console.log('✅ TEST FLOW: POC Plan API response:', {
          adventureName: pocPlanData.name,
          scheduleItems: pocPlanData.schedule?.length || 0
        });
        
        // Step 3: Validate adventure data structure
        if (!pocPlanData.error) {
          console.log('🔍 TEST FLOW: Step 3 - Validating adventure data structure');
          
          const validation = {
            hasName: !!pocPlanData.name,
            hasCity: !!pocPlanData.city,
            hasActivity: !!pocPlanData.activity,
            hasDescription: !!pocPlanData.description,
            hasSchedule: !!pocPlanData.schedule,
            scheduleIsArray: Array.isArray(pocPlanData.schedule),
            scheduleLength: pocPlanData.schedule?.length || 0,
            scheduleItemsValid: true
          };
          
          // Validate each schedule item
          if (pocPlanData.schedule && Array.isArray(pocPlanData.schedule)) {
            for (const item of pocPlanData.schedule) {
              if (!item.time || !item.activity || !item.location) {
                validation.scheduleItemsValid = false;
                break;
              }
            }
          }
          
          testResults.steps.validation = validation;
          
          const isValid = validation.hasName && validation.hasCity && 
                          validation.hasActivity && validation.hasSchedule && 
                          validation.scheduleIsArray && validation.scheduleItemsValid;
          
          testResults.steps.validation.overall = isValid ? 'valid' : 'invalid';
          
          console.log('✅ TEST FLOW: Adventure validation:', {
            overall: testResults.steps.validation.overall,
            scheduleItems: validation.scheduleLength
          });
        }
      }
      
    } catch (error) {
      testResults.steps.groqChat = {
        status: 'error',
        error: error.message
      };
      console.error('❌ TEST FLOW: Groq Chat API failed:', error);
    }

    // Overall test result
    const allStepsSuccessful = Object.values(testResults.steps).every((step: any) => 
      step.status === 'success' || step.overall === 'valid'
    );
    
    testResults.overall = {
      status: allStepsSuccessful ? 'success' : 'failure',
      message: allStepsSuccessful ? 
        'All steps completed successfully' : 
        'One or more steps failed'
    };
    
    console.log(`🎉 TEST FLOW: Overall result for "${testCase}": ${testResults.overall.status}`);
    
    return new Response(
      JSON.stringify(testResults, null, 2),
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
    console.error('❌ TEST FLOW: Test adventure flow failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Test flow failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
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