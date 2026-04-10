import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import pb from '../lib/pocketbase';
import { theme } from '../lib/theme';

const NoteEditor = forwardRef(({ note, onSave, refreshNotes }, ref) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const isNoteChanging = useRef(false);
  const savedNoteRef = useRef(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    isNoteChanging.current = true;
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      savedNoteRef.current = note.id ? note : null;
    } else {
      setTitle('');
      setContent('');
      savedNoteRef.current = null;
    }
    setIsPreview(false);
    isSavingRef.current = false;
    setTimeout(() => {
      isNoteChanging.current = false;
    }, 100);
  }, [note]);

  const handleLogout = () => {
    pb.authStore.clear();
    window.location.href = '/login';
  };

  const saveNote = useCallback(async () => {
    if (!title.trim() || isSavingRef.current) return;

    isSavingRef.current = true;

    try {
      const data = {
        title: title.trim(),
        content,
        owner: pb.authStore.model.id,
      };

      let savedNote;
      if (savedNoteRef.current?.id) {
        const folderId = savedNoteRef.current.folder && Array.isArray(savedNoteRef.current.folder) && savedNoteRef.current.folder.length > 0 
          ? savedNoteRef.current.folder[0].id 
          : null;
        if (folderId) {
          data.folder = folderId;
        }
        savedNote = await pb.collection('notes').update(savedNoteRef.current.id, data);
        savedNoteRef.current = savedNote;
      } else {
        savedNote = await pb.collection('notes').create(data);
        savedNote.isNew = false;
        savedNoteRef.current = savedNote;
      }
      onSave(savedNote);
      refreshNotes?.();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [title, content, onSave, refreshNotes]);

  useImperativeHandle(ref, () => ({
    saveNote
  }));

  useEffect(() => {
    if (!isNoteChanging.current && !isSavingRef.current && title.trim() && (title !== savedNoteRef.current?.title || content !== savedNoteRef.current?.content)) {
      const timeoutId = setTimeout(() => {
        saveNote();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [title, content, saveNote]);

  if (!note && !title) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', padding: '48px 20%', position: 'relative', background: theme.colors.background.primary, color: theme.colors.text.primary }}>
      <style>{`
        .markdown-preview h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; color: ${theme.colors.text.primary}; }
        .markdown-preview h2 { font-size: 1.5em; font-weight: 600; margin: 0.83em 0; color: ${theme.colors.text.primary}; }
        .markdown-preview h3 { font-size: 1.17em; font-weight: 600; margin: 1em 0; color: ${theme.colors.text.primary}; }
        .markdown-preview h4 { font-size: 1em; font-weight: 600; margin: 1.33em 0; color: ${theme.colors.text.primary}; }
        .markdown-preview h5 { font-size: 0.83em; font-weight: 600; margin: 1.67em 0; color: ${theme.colors.text.primary}; }
        .markdown-preview h6 { font-size: 0.67em; font-weight: 600; margin: 2.33em 0; color: ${theme.colors.text.primary}; }
        .markdown-preview p { margin: 1em 0; color: ${theme.colors.text.secondary}; line-height: 1.6; }
        .markdown-preview ul, .markdown-preview ol { margin: 1em 0; padding-left: 30px; color: ${theme.colors.text.secondary}; }
        .markdown-preview li { margin: 0.25em 0; }
        .markdown-preview code { background: ${theme.colors.background.tertiary}; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: ${theme.colors.text.primary}; }
        .markdown-preview pre { background: ${theme.colors.background.secondary}; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
        .markdown-preview pre code { background: none; padding: 0; }
        .markdown-preview blockquote { border-left: 4px solid ${theme.colors.border.secondary}; margin: 1em 0; padding-left: 16px; color: ${theme.colors.text.muted}; font-style: italic; }
        .markdown-preview a { color: ${theme.colors.text.link}; text-decoration: underline; }
        .markdown-preview hr { border: none; border-top: 1px solid ${theme.colors.border.primary}; margin: 1.5em 0; }
        .markdown-preview img { max-width: 100%; border-radius: 8px; }
        .markdown-preview strong { font-weight: 700; color: ${theme.colors.text.primary}; }
        .markdown-preview em { font-style: italic; color: ${theme.colors.text.tertiary}; }
        .markdown-preview table { border-collapse: collapse; margin: 1em 0; }
        .markdown-preview th, .markdown-preview td { border: 1px solid ${theme.colors.border.primary}; padding: 8px 12px; }
        .markdown-preview th { background: ${theme.colors.background.tertiary}; font-weight: 600; }
        .preview-button { opacity: ${theme.opacity.muted}; transition: opacity 0.15s; }
        .preview-button:hover { opacity: 1; }
        .logout-button { opacity: ${theme.opacity.muted}; transition: opacity 0.15s; }
        .logout-button:hover { opacity: 1; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            padding: '8px',
            flex: 1
          }}
        />
        <button
          onClick={() => setIsPreview(!isPreview)}
          className="preview-button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px 8px', fontSize: 12 }}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {isPreview ? (
        <div style={{ padding: '8px', flex: 1, overflowY: 'auto', background: 'transparent', color: theme.colors.text.primary }} className="markdown-preview">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            padding: '8px',
            flex: 1,
            resize: 'none'
          }}
        />
      )}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ opacity: theme.opacity.muted }}>{pb.authStore.model?.email}</span>
        <button onClick={handleLogout} className="logout-button" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}>Logout</button>
      </div>
    </div>
  );
});

NoteEditor.displayName = 'NoteEditor';

export default NoteEditor;