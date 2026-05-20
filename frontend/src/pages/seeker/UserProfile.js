import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopNavBar from '../../components/SeekerTopNavBar';
import SideNavBar from '../../components/SeekerSideNavBar';
import PersonalInfo from '../../components/profile/PersonalInfo';
import Experience from '../../components/profile/Experience';
import Projects from '../../components/profile/Projects';
import Settings from '../../components/profile/Settings';

const UserProfile = () => {
  const navigate = useNavigate();
  const { tab = 'personal' } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }
    setIsLoggedIn(true);
  }, [navigate]);

  const renderTabContent = () => {
    switch (tab) {
      case 'personal':
        return <PersonalInfo />;
      case 'experience':
        return <Experience />;
      case 'projects':
        return <Projects />;
      case 'settings':
        return <Settings />;
      default:
        return <PersonalInfo />;
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <TopNavBar currentPage="profile" />
      <SideNavBar activeTab={tab} />

      {/* Main Content */}
      <main className="ml-64 flex-1 pt-16 bg-surface">
        <div className="min-h-screen">{renderTabContent()}</div>
      </main>
    </div>
  );
};

export default UserProfile;
