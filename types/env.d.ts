declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      GROQ_API_KEY: string;
      BORGCLOUD_API_KEY: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};