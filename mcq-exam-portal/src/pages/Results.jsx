import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';

const Result = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { submission, totalQuestions, attempted } = location.state || {};

    useEffect(() => {
        // Exit fullscreen on result page
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }, []);

    if (!submission) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No submission found</h2>
          // Change the dashboard button to go to feedback
                    <button
                        onClick={() => navigate('/feedback')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                    >
                        Continue to Feedback
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-green-600 p-8 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Test Submitted Successfully</h1>
                    <p className="text-green-100">Your responses have been recorded</p>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                <FileText size={18} />
                                <span className="text-sm font-medium">Questions Attempted</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{attempted} / {totalQuestions}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                <Clock size={18} />
                                <span className="text-sm font-medium">Time Remaining</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{submission.timeRemaining}</p>
                        </div>
                    </div>

                    {submission.warningCount > 0 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-yellow-800">Warnings Received</h3>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        You received {submission.warningCount} tab switch warning(s) during the examination.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <p className="text-sm text-gray-600 text-center mb-4">
                            Submission ID: <span className="font-mono font-medium">{Date.now()}</span>
                        </p>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Return to Dashboard
                        </button>

                        <button
                            onClick={() => {
                                localStorage.clear();
                                navigate('/login');
                            }}
                            className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Result;