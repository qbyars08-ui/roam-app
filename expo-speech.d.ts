declare module 'expo-speech' {
  export function speak(
    text: string,
    options?: { language?: string; rate?: number }
  ): void;
  export function stop(): void;
}
