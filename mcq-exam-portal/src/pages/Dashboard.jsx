import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Clock, BookOpen, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');

  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('studentAuthToken');
      if (!token) {
        navigate('/login');
        return;
      }

      setStudentName(localStorage.getItem('studentName') || 'Student');
      setStudentId(localStorage.getItem('studentId') || '');

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/tests`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tests');
        }

        const data = await response.json();
        if (data.success) {
          setAvailableTests(data.tests);
        } else {
          setError('Failed to load tests');
        }
      } catch (err) {
        console.error('Error loading tests:', err);
        setError('Connection error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleTakeTest = (testId) => {
    localStorage.setItem('selectedTestId', testId);
    navigate('/instructions');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">EX</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Assessment Portal</h1>
                <p className="text-sm text-gray-500">Student Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Welcome, {studentName}</p>
                <p className="text-xs text-gray-500">ID: {studentId}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Examinations</h2>
          <p className="text-gray-600">Select a test to begin your assessment</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && availableTests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Tests Available</h3>
            <p className="text-gray-500 mt-2">Check back later for new assessments.</p>
          </div>
        )}

        {!loading && !error && availableTests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {availableTests.map((test) => (
              <div
                key={test.id}
                className={`${test.color} border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-gray-700 mb-2">
                      {test.subject}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                  </div>
                  <BookOpen className="text-gray-400" size={24} />
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    <span>Duration: {test.duration}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <AlertCircle size={16} className="mr-2" />
                    <span>{test.questions} Questions • {test.difficulty} Level</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTakeTest(test.id)}
                  className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Take Test
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Ensure you have a stable internet connection before starting
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              All tests require fullscreen mode and prohibit tab switching
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Three warnings for tab switching will result in automatic submission
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;