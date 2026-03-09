import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const Transactions = lazy(() => import("./pages/Transactions"));
const LoanCalculator = lazy(() => import("./pages/LoanCalculator"));
const Accounts = lazy(() => import("./pages/Accounts"));
const AccountDetail = lazy(() => import("./pages/AccountDetail"));
const Budget = lazy(() => import("./pages/Budget"));
const Insights = lazy(() => import("./pages/Insights"));
const Goals = lazy(() => import("./pages/Goals"));
const GoalDetail = lazy(() => import("./pages/GoalDetail"));
const Install = lazy(() => import("./pages/Install"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/loan-calculator" element={<LoanCalculator />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/accounts/:id" element={<AccountDetail />} />
                  <Route path="/budget" element={<Budget />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/goals/:id" element={<GoalDetail />} />
                  <Route path="/install" element={<Install />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
