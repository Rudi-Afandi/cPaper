import { useState, useEffect } from 'react';
import { TrashBin, Plus, ChevronDown, ChevronRight } from '@gravity-ui/icons';
import pb from '../lib/pocketbase';
import { theme } from '../lib/theme';

export default function Sidebar({ refreshFlag, onSelectNote, showNotes, onClose, onToggle, onNewNote, onNotesRefreshed }) {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const fetchNotes = async () => {
    try {
      const records = await pb.collection('notes').getFullList({
        sort: '-created',
        filter: `owner.id="${pb.authStore.model.id}"`,
        expand: 'folder',
      });
      console.log('Fetched notes:', records.map(n => ({
        id: n.id,
        title: n.title,
        folder: n.folder,
        folderType: typeof n.folder,
        isArray: Array.isArray(n.folder),
        expand: n.expand
      })));
      setNotes(records);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const records = await pb.collection('folders').getFullList({
        sort: 'name',
        filter: `owner.id="${pb.authStore.model.id}"`,
      });
      console.log('Fetched folders:', records.map(f => ({
        id: f.id,
        name: f.name,
        idType: typeof f.id
      })));
      setFolders(records);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    try {
      await pb.collection('notes').delete(noteId);
      await fetchNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation();
    try {
      const folderNotes = notes.filter(note => {
        if (!note.folder || !Array.isArray(note.folder) || note.folder.length === 0) return false;
        const folderItem = note.folder[0];
        if (!folderItem) return false;
        const noteFolderId = typeof folderItem === 'object' && folderItem.id ? folderItem.id : folderItem;
        return noteFolderId === folderId;
      });
      for (const note of folderNotes) {
        await pb.collection('notes').update(note.id, { folder: null });
      }
      await pb.collection('folders').delete(folderId);
      await fetchFolders();
      await fetchNotes();
      onNotesRefreshed?.();
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    try {
      await pb.collection('folders').create({
        name: folderName.trim(),
        owner: pb.authStore.model.id,
      });
      await fetchFolders();
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const toggleFolder = (folderId) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, [showNotes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById('notes-sidebar');
      const toggle = document.querySelector('.notes-toggle');
      if (sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        onClose();
      }
    };

    if (showNotes) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotes, onClose]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.background = theme.colors.background.hover;
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    e.currentTarget.style.background = 'transparent';
  };

  const handleDrop = async (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.background = 'transparent';

    const noteId = e.dataTransfer.getData('text/plain');
    if (!noteId) return;

    try {
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return;

      console.log('Before update - Note ID:', noteId, 'Folder ID:', folderId, 'Folder:', folder);
      const currentNote = notes.find(n => n.id === noteId);
      console.log('Current note:', currentNote);
      console.log('Current note folder field:', currentNote?.folder, 'Type:', typeof currentNote?.folder);
      
      console.log('Calling update with data:', { folder: folderId });
      await pb.collection('notes').update(noteId, { folder: folderId });
      
      const updatedNote = await pb.collection('notes').getOne(noteId, { expand: 'folder' });
      console.log('Updated note from DB:', {
        id: updatedNote.id,
        title: updatedNote.title,
        folder: updatedNote.folder,
        folderType: typeof updatedNote.folder,
        isArray: Array.isArray(updatedNote.folder)
      });
      
      console.log('After update - Setting note folder to:', folderId);
      
      setNotes(prevNotes => {
        const updated = prevNotes.map(note => note.id === noteId ? { ...note, folder: [folder] } : note);
        console.log('Updated notes state:', updated.map(n => ({ id: n.id, title: n.title, folder: n.folder })));
        return updated;
      });
      
      onNotesRefreshed?.();
    } catch (err) {
      console.error('Failed to move note to folder:', err);
      console.error('Error details:', err.data);
    }
  };

  const handleNoteDragStart = (e, noteId) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', noteId);
  };

  const handleFolderClick = (e, folderId) => {
    e.stopPropagation();
    toggleFolder(folderId);
  };

  const uncategorizedNotes = notes.filter(note => {
    if (!note.folder || !Array.isArray(note.folder) || note.folder.length === 0) return true;
    const folderItem = note.folder[0];
    if (!folderItem) return true;
    const folderId = typeof folderItem === 'object' && folderItem.id ? folderItem.id : folderItem;
    return !folders.some(folder => folder.id === folderId);
  });

  console.log('Debug - Notes:', notes.map(n => ({
    id: n.id,
    title: n.title,
    folder: n.folder,
    folderType: typeof n.folder,
    isArray: Array.isArray(n.folder)
  })));
  console.log('Debug - Folders:', folders.map(f => ({ id: f.id, name: f.name })));
  console.log('Debug - Uncategorized:', {
    count: uncategorizedNotes.length,
    notes: uncategorizedNotes.map(n => ({
      title: n.title,
      folder: n.folder
    }))
  });

  return (
    <div>
      <div
        className="notes-toggle"
        onClick={onToggle}
        style={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: theme.opacity.subtle,
          transition: 'opacity 0.2s',
          zIndex: 50,
        }}
      >
        <div 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed', 
            padding: `${theme.spacing.xl}px ${theme.spacing.md}px`, 
            cursor: 'pointer', 
            background: theme.colors.background.tertiary, 
            borderRadius: `0 ${theme.radius.md}px ${theme.radius.md}px 0`, 
            color: theme.colors.text.primary, 
            fontSize: 13,
            opacity: isHovered ? 1 : theme.opacity.disabled,
            transition: 'opacity 0.2s',
          }}
        >
          {showNotes ? '← Notes' : 'Notes →'}
        </div>
      </div>
      <style>{`
        .notes-toggle:hover {
          opacity: 1 !important;
        }
        #notes-sidebar::-webkit-scrollbar {
          display: none;
        }
        #notes-sidebar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {showNotes && (
        <div id="notes-sidebar" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 280, background: theme.colors.background.secondary, borderRight: `1px solid ${theme.colors.border.primary}`, padding: theme.spacing.lg, overflowY: 'auto', zIndex: 50, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text.primary }}>Notes</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCreateFolder}
                title="New folder"
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: theme.opacity.muted, color: theme.colors.text.primary, display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = theme.opacity.muted}
              >
                <Plus style={{ width: 18, height: 18 }} />
              </button>
              <button
                onClick={onNewNote}
                title="New note"
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: theme.opacity.muted, color: theme.colors.text.primary, display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = theme.opacity.muted}
              >
                <Plus style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {folders.map((folder) => {
              const folderNotes = notes.filter(note => {
                if (!note.folder || !Array.isArray(note.folder) || note.folder.length === 0) return false;
                const folderItem = note.folder[0];
                if (!folderItem) return false;
                const folderId = typeof folderItem === 'object' && folderItem.id ? folderItem.id : folderItem;
                console.log(`Checking note ${note.title}:`, { folderId, expectedId: folder.id, match: folderId === folder.id });
                return folderId === folder.id;
              });
              const isCollapsed = collapsedFolders[folder.id];

              return (
                <div key={folder.id}>
                  <div
                    onClick={(e) => handleFolderClick(e, folder.id)}
                    draggable
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    style={{
                      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                      borderRadius: theme.radius.sm,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      color: theme.colors.text.tertiary,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                      {isCollapsed ? <ChevronRight style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                    </span>
                    <span>{folder.name}</span>
                    <span style={{ opacity: 0.5, fontSize: 11 }}> ({folderNotes.length})</span>
                    <button
                      onClick={(e) => handleDeleteFolder(e, folder.id)}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 0.3,
                        color: theme.colors.text.danger,
                        padding: theme.spacing.xs,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
                    >
                      <TrashBin style={{ width: 14, height: 14 }} />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div style={{ marginLeft: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      {folderNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(note);
                          }}
                          draggable
                          onDragStart={(e) => handleNoteDragStart(e, note.id)}
                          style={{
                            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                            borderRadius: theme.radius.sm,
                            cursor: 'pointer',
                            background: theme.colors.background.transparent,
                            transition: 'background 0.15s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.background.hover}
                          onMouseLeave={(e) => e.currentTarget.style.background = theme.colors.background.transparent}
                        >
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 500, fontSize: 13, color: theme.colors.text.primary }}>{note.title || 'Untitled'}</div>
                            <div style={{ fontSize: 11, opacity: theme.opacity.disabled, color: theme.colors.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                              {note.content?.substring(0, 60) || 'No content'}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNote(e, note.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, color: theme.colors.text.danger, padding: theme.spacing.xs, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
                          >
                            <TrashBin style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      ))}
                      {folderNotes.length === 0 && (
                        <div style={{ textAlign: 'center', opacity: theme.opacity.disabled, padding: theme.spacing.md, color: theme.colors.text.tertiary, fontSize: 11 }}>
                          No notes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(uncategorizedNotes.length > 0 || folders.length === 0) && (
              <>
                <div
                  draggable
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.style.background = 'transparent';
                    const noteId = e.dataTransfer.getData('text/plain');
                    if (noteId) {
                      try {
                        await pb.collection('notes').update(noteId, { folder: null });
                        setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? { ...note, folder: null } : note));
                        onNotesRefreshed?.();
                      } catch (err) {
                        console.error('Failed to move note to uncategorized:', err);
                      }
                    }
                  }}
                  style={{
                    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                    color: theme.colors.text.tertiary,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: theme.spacing.md,
                    userSelect: 'none'
                  }}
                >
                  Uncategorized
                </div>
                {uncategorizedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNote(note);
                    }}
                    draggable
                    onDragStart={(e) => handleNoteDragStart(e, note.id)}
                    style={{
                      padding: theme.spacing.md,
                      borderRadius: theme.radius.md,
                      cursor: 'pointer',
                      background: theme.colors.background.transparent,
                      transition: 'background 0.15s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.background.hover}
                    onMouseLeave={(e) => e.currentTarget.style.background = theme.colors.background.transparent}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.text.primary }}>{note.title || 'Untitled'}</div>
                      <div style={{ fontSize: 12, opacity: theme.opacity.disabled, color: theme.colors.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
                        {note.content?.substring(0, 60) || 'No content'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, color: theme.colors.text.danger, padding: theme.spacing.xs, display: 'flex', alignItems: 'center' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
                    >
                      <TrashBin style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ))}
                {uncategorizedNotes.length === 0 && (
                  <div style={{ textAlign: 'center', opacity: theme.opacity.disabled, padding: theme.spacing.md, color: theme.colors.text.tertiary, fontSize: 11 }}>
                    No notes
                  </div>
                )}
              </>
            )}

            {folders.length === 0 && uncategorizedNotes.length === 0 && (
              <div style={{ textAlign: 'center', opacity: theme.opacity.disabled, padding: theme.spacing.xl, color: theme.colors.text.tertiary, fontSize: 13 }}>
                No notes or folders yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}