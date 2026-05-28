import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';

export default function FileUploader({ onUploadSuccess, projectId }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    inputRef.current.click();
  };

  // Mock Upload Function simulating real Cloudinary upload
  const uploadFile = (file) => {
    setError('');
    setUploading(true);
    setProgress(0);
    setUploadedFile(null);

    // Simulate progress increments
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          
          // Determine mock preview based on file type
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
    <div className="w-full space-y-4">
      {!uploadedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInput}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 text-center ${
            dragActive
              ? 'border-primary bg-primary-light/50 scale-[0.99]'
              : 'border-gray-200 bg-white hover:border-primary/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary mb-4">
            <UploadCloud className="h-6 w-6" />
          </div>

          <p className="text-sm font-semibold text-[#111111] mb-1">
            Drag & drop your files here, or <span className="text-primary font-bold">browse</span>
          </p>
          <p className="text-xs text-[#6B7280]">
            Supports PDF, JPG, PNG, DOCX up to 10MB
          </p>

          {uploading && (
            <div className="w-full max-w-xs mt-6 space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between text-xs font-semibold text-primary">
                <span>Uploading file...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-[#EF4444] font-semibold mt-4" onClick={(e) => e.stopPropagation()}>
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        /* Preview Panel */
        <div className="border border-[#EEEDFE] bg-white rounded-xl p-4 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            {uploadedFile.isImage ? (
              <div className="h-14 w-14 rounded-lg overflow-hidden border border-gray-100 relative group bg-gray-50 flex items-center justify-center">
                <img
                  src={uploadedFile.url}
                  alt={uploadedFile.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-[#6B7280]">
                <File className="h-6 w-6" />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-[#111111] truncate max-w-md">
                {uploadedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B7280]">
                <span>{uploadedFile.size}</span>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <span className="flex items-center gap-1 text-[#10B981] font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready to submit
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={clearUploaded}
            className="text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
