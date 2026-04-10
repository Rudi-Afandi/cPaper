import { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import pb from '../lib/pocketbase';

export default function NoteList({ folderId, selectedNoteId, onSelectNote, onNewNote, refreshFlag }) {
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
    try {
      let filter = '';
      if (folderId) {
        filter = `folder = "${folderId}"`;
      }

      const records = await pb.collection('notes').getFullList({
        sort: '-created',
        filter,
      });
      setNotes(records);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [folderId, refreshFlag]);

  const deleteNote = async (noteId) => {
    try {
      await pb.collection('notes').delete(noteId);
      if (selectedNoteId === noteId) {
        onSelectNote(null);
      }
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-48 h-full flex flex-col zed-sidebar">
      <div className="zed-sidebar-header">
        <div className="flex items-center justify-between">
          <span>Notes</span>
          <Button
            size="sm"
            color="primary"
            onPress={onNewNote}
            className="zed-button primary"
          >
            +
          </Button>
        </div>
      </div>

      <div className="zed-sidebar-content">
        {notes.length === 0 ? (
          <div className="zed-text-secondary text-sm text-center py-8">
            No notes yet
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`zed-list-item ${selectedNoteId === note.id ? 'selected' : ''}`}
                onClick={() => onSelectNote(note)}
              >
                <div className="flex flex-col w-full">
                  {/* Title */}
                  <h3 className="text-sm font-medium text-foreground truncate zed-text-accent mb-1">
                    {note.title || 'Untitled'}
                  </h3>
                  
                  {/* Preview */}
                  {note.content && (
                    <p className="text-xs text-foreground-70 line-clamp-2 zed-text-secondary mb-2">
                      {note.content.substring(0, 80)}
                    </p>
                  )}
                  
                  {/* Date */}
                  <div className="flex items-center justify-between">
                    <span className="zed-text-secondary text-xs">
                      {formatDate(note.created)}
                    </span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="zed-button danger"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}