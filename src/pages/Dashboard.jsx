import { useState, useEffect, useRef } from 'react';
import NoteEditor from '../components/NoteEditor';
import Sidebar from '../components/Sidebar';
import pb from '../lib/pocketbase';
import { theme } from '../lib/theme';

export default function Dashboard() {
  const [selectedNote, setSelectedNote] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const forceRefreshRef = useRef(false);
  const hasInitialized = useRef(false);
  const editorRef = useRef(null);
  const isCreatingNoteRef = useRef(false);

  const handleNewNote = async () => {
    if (isCreatingNoteRef.current) return;
    isCreatingNoteRef.current = true;

    try {
      await editorRef.current?.saveNote();

      setSelectedNote({
        id: null,
        title: '',
        content: '',
        folder: null,
        owner: pb.authStore.model?.id,
        isNew: true
      });
      setShowNotes(false);
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setTimeout(() => {
        isCreatingNoteRef.current = false;
      }, 500);
    }
  };

  const loadLastNote = async () => {
    try {
      const records = await pb.collection('notes').getList(1, 1, {
        sort: '-created',
        filter: `owner.id="${pb.authStore.model.id}"`,
      });
      if (records.items.length > 0) {
        setSelectedNote(records.items[0]);
      } else {
        await handleNewNote();
      }
    } catch (err) {
      console.error('Failed to load last note:', err);
      await handleNewNote();
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadLastNote();
    }
  }, []);

  useEffect(() => {
    if (selectedNote?.id) {
      const refreshCurrentNote = async () => {
        try {
          const updatedNote = await pb.collection('notes').getOne(selectedNote.id, { expand: 'folder' });
          console.log('Refreshed selected note:', { id: updatedNote.id, title: updatedNote.title, folder: updatedNote.folder });
          setSelectedNote(updatedNote);
        } catch (err) {
          console.error('Failed to refresh note:', err);
        }
      };
      refreshCurrentNote();
    }
  }, [refreshFlag]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: theme.colors.background.primary }}>
      <Sidebar
        showNotes={showNotes}
        onToggle={() => setShowNotes(!showNotes)}
        onClose={() => setShowNotes(false)}
        onSelectNote={async (note) => {
          await editorRef.current?.saveNote();
          setSelectedNote(note);
          setShowNotes(false);
        }}
        onNewNote={handleNewNote}
        refreshFlag={refreshFlag}
        onNotesRefreshed={() => setRefreshFlag(prev => prev + 1)}
      />
      <div style={{ flex: 1 }}>
        <NoteEditor
          ref={editorRef}
          note={selectedNote}
          onSave={(note) => {
            setSelectedNote(note);
            setRefreshFlag(prev => prev + 1);
          }}
          refreshNotes={() => setRefreshFlag(prev => prev + 1)}
        />
      </div>
    </div>
  );
}