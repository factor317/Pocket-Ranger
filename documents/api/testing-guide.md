# API Testing Guide - Pocket Ranger

## Overview

This guide provides comprehensive instructions for testing the Pocket Ranger API endpoints, including manual testing, automated testing, and integration testing strategies.

## API Endpoint Testing

### POC Planning Endpoint

**Endpoint**: `POST /api/pocPlan`  
**Purpose**: Get activity recommendations based on user input

#### Test Cases

##### 1. Valid Hiking Request
```bash
curl -X POST http://localhost:8081/api/pocPlan \
  -H "Content-Type: application/json" \
  -d '{"userInput": "hiking near Madison"}'
```

**Expected Response**:
```json
{
  "name": "Capital Springs Recreation Area",
  "activity": "hiking",
  "city": "Madison, WI",
  "description": "Explore diverse prairie and forest trails...",
  "schedule": [
    {
      "time": "9:00 AM",
      "activity": "Prairie Trail Hike",
      "location": "Capital Springs Recreation Area",
      "partnerLink": "https://www.alltrails.com/...",
      "partnerName": "AllTrails"
    }
  ]
}
```

##### 2. Valid Fishing Request
```bash
curl -X POST http://localhost:8081/api/pocPlan \
  -H "Content-Type: application/json" \
  -d '{"userInput": "fishing at a lake"}'
```

##### 3. City Exploration Request
```bash
curl -X POST http://localhost:8081/api/pocPlan \
  -H "Content-Type: application/json" \
  -d '{"userInput": "explore Milwaukee"}'
```

##### 4. Invalid Request - Empty Input
```bash
curl -X POST http://localhost:8081/api/pocPlan \
  -H "Content-Type: application/json" \
  -d '{"userInput": ""}'
```

**Expected Response**:
```json
{
  "error": "Invalid input provided"
}
```

##### 5. Invalid Request - Missing Field
```bash
curl -X POST http://localhost:8081/api/pocPlan \
  -H "Content-Type: application/json" \
  -d '{}'
```

##### 6. CORS Preflight Request
```bash
curl -X OPTIONS http://localhost:8081/api/pocPlan \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## Automated Testing

### Jest Test Suite

Create test files in `__tests__/api/` directory:

#### API Endpoint Tests

```javascript
// __tests__/api/pocPlan.test.js
describe('POC Plan API', () => {
  const API_URL = 'http://localhost:8081/api/pocPlan';

  test('should return hiking recommendation for Madison', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: 'hiking near Madison' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('activity');
    expect(data).toHaveProperty('schedule');
    expect(data.activity).toBe('hiking');
  });

  test('should return error for empty input', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: '' })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle CORS preflight', async () => {
    const response = await fetch(API_URL, {
      method: 'OPTIONS'
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- __tests__/api/pocPlan.test.js
```

## Performance Testing

### Load Testing with Artillery

Create `artillery-config.yml`:

```yaml
config:
  target: 'http://localhost:8081'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: 'POC Plan API Test'
    weight: 100
    requests:
      - post:
          url: '/api/pocPlan'
          json:
            userInput: 'hiking near Madison'
```

Run load tests:
```bash
npx artillery run artillery-config.yml
```

### Stress Testing

```bash
# Test with increasing load
for i in {1..100}; do
  curl -X POST http://localhost:8081/api/pocPlan \
    -H "Content-Type: application/json" \
    -d '{"userInput": "hiking test '$i'"}' &
done
```

## Integration Testing

### End-to-End Mobile App Testing

```javascript
// __tests__/integration/app-integration.test.js
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ExploreScreen from '../../app/(tabs)/index';

// Mock fetch for testing
global.fetch = jest.fn();

describe('App Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should handle successful API response', async () => {
    const mockResponse = {
      name: 'Test Location',
      activity: 'hiking',
      city: 'Test City',
      description: 'Test description',
      schedule: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { getByPlaceholderText, getByText } = render(<ExploreScreen />);
    
    const input = getByPlaceholderText(/What's your next adventure/);
    const button = getByText('Find Adventure');

    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('Test Location')).toBeTruthy();
    });
  });

  test('should handle API error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByPlaceholderText, getByText } = render(<ExploreScreen />);
    
    const input = getByPlaceholderText(/What's your next adventure/);
    const button = getByText('Find Adventure');

    fireEvent.changeText(input, 'test input');
    fireEvent.press(button);

    // Test would verify error handling UI
  });
});
```

## API Response Validation

### Schema Validation Tests

```javascript
// __tests__/api/schema-validation.test.js
const Ajv = require('ajv');

const locationSchema = {
  type: 'object',
  required: ['name', 'activity', 'city', 'description', 'schedule'],
  properties: {
    name: { type: 'string' },
    activity: { type: 'string', enum: ['hiking', 'fishing', 'exploration', 'dining', 'social'] },
    city: { type: 'string' },
    description: { type: 'string' },
    schedule: {
      type: 'array',
      items: {
        type: 'object',
        required: ['time', 'activity', 'location'],
        properties: {
          time: { type: 'string' },
          activity: { type: 'string' },
          location: { type: 'string' },
          partnerLink: { type: 'string', format: 'uri' },
          partnerName: { type: 'string' }
        }
      }
    }
  }
};

describe('API Response Schema Validation', () => {
  const ajv = new Ajv();
  const validate = ajv.compile(locationSchema);

  test('should validate hiking response schema', async () => {
    const response = await fetch('/api/pocPlan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: 'hiking near Madison' })
    });

    const data = await response.json();
    const valid = validate(data);
    
    expect(valid).toBe(true);
    if (!valid) {
      console.log(validate.errors);
    }
  });
});
```

## Monitoring and Debugging

### API Logging

Add logging middleware to track API usage:

```javascript
// middleware/apiLogger.js
export function logApiRequest(req, endpoint) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${endpoint}`, {
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || 'localhost',
    body: req.method === 'POST' ? req.body : null
  });
}
```

### Health Check Endpoint

```javascript
// app/api/health+api.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}
```

## Testing Checklist

### Before Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] API response schemas validated
- [ ] CORS headers properly configured
- [ ] Error handling tested
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities scanned
- [ ] Documentation updated

### Continuous Testing

- [ ] Automated test pipeline configured
- [ ] Staging environment tests
- [ ] Production health checks
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Error rate monitoring

## Troubleshooting Common Issues

### API Not Responding
1. Check development server is running
2. Verify correct port (8081)
3. Check firewall settings
4. Review server logs

### CORS Errors
1. Verify OPTIONS handler implemented
2. Check Access-Control headers
3. Confirm origin whitelist

### Response Schema Errors
1. Validate JSON structure
2. Check required fields
3. Verify data types
4. Review OpenAPI specification

### Performance Issues
1. Monitor response times
2. Check for memory leaks
3. Review database queries
4. Optimize payload sizes

For additional support, refer to the [Architecture Documentation](../architecture/system-overview.md) or create an issue in the project repository.