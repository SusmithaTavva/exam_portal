import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Step 1: Attempt Admin Login
      try {
        const adminResponse = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const adminData = await adminResponse.json();

        if (adminResponse.ok && adminData.success) {
          // Admin Login Successful
          localStorage.setItem('adminToken', adminData.token);
          localStorage.setItem('adminUser', JSON.stringify(adminData.admin));
          navigate('/admin/dashboard');
          return; // Exit function, no need to try student login
        }
      } catch (adminErr) {
        console.warn('Admin login attempt failed, trying student login...', adminErr);
        // Continue to student login
      }

      // Step 2: Authenticate with Firebase (Student Login)
      const { signInWithEmailAndPassword, auth } = await import('../config/firebase');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Step 3: Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Step 4: Call backend to get student profile
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Extract user data from backend response
      const { user } = data;

      if (!user || !user.id) {
        throw new Error('Session data incomplete');
      }

      // Store user data in localStorage
      localStorage.setItem('studentAuthToken', idToken);
      localStorage.setItem('studentId', user.id.toString());
      localStorage.setItem('studentName', user.full_name || '');
      localStorage.setItem('rollNumber', user.roll_number || '');
      localStorage.setItem('email', user.email || '');

      // Navigate to dashboard
      navigate('/dashboard', {
        replace: true,
        state: {
          studentId: user.id,
          studentName: user.full_name
        }
      });

    } catch (error) {
      console.error('Login error:', error);

      // Handle Firebase-specific errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setApiError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setApiError('Invalid email address format.');
      } else if (error.code === 'auth/too-many-requests') {
        setApiError('Too many failed login attempts. Please try again later.');
      } else {
        setApiError(error.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 font-sans p-0 overflow-hidden">
      <div className="bg-white w-full max-w-[520px] min-h-[600px] max-h-[90vh] p-12 md:p-14 flex flex-col justify-center rounded-lg shadow-xl border border-slate-200 relative overflow-y-auto">
        <div className="text-center mb-10 flex-shrink-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-4">
            Secure Assessment Portal
          </div>
          <div className="w-16 h-16 bg-slate-900 rounded-xl mx-auto mb-5 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
            EX
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Student Login</h1>
          <p className="text-[15px] text-slate-500 font-normal leading-relaxed">
            Enter your credentials to access the examination
          </p>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border-l-4 border-emerald-600 text-emerald-600 p-4 rounded-r-md text-sm font-medium flex items-center gap-2.5 mb-6 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.5 6.5L7 11l-2.5-2.5 1-1L7 9l3.5-3.5 1 1z" />
            </svg>
            {successMessage}
          </div>
        )}

        {apiError && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-600 p-4 rounded-r-md text-sm font-medium flex items-center gap-2.5 mb-6 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
            </svg>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 justify-center">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Email Address <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="email"
              className={`w-full h-[52px] px-[18px] border-2 rounded-md text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-[15px] ${errors.email ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="Enter your institutional email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                setApiError('');
              }}
              disabled={isLoading}
              autoComplete="username"
            />
            {errors.email && (
              <span className="text-red-600 text-[13px] font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Password <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="password"
              className={`w-full h-[52px] px-[18px] border-2 rounded-md text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-[15px] ${errors.password ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                setApiError('');
              }}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="text-red-600 text-[13px] font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={`w-full h-14 mt-2 bg-slate-900 text-white rounded-md text-base font-semibold uppercase tracking-wider shadow-sm hover:bg-slate-800 hover:-translate-y-px hover:shadow-md active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 ${isLoading ? 'text-transparent relative' : ''
              }`}
            disabled={isLoading}
          >
            {isLoading && (
              <div className="absolute top-1/2 left-1/2 -ml-2.5 -mt-2.5 w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            Sign In to Examination
          </button>
        </form>

        <div className="mt-auto pt-8 flex-shrink-0">
          <div className="text-center text-[15px] text-slate-500 font-medium">
            New candidate?{' '}
            <Link to="/register" className="text-blue-500 font-semibold no-underline ml-1 hover:text-blue-600 hover:underline transition-colors duration-200">
              Register for examination
            </Link>
          </div>

          <div className="h-px bg-slate-200 my-6"></div>

          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
            Secure, proctored examination environment
          </div>


        </div>
      </div>
    </div>
  );
};

export default Login;