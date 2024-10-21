import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FaTag, FaLink, FaCopy } from "react-icons/fa";
import axios from 'axios';

const FileUpload = () => {
  const [file, setFile] = useState(null);  // For single file
  const [error, setError] = useState('');
  const [filesList, setFilesList] = useState([]);  // To display user's files
  const [uploadMessage, setUploadMessage] = useState('');
  const [copyLink, setCopyLink] = useState(''); // For the shareable link
  const [isModalOpen, setIsModalOpen] = useState(false); // For modal state
  const [newTags, setNewTags] = useState({}); // Object to hold new tags for each file

  const fetchFiles = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/files/get-files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setFilesList(response.data.files); // Access the files array from the response
    } catch (error) {
      console.error("Error fetching files", error);
    }
  };

  // Fetch all uploaded files by user on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    setError('');
    if (acceptedFiles.length > 1) {
      setError('You can only upload one file at a time.');
      return;
    }

    const selectedFile = acceptedFiles[0];
    setFile({
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
      tags: [],
      views: 0,
    });
  }, []);
  
  const acceptedFileTypes = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv']
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,  // Restrict to 1 file
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file.file);  // Ensure this matches the backend ('file')

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/files/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadMessage('File uploaded successfully!');
      setFile(null); // Clear after successful upload
      fetchFiles(); // Refresh the files list
    } catch (error) {
      console.error('Error uploading file', error);
      setUploadMessage('Error uploading file. Please try again.');
    }
  };

  // Function to add tags to a file
  const addTagToFile = async (fileId) => {
    const token = localStorage.getItem('token');
    const tagsArray = newTags[fileId] || []; // Get the tags array for the specific file
    const newTag = tagsArray[tagsArray.length - 1]; // Get the last tag which is the one the user just added
    if (!newTag) {
      setUploadMessage('Please enter a tag to add.');
      return;
    }
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/file/${fileId}/add-tags`, { tags: [...tagsArray, newTag] }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNewTags({ ...newTags, [fileId]: [] }); // Clear input after successful tag addition
      setUploadMessage('Tag added successfully!');
      fetchFiles(); // Refresh the files list
    } catch (error) {
      console.error('Error adding tag', error);
      setUploadMessage('Error adding tag. Please try again.');
    }
  };

  const createShareableLink = async (fileId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/files/file/${fileId}/create-link`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const baseUrl = 'http://localhost:3000'; // Your frontend base URL
      const shareableLink = `${baseUrl}/file/${response.data.shareableLink}`; // Update to match your route
      setCopyLink(shareableLink);

      setUploadMessage('Shareable link created successfully!');
      setIsModalOpen(true); // Open the modal to display the link
    } catch (error) {
      console.error('Error creating shareable link', error);
      setUploadMessage('Error creating shareable link. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(copyLink);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div
        {...getRootProps()}
        className={`border-4 border-dashed rounded-lg p-10 flex flex-col justify-center items-center ${
          isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the file here ...</p>
        ) : (
          <p className="text-gray-600">Drag & drop a file here, or click to select a file</p>
        )}
        <p className="text-sm text-gray-500 mt-2">Only one image or video file is allowed.</p>
      </div>

      {file && (
        <div className="mt-4">
          <div className="flex flex-col items-center">
            {file.file.type.startsWith("image/") ? (
              <img src={file.preview} alt={file.file.name} className="w-32 h-32 object-cover rounded-md" />
            ) : (
              <video src={file.preview} controls className="w-32 h-32 rounded-md" />
            )}
            <button
              onClick={handleUpload}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              Upload File
            </button>
          </div>
        </div>
      )}

      <h2 className="mt-8 text-xl font-semibold">Uploaded Files</h2>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filesList.map((uploadedFile) => (
          <div key={uploadedFile._id} className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center">
            {uploadedFile.fileType === 'image' ? (
              <img 
                src={`data:image/jpeg;base64,${uploadedFile.base64}`} 
                alt={uploadedFile.filename} 
                className="w-full h-32 object-cover rounded-md" 
              />
            ) : (
              <video controls className="w-full h-32 rounded-md">
                <source 
                  src={`data:video/mp4;base64,${uploadedFile.base64}`} 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
            )}

            <p className="text-sm text-gray-600 mt-2">{uploadedFile.filename}</p>

            <div className="mt-4 flex space-x-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTagToFile(uploadedFile._id); // Pass the file ID to the tag function
                }}
                className="flex"
              >
                <input
                  type="text"
                  placeholder="Add tag"
                  value={newTags[uploadedFile._id]?.[newTags[uploadedFile._id].length - 1] || ''} // Show the last tag as input
                  onChange={(e) => setNewTags({ ...newTags, [uploadedFile._id]: [e.target.value] })} // Update the last tag in the array
                  className="border border-gray-300 rounded-l-md p-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <button type="submit" className="bg-blue-500 text-white px-3 rounded-r-md text-sm hover:bg-blue-600">
                  <FaTag />
                </button>
              </form>
            </div>

            <button 
              onClick={() => createShareableLink(uploadedFile.id)} 
              className="mt-4 text-blue-500 hover:underline text-sm flex items-center space-x-2"
            >
              <FaLink />
              <span>Create Shareable Link</span>
            </button>

            <p className="mt-2 text-sm text-gray-500">{uploadedFile.views} views</p>
          </div>
        ))}
      </div>

      {uploadMessage && (
        <p className="mt-4 text-green-500">{uploadMessage}</p>
      )}

      {/* Shareable Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">Shareable Link</h3>
            <input
              type="text"
              value={copyLink}
              readOnly
              className="border border-gray-300 rounded-md p-2 w-full mb-4"
            />
            <div className="flex flex-col md:flex-row justify-between">
              <button 
                onClick={copyToClipboard} 
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded w-full md:w-auto mr-0 md:mr-2 hover:bg-blue-600 transition duration-200"
              >
                <FaCopy className="inline mr-1" /> Copy Link
              </button>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="mt-4 border border-red-500 text-red-500 px-4 py-2 rounded w-full md:w-auto hover:bg-red-500 hover:text-white transition duration-200"
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

export default FileUpload;
