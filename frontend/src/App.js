import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SeekerHome from "./pages/seeker/SeekerHome";
import SeekerHomeLoggedIn from "./pages/seeker/SeekerHomeLoggedIn";
import SeekerSavedJobsPage from "./pages/seeker/SeekerSavedJobsPage";
import UserProfile from "./pages/seeker/UserProfile";
import JobDetailPage from "./pages/seeker/JobDetailPage";
import EmployerHome from "./pages/employer/EmployerHome";
import LoginSeeker from "./pages/seeker/LoginSeeker";
import RegisterSeeker from "./pages/seeker/RegisterSeeker";
import LoginEmployer from "./pages/employer/LoginEmployer";
import RegisterEmployer from "./pages/employer/RegisterEmployer";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerJobs from "./pages/employer/EmployerJobs";
import EmployerCreatePost from "./pages/employer/EmployerCreatePost";
import EmployerCandidates from "./pages/employer/EmployerCandidates";
import EmployerAnalytics from "./pages/employer/EmployerAnalytics";
import EmployerSettings from "./pages/employer/EmployerSettings";
import SeekerCompanyLoggedIn from "./pages/seeker/SeekerCompanyLoggedIn";
import SeekerCompany from "./pages/seeker/SeekerCompany";
import SeekerCompanyDetail from "./pages/seeker/SeekerCompanyDetail";
import SeekerApplications from "./pages/seeker/SeekerApplications";
import SeekerAbout from "./pages/seeker/SeekerAbout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Guest Routes */}
        <Route path="/" element={<SeekerHome />} />
        <Route path="/employer" element={<EmployerHome />} />
        <Route path="/login-seeker" element={<LoginSeeker />} />
        <Route path="/register-seeker" element={<RegisterSeeker />} />
        <Route path="/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/company" element={<SeekerCompany />} />
        <Route path="/about" element={<SeekerAbout />} />
        <Route path="/login-employer" element={<LoginEmployer />} />
        <Route path="/employer/login" element={<LoginEmployer />} />
        <Route path="/register-employer" element={<RegisterEmployer />} />
        <Route path="/employer/register" element={<RegisterEmployer />} />

        {/* Seeker Routes */}
        <Route path="/seeker/home" element={<SeekerHomeLoggedIn />} />
        <Route path="/seeker/saved-jobs" element={<SeekerSavedJobsPage />} />
        <Route path="/seeker/profile" element={<UserProfile />} />
        <Route path="/seeker/profile/:tab" element={<UserProfile />} />
        <Route path="/seeker/company" element={<SeekerCompanyLoggedIn />} />
        <Route path="/seeker/company/:companyId" element={<SeekerCompanyDetail />} />
        <Route path="/seeker/applications" element={<SeekerApplications />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/jobs" element={<AdminJobs />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Employer Routes */}
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/jobs" element={<EmployerJobs />} />
        <Route path="/employer/post" element={<EmployerCreatePost />} />
        <Route path="/employer/candidates" element={<EmployerCandidates />} />
        <Route path="/employer/analytics" element={<EmployerAnalytics />} />
        <Route path="/employer/settings" element={<EmployerSettings />} />
      </Routes>
    </Router>
  );
}

export default App;