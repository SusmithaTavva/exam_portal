// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileSpreadsheet, Users, LogOut,
  Download, Trash2, Eye, FileText
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [tests, setTests] = useState([
    { id: 1, name: 'Java Mock Test', questions: 20, attempts: 45, avgScore: 72 },
    { id: 2, name: 'Aptitude Test', questions: 30, attempts: 120, avgScore: 68 },
  ]);
  const [students, setStudents] = useState([
    { id: 'STU001', name: 'John Doe', test: 'Java Mock Test', score: 85, date: '2024-01-15' },
    { id: 'STU002', name: 'Jane Smith', test: 'Aptitude Test', score: 92, date: '2024-01-16' },
    { id: 'STU003', name: 'Bob Wilson', test: 'Java Mock Test', score: 78, date: '2024-01-17' },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const [testTitle, setTestTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!testTitle) {
      alert('Please enter a test title first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('testName', testTitle);
    // formData.append('testDescription', 'Uploaded via Dashboard'); // Optional

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/upload/questions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message);
        setTestTitle('');
        e.target.value = null; // Reset file input
        // Optionally refresh tests list here
        fetchTests();
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchTests = async () => {
    // Placeholder for fetching tests later
    // console.log('Fetching updated tests list...');
  };

  const exportToExcel = () => {
    // Mock export
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Student ID,Name,Test,Score,Date\n"
      + students.map(s => `${s.id},${s.name},${s.test},${s.score},${s.date}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Dashboard</h1>
                <p className="text-xs text-gray-400">MCQ Management System</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'upload', label: 'Upload Questions', icon: Upload },
              { id: 'results', label: 'Marks Overview', icon: FileSpreadsheet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Single Question Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="mr-2" size={20} />
                Add Single Question
              </h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Enter your question here..."
                  />
                </div>
                {[1, 2, 3, 4].map((num) => (
                  <div key={num}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option {num}</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder={`Option ${num}`}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                    <option>Select correct option</option>
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                    <option>Option 4</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
                  >
                    Add Question
                  </button>
                </div>
              </form>
            </div>

            {/* Bulk Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Upload className="mr-2" size={20} />
                Bulk Upload (Excel/CSV)
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Title (New Test)</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Enter a title for this test (e.g. Java Basics 101)"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-slate-900 transition-colors relative">
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  </div>
                )}

                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">Drag and drop your Excel/CSV file here</p>
                <p className="text-sm text-gray-400 mb-4">or</p>
                <label className={`inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer transition-colors ${!testTitle ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload size={18} className="mr-2" />
                  Browse Files
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={!testTitle || isUploading}
                  />
                </label>
                <p className="mt-4 text-xs text-gray-400">
                  Supported formats: .csv, .xlsx, .xls (Max 5MB)
                </p>
                {!testTitle && (
                  <p className="mt-2 text-sm text-red-500 font-medium">
                    Please enter a Test Title first
                  </p>
                )}
              </div>
            </div>

            {/* Existing Tests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Existing Tests</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tests.map((test) => (
                      <tr key={test.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{test.name}</td>
                        <td className="px-4 py-3 text-gray-600">{test.questions}</td>
                        <td className="px-4 py-3 text-gray-600">{test.attempts}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            {test.avgScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-red-600 hover:text-red-800">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Users className="mr-2" size={20} />
                Student Results Overview
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={exportToExcel}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <FileSpreadsheet size={18} />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Download size={18} />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-900">{student.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-gray-600">{student.test}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${student.score}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900">{student.score}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.date}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Total Students', value: students.length, color: 'bg-blue-50 text-blue-900' },
                { label: 'Average Score', value: '75%', color: 'bg-green-50 text-green-900' },
                { label: 'Pass Rate', value: '85%', color: 'bg-purple-50 text-purple-900' },
                { label: 'Tests Active', value: tests.length, color: 'bg-orange-50 text-orange-900' },
              ].map((stat, idx) => (
                <div key={idx} className={`${stat.color} rounded-lg p-4`}>
                  <p className="text-sm font-medium opacity-80">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;