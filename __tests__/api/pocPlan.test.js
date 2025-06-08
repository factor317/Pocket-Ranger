/**
 * @jest-environment jsdom
 */

import { POST, OPTIONS } from '../../app/api/pocPlan+api';

describe('POC Plan API', () => {
  describe('POST /api/pocPlan', () => {
    test('should return hiking recommendation for Madison input', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'hiking near Madison' })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('activity');
      expect(data).toHaveProperty('city');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('schedule');
      expect(Array.isArray(data.schedule)).toBe(true);
      expect(data.activity).toBe('hiking');
      expect(data.city).toContain('Madison');
    });

    test('should return fishing recommendation for fishing input', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'fishing at a lake' })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.activity).toBe('fishing');
      expect(data.schedule.length).toBeGreaterThan(0);
    });

    test('should return exploration recommendation for Milwaukee input', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'explore Milwaukee' })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.activity).toBe('exploration');
      expect(data.city).toContain('Milwaukee');
    });

    test('should return default recommendation for unmatched input', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'random unmatched activity' })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('activity');
      expect(data).toHaveProperty('schedule');
    });

    test('should return error for empty input', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: '' })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Invalid input provided');
    });

    test('should return error for missing userInput field', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should return error for non-string userInput', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 123 })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should validate schedule item structure', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'hiking near Madison' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.schedule.length).toBeGreaterThan(0);
      
      data.schedule.forEach(item => {
        expect(item).toHaveProperty('time');
        expect(item).toHaveProperty('activity');
        expect(item).toHaveProperty('location');
        expect(typeof item.time).toBe('string');
        expect(typeof item.activity).toBe('string');
        expect(typeof item.location).toBe('string');
        
        // Optional properties
        if (item.partnerLink) {
          expect(typeof item.partnerLink).toBe('string');
          expect(item.partnerLink).toMatch(/^https?:\/\//);
        }
        if (item.partnerName) {
          expect(typeof item.partnerName).toBe('string');
        }
      });
    });

    test('should include proper CORS headers', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'hiking' })
      });

      const response = await POST(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });

    test('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('OPTIONS /api/pocPlan', () => {
    test('should handle CORS preflight request', async () => {
      const response = await OPTIONS();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('Location Database', () => {
    test('should have consistent location data structure', async () => {
      const inputs = [
        'hiking near Madison',
        'fishing at a lake',
        'explore Milwaukee',
        'Door County adventure',
        'Devil\'s Lake hiking'
      ];

      for (const input of inputs) {
        const request = new Request('http://localhost:8081/api/pocPlan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: input })
        });

        const response = await POST(request);
        const data = await response.json();

        // Validate required fields
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('activity');
        expect(data).toHaveProperty('city');
        expect(data).toHaveProperty('description');
        expect(data).toHaveProperty('schedule');

        // Validate data types
        expect(typeof data.name).toBe('string');
        expect(typeof data.activity).toBe('string');
        expect(typeof data.city).toBe('string');
        expect(typeof data.description).toBe('string');
        expect(Array.isArray(data.schedule)).toBe(true);

        // Validate activity types
        expect(['hiking', 'fishing', 'exploration', 'dining', 'social']).toContain(data.activity);

        // Validate city format (should contain state)
        expect(data.city).toMatch(/,\s*WI$/);
      }
    });

    test('should have partner links in appropriate schedule items', async () => {
      const request = new Request('http://localhost:8081/api/pocPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'hiking near Madison' })
      });

      const response = await POST(request);
      const data = await response.json();

      const itemsWithPartnerLinks = data.schedule.filter(item => item.partnerLink);
      expect(itemsWithPartnerLinks.length).toBeGreaterThan(0);

      itemsWithPartnerLinks.forEach(item => {
        expect(item.partnerLink).toMatch(/^https?:\/\//);
        expect(item.partnerName).toBeTruthy();
        
        // Check for known partner domains
        const knownPartners = ['alltrails.com', 'opentable.com'];
        const hasKnownPartner = knownPartners.some(partner => 
          item.partnerLink.includes(partner)
        );
        expect(hasKnownPartner).toBe(true);
      });
    });
  });

  describe('Keyword Matching Logic', () => {
    test('should prioritize activity keywords', async () => {
      const testCases = [
        { input: 'hiking adventure', expectedActivity: 'hiking' },
        { input: 'fishing trip', expectedActivity: 'fishing' },
        { input: 'exploration day', expectedActivity: 'exploration' }
      ];

      for (const testCase of testCases) {
        const request = new Request('http://localhost:8081/api/pocPlan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: testCase.input })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.activity).toBe(testCase.expectedActivity);
      }
    });

    test('should match city names', async () => {
      const testCases = [
        { input: 'activities in Madison', expectedCity: 'Madison' },
        { input: 'Milwaukee exploration', expectedCity: 'Milwaukee' },
        { input: 'Baraboo hiking', expectedCity: 'Baraboo' }
      ];

      for (const testCase of testCases) {
        const request = new Request('http://localhost:8081/api/pocPlan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: testCase.input })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.city).toContain(testCase.expectedCity);
      }
    });

    test('should be case insensitive', async () => {
      const testCases = [
        'HIKING NEAR MADISON',
        'hiking near madison',
        'Hiking Near Madison',
        'HiKiNg NeAr MaDiSoN'
      ];

      for (const input of testCases) {
        const request = new Request('http://localhost:8081/api/pocPlan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: input })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.activity).toBe('hiking');
        expect(data.city).toContain('Madison');
      }
    });
  });
});