/**
 * @file App.jsx
 * @purpose Root application component that serves as the entry point for the React component tree.
 * @responsibilities
 * - Wraps the application with necessary context providers (auth, theme, verification).
 * - Houses the primary AppShell for layout consistency.
 * - Renders the root routing configuration.
 * @key_exports
 * - App (Default): Primary application container component.
 * @dependencies
 * - UserContext: Provides authentication and user session state.
 * - ThemeContext: Manages application-wide visual styling and theme switching.
 * - VerificationContext: Handles multi-factor and security verification states.
 * - AppRoutes: Defines the logical navigation map of the application.
 * - AppShell: Provides the base visual container for app content.
 * @lifecycle
 * - Initialized by main.jsx.
 * - Mounts providers which hydrate state from storage/API.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import UserProvider from "@/shared/context/UserContext";
import { VerificationProvider } from "@/shared/context/VerificationContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { DataRegistryProvider } from "@/shared/context/DataRegistryContext";
import { VoiceProvider } from "@/shared/context/VoiceContext";
import AppRoutes from "./routes";
import AppShell from "./AppShell";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/shared/context/NotificationContext";

// =============================
// Main Component
// =============================
const App = () => {
  return (
    <DataRegistryProvider>
      <NotificationProvider>
        <UserProvider>
          <VerificationProvider>
            <ThemeProvider>
              <VoiceProvider>
                <AppShell>
                  <AppRoutes />
                  <Toaster />
                </AppShell>
              </VoiceProvider>
            </ThemeProvider>
          </VerificationProvider>
        </UserProvider>
      </NotificationProvider>
    </DataRegistryProvider>
  );
};

// =============================
// Exports
// =============================
export default App;
