import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ title, showBack = false, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3 sticky top-0 z-30">
      {showBack && (
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title="Back to dashboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        {title && (
          <span className="font-medium text-gray-800 text-sm truncate">{title}</span>
        )}
        {!title && (
          <span className="font-semibold text-gray-900 text-sm">Ajaia Docs</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors ml-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
