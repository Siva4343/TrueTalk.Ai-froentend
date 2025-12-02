import React, { useRef, useState, useEffect } from "react";

export default function DragDropUpload({ onFileChange, initialUrl=null, required=false }) {
  const [preview, setPreview] = useState(initialUrl);
  const inputRef = useRef();

  useEffect(() => {
    setPreview(initialUrl);
  }, [initialUrl]);

  function handleFiles(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileChange && onFileChange(file);
  }

  function onInputChange(e) {
    const f = e.target.files[0];
    handleFiles(f);
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    handleFiles(f);
  }

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full h-40 border-2 border-dashed rounded-xl flex items-center justify-center mb-4 cursor-pointer bg-white"
        onClick={() => inputRef.current.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7h18M3 7l9-4 9 4M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" />
            </svg>
            <div className="text-blue-600 font-medium">Upload a file</div>
            <div className="text-gray-400 text-sm">PNG, JPG, GIF up to 10MB</div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
        required={required && !initialUrl}
      />
    </div>
  );
}