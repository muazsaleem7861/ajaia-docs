import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import api from '../api';
import Navbar from '../components/Navbar';
import ShareModal from '../components/ShareModal';

/* ---------- Toolbar button ---------- */
function TBtn({ onClick, active, title, children }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`toolbar-btn p-1.5 rounded text-gray-700 hover:bg-gray-100 transition-colors text-sm ${active ? 'is-active' : ''}`}
    >
      {children}
    </button>
  );
}

/* ---------- Toolbar ---------- */
function Toolbar({ editor }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-white sticky top-14 z-20">
      {/* Text style */}
      <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <strong>B</strong>
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <em>I</em>
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <u>U</u>
      </TBtn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Headings */}
      {[1, 2, 3].map(level => (
        <TBtn
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive('heading', { level })}
          title={`Heading ${level}`}
        >
          <span className="font-semibold text-xs">H{level}</span>
        </TBtn>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Lists */}
      <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </TBtn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* History */}
      <TBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </TBtn>
    </div>
  );
}

/* ---------- Main Page ---------- */
export default function EditorPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [doc, setDoc]             = useState(null);
  const [title, setTitle]         = useState('');
  const [isOwner, setIsOwner]     = useState(false);
  const [canEdit, setCanEdit]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saveState, setSaveState] = useState('saved'); // saved | saving | unsaved | error
  const [showShare, setShowShare] = useState(false);
  const [editTitle, setEditTitle] = useState(false);

  const saveTimer = useRef(null);
  const titleRef  = useRef(null);

  /* ---------- Editor setup ---------- */
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editable: canEdit,
    onUpdate: () => {
      setSaveState('unsaved');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(saveContent, 1500);
    },
  });

  /* ---------- Load document ---------- */
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/documents/${id}`);
        setDoc(data.document);
        setTitle(data.document.title);
        setIsOwner(data.isOwner);
        setCanEdit(data.permission === 'edit');
        editor?.commands.setContent(data.document.content || '');
      } catch (err) {
        if (err.response?.status === 403) navigate('/');
        else navigate('/');
      } finally {
        setLoading(false);
      }
    }
    if (editor) load();
  }, [id, editor]);

  /* Sync editability */
  useEffect(() => {
    if (editor) editor.setEditable(canEdit);
  }, [canEdit, editor]);

  /* ---------- Save ---------- */
  const saveContent = useCallback(async () => {
    if (!canEdit) return;
    setSaveState('saving');
    try {
      await api.patch(`/documents/${id}`, { content: editor.getHTML() });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [id, canEdit, editor]);

  async function saveTitle(newTitle) {
    if (!newTitle.trim() || newTitle === doc?.title) { setEditTitle(false); return; }
    try {
      await api.patch(`/documents/${id}`, { title: newTitle.trim() });
      setDoc(prev => ({ ...prev, title: newTitle.trim() }));
      setTitle(newTitle.trim());
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to rename');
      setTitle(doc?.title || '');
    }
    setEditTitle(false);
  }

  /* ---------- Save status indicator ---------- */
  const statusLabel = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Save failed' }[saveState];
  const statusColor = { saved: 'text-gray-400', saving: 'text-indigo-400', unsaved: 'text-amber-500', error: 'text-red-500' }[saveState];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading document…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showBack title={
        editTitle ? null : (
          <button
            onClick={() => { if (isOwner) { setEditTitle(true); setTimeout(() => titleRef.current?.select(), 50); } }}
            className={`font-medium text-gray-800 text-sm truncate max-w-xs ${isOwner ? 'hover:text-indigo-600 cursor-text' : 'cursor-default'}`}
            title={isOwner ? 'Click to rename' : ''}
          >
            {title}
          </button>
        )
      }>
        {editTitle && (
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => saveTitle(title)}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(title); if (e.key === 'Escape') { setTitle(doc?.title || ''); setEditTitle(false); } }}
            className="border border-indigo-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            autoFocus
          />
        )}

        <span className={`text-xs ${statusColor} hidden sm:inline`}>{statusLabel}</span>

        {canEdit && (
          <button
            onClick={saveContent}
            disabled={saveState === 'saved' || saveState === 'saving'}
            className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Save
          </button>
        )}

        {isOwner && (
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        )}
      </Navbar>

      {/* Non-editable banner */}
      {!canEdit && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-2">
          You have view-only access to this document.
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm mt-4 mb-8 mx-4 rounded-xl overflow-hidden border border-gray-200">
          <Toolbar editor={editor} />
          <div className="px-8 py-8">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {showShare && doc && (
        <ShareModal
          doc={doc}
          onClose={() => setShowShare(false)}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
}
