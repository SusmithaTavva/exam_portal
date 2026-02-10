// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileSpreadsheet, Users, LogOut,
  Download, Trash2, Eye, FileText, UserCheck, ChevronDown, ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([
    { id: 'STU001', name: 'John Doe', test: 'Java Mock Test', score: 85, date: '2024-01-15' },
    { id: 'STU002', name: 'Jane Smith', test: 'Aptitude Test', score: 92, date: '2024-01-16' },
    { id: 'STU003', name: 'Bob Wilson', test: 'Java Mock Test', score: 78, date: '2024-01-17' },
  ]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  
  // Test Assignment States
  const [institutes, setInstitutes] = useState([]);
  const [expandedInstitutes, setExpandedInstitutes] = useState({});
  const [instituteStudents, setInstituteStudents] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
    else {
      fetchTests();
      if (activeTab === 'assign') {
        fetchInstitutes();
      }
    }
  }, [navigate, activeTab]);

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

    if (!testTitle || testTitle.trim() === '') {
      alert('⚠️ Please enter a Test Title before uploading the file');
      e.target.value = null; // Reset file input
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('testName', testTitle.trim());
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
        alert(`✅ ${data.message}\n\nTest ID: ${data.testId}\nQuestions uploaded: ${data.questionsCount}`);
        setTestTitle('');
        e.target.value = null; // Reset file input
        // Optionally refresh tests list here
        fetchTests();
      } else {
        alert(`❌ ${data.message || 'Upload failed'}`);
        e.target.value = null; // Reset file input
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('❌ An error occurred during upload. Please check your connection and try again.');
      e.target.value = null; // Reset file input
    } finally {
      setIsUploading(false);
    }
  };

  const fetchTests = async () => {
    try {
      setIsLoadingTests(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/tests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTests(data.tests);
      } else {
        console.error('Failed to fetch tests:', data.message);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setIsLoadingTests(false);
    }
  };

  const handleDeleteTest = async (testId, testName) => {
    if (!confirm(`Are you sure you want to delete "${testName}"? This will also delete all ${tests.find(t => t.id === testId)?.question_count || 0} questions.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Test deleted successfully');
        fetchTests(); // Refresh the list
      } else {
        alert(`❌ ${data.message || 'Failed to delete test'}`);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('❌ An error occurred while deleting the test');
    }
  };

  // Fetch Institutes
  const fetchInstitutes = async () => {
    try {
      setIsLoadingInstitutes(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/tests/institutes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setInstitutes(data.institutes);
      } else {
        console.error('Failed to fetch institutes:', data.message);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
    } finally {
      setIsLoadingInstitutes(false);
    }
  };

  // Toggle Institute Expansion
  const toggleInstitute = async (instituteName) => {
    const isExpanded = expandedInstitutes[instituteName];
    
    setExpandedInstitutes(prev => ({
      ...prev,
      [instituteName]: !isExpanded
    }));

    // Fetch students if not already loaded
    if (!isExpanded && !instituteStudents[instituteName]) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/tests/institutes/${encodeURIComponent(instituteName)}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setInstituteStudents(prev => ({
            ...prev,
            [instituteName]: data.students
          }));
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    }
  };

  // Toggle All Students from an Institute
  const toggleAllStudents = (instituteName, students) => {
    const studentIds = students.map(s => s.id);
    const allSelected = studentIds.every(id => selectedStudents.includes(id));

    if (allSelected) {
      // Deselect all from this institute
      setSelectedStudents(prev => prev.filter(id => !studentIds.includes(id)));
    } else {
      // Select all from this institute
      setSelectedStudents(prev => {
        const newSelection = [...prev];
        studentIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Toggle Individual Student
  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Assign Test to Selected Students
  const handleAssignTest = async () => {
    if (!selectedTest) {
      alert('⚠️ Please select a test to assign');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('⚠️ Please select at least one student');
      return;
    }

    if (!confirm(`Assign test to ${selectedStudents.length} student(s)?`)) {
      return;
    }

    try {
      setIsAssigning(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/tests/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_id: parseInt(selectedTest),
          student_ids: selectedStudents
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        setSelectedStudents([]);
        setSelectedTest('');
      } else {
        alert(`❌ ${data.message || 'Failed to assign test'}`);
      }
    } catch (error) {
      console.error('Error assigning test:', error);
      alert('❌ An error occurred while assigning the test');
    } finally {
      setIsAssigning(false);
    }
  };

  // Helper function to capitalize institute name for display
  const capitalizeInstitute = (instituteName) => {
    if (!instituteName) return '';
    return instituteName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
              { id: 'assign', label: 'Assign Tests', icon: UserCheck },
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <span className="text-red-500">* </span>Test Title (Required)
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  placeholder="e.g., Programming Basics Test, Aptitude Test 2026, Java MCQ..."
                  required
                />
                {testTitle && (
                  <p className="mt-1 text-xs text-green-600 flex items-center">
                    <span className="mr-1">✓</span> Test title is set - you can now upload a file below
                  </p>
                )}
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
                <p className="text-gray-600 mb-2">Click the button below to select your file</p>
                <p className="text-sm text-gray-400 mb-4">Excel (.xlsx, .xls) or CSV (.csv)</p>
                <label className={`inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer transition-all duration-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}>
                  <Upload size={18} className="mr-2" />
                  {isUploading ? 'Uploading...' : 'Browse Files'}
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                <p className="mt-4 text-xs text-gray-400">
                  Supported formats: .csv, .xlsx, .xls (Max 5MB)
                </p>
                {!testTitle && (
                  <p className="mt-2 text-sm text-amber-600 font-medium flex items-center justify-center">
                    <span className="mr-1">⚠️</span> Remember to enter a Test Title above before selecting a file
                  </p>
                )}
              </div>
            </div>

            {/* Existing Tests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Existing Tests</h2>
              
              {isLoadingTests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  <span className="ml-3 text-gray-600">Loading tests...</span>
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>No tests uploaded yet</p>
                  <p className="text-sm mt-1">Upload a CSV file above to create your first test</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tests.map((test) => (
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{test.title}</td>
                          <td className="px-4 py-3 text-gray-600">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              {test.question_count} questions
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {new Date(test.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button 
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="View Questions"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTest(test.id, test.title)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Delete Test"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats or Additional Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Future stats or analytics can go here */}
            </div>
          </div>
        )}

        {activeTab === 'assign' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <UserCheck className="mr-2" size={20} />
                Assign Tests to Students
              </h2>

              {/* Test Selection */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select Test to Assign
                </label>
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Choose a test --</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title} ({test.question_count} questions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Students Counter */}
              {selectedStudents.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900">
                    {selectedStudents.length} student(s) selected
                  </p>
                </div>
              )}

              {/* Institutes and Students */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">Select Students by Institute</h3>
                
                {isLoadingInstitutes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    <span className="ml-3 text-gray-600">Loading institutes...</span>
                  </div>
                ) : institutes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>No students registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {institutes.map((institute) => {
                      const isExpanded = expandedInstitutes[institute.institute];
                      const students = instituteStudents[institute.institute] || [];
                      const allSelected = students.length > 0 && students.every(s => selectedStudents.includes(s.id));
                      const someSelected = students.some(s => selectedStudents.includes(s.id));

                      return (
                        <div key={institute.institute} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Institute Header */}
                          <div className="bg-gray-50 p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <button
                                onClick={() => toggleInstitute(institute.institute)}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                              </button>
                              
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{capitalizeInstitute(institute.institute)}</h4>
                                <p className="text-sm text-gray-500">{institute.student_count} students</p>
                              </div>

                              {students.length > 0 && (
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                      if (el) el.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={() => toggleAllStudents(institute.institute, students)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Select All
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Students List */}
                          {isExpanded && (
                            <div className="p-4 bg-white">
                              {students.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">Loading students...</p>
                              ) : (
                                <div className="space-y-2">
                                  {students.map((student) => (
                                    <label
                                      key={student.id}
                                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{student.full_name}</p>
                                        <p className="text-sm text-gray-500">
                                          {student.roll_number} • {student.email}
                                        </p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assign Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleAssignTest}
                  disabled={!selectedTest || selectedStudents.length === 0 || isAssigning}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
                    selectedTest && selectedStudents.length > 0 && !isAssigning
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAssigning && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <UserCheck size={18} />
                  <span>{isAssigning ? 'Assigning...' : `Assign Test to ${selectedStudents.length} Student(s)`}</span>
                </button>
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