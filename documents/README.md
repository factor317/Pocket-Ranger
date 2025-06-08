# Pocket Ranger - Outdoor Adventure Planning POC

## Overview

Pocket Ranger is a mobile application designed to help users plan outdoor activities and adventures. This POC demonstrates the core functionality of taking user input, processing it through a mock AI service, and returning personalized location recommendations with detailed itineraries.

## Features

- **Activity Planning**: Users can input their desired activities in natural language
- **Mock AI Service**: Simulates intelligent location recommendations based on user input
- **Detailed Itineraries**: Provides scheduled activities with partner integration links
- **Partner Integration**: Links to AllTrails, OpenTable, and other relevant services
- **Responsive Design**: Optimized for mobile devices with modern UI/UX
- **Optional Authentication**: Supports both authenticated and guest usage

## Technology Stack

### Mobile Application
- **Framework**: React Native with Expo
- **Navigation**: Expo Router with tab-based navigation
- **Styling**: StyleSheet with custom color palette
- **Icons**: Lucide React Native
- **Animations**: React Native Reanimated
- **Fonts**: Inter from Google Fonts

### Backend API
- **Runtime**: Node.js with Expo Router API routes
- **API**: RESTful JSON API with OpenAPI documentation
- **Authentication**: Firebase (configured but optional)
- **Database**: Hardcoded mock data for POC

### Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes manifests
- **Cloud Platforms**: Support for GCP, AWS, Azure, IBM Cloud

## Project Structure

```
pocket-ranger-app/
├── app/                    # Expo Router pages and API routes
│   ├── (tabs)/            # Tab navigation screens
│   ├── api/               # API endpoints
│   └── _layout.tsx        # Root layout
├── components/            # Reusable React components
├── documents/             # Project documentation
│   ├── architecture/      # Architecture diagrams and docs
│   ├── api/              # API documentation
│   └── guides/           # Setup and deployment guides
├── assets/               # Static assets (images, fonts)
├── docker/               # Docker configuration files
├── k8s/                  # Kubernetes manifests
└── scripts/              # Build and deployment scripts
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI
- Docker (for containerized deployment)
- kubectl (for Kubernetes deployment)

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser or Mobile Device**
   - Web: http://localhost:8081
   - Mobile: Scan QR code with Expo Go app

### API Testing

The POC includes a mock API endpoint at `/api/pocPlan` that accepts POST requests:

```javascript
// Example request
fetch('/api/pocPlan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userInput: 'hiking near Madison' })
})
```

## Color Palette

The application uses an outdoor-inspired color scheme:
- **Primary Green**: #6B8E23 (OliveDrab)
- **Light Green**: #BFD3C1 (Sage)
- **Warm Beige**: #E7C9A1 (Wheat)
- **Soft Pink**: #D4A5A5 (RosyBrown)
- **Cream**: #F6F2D7 (Cornsilk)

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Docker
```bash
npm run build:docker
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

For detailed deployment instructions, see:
- [Docker Deployment Guide](./documents/guides/docker-deployment.md)
- [Kubernetes Deployment Guide](./documents/guides/k8s-deployment.md)
- [Cloud Platform Guides](./documents/guides/cloud-deployment.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support, please refer to the documentation in the `documents/` directory or create an issue in the project repository.