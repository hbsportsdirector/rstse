import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  BookOpen,
  Dumbbell,
  Home,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Award,
  Calendar,
  Activity,
  FileText,
  User,
  LineChart
} from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon,
  label,
  active,
}) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  // Only show links relevant to the user's role
  const isAdmin = user?.role === 'admin';
  const isCoach = user?.role === 'coach' || isAdmin;
  const isPlayer = user?.role === 'player';

  return (
    <div className="w-64 bg-white border-r h-screen overflow-y-auto">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary">Athlete Manager</h1>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
          Main
        </p>
        <nav className="space-y-1">
          <SidebarLink
            to="/dashboard"
            icon={<Home size={18} />}
            label="Dashboard"
            active={isActive('/dashboard') || isActive('/')}
          />

          {isPlayer && (
            <>
              <SidebarLink
                to="/my-test-results"
                icon={<Activity size={18} />}
                label="My Test Results"
                active={isActive('/my-test-results')}
              />
              <SidebarLink
                to="/workout-logs"
                icon={<FileText size={18} />}
                label="My Workout Logs"
                active={isActive('/workout-logs')}
              />
            </>
          )}

          {isCoach && (
            <>
              <SidebarLink
                to="/players"
                icon={<Users size={18} />}
                label="Players"
                active={isActive('/players')}
              />
              <SidebarLink
                to="/team-management"
                icon={<Users size={18} />}
                label="Teams"
                active={isActive('/team-management')}
              />
            </>
          )}
        </nav>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
          Training
        </p>
        <nav className="space-y-1">
          <SidebarLink
            to="/training"
            icon={<Dumbbell size={18} />}
            label="Training Hub"
            active={isActive('/training')}
          />
          {isCoach && (
            <>
              <SidebarLink
                to="/workout-groups"
                icon={<Calendar size={18} />}
                label="Workout Groups"
                active={isActive('/workout-groups')}
              />
              <SidebarLink
                to="/training/programs/assignments"
                icon={<ClipboardList size={18} />}
                label="Program Assignments"
                active={isActive('/training/programs/assignments')}
              />
            </>
          )}
        </nav>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
          Testing
        </p>
        <nav className="space-y-1">
          <SidebarLink
            to="/learning"
            icon={<BookOpen size={18} />}
            label="Learning Hub"
            active={isActive('/learning')}
          />
          {isCoach && (
            <>
              <SidebarLink
                to="/physical-tests"
                icon={<Activity size={18} />}
                label="Physical Tests"
                active={isActive('/physical-tests')}
              />
              <SidebarLink
                to="/fitness-assessment"
                icon={<LineChart size={18} />}
                label="Fitness Assessment"
                active={isActive('/fitness-assessment')}
              />
            </>
          )}
        </nav>
      </div>

      {isAdmin && (
        <div className="px-4 py-2">
          <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
            Admin
          </p>
          <nav className="space-y-1">
            <SidebarLink
              to="/admin/exercises"
              icon={<Award size={18} />}
              label="Pending Exercises"
              active={isActive('/admin/exercises')}
            />
            <SidebarLink
              to="/settings"
              icon={<Settings size={18} />}
              label="Settings"
              active={isActive('/settings')}
            />
          </nav>
        </div>
      )}

      <div className="px-4 py-2 mt-auto">
        <button
          onClick={signOut}
          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors text-gray-700 hover:bg-gray-100"
        >
          <LogOut size={18} className="mr-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
