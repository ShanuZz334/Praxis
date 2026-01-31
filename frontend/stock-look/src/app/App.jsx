import UserProvider from "@/shared/context/UserContext";
import { VerificationProvider } from "@/shared/context/VerificationContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import AppRoutes from "./routes";
import AppShell from "./AppShell";

const App = () => {
  return (
    <UserProvider>
      <VerificationProvider>
        <ThemeProvider>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </ThemeProvider>
      </VerificationProvider>
    </UserProvider>
  );
};

export default App;
