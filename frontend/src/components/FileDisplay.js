import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const FileDisplay = () => {
  const { fileId } = useParams(); 
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState([]);

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/files/files-view/${fileId}`);
        setFileData(response.data);
      } catch (error) {
        console.error('Error fetching file data:', error);
        setError('File not found.');
      }
    };

    fetchFileData(); 
  }, [fileId]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    setDroppedFiles(files);
    // You can also implement a function to handle the uploaded files here
  };

  if (error) {
    return <p className="text-red-500 text-center mt-4">{error}</p>;
  }

  if (!fileData) {
    return <p className="text-center mt-4">Loading...</p>;
  }

  const { base64, filename, fileType, views } = fileData;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-5">
      <div
        className={`bg-white shadow-md rounded-lg p-6 max-w-2xl w-full ${dragging ? 'border-2 border-blue-500' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">{filename}</h1>
        <div className="flex justify-center">
          {fileType === 'image' ? (
            <img
              src={`data:${fileType};base64,${base64}`}
              alt={filename}
              className="max-w-full h-auto rounded-lg border-2 border-gray-200"
            />
          ) : (
            <video controls className="max-w-full h-auto rounded-lg border-2 border-gray-200">
              <source src={`data:${fileType};base64,${base64}`} type={fileType} />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        {(fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/gif') && (
          <p className="text-gray-600 mt-4 text-center">Views: {views}</p>
        )}
      </div>

      {/* Display dropped files */}
      {droppedFiles.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Dropped Files:</h2>
          <ul className="list-disc pl-5">
            {droppedFiles.map((file, index) => (
              <li key={index} className="text-gray-700">{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileDisplay;
