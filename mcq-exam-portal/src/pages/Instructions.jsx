import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Monitor, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const Instructions = () => {
  const navigate = useNavigate();
  const [hasRead, setHasRead] = useState(false);
  const [testDetails, setTestDetails] = useState(null);

  useEffect(() => {
    const testId = localStorage.getItem('selectedTestId');
    const token = localStorage.getItem('studentAuthToken');

    if (!token) {
      navigate('/login');
      return;
    }

    if (!testId) {
      navigate('/dashboard');
      return;
    }

    // Mock test details based on ID
    const testInfo = {
      'test-001': { title: 'Java Programming Mock Test', duration: 60 },
      'test-002': { title: 'Aptitude Assessment', duration: 45 },
      'test-003': { title: 'Database Management Systems', duration: 90 },
      'test-004': { title: 'Logical Reasoning', duration: 30 }
    };

    setTestDetails(testInfo[testId] || { title: 'Assessment Test', duration: 60 });
  }, [navigate]);

  const handleStartExam = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
      alert('Fullscreen mode is required to start the examination.');
      return;
    }
    
    navigate('/test');
  };

  const rules = [
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      title: 'Duration',
      description: `You have ${testDetails?.duration || 60} minutes to complete the examination. The timer cannot be paused once started.`
    },
    {
      icon: <Monitor className="w-6 h-6 text-green-600" />,
      title: 'Fullscreen Mode',
      description: 'Fullscreen mode is mandatory throughout the examination. Exiting fullscreen will trigger a warning.'
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
      title: 'Tab Switching Policy',
      description: 'Switching tabs or applications is strictly prohibited. You will receive 3 warnings before automatic submission.'
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-600" />,
      title: 'Prohibited Actions',
      description: 'Copy-paste, right-click, and keyboard shortcuts (Ctrl+C, Ctrl+V, etc.) are disabled during the test.'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-teal-600" />,
      title: 'Navigation',
      description: 'You can navigate between questions using the sidebar palette. All answers are auto-saved.'
    }
  ];

  if (!testDetails) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Examination Instructions</h1>
              <p className="text-lg text-gray-600">{testDetails.title}</p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Duration: {testDetails.duration} Minutes
            </span>
            <span>•</span>
            <span>Total Questions: 20</span>
            <span>•</span>
            <span>Full Screen Required</span>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid gap-4 mb-8">
          {rules.map((rule, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 p-6 flex items-start space-x-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                {rule.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{rule.title}</h3>
                <p className="text-gray-600 leading-relaxed">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Warning Box */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold text-red-900 mb-2">Important Warning</h4>
              <p className="text-red-800 text-sm leading-relaxed">
                Any attempt to cheat, switch tabs, or exit fullscreen mode will be recorded. 
                After 3 warnings, your test will be automatically submitted with your current progress. 
                Please ensure you are in a quiet environment with no distractions before starting.
              </p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <span className="text-gray-900 font-medium group-hover:text-blue-700 transition-colors">
                I have read and understood all the instructions
              </span>
              <p className="text-sm text-gray-500 mt-1">
                By checking this box, you agree to abide by the examination rules and regulations.
              </p>
            </div>
          </label>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Dashboard
            </button>
            
            <button
              onClick={handleStartExam}
              disabled={!hasRead}
              className={`
                px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200
                ${hasRead 
                  ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              {hasRead ? 'Start Examination →' : 'Please Read Instructions First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;