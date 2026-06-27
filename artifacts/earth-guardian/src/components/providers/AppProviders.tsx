

import { CursorGlow } from "./CursorGlow";
import { LoadingScreen } from "./LoadingScreen";
import { SmoothScrollProvider } from "./SmoothScrollProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <LoadingScreen />
      <CursorGlow />
      {children}
    </SmoothScrollProvider>
  );
}
