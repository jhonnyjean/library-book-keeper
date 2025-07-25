import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Calendar, User, Book, Edit2, Trash2, CheckCircle, Clock, Upload, FileText, Download, Camera, X, RotateCcw } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function BookKeeperInterface() {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([
    { id: 1, title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0061120084", quantity: 5, condition: "Good", category: "Fiction" },
    { id: 2, title: "1984", author: "George Orwell", isbn: "978-0451524935", quantity: 3, condition: "Excellent", category: "Fiction" },
    { id: 3, title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518", quantity: 4, condition: "Fair", category: "Classic Literature" },
    { id: 4, title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", quantity: 2, condition: "Good", category: "Fiction" },
    { id: 5, title: "Lord of the Flies", author: "William Golding", isbn: "978-0571056866", quantity: 6, condition: "Excellent", category: "Fiction" }
  ]);
  const [assignments, setAssignments] = useState([]);
  
  const [activeTab, setActiveTab] = useState('assign');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    phoneNumber: '',
    grade: '',
    house: ''
  });
  
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: 1,
    condition: 'Good',
    category: ''
  });
  
  const [assignmentForm, setAssignmentForm] = useState({
    studentId: '',
    bookIds: [],
    dateOut: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  // Calculate due date (2 weeks from checkout)
  const calculateDueDate = (dateOut) => {
    const date = new Date(dateOut);
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  const addStudent = () => {
    if (newStudent.firstName && newStudent.lastName) {
      const student = {
        id: Date.now(),
        ...newStudent,
        studentId: newStudent.studentId || `STU${Date.now()}`
      };
      setStudents([...students, student]);
      setNewStudent({ firstName: '', lastName: '', studentId: '', phoneNumber: '', grade: '', house: '' });
      setShowAddStudent(false);
    }
  };

  const addBook = () => {
    if (newBook.title && newBook.author) {
      const book = {
        id: Date.now(),
        ...newBook,
        isbn: newBook.isbn || `ISBN${Date.now()}`,
        quantity: parseInt(newBook.quantity) || 1
      };
      setBooks([...books, book]);
      setNewBook({ title: '', author: '', isbn: '', quantity: 1, condition: 'Good', category: '' });
      setShowAddBook(false);
    }
  };

  const assignBooks = () => {
    if (assignmentForm.studentId && assignmentForm.bookIds.length > 0) {
      const dueDate = calculateDueDate(assignmentForm.dateOut);
      const newAssignments = assignmentForm.bookIds.map(bookId => ({
        id: Date.now() + Math.random(),
        studentId: parseInt(assignmentForm.studentId),
        bookId: parseInt(bookId),
        dateOut: assignmentForm.dateOut,
        dueDate: dueDate,
        dateReturned: null,
        status: 'checked-out'
      }));
      
      setAssignments([...assignments, ...newAssignments]);
      setAssignmentForm({
        studentId: '',
        bookIds: [],
        dateOut: new Date().toISOString().split('T')[0],
        dueDate: ''
      });
    }
  };

  const returnBook = (assignmentId) => {
    setAssignments(assignments.map(assignment => 
      assignment.id === assignmentId 
        ? { ...assignment, dateReturned: new Date().toISOString().split('T')[0], status: 'returned' }
        : assignment
    ));
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  const getBookTitle = (bookId) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.title : 'Unknown Book';
  };

  const getBookAuthor = (bookId) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.author : 'Unknown Author';
  };

  const isBookAvailable = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return false;
    
    const checkedOutCount = assignments.filter(assignment => 
      assignment.bookId === bookId && assignment.status === 'checked-out'
    ).length;
    
    return checkedOutCount < book.quantity;
  };

  const getAvailableCopies = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return 0;
    
    const checkedOutCount = assignments.filter(assignment => 
      assignment.bookId === bookId && assignment.status === 'checked-out'
    ).length;
    
    return book.quantity - checkedOutCount;
  };

  // Camera and barcode scanning functions
  const startCamera = async () => {
    try {
      setIsScanning(true);
      setScanResults(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResults({
        success: false,
        message: 'Unable to access camera. Please check permissions.',
        error: error.message
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        await processImageForBarcode(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const processImageForBarcode = async (imageBlob) => {
    try {
      // Create FormData for the image
      const formData = new FormData();
      formData.append('image', imageBlob, 'barcode.jpg');

      // For demonstration, we'll simulate barcode detection
      // In a real application, you would send this to a barcode detection service
      // or use a client-side barcode library like QuaggaJS or ZXing
      
      setTimeout(() => {
        // Simulate successful barcode detection
        const mockISBN = generateMockISBN();
        lookupBookByISBN(mockISBN);
      }, 1500);

      setScanResults({
        success: true,
        message: 'Processing image for barcode...',
        scanning: true
      });

    } catch (error) {
      console.error('Error processing image:', error);
      setScanResults({
        success: false,
        message: 'Error processing image for barcode detection.',
        error: error.message
      });
    }
  };

  const generateMockISBN = () => {
    // Generate a mock ISBN for demonstration
    const mockISBNs = [
      '9780142437247', // The Kite Runner
      '9780061120084', // To Kill a Mockingbird
      '9780451524935', // 1984
      '9780747532699', // Harry Potter
      '9780316769174', // The Catcher in the Rye
      '9780544003415', // The Lord of the Rings
      '9780553380163', // A Brief History of Time
      '9780525478812', // Educated
      '9780062315007', // The Alchemist
      '9780679783268'  // Beloved
    ];
    return mockISBNs[Math.floor(Math.random() * mockISBNs.length)];
  };

  const lookupBookByISBN = async (isbn) => {
    try {
      // In a real application, you would call a book API like Google Books API, OpenLibrary, etc.
      // For demonstration, we'll use mock book data
      
      const mockBookData = {
        '9780142437247': { title: 'The Kite Runner', author: 'Khaled Hosseini', category: 'Fiction' },
        '9780061120084': { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Classic Literature' },
        '9780451524935': { title: '1984', author: 'George Orwell', category: 'Dystopian Fiction' },
        '9780747532699': { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', category: 'Fantasy' },
        '9780316769174': { title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Classic Literature' },
        '9780544003415': { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', category: 'Fantasy' },
        '9780553380163': { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science' },
        '9780525478812': { title: 'Educated', author: 'Tara Westover', category: 'Memoir' },
        '9780062315007': { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction' },
        '9780679783268': { title: 'Beloved', author: 'Toni Morrison', category: 'Literary Fiction' }
      };

      setTimeout(() => {
        const bookData = mockBookData[isbn];
        
        if (bookData) {
          // Pre-fill the book form with scanned data
          setNewBook({
            title: bookData.title,
            author: bookData.author,
            isbn: isbn,
            quantity: 1,
            condition: 'Good',
            category: bookData.category
          });

          setScanResults({
            success: true,
            message: `Book found: "${bookData.title}" by ${bookData.author}`,
            bookData: bookData,
            isbn: isbn
          });
          
          // Show the add book form
          setShowAddBook(true);
        } else {
          setScanResults({
            success: false,
            message: `No book found for ISBN: ${isbn}. You can manually enter the book details.`,
            isbn: isbn
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Error looking up book:', error);
      setScanResults({
        success: false,
        message: 'Error looking up book information.',
        error: error.message
      });
    }
  };

  // Cleanup camera when component unmounts or scanner closes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const closeBarcodeScanner = () => {
    stopCamera();
    setShowBarcodeScanner(false);
    setScanResults(null);
  };

  // Bulk upload functions
  const downloadTemplate = () => {
    const csvContent = "firstName,lastName,studentId,phoneNumber,grade,house\nJohn,Doe,STU001,555-0123,9,Gryffindor\nJane,Smith,STU002,555-0124,10,Ravenclaw";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          processUploadedData(results.data, results.errors);
        },
        error: (error) => {
          setUploadResults({
            success: false,
            message: `CSV parsing error: ${error.message}`,
            added: 0,
            errors: []
          });
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false
          });
          
          // Convert array of arrays to array of objects
          if (jsonData.length > 0) {
            const headers = jsonData[0].map(h => h.toString().trim());
            const rows = jsonData.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] ? row[index].toString().trim() : '';
              });
              return obj;
            });
            processUploadedData(rows, []);
          }
        } catch (error) {
          setUploadResults({
            success: false,
            message: `Excel parsing error: ${error.message}`,
            added: 0,
            errors: []
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setUploadResults({
        success: false,
        message: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
        added: 0,
        errors: []
      });
    }

    // Clear the input
    event.target.value = '';
  };

  const processUploadedData = (data, parseErrors) => {
    const errors = [];
    const successfulAdds = [];
    const existingStudentIds = new Set(students.map(s => s.studentId.toLowerCase()));

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
      
      // Clean and validate data
      const firstName = row.firstName ? row.firstName.toString().trim() : '';
      const lastName = row.lastName ? row.lastName.toString().trim() : '';
      let studentId = row.studentId ? row.studentId.toString().trim() : '';
      const phoneNumber = row.phoneNumber ? row.phoneNumber.toString().trim() : '';
      const grade = row.grade ? row.grade.toString().trim() : '';
      const house = row.house ? row.house.toString().trim() : '';

      // Validate required fields
      if (!firstName || !lastName) {
        errors.push(`Row ${rowNumber}: First name and last name are required`);
        return;
      }

      // Generate student ID if not provided
      if (!studentId) {
        studentId = `STU${Date.now()}_${index}`;
      }

      // Check for duplicate student IDs
      if (existingStudentIds.has(studentId.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Student ID "${studentId}" already exists`);
        return;
      }

      // Add to successful list
      successfulAdds.push({
        id: Date.now() + index,
        firstName,
        lastName,
        studentId,
        phoneNumber,
        grade,
        house
      });
      
      // Add to existing IDs set to prevent duplicates within the upload
      existingStudentIds.add(studentId.toLowerCase());
    });

    // Add successful students to the main list
    if (successfulAdds.length > 0) {
      setStudents(prevStudents => [...prevStudents, ...successfulAdds]);
    }

    // Set upload results
    setUploadResults({
      success: successfulAdds.length > 0,
      message: `Upload completed: ${successfulAdds.length} students added${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      added: successfulAdds.length,
      errors: errors,
      parseErrors: parseErrors
    });
  };

  const getOverdueAssignments = () => {
    const today = new Date().toISOString().split('T')[0];
    return assignments.filter(assignment => 
      assignment.status === 'checked-out' && assignment.dueDate < today
    );
  };

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssignments = assignments.filter(assignment => {
    const studentName = getStudentName(assignment.studentId);
    const bookTitle = getBookTitle(assignment.bookId);
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           bookTitle.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 rounded-t-lg">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Book className="w-8 h-8" />
              Library Book Keeper System
            </h1>
            <p className="text-lg opacity-90 mt-1">Created by Jhonny Jean</p>
            <p className="mt-2 opacity-90">Manage student book assignments and returns</p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'assign', label: 'Assign Books', icon: Plus },
                { id: 'assignments', label: 'Current Assignments', icon: Book },
                { id: 'students', label: 'Students', icon: User },
                { id: 'books', label: 'Books', icon: Book }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students, books, or assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Overdue Notice */}
            {getOverdueAssignments().length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Overdue Books ({getOverdueAssignments().length})
                </h3>
                <div className="mt-2 space-y-1">
                  {getOverdueAssignments().slice(0, 3).map(assignment => (
                    <p key={assignment.id} className="text-red-700 text-sm">
                      {getStudentName(assignment.studentId)} - "{getBookTitle(assignment.bookId)}" (Due: {assignment.dueDate})
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Assign Books Tab */}
            {activeTab === 'assign' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Assign Books to Students</h2>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Student
                      </label>
                      <select
                        value={assignmentForm.studentId}
                        onChange={(e) => setAssignmentForm({...assignmentForm, studentId: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose a student...</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} ({student.studentId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Out
                      </label>
                      <input
                        type="date"
                        value={assignmentForm.dateOut}
                        onChange={(e) => setAssignmentForm({...assignmentForm, dateOut: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Books (Due: {assignmentForm.dateOut ? calculateDueDate(assignmentForm.dateOut) : 'Select date'})
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {books.map(book => (
                        <label
                          key={book.id}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                            isBookAvailable(book.id) 
                              ? 'hover:bg-blue-50 border-gray-300' 
                              : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={assignmentForm.bookIds.includes(book.id.toString())}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignmentForm({
                                  ...assignmentForm,
                                  bookIds: [...assignmentForm.bookIds, book.id.toString()]
                                });
                              } else {
                                setAssignmentForm({
                                  ...assignmentForm,
                                  bookIds: assignmentForm.bookIds.filter(id => id !== book.id.toString())
                                });
                              }
                            }}
                            disabled={!isBookAvailable(book.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{book.title}</p>
                                <p className="text-sm text-gray-600">{book.author}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {book.category}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    book.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                                    book.condition === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                                    book.condition === 'Fair' ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {book.condition}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {getAvailableCopies(book.id)}/{book.quantity} available
                                </p>
                              </div>
                            </div>
                            {!isBookAvailable(book.id) && (
                              <p className="text-xs text-red-500 mt-1">All copies checked out</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={assignBooks}
                    disabled={!assignmentForm.studentId || assignmentForm.bookIds.length === 0}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Assign Selected Books
                  </button>
                </div>
              </div>
            )}

            {/* Current Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Current Book Assignments</h2>
                
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Book
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date Out
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAssignments.map(assignment => (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {getStudentName(assignment.studentId)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{getBookTitle(assignment.bookId)}</div>
                              <div className="text-sm text-gray-500">{getBookAuthor(assignment.bookId)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assignment.dateOut}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${
                                assignment.status === 'checked-out' && assignment.dueDate < new Date().toISOString().split('T')[0]
                                  ? 'text-red-600 font-medium'
                                  : 'text-gray-900'
                              }`}>
                                {assignment.dueDate}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                assignment.status === 'returned' 
                                  ? 'bg-green-100 text-green-800'
                                  : assignment.dueDate < new Date().toISOString().split('T')[0]
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {assignment.status === 'returned' ? 'Returned' : 
                                 assignment.dueDate < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Checked Out'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {assignment.status === 'checked-out' && (
                                <button
                                  onClick={() => returnBook(assignment.id)}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Return
                                </button>
                              )}
                              {assignment.status === 'returned' && (
                                <span className="text-gray-500">
                                  Returned: {assignment.dateReturned}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Students</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBulkUpload(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Bulk Upload
                    </button>
                    <button
                      onClick={() => setShowAddStudent(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Student
                    </button>
                  </div>
                </div>

                {showBulkUpload && (
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Bulk Upload Students
                    </h3>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Upload students from CSV or Excel files. Required columns: <strong>firstName</strong>, <strong>lastName</strong>. 
                        Optional: <strong>studentId</strong>, <strong>phoneNumber</strong>, <strong>grade</strong>, <strong>house</strong>.
                      </p>
                      
                      <button
                        onClick={downloadTemplate}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-4"
                      >
                        <Download className="w-4 h-4" />
                        Download CSV Template
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </label>
                    </div>

                    {uploadResults && (
                      <div className={`p-4 rounded-lg mb-4 ${
                        uploadResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <p className={`font-medium ${uploadResults.success ? 'text-green-800' : 'text-red-800'}`}>
                          {uploadResults.message}
                        </p>
                        
                        {uploadResults.errors && uploadResults.errors.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
                            <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                              {uploadResults.errors.map((error, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {uploadResults.parseErrors && uploadResults.parseErrors.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-red-700 mb-2">Parse Errors:</p>
                            <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                              {uploadResults.parseErrors.map((error, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  Row {error.row}: {error.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowBulkUpload(false);
                          setUploadResults(null);
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {showAddStudent && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="First Name *"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Last Name *"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Student ID"
                        value={newStudent.studentId}
                        onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newStudent.phoneNumber}
                        onChange={(e) => setNewStudent({...newStudent, phoneNumber: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newStudent.grade}
                        onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Grade</option>
                        <option value="K">Kindergarten</option>
                        <option value="1">1st Grade</option>
                        <option value="2">2nd Grade</option>
                        <option value="3">3rd Grade</option>
                        <option value="4">4th Grade</option>
                        <option value="5">5th Grade</option>
                        <option value="6">6th Grade</option>
                        <option value="7">7th Grade</option>
                        <option value="8">8th Grade</option>
                        <option value="9">9th Grade</option>
                        <option value="10">10th Grade</option>
                        <option value="11">11th Grade</option>
                        <option value="12">12th Grade</option>
                      </select>
                      <input
                        type="text"
                        placeholder="House (optional)"
                        value={newStudent.house}
                        onChange={(e) => setNewStudent({...newStudent, house: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={addStudent}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Add Student
                      </button>
                      <button
                        onClick={() => setShowAddStudent(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <User className="w-8 h-8 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        {student.phoneNumber && (
                          <p className="flex items-center gap-2">
                            <span className="w-16 font-medium">Phone:</span>
                            <span>{student.phoneNumber}</span>
                          </p>
                        )}
                        {student.grade && (
                          <p className="flex items-center gap-2">
                            <span className="w-16 font-medium">Grade:</span>
                            <span>{student.grade === 'K' ? 'Kindergarten' : `${student.grade}${['st', 'nd', 'rd'][parseInt(student.grade) - 1] || 'th'} Grade`}</span>
                          </p>
                        )}
                        {student.house && (
                          <p className="flex items-center gap-2">
                            <span className="w-16 font-medium">House:</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {student.house}
                            </span>
                          </p>
                        )}
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          Books checked out: <span className="font-medium">{assignments.filter(a => a.studentId === student.id && a.status === 'checked-out').length}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Books Tab */}
            {activeTab === 'books' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Books</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBarcodeScanner(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Scan Barcode
                    </button>
                    <button
                      onClick={() => setShowAddBook(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Book
                    </button>
                  </div>
                </div>

                {showBarcodeScanner && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Scan Book Barcode
                        </h3>
                        <button
                          onClick={closeBarcodeScanner}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {!isScanning ? (
                          <div className="text-center">
                            <div className="bg-gray-100 rounded-lg p-8 mb-4">
                              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 mb-4">
                                Position the book's barcode in front of your camera to automatically add it to your collection.
                              </p>
                              <button
                                onClick={startCamera}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                              >
                                <Camera className="w-5 h-5" />
                                Start Camera
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="relative bg-black rounded-lg overflow-hidden">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-64 object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="border-2 border-white border-dashed w-48 h-32 flex items-center justify-center">
                                  <span className="text-white text-sm">Position barcode here</span>
                                </div>
                              </div>
                            </div>
                            
                            <canvas ref={canvasRef} className="hidden" />
                            
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={captureImage}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                              >
                                <Camera className="w-4 h-4" />
                                Capture & Scan
                              </button>
                              <button
                                onClick={stopCamera}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Stop Camera
                              </button>
                            </div>
                          </div>
                        )}

                        {scanResults && (
                          <div className={`p-4 rounded-lg ${
                            scanResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}>
                            {scanResults.scanning ? (
                              <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <p className="text-blue-800 font-medium">{scanResults.message}</p>
                              </div>
                            ) : (
                              <>
                                <p className={`font-medium ${scanResults.success ? 'text-green-800' : 'text-red-800'}`}>
                                  {scanResults.message}
                                </p>
                                
                                {scanResults.success && scanResults.bookData && (
                                  <div className="mt-3 text-sm text-green-700">
                                    <p><strong>ISBN:</strong> {scanResults.isbn}</p>
                                    <p><strong>Title:</strong> {scanResults.bookData.title}</p>
                                    <p><strong>Author:</strong> {scanResults.bookData.author}</p>
                                    <p><strong>Category:</strong> {scanResults.bookData.category}</p>
                                  </div>
                                )}

                                {!scanResults.success && scanResults.isbn && (
                                  <div className="mt-3">
                                    <p className="text-red-700 text-sm mb-2">ISBN: {scanResults.isbn}</p>
                                    <button
                                      onClick={() => {
                                        setNewBook({
                                          ...newBook,
                                          isbn: scanResults.isbn
                                        });
                                        setShowAddBook(true);
                                        closeBarcodeScanner();
                                      }}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                      Add Book Manually
                                    </button>
                                  </div>
                                )}

                                {scanResults.success && scanResults.bookData && (
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => {
                                        addBook(); // This will use the pre-filled newBook data
                                        closeBarcodeScanner();
                                      }}
                                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                                    >
                                      Add This Book
                                    </button>
                                    <button
                                      onClick={() => {
                                        setScanResults(null);
                                        if (isScanning) {
                                          // Ready for another scan
                                        }
                                      }}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                      Scan Another
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          <p className="mb-2"><strong>Tips for better scanning:</strong></p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Ensure good lighting</li>
                            <li>Hold the book steady</li>
                            <li>Make sure the barcode is clearly visible and not blurry</li>
                            <li>Try different angles if the first scan doesn't work</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showAddBook && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Add New Book</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Book Title *"
                        value={newBook.title}
                        onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Author *"
                        value={newBook.author}
                        onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="ISBN"
                        value={newBook.isbn}
                        onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Quantity *"
                        min="1"
                        value={newBook.quantity}
                        onChange={(e) => setNewBook({...newBook, quantity: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newBook.condition}
                        onChange={(e) => setNewBook({...newBook, condition: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Category"
                        value={newBook.category}
                        onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={addBook}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Add Book
                      </button>
                      <button
                        onClick={() => setShowAddBook(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map(book => (
                    <div key={book.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <Book className="w-8 h-8 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">By {book.author}</p>
                          <p className="text-xs text-gray-500 mb-3">ISBN: {book.isbn}</p>
                          
                          {/* Category and Condition */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {book.category}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              book.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                              book.condition === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                              book.condition === 'Fair' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {book.condition}
                            </span>
                          </div>

                          {/* Availability Status */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Total Copies:</span>
                              <span className="text-sm text-gray-900">{book.quantity}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Available:</span>
                              <span className="text-sm text-gray-900">{getAvailableCopies(book.id)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Checked Out:</span>
                              <span className="text-sm text-gray-900">
                                {book.quantity - getAvailableCopies(book.id)}
                              </span>
                            </div>
                          </div>

                          {/* Overall Status */}
                          <div className="mt-3 pt-2 border-t border-gray-100">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              getAvailableCopies(book.id) > 0 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {getAvailableCopies(book.id) > 0 ? 'Available' : 'All Copies Out'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}