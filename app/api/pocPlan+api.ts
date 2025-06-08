export async function POST(request: Request) {
  try {
    const { userInput } = await request.json();

    if (!userInput || typeof userInput !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mock locations database
    const locations = [
      {
        name: "Devil's Lake State Park - 3 Day Adventure",
        activity: "hiking",
        city: "Baraboo, WI",
        description: "Experience Wisconsin's most popular state park with stunning bluffs, crystal-clear lake, and challenging hiking trails perfect for a weekend getaway.",
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
          },
          {
            time: "2:30 PM",
            activity: "West Bluff Trail",
            location: "Devil's Lake State Park",
            partnerLink: "https://www.alltrails.com/trail/us/wisconsin/devils-lake-west-bluff-trail",
            partnerName: "AllTrails"
          },
          {
            time: "5:00 PM",
            activity: "Sunset Viewing",
            location: "South Shore Beach",
          }
        ]
      },
      {
        name: "Capital Springs Recreation Area",
        activity: "hiking",
        city: "Madison, WI",
        description: "Explore diverse prairie and forest trails with scenic views and wildlife observation opportunities just minutes from Madison.",
        schedule: [
          {
            time: "9:00 AM",
            activity: "Prairie Trail Hike",
            location: "Capital Springs Recreation Area",
            partnerLink: "https://www.alltrails.com/trail/us/wisconsin/capital-springs-recreation-area-trail",
            partnerName: "AllTrails"
          },
          {
            time: "11:30 AM",
            activity: "Wildlife Observation",
            location: "Prairie Overlook",
          },
          {
            time: "1:00 PM",
            activity: "Lunch in Madison",
            location: "State Street",
            partnerLink: "https://www.opentable.com/madison-restaurants",
            partnerName: "OpenTable"
          }
        ]
      },
      {
        name: "Governor Nelson State Park",
        activity: "fishing",
        city: "Waunakee, WI",
        description: "Enjoy excellent shoreline fishing on Lake Mendota with beautiful prairie restoration and peaceful hiking trails.",
        schedule: [
          {
            time: "6:00 AM",
            activity: "Morning Fishing",
            location: "Lake Mendota Shore",
          },
          {
            time: "10:00 AM",
            activity: "Prairie Walk",
            location: "Governor Nelson State Park",
            partnerLink: "https://www.alltrails.com/trail/us/wisconsin/governor-nelson-state-park-trail",
            partnerName: "AllTrails"
          },
          {
            time: "12:30 PM",
            activity: "Picnic Lunch",
            location: "Park Shelter",
          },
          {
            time: "2:00 PM",
            activity: "Afternoon Fishing",
            location: "Lake Mendota Shore",
          }
        ]
      },
      {
        name: "Milwaukee Riverwalk Exploration",
        activity: "exploration",
        city: "Milwaukee, WI",
        description: "Discover Milwaukee's vibrant downtown through the scenic Riverwalk, featuring breweries, restaurants, and cultural attractions.",
        schedule: [
          {
            time: "10:00 AM",
            activity: "Historic Third Ward",
            location: "Milwaukee Riverwalk",
          },
          {
            time: "12:00 PM",
            activity: "Brewery Lunch",
            location: "Lakefront Brewery",
            partnerLink: "https://www.opentable.com/milwaukee-restaurants",
            partnerName: "OpenTable"
          },
          {
            time: "2:30 PM",
            activity: "Milwaukee Art Museum",
            location: "Lakefront",
          },
          {
            time: "4:00 PM",
            activity: "Riverside Walk",
            location: "Milwaukee River",
          }
        ]
      },
      {
        name: "Door County Coastal Adventure",
        activity: "exploration",
        city: "Door County, WI",
        description: "Experience Wisconsin's scenic peninsula with charming coastal towns, lighthouse tours, and waterfront dining.",
        schedule: [
          {
            time: "9:00 AM",
            activity: "Lighthouse Tour",
            location: "Cana Island Lighthouse",
          },
          {
            time: "11:30 AM",
            activity: "Coastal Hike",
            location: "Newport State Park",
            partnerLink: "https://www.alltrails.com/trail/us/wisconsin/newport-state-park-europe-bay-trail",
            partnerName: "AllTrails"
          },
          {
            time: "1:00 PM",
            activity: "Waterfront Dining",
            location: "Fish Creek",
            partnerLink: "https://www.opentable.com/door-county-restaurants",
            partnerName: "OpenTable"
          },
          {
            time: "3:30 PM",
            activity: "Art Galleries",
            location: "Ephraim",
          }
        ]
      }
    ];

    // Simple keyword matching logic
    const input = userInput.toLowerCase();
    let selectedLocation = null;

    // Priority matching: specific activities first, then locations
    for (const location of locations) {
      const activityMatch = input.includes(location.activity.toLowerCase());
      const cityMatch = input.includes(location.city.toLowerCase().split(',')[0]);
      const nameMatch = location.name.toLowerCase().includes(input) || 
                       input.includes(location.name.toLowerCase().split(' ')[0]);
      
      if (activityMatch || cityMatch || nameMatch) {
        selectedLocation = location;
        break;
      }
    }

    // Fallback to first location if no match found
    if (!selectedLocation) {
      selectedLocation = locations[0];
    }

    return new Response(
      JSON.stringify(selectedLocation),
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
    console.error('API Error:', error);
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