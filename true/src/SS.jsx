import React, { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const SS = () => {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("image");
  const [files, setFiles] = useState([]);

  // Safe function to load files
  const getFiles = async () => {
    const res = await fetch(`${API_BASE}/upload/`);
    if (!res.ok) throw new Error("Failed to fetch files");
    return await res.json();
  };


  useEffect(() => {
    let mounted = true;

    const loadFiles = async () => {
      try {
        const data = await getFiles();
        if (mounted) setFiles(data);
      } catch (err) {
        console.log("Fetch error:", err);
      }
    };

    loadFiles();

    return () => {
      mounted = false; 
    };
  }, []);

  const uploadFile = async () => {
    if (!file) return alert("Select a file first!");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", fileType);

    try {
      await fetch(`${API_BASE}/upload/`, {
        method: "POST",
        body: formData,
      });

      alert("Uploaded successfully!");
      setFile(null);

      // Refresh list
      const data = await getFiles();
      setFiles(data);
    } catch (err) {
      console.log("Upload error:", err);
    }
  };

  const downloadFile = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/download/${id}/`);
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const content = res.headers.get("content-disposition");
      const filename = content
        ? content.split("filename=")[1]
        : "downloaded_file";

      link.href = url;
      link.download = filename.replace(/"/g, "");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.log("Download error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white shadow-2xl rounded-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-6 text-blue-700">
          File Manager
        </h1>

        {/* Upload Section */}
        <div className="space-y-4">
          <select
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
            <option value="scan">Scan</option>
            <option value="audio">Audio</option>
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-2 rounded w-full"
          />

          <button
            onClick={uploadFile}
            className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 w-full"
          >
            Upload File
          </button>
        </div>

        <hr className="my-6 border-blue-200" />

        {/* File List */}
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">
          Uploaded Files
        </h2>

        <ul className="space-y-3">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center border p-3 rounded bg-blue-50"
            >
              <span className="text-blue-800 font-medium">
                {item.file_type} — {item.file.split("/").pop()}
              </span>

              <button
                onClick={() => downloadFile(item.id)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SS;

