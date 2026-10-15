import React, { useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MiddleContent from './MiddleContent';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  const user = {
    name: 'Alex Morgan',
    role: 'Workspace Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      {/* 1. Navigator Top Bar Component */}
      <TopBar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        user={user} 
      />

      <div className="flex flex-1 relative">
        {/* 2. Sidebar Component */}
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          activeNav={activeNav} 
          setActiveNav={setActiveNav} 
        />

        {/* 3. Middle Content Component */}
        <MiddleContent 
          activeNav={activeNav} 
        />
      </div>
    </div>
  );
}