import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import FileUploadModal from '../components/FileUploadModal';

function DocCard({ doc, onDelete, onClick }) {
  const isOwned   = doc.relation === 'owned';
  const updatedAt = new Date(doc.updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative"
    >
      {/* Doc icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isOwned ? 'bg-indigo-50' : 'bg-amber-50'}`}>
          <svg className={`w-5 h-5 ${isOwned ? 'text-indigo-500' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{updatedAt}</p>
        </div>
      </div>

      {/* Footer badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOwned ? (
            <span className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2 py-0.5 font-medium">Owned</span>
          ) : (
            <span className="text-xs bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 font-medium">
              Shared by {doc.owner_name}
            </span>
          )}
          {doc.permission === 'view' && (
            <span className="text-xs bg-gray-50 text-gray-500 rounded-full px-2 py-0.5">View only</span>
          )}
        </div>

        {isOwned && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(doc); }}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch]         = useState('');
  const [creating, setCreating]     = useState(false);

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createDocument() {
    setCreating(true);
    try {
      const { data } = await api.post('/documents', { title: 'Untitled Document' });
      navigate(`/doc/${data.document.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function deleteDocument(doc) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  }

  const filtered   = documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
  const owned      = filtered.filter(d => d.relation === 'owned');
  const shared     = filtered.filter(d => d.relation === 'shared');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import
        </button>
        <button
          onClick={createDocument}
          disabled={creating}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New document
        </button>
      </Navbar>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-8">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400">Loading…</div>
        ) : documents.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">No documents yet</h2>
            <p className="text-gray-500 text-sm mb-6">Create your first document or import a file to get started.</p>
            <button
              onClick={createDocument}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
            >
              Create document
            </button>
          </div>
        ) : (
          <>
            {owned.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">My documents</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {owned.map(doc => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      onDelete={deleteDocument}
                      onClick={() => navigate(`/doc/${doc.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {shared.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Shared with me</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {shared.map(doc => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      onDelete={deleteDocument}
                      onClick={() => navigate(`/doc/${doc.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-12">No documents match "{search}"</p>
            )}
          </>
        )}
      </main>

      {showUpload && (
        <FileUploadModal
          onClose={() => setShowUpload(false)}
          onImported={doc => {
            setShowUpload(false);
            navigate(`/doc/${doc.id}`);
          }}
        />
      )}
    </div>
  );
}
