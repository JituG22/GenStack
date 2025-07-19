import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProjectsPage, AnalyticsPage, CollaborativeTestPage } from "./pages";
import TemplatesPage from "./pages/TemplatesPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import NodeDetailPage from "./pages/NodeDetailPage";
import TemplateDetailPage from "./pages/TemplateDetailPage";
import CollaborationDemo from "./pages/CollaborationDemo";
import MonitoringDemo from "./pages/MonitoringDemo";
import { GitHubConfigPage } from "./pages/GitHubConfigPage";
import IntegrationDemoPage from "./pages/IntegrationDemoPage";
import EnhancedProjectsPage from "./pages/EnhancedProjectsPage";

// Components
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import WebSocketTest from "./components/WebSocketTest";

// Providers
import { AuthProvider } from "./contexts/AuthContext";
import { NodeProvider } from "./contexts/NodeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { CollaborativeProvider } from "./contexts/CollaborativeContext";

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <CollaborativeProvider>
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
                  />{" "}
                  <Route
                    path="/templates"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <TemplatesPage />
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
                    path="/projects/new"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ProjectsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ProjectDetailPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/:id/edit"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ProjectsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nodes/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <NodeDetailPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nodes/:id/edit"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <TemplatesPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/templates/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <TemplateDetailPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/templates/:id/edit"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <TemplatesPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nodes/new"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <TemplatesPage />
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
                  <Route
                    path="/websocket-test"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <WebSocketTest />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/collaborative-test"
                    element={
                      <ProtectedRoute>
                        <CollaborativeTestPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/collaboration-demo"
                    element={
                      <ProtectedRoute>
                        <CollaborationDemo />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/monitoring-demo"
                    element={
                      <ProtectedRoute>
                        <MonitoringDemo />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/github-config"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <GitHubConfigPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/integration-demo"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <IntegrationDemoPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects-enhanced"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <EnhancedProjectsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </Router>
          </NodeProvider>
        </CollaborativeProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
