import { useState, useEffect } from 'react';
import api from '../api';

export default function ShareModal({ doc, onClose, onUpdate }) {
  const [email, setEmail]           = useState('');
  const [permission, setPermission] = useState('edit');
  const [sharedWith, setSharedWith] = useState([]);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetchShares();
  }, [doc.id]);

  async function fetchShares() {
    try {
      const { data } = await api.get(`/documents/${doc.id}`);
      setSharedWith(data.sharedWith || []);
    } catch {}
  }

  async function handleShare(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/shares', { documentId: doc.id, sharedWithEmail: email, permission });
      setSuccess(`Shared with ${email}`);
      setEmail('');
      await fetchShares();
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId) {
    try {
      await api.delete('/shares', { data: { documentId: doc.id, sharedWithId: userId } });
      await fetchShares();
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revoke');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Share document</h2>
            <p className="text-sm text-gray-500 truncate max-w-xs">{doc.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Share form */}
        <form onSubmit={handleShare} className="p-5 space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="colleague@email.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={permission}
              onChange={e => setPermission(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="edit">Can edit</option>
              <option value="view">Can view</option>
            </select>
          </div>

          {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? 'Sharing…' : 'Share'}
          </button>
        </form>

        {/* People with access */}
        {sharedWith.length > 0 && (
          <div className="px-5 pb-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">People with access</p>
            <ul className="space-y-2">
              {sharedWith.map(u => (
                <li key={u.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-indigo-700">{u.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-2 py-0.5">
                      {u.permission === 'edit' ? 'Can edit' : 'Can view'}
                    </span>
                    <button
                      onClick={() => handleRevoke(u.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      title="Revoke access"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Demo hint */}
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-400">
            Demo users: alice@ajaia.com · bob@ajaia.com · carol@ajaia.com
          </p>
        </div>
      </div>
    </div>
  );
}
