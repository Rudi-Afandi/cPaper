import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import pb from '../lib/pocketbase';
import { theme } from '../lib/theme';

const NoteEditor = forwardRef(({ note, onSave, refreshNotes }, ref) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const isNoteChanging = useRef(false);
  const savedNoteRef = useRef(null);
  const isSavingRef = useRef(false);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);
  const lastSyncedTitleRef = useRef('');
  const lastSyncedContentRef = useRef('');

  useEffect(() => {
    const cleanup = () => {
      clearTimeout(typingTimerRef.current);
      if (savedNoteRef.current?.id) {
        localStorage.removeItem(`unsaved_note_${savedNoteRef.current.id}`);
      }
    };

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    isNoteChanging.current = true;
    if (note) {
      const unsavedData = localStorage.getItem(`unsaved_note_${note.id}`);
      if (unsavedData) {
        const { title: savedTitle, content: savedContent } = JSON.parse(unsavedData);
        setTitle(savedTitle);
        setContent(savedContent);
      } else {
        setTitle(note.title || '');
        setContent(note.content || '');
      }
      savedNoteRef.current = note.id ? note : null;
      lastSyncedTitleRef.current = note.title || '';
      lastSyncedContentRef.current = note.content || '';
    } else {
      setTitle('');
      setContent('');
      savedNoteRef.current = null;
      lastSyncedTitleRef.current = '';
      lastSyncedContentRef.current = '';
    }
    setIsPreview(false);
    isSavingRef.current = false;
    isTypingRef.current = false;
    clearTimeout(typingTimerRef.current);
    setTimeout(() => {
      isNoteChanging.current = false;
    }, 100);
  }, [note]);

  const handleLogout = () => {
    pb.authStore.clear();
    window.location.href = '/login';
  };

  const handleTyping = useCallback(() => {
    isTypingRef.current = true;
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 2000);
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    handleTyping();
    setTitle(newTitle);
    if (savedNoteRef.current?.id) {
      localStorage.setItem(`unsaved_note_${savedNoteRef.current.id}`, JSON.stringify({
        title: newTitle,
        content: content
      }));
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    console.log('Paste event detected, items:', items);
    
    for (const item of items) {
      console.log('Item type:', item.type, 'Kind:', item.kind);
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        console.log('Image file:', file);
        
        if (file) {
          try {
            const formData = new FormData();
            formData.append('images', file);
            if (savedNoteRef.current?.id) {
              formData.append('notes', savedNoteRef.current?.id);
              console.log('Note ID:', savedNoteRef.current?.id);
            } else {
              console.log('No note ID found');
            }
            
            console.log('Uploading image with field name: images');
            const imageRecord = await pb.collection('images').create(formData);
            console.log('Image uploaded successfully:', imageRecord);
            
            const baseUrl = pb.baseUrl.endsWith('/') ? pb.baseUrl.slice(0, -1) : pb.baseUrl;
            const token = pb.authStore.token;
            const imageUrl = `${baseUrl}/api/files/images/${imageRecord.id}/${imageRecord.images}${token ? '?token=' + token : ''}`;
            console.log('Image URL:', imageUrl);
            
            const imageMarkdown = `

![${file.name}](${imageUrl})

`;
            const newContent = content + imageMarkdown;
            setContent(newContent);
            
            if (savedNoteRef.current?.id) {
              localStorage.setItem(`unsaved_note_${savedNoteRef.current.id}`, JSON.stringify({
                title: title,
                content: newContent
              }));
            }
          } catch (err) {
            console.error('Failed to upload image:', err);
            console.error('Error details:', err.message);
            console.error('Error data:', err.data);
          }
        }
        break;
      }
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    handleTyping();
    setContent(newContent);
    if (savedNoteRef.current?.id) {
      localStorage.setItem(`unsaved_note_${savedNoteRef.current.id}`, JSON.stringify({
        title: title,
        content: newContent
      }));
    }
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
    const syncInterval = setInterval(async () => {
      if (isTypingRef.current || isSavingRef.current) return;

      const currentTitle = title.trim();
      if (!currentTitle) return;

      const hasTitleChanged = title !== lastSyncedTitleRef.current;
      const hasContentChanged = content !== lastSyncedContentRef.current;

      if (hasTitleChanged || hasContentChanged) {
        isSavingRef.current = true;

        try {
          const data = {
            title: currentTitle,
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

          lastSyncedTitleRef.current = title;
          lastSyncedContentRef.current = content;

          if (savedNoteRef.current?.id) {
            localStorage.removeItem(`unsaved_note_${savedNoteRef.current.id}`);
          }

          if (savedNote) {
            onSave(savedNote);
            refreshNotes?.();
          }
        } catch (err) {
          console.error('Failed to sync note:', err);
        } finally {
          isSavingRef.current = false;
        }
      }
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [title, content, onSave, refreshNotes]);

  if (!note && !title) {
    return null;
  }

  return (
    <div className="note-editor-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', padding: '48px 20%', position: 'relative', background: theme.colors.background.primary, color: theme.colors.text.primary }}>
      <style>{`
        @media (max-width: 768px) {
          .note-editor-container { padding: 48px 16px !important; }
        }
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
        .markdown-preview img { max-width: 100%; border-radius: 8px; margin: 1em 0; }
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
          onChange={handleTitleChange}
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
      </div>
      {isPreview ? (
        <div style={{ padding: '8px', flex: 1, overflowY: 'auto', background: 'transparent', color: theme.colors.text.primary }} className="markdown-preview">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ node, ...props }) => <img style={{ maxWidth: '100%', borderRadius: '8px', margin: '1em 0' }} {...props} />
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleContentChange}
          onPaste={handlePaste}
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
      <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setIsPreview(!isPreview)}
          className="preview-button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px 8px', fontSize: 12 }}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ opacity: theme.opacity.muted, fontSize: 12 }}>{pb.authStore.model?.email}</span>
          <button onClick={handleLogout} className="logout-button" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', fontSize: 12, padding: '4px 8px' }}>Logout</button>
        </div>
      </div>
    </div>
  );
});

NoteEditor.displayName = 'NoteEditor';

export default NoteEditor;