import UserProvider from "@/shared/context/UserContext";
import { VerificationProvider } from "@/shared/context/VerificationContext";
import AppRoutes from "./routes";
import AppShell from "./AppShell";

const App = () => {
  return (
    <UserProvider>
      <VerificationProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </VerificationProvider>
    </UserProvider>
  );
};

export default App;
