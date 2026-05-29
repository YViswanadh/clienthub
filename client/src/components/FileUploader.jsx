import React, { useState, useRef } from 'react';

export default function FileUploader({ onUploadSuccess, projectId }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const inputRef = useRef(null);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = (file) => {
    setUploading(true);
    setProgress(0);
    setUploadedFile(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          
          const isImage = file.type.startsWith('image/');
          const mockUrl = isImage 
            ? URL.createObjectURL(file) 
            : 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
          
          const result = {
            name: file.name,
            url: mockUrl,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            isImage,
          };
          
          setUploadedFile(result);
          if (onUploadSuccess) {
            onUploadSuccess(result);
          }
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const clearUploaded = () => {
    setUploadedFile(null);
    setProgress(0);
  };

  return (
    <div>
      {!uploadedFile ? (
        <div>
          <label htmlFor="file_upload_input">Choose File: </label>
          <input
            id="file_upload_input"
            ref={inputRef}
            type="file"
            onChange={handleChange}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />

          {uploading && (
            <div>
              <p>Uploading file: {progress}%</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p>
            <strong>Uploaded:</strong> {uploadedFile.name} ({uploadedFile.size})
          </p>
          {uploadedFile.isImage && (
            <img
              src={uploadedFile.url}
              alt={uploadedFile.name}
              style={{ maxWidth: 100, display: 'block' }}
            />
          )}
          <button type="button" onClick={clearUploaded}>[Remove File]</button>
        </div>
      )}
    </div>
  );
}
