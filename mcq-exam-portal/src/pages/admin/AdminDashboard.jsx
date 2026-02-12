// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileSpreadsheet, Users, LogOut,
  Download, Trash2, Eye, FileText, UserCheck, ChevronDown, ChevronRight, Building2, Plus
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
  
  // Institute Management States
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [newInstituteName, setNewInstituteName] = useState('');
  const [isAddingInstitute, setIsAddingInstitute] = useState(false);
  const [isLoadingAllInstitutes, setIsLoadingAllInstitutes] = useState(false);
  const [selectedInstituteForAssignment, setSelectedInstituteForAssignment] = useState(null);
  
  // Assigned Tests Modal States
  const [showAssignedTestsModal, setShowAssignedTestsModal] = useState(false);
  const [selectedInstituteForTests, setSelectedInstituteForTests] = useState(null);
  const [assignedTests, setAssignedTests] = useState([]);
  const [isLoadingAssignedTests, setIsLoadingAssignedTests] = useState(false);

  // Student Management States
  const [showAddStudentForm, setShowAddStudentForm] = useState({});
  const [newStudentData, setNewStudentData] = useState({});
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
    else {
      fetchTests();
      if (activeTab === 'assign') {
        fetchInstitutes();
      }
      if (activeTab === 'institutes') {
        fetchAllInstitutes();
        // Clear selected institute when returning to institutes tab
        setSelectedInstituteForAssignment(null);
      }
      // Clear selected institute when switching to other tabs (except assign)
      if (activeTab !== 'assign' && activeTab !== 'institutes') {
        setSelectedInstituteForAssignment(null);
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

  // Fetch all institutes from the new institutes API
  const fetchAllInstitutes = async () => {
    try {
      setIsLoadingAllInstitutes(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/institutes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAllInstitutes(data.institutes);
      }
    } catch (error) {
      console.error('Error fetching all institutes:', error);
      alert('❌ Failed to load institutes');
    } finally {
      setIsLoadingAllInstitutes(false);
    }
  };

  // Add new institute
  const handleAddInstitute = async () => {
    if (!newInstituteName || newInstituteName.trim() === '') {
      alert('⚠️ Please enter an institute name');
      return;
    }

    try {
      setIsAddingInstitute(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/institutes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instituteName: newInstituteName.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        setNewInstituteName('');
        fetchAllInstitutes(); // Refresh the list
      } else {
        alert(`❌ ${data.message || 'Failed to add institute'}`);
      }
    } catch (error) {
      console.error('Error adding institute:', error);
      alert('❌ An error occurred while adding the institute');
    } finally {
      setIsAddingInstitute(false);
    }
  };

  // Delete institute
  const handleDeleteInstitute = async (instituteId, instituteName) => {
    if (!confirm(`Are you sure you want to delete "${instituteName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/institutes/${instituteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        fetchAllInstitutes(); // Refresh the list
      } else {
        alert(`❌ ${data.message || 'Failed to delete institute'}`);
      }
    } catch (error) {
      console.error('Error deleting institute:', error);
      alert('❌ An error occurred while deleting the institute');
    }
  };

  // Navigate to assign tab with selected institute
  const handleAssignTestToInstitute = (instituteId, instituteName, studentCount) => {
    // Set the selected institute for assignment
    setSelectedInstituteForAssignment({ id: instituteId, name: instituteName, studentCount });
    // Switch to assign tab
    setActiveTab('assign');
  };

  // View assigned tests for an institute
  const handleViewAssignedTests = async (institute) => {
    setSelectedInstituteForTests(institute);
    setShowAssignedTestsModal(true);
    setIsLoadingAssignedTests(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/institutes/${institute.id}/assigned-tests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAssignedTests(data.tests);
      } else {
        alert(`❌ ${data.message || 'Failed to fetch assigned tests'}`);
        setShowAssignedTestsModal(false);
      }
    } catch (error) {
      console.error('Error fetching assigned tests:', error);
      alert('❌ An error occurred while fetching assigned tests');
      setShowAssignedTestsModal(false);
    } finally {
      setIsLoadingAssignedTests(false);
    }
  };

  // Unassign test from institute
  const handleUnassignTest = async (testId, testTitle) => {
    if (!confirm(`Are you sure you want to unassign "${testTitle}" from "${selectedInstituteForTests.display_name}"?\n\nThis will remove the test from all students in this institute.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/institutes/${selectedInstituteForTests.id}/unassign-test/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        // Refresh assigned tests list
        handleViewAssignedTests(selectedInstituteForTests);
        // Refresh institutes list to update count
        fetchAllInstitutes();
      } else {
        alert(`❌ ${data.message || 'Failed to unassign test'}`);
      }
    } catch (error) {
      console.error('Error unassigning test:', error);
      alert('❌ An error occurred while unassigning the test');
    }
  };

  // Toggle Add Student Form for an institute
  const toggleAddStudentForm = (instituteName) => {
    setShowAddStudentForm(prev => ({
      ...prev,
      [instituteName]: !prev[instituteName]
    }));
  };

  // Handle Add Student
  const handleAddStudent = async (instituteName) => {
    const studentData = newStudentData[instituteName] || {};
    
    if (!studentData.full_name || !studentData.email) {
      alert('⚠️ Please enter student name and email');
      return;
    }

    try {
      setIsAddingStudent(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/student/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: studentData.full_name,
          email: studentData.email,
          roll_number: studentData.roll_number || '',
          institute: instituteName
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        // Clear form
        setNewStudentData(prev => ({
          ...prev,
          [instituteName]: {}
        }));
        // Hide form
        setShowAddStudentForm(prev => ({
          ...prev,
          [instituteName]: false
        }));
        // Refresh students list
        const studentsResponse = await fetch(`/api/tests/institutes/${encodeURIComponent(instituteName)}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const studentsData = await studentsResponse.json();
        if (studentsResponse.ok && studentsData.success) {
          setInstituteStudents(prev => ({
            ...prev,
            [instituteName]: studentsData.students
          }));
        }
        // Refresh institutes list to update count
        fetchInstitutes();
      } else {
        alert(`❌ ${data.message || 'Failed to create student'}`);
      }
    } catch (error) {
      console.error('Error creating student:', error);
      alert('❌ An error occurred while creating the student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Delete Individual Student
  const handleDeleteStudent = async (studentId, studentName, instituteName) => {
    if (!confirm(`Are you sure you want to delete "${studentName}"?\n\nThis will permanently remove the student and all their test assignments.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/student/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        // Refresh students list
        const studentsResponse = await fetch(`/api/tests/institutes/${encodeURIComponent(instituteName)}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const studentsData = await studentsResponse.json();
        if (studentsResponse.ok && studentsData.success) {
          setInstituteStudents(prev => ({
            ...prev,
            [instituteName]: studentsData.students
          }));
        }
        // Remove from selected students if selected
        setSelectedStudents(prev => prev.filter(id => id !== studentId));
        // Refresh institutes list to update count
        fetchInstitutes();
      } else {
        alert(`❌ ${data.message || 'Failed to delete student'}`);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('❌ An error occurred while deleting the student');
    }
  };

  // Delete All Students from Institute
  const handleDeleteAllStudents = async (instituteName, studentCount) => {
    if (!confirm(`⚠️ WARNING: This will permanently delete ALL ${studentCount} student(s) from "${capitalizeInstitute(instituteName)}" and their test assignments.\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/student/institute/${encodeURIComponent(instituteName)}/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        // Clear students list
        setInstituteStudents(prev => ({
          ...prev,
          [instituteName]: []
        }));
        // Clear any selected students from this institute
        setSelectedStudents([]);
        // Collapse the institute
        setExpandedInstitutes(prev => ({
          ...prev,
          [instituteName]: false
        }));
        // Refresh institutes list to update count
        fetchInstitutes();
      } else {
        alert(`❌ ${data.message || 'Failed to delete students'}`);
      }
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('❌ An error occurred while deleting students');
    }
  };

  // Assign test to entire institute (with or without students)
  const handleAssignToInstitute = async () => {
    if (!selectedTest) {
      alert('⚠️ Please select a test to assign');
      return;
    }

    if (!selectedInstituteForAssignment) {
      alert('⚠️ Please select an institute');
      return;
    }

    const message = selectedInstituteForAssignment.studentCount > 0
      ? `Assign test to all ${selectedInstituteForAssignment.studentCount} student(s) in "${selectedInstituteForAssignment.name}" and future students?`
      : `Assign test to "${selectedInstituteForAssignment.name}"?\n\nNo students are currently registered, but future students will automatically receive this test.`;

    if (!confirm(message)) {
      return;
    }

    try {
      setIsAssigning(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/institutes/${selectedInstituteForAssignment.id}/assign-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test_id: parseInt(selectedTest) })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        setSelectedTest('');
        setSelectedInstituteForAssignment(null);
        fetchAllInstitutes();
        fetchInstitutes();
      } else {
        alert(`❌ ${data.message || 'Failed to assign test'}`);
      }
    } catch (error) {
      console.error('Error assigning test to institute:', error);
      alert('❌ An error occurred while assigning the test');
    } finally {
      setIsAssigning(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                <span className="font-bold text-xl">📚</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Dashboard</h1>
                <p className="text-xs text-blue-100">MCQ Management System</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'upload', label: 'Upload Questions', icon: Upload },
              { id: 'institutes', label: 'Manage Institutes', icon: Building2 },
              { id: 'assign', label: 'Assign Tests', icon: UserCheck },
              { id: 'results', label: 'Marks Overview', icon: FileSpreadsheet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-200'
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

        {activeTab === 'institutes' && (
          <div className="space-y-6">
            {/* Add New Institute */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Plus className="mr-2" size={20} />
                Add New Institute/University
              </h2>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newInstituteName}
                    onChange={(e) => setNewInstituteName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInstitute()}
                    placeholder="Enter institute/university name..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isAddingInstitute}
                  />
                </div>
                <button
                  onClick={handleAddInstitute}
                  disabled={isAddingInstitute || !newInstituteName.trim()}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
                    !isAddingInstitute && newInstituteName.trim()
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAddingInstitute && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <Plus size={18} />
                  <span>{isAddingInstitute ? 'Adding...' : 'Add Institute'}</span>
                </button>
              </div>
            </div>

            {/* List of Institutes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Building2 className="mr-2" size={20} />
                All Institutes ({allInstitutes.length})
              </h2>

              {isLoadingAllInstitutes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  <span className="ml-3 text-gray-600">Loading institutes...</span>
                </div>
              ) : allInstitutes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>No institutes created yet</p>
                  <p className="text-sm mt-1">Add your first institute using the form above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institute Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Tests</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allInstitutes.map((institute) => (
                        <tr key={institute.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-gray-900">{institute.display_name}</p>
                              <p className="text-xs text-gray-500">{institute.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Users size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-900">{institute.student_count || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleViewAssignedTests(institute)}
                              className="flex items-center hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                              disabled={!institute.assigned_tests_count || institute.assigned_tests_count === 0}
                              title={institute.assigned_tests_count > 0 ? 'View assigned tests' : 'No tests assigned'}
                            >
                              <FileText size={16} className="mr-2 text-gray-400" />
                              <span className={`font-medium ${institute.assigned_tests_count > 0 ? 'text-blue-600 underline' : 'text-gray-900'}`}>
                                {institute.assigned_tests_count || 0}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(institute.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAssignTestToInstitute(institute.id, institute.display_name, institute.student_count)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Assign Test to Institute"
                              >
                                <UserCheck size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteInstitute(institute.id, institute.display_name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Institute"
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
              
              {allInstitutes.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>📌 How to assign tests:</strong>
                  </p>
                  <ul className="text-sm text-blue-900 list-disc list-inside space-y-1">
                    <li>Click the <UserCheck size={14} className="inline" /> button to go to the assign page for that institute</li>
                    <li>You can assign tests even if no students are registered yet</li>
                    <li>Tests will apply to all current students and future students who register</li>
                    <li>When students register with an institute name, they automatically get pre-assigned tests</li>
                  </ul>
                </div>
              )}
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

              {/* Institute Assignment Section */}
              {selectedInstituteForAssignment && (
                <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-purple-900">Assigning to Institute</h3>
                      <p className="text-sm text-purple-700 mt-1">
                        <Building2 size={14} className="inline mr-1" />
                        {selectedInstituteForAssignment.name} ({selectedInstituteForAssignment.studentCount} student{selectedInstituteForAssignment.studentCount !== 1 ? 's' : ''})
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedInstituteForAssignment(null)}
                      className="text-purple-600 hover:text-purple-800 text-sm underline"
                    >
                      Clear selection
                    </button>
                  </div>
                  <button
                    onClick={handleAssignToInstitute}
                    disabled={!selectedTest || isAssigning}
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                      selectedTest && !isAssigning
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isAssigning && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <Building2 size={18} />
                    <span>{isAssigning ? 'Assigning...' : 'Assign Test to Entire Institute'}</span>
                  </button>
                  <p className="text-xs text-purple-600 mt-2 text-center">
                    {selectedInstituteForAssignment.studentCount > 0
                      ? 'This will assign to all current students and future students who register'
                      : 'No students yet - this will assign to future students who register'}
                  </p>
                </div>
              )}

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

              {/* Divider - Only show if institute assignment section is NOT active */}
              {!selectedInstituteForAssignment && (
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">OR assign to individual students</span>
                  </div>
                </div>
              )}

              {/* Institutes and Students */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {selectedInstituteForAssignment ? 'Or Select Individual Students' : 'Select Students by Institute'}
                </h3>
                
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
                              {/* Action Buttons */}
                              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                <button
                                  onClick={() => toggleAddStudentForm(institute.institute)}
                                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                  <Plus size={16} />
                                  <span>Add Student</span>
                                </button>
                                
                                {students.length > 0 && (
                                  <button
                                    onClick={() => handleDeleteAllStudents(institute.institute, students.length)}
                                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete All ({students.length})</span>
                                  </button>
                                )}
                              </div>

                              {/* Add Student Form */}
                              {showAddStudentForm[institute.institute] && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <h5 className="font-semibold text-gray-900 mb-3">Add New Student to {capitalizeInstitute(institute.institute)}</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Full Name *"
                                      value={newStudentData[institute.institute]?.full_name || ''}
                                      onChange={(e) => setNewStudentData(prev => ({
                                        ...prev,
                                        [institute.institute]: {
                                          ...prev[institute.institute],
                                          full_name: e.target.value
                                        }
                                      }))}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <input
                                      type="email"
                                      placeholder="Email *"
                                      value={newStudentData[institute.institute]?.email || ''}
                                      onChange={(e) => setNewStudentData(prev => ({
                                        ...prev,
                                        [institute.institute]: {
                                          ...prev[institute.institute],
                                          email: e.target.value
                                        }
                                      }))}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Roll Number (Optional)"
                                      value={newStudentData[institute.institute]?.roll_number || ''}
                                      onChange={(e) => setNewStudentData(prev => ({
                                        ...prev,
                                        [institute.institute]: {
                                          ...prev[institute.institute],
                                          roll_number: e.target.value
                                        }
                                      }))}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2 mt-3">
                                    <button
                                      onClick={() => handleAddStudent(institute.institute)}
                                      disabled={isAddingStudent}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 text-sm"
                                    >
                                      {isAddingStudent ? 'Adding...' : 'Create Student'}
                                    </button>
                                    <button
                                      onClick={() => toggleAddStudentForm(institute.institute)}
                                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Students List */}
                              {students.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No students in this institute yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {students.map((student) => (
                                    <div
                                      key={student.id}
                                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
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
                                      <button
                                        onClick={() => handleDeleteStudent(student.id, student.full_name, institute.institute)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete student"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
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

      {/* Assigned Tests Modal */}
      {showAssignedTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Assigned Tests</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedInstituteForTests?.display_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignedTestsModal(false);
                  setSelectedInstituteForTests(null);
                  setAssignedTests([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingAssignedTests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading assigned tests...</span>
                </div>
              ) : assignedTests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-gray-500">No tests assigned to this institute</p>
                  <p className="text-sm text-gray-400 mt-1">Assign tests from the Manage Institutes tab</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedTests.map((test) => (
                    <div
                      key={test.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg mb-2">{test.title}</h4>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center">
                              <FileText size={14} className="mr-1" />
                              {test.question_count} questions
                            </span>
                            {test.duration_minutes && (
                              <span className="flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {test.duration_minutes} minutes
                              </span>
                            )}
                            {test.is_institute_level && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                Institute-level
                              </span>
                            )}
                          </div>
                          {test.institute_assigned_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Assigned: {new Date(test.institute_assigned_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnassignTest(test.id, test.title)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Unassign this test"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowAssignedTestsModal(false);
                  setSelectedInstituteForTests(null);
                  setAssignedTests([]);
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;