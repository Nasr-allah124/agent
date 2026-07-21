import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./auth/components/ProtectedRoute";
import InvoiceWorkspace from "./workspace/InvoiceWorkspace";
import HomeRoute from "./lib/HomeRoute";
import ResumeWorkspace from "./workspace/ResumeWorkspace";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />

      <Route path="/connexion" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      {/* <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      /> */}
      <Route
        path="/workspace/invoice"
        element={
          <ProtectedRoute>
            <InvoiceWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/resume"
        element={
          <ProtectedRoute>
            <ResumeWorkspace />
          </ProtectedRoute>
        }
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  );
}

export default App;
