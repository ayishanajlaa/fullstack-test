import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FaTag, FaLink, FaCopy } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "react-toastify/dist/ReactToastify.css";

// Define Item Types
const ItemTypes = {
  FILE: "file",
};

// Draggable File Component
const DraggableFile = ({
  file,
  index,
  moveFile,
  addTagToFile,
  newTags,
  setNewTags,
  createShareableLink,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FILE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.FILE,
    hover: (item) => {
      if (item.index !== index) {
        moveFile(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-white shadow-md rounded-lg p-4 flex flex-col items-center ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {file.fileType === "image" ? (
        <img
          src={`data:image/jpeg;base64,${file.base64}`}
          alt={file.filename}
          className="w-full h-32 object-cover rounded-md"
        />
      ) : (
        <video controls className="w-full h-32 rounded-md">
          <source
            src={`data:video/mp4;base64,${file.base64}`}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      )}
      <p className="text-sm text-gray-600 mt-2">{file.filename}</p>

      <div className="mt-4 flex items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTagToFile(file.id);
          }}
          className="flex w-full space-x-2"
        >
          <input
            type="text"
            placeholder="Add a tag"
            value={newTags[file.id]?.[0] || ""}
            onChange={(e) =>
              setNewTags({ ...newTags, [file.id]: [e.target.value] })
            }
            className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 rounded-md text-sm hover:bg-blue-600 transition duration-200 flex items-center justify-center"
          >
            <FaTag className="w-4 h-4" />
          </button>
        </form>
      </div>

      <button
        onClick={() => createShareableLink(file.id)}
        className="mt-4 text-blue-500 hover:underline text-sm flex items-center space-x-2"
      >
        <FaLink />
        <span>Create Shareable Link</span>
      </button>

      <p className="mt-2 text-sm text-gray-500">{file.views} views</p>

      {file.tags && file.tags.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-semibold">Tags:</h4>
          <div className="flex flex-wrap space-x-2 mt-1">
            {file.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full border border-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [filesList, setFilesList] = useState([]);
  const [newTags, setNewTags] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyLink, setCopyLink] = useState("");

  const fetchFiles = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/files/get-files`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFilesList(response.data.files);
    } catch (error) {
      toast.error("Error fetching files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    setError("");
    if (acceptedFiles.length > 1) {
      setError("You can only upload one file at a time.");
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
    "image/*": [".jpg", ".jpeg", ".png", ".gif"],
    "video/*": [".mp4", ".mov", ".avi", ".mkv"],
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const token = sessionStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file.file);

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/files/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("File uploaded successfully!");
      setFile(null);
      fetchFiles();
    } catch (error) {
      toast.error("Error uploading file. Please try again.");
    }
  };

  const addTagToFile = async (fileId) => {
    const token = sessionStorage.getItem("token");
    const tagsArray = newTags[fileId] || [];
    const newTag = tagsArray[0]?.trim();

    if (!newTag) {
      toast.error("Please enter a tag to add.");
      return;
    }

    const uploadedFile = filesList.find((file) => file.id === fileId);
    if (uploadedFile && uploadedFile.tags.includes(newTag)) {
      toast.error("This tag already exists.");
      return;
    }

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/files/add-tags/${fileId}`,
        { tags: [newTag] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewTags({ ...newTags, [fileId]: [""] });
      toast.success("Tag added successfully!");
      fetchFiles();
    } catch (error) {
      toast.error("Error adding tag. Please try again.");
    }
  };

  const createShareableLink = async (fileId) => {
    const token = sessionStorage.getItem("token");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/files/file/${fileId}/create-link`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const shareableLink = `${process.env.REACT_APP_BASE_URL}/file/${response.data.shareableLink}`;
      setCopyLink(shareableLink);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Error creating shareable link. Please try again.");
    }
  };

  const copyToClipboard = () => {
    if (!copyLink) {
        toast.error("No link to copy.");
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(copyLink)
            .then(() => {
                toast.success("Link copied to clipboard!");
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                toast.error("Failed to copy link. Please try again.");
            });
    } else {
        toast.error("Clipboard API not supported in this browser.");
    }
};

  const moveFile = (fromIndex, toIndex) => {
    const updatedFiles = [...filesList];
    const [movedFile] = updatedFiles.splice(fromIndex, 1);
    updatedFiles.splice(toIndex, 0, movedFile);
    setFilesList(updatedFiles);
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
            <p className="text-gray-600">
              Drag & drop a file here, or click to select a file
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Only one image or video file is allowed.
          </p>
        </div>

        {file && (
          <div className="mt-4">
            <div className="flex flex-col items-center">
              {file.file.type.startsWith("image/") ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-32 h-32 object-cover rounded-md"
                />
              ) : (
                <video
                  src={file.preview}
                  controls
                  className="w-32 h-32 rounded-md"
                />
              )}
              <button
                onClick={handleUpload}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600 transition"
              >
                Upload File
              </button>
            </div>
          </div>
        )}

        <h2 className="mt-8 text-xl font-semibold">Uploaded Files</h2>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filesList.map((uploadedFile, index) => (
            <DraggableFile
              key={uploadedFile.id}
              file={uploadedFile}
              index={index}
              moveFile={moveFile}
              addTagToFile={addTagToFile}
              newTags={newTags}
              setNewTags={setNewTags}
              createShareableLink={createShareableLink}
            />
          ))}
        </div>

        {/* Shareable Link Modal */}
        {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
                            <h3 className="text-lg font-semibold mb-4 text-center">
                                Shareable Link
                            </h3>
                            <input
                                type="text"
                                value={copyLink}
                                readOnly
                                className="border border-gray-300 rounded-md p-2 w-full mb-4"
                            />
                            <div className="flex flex-col md:flex-row justify-between">
                                <button
                                    onClick={copyToClipboard}
                                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded w-full md:w-auto mr-0 md:mr-2 hover:bg-blue-600 transition"
                                >
                                    <FaCopy className="inline mr-1" /> Copy Link
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="mt-4 border border-red-500 text-red-500 px-4 py-2 rounded w-full md:w-auto hover:bg-red-500 hover:text-white transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
      </div>
    </DndProvider>
  );
};

export default FileUpload;
