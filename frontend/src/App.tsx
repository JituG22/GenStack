import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProjectsPage, AnalyticsPage } from "./pages";

// Components
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Providers
import { AuthProvider } from "./contexts/AuthContext";
import { NodeProvider } from "./contexts/NodeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <NodeProvider>
          <Router>
            <div className="min-h-screen bg-gray-100">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/templates"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <div className="p-6">
                          <h1 className="text-2xl font-bold text-gray-900">
                            Templates
                          </h1>
                          <p className="text-gray-600">
                            Templates page coming soon...
                          </p>
                        </div>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProjectsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AnalyticsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </NodeProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
