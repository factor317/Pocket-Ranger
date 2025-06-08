/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import ExploreScreen from '../../app/(tabs)/index';

// Mock the API response
const mockSuccessResponse = {
  name: "Devil's Lake State Park - 3 Day Adventure",
  activity: "hiking",
  city: "Baraboo, WI",
  description: "Experience Wisconsin's most popular state park with stunning bluffs and trails.",
  schedule: [
    {
      time: "8:00 AM",
      activity: "East Bluff Trail Hike",
      location: "Devil's Lake State Park",
      partnerLink: "https://www.alltrails.com/trail/us/wisconsin/devils-lake-east-bluff-trail",
      partnerName: "AllTrails"
    },
    {
      time: "12:00 PM",
      activity: "Lunch at Dells",
      location: "Wisconsin Dells",
      partnerLink: "https://www.opentable.com/wisconsin-dells-restaurants",
      partnerName: "OpenTable"
    }
  ]
};

describe('ExploreScreen', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders correctly with initial state', () => {
    render(<ExploreScreen />);
    
    expect(screen.getByText('Pocket Ranger')).toBeTruthy();
    expect(screen.getByText('Your outdoor adventure companion')).toBeTruthy();
    expect(screen.getByPlaceholderText(/What's your next adventure/)).toBeTruthy();
    expect(screen.getByText('Find Adventure')).toBeTruthy();
  });

  test('shows alert when searching with empty input', () => {
    const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
    
    render(<ExploreScreen />);
    
    const searchButton = screen.getByText('Find Adventure');
    fireEvent.press(searchButton);
    
    expect(mockAlert).toHaveBeenCalledWith(
      'Input Required',
      'Please enter your activity preference'
    );
  });

  test('handles successful API response', async () => {
    mockFetch(mockSuccessResponse);
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Planning...')).toBeTruthy();
    });
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText("Devil's Lake State Park - 3 Day Adventure")).toBeTruthy();
    });
    
    expect(screen.getByText('Baraboo, WI')).toBeTruthy();
    expect(screen.getByText(/Experience Wisconsin's most popular state park/)).toBeTruthy();
    expect(screen.getByText('Your Itinerary')).toBeTruthy();
    expect(screen.getByText('East Bluff Trail Hike')).toBeTruthy();
    expect(screen.getByText('8:00 AM')).toBeTruthy();
  });

  test('handles API error gracefully', async () => {
    const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Failed to get recommendation. Please try again.'
      );
    });
  });

  test('handles non-200 response status', async () => {
    const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    });
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Failed to get recommendation. Please try again.'
      );
    });
  });

  test('displays partner links correctly', async () => {
    mockFetch(mockSuccessResponse);
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('View on AllTrails')).toBeTruthy();
      expect(screen.getByText('View on OpenTable')).toBeTruthy();
    });
  });

  test('handles partner link press', async () => {
    const mockCanOpenURL = jest.spyOn(require('react-native').Linking, 'canOpenURL');
    const mockOpenURL = jest.spyOn(require('react-native').Linking, 'openURL');
    
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue();
    mockFetch(mockSuccessResponse);
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('View on AllTrails')).toBeTruthy();
    });
    
    const partnerLink = screen.getByText('View on AllTrails');
    fireEvent.press(partnerLink);
    
    await waitFor(() => {
      expect(mockCanOpenURL).toHaveBeenCalledWith(
        'https://www.alltrails.com/trail/us/wisconsin/devils-lake-east-bluff-trail'
      );
      expect(mockOpenURL).toHaveBeenCalledWith(
        'https://www.alltrails.com/trail/us/wisconsin/devils-lake-east-bluff-trail'
      );
    });
  });

  test('handles unsupported partner link', async () => {
    const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
    const mockCanOpenURL = jest.spyOn(require('react-native').Linking, 'canOpenURL');
    
    mockCanOpenURL.mockResolvedValue(false);
    mockFetch(mockSuccessResponse);
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('View on AllTrails')).toBeTruthy();
    });
    
    const partnerLink = screen.getByText('View on AllTrails');
    fireEvent.press(partnerLink);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Unable to open link');
    });
  });

  test('button is disabled during loading', async () => {
    // Mock a slow response
    fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockSuccessResponse
        }), 100)
      )
    );
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    // Button should show loading state
    expect(screen.getByText('Planning...')).toBeTruthy();
    
    // Try to press button again - should not trigger another request
    fireEvent.press(searchButton);
    
    // Should still be in loading state
    expect(screen.getByText('Planning...')).toBeTruthy();
  });

  test('input text updates correctly', () => {
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    
    fireEvent.changeText(input, 'hiking near Madison');
    
    expect(input.props.value).toBe('hiking near Madison');
  });

  test('clears recommendation when new search is performed', async () => {
    mockFetch(mockSuccessResponse);
    
    render(<ExploreScreen />);
    
    const input = screen.getByPlaceholderText(/What's your next adventure/);
    const searchButton = screen.getByText('Find Adventure');
    
    // First search
    fireEvent.changeText(input, 'hiking near Madison');
    fireEvent.press(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText("Devil's Lake State Park - 3 Day Adventure")).toBeTruthy();
    });
    
    // Second search
    mockFetch({
      name: "Different Location",
      activity: "fishing",
      city: "Different City, WI",
      description: "Different description",
      schedule: []
    });
    
    fireEvent.changeText(input, 'fishing trip');
    fireEvent.press(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText("Different Location")).toBeTruthy();
    });
    
    // Old recommendation should be gone
    expect(screen.queryByText("Devil's Lake State Park - 3 Day Adventure")).toBeFalsy();
  });
});