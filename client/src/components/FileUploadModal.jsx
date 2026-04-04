import { useState, useRef } from 'react';
import api from '../api';

export default function FileUploadModal({ onClose, onImported }) {
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const inputRef = useRef(null);

  const ACCEPTED = ['.txt', '.md', '.docx'];

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }

  function validateAndSet(f) {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError(`Only ${ACCEPTED.join(', ')} files are supported.`);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    setError('');
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onImported(data.document);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Import file</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.md,.docx"
              className="hidden"
              onChange={e => e.target.files[0] && validateAndSet(e.target.files[0])}
            />
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {file ? (
              <p className="text-sm font-medium text-indigo-600">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">Drop a file or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supported: .txt · .md · .docx — max 5 MB</p>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg py-2.5 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              {loading ? 'Importing…' : 'Import as new document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
