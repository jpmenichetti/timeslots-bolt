import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { AdminDashboard } from './components/AdminDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { useState, useEffect } from 'react';

function App() {
  const { user, profile, loading } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (user && profile) {
      const checkPasswordChange = user.user_metadata?.must_change_password;
      setMustChangePassword(checkPasswordChange === true);
    } else {
      setMustChangePassword(false);
    }
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm />;
  }

  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <ChangePasswordModal
          onSuccess={() => setMustChangePassword(false)}
          isRequired={true}
        />
      </div>
    );
  }

  return profile.role === 'admin' ? <AdminDashboard /> : <WorkerDashboard />;
}

export default App;
