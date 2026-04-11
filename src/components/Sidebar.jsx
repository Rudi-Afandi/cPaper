import { useState, useEffect, useMemo } from "react";
import { TrashBin, Plus, ChevronDown, ChevronRight } from "@gravity-ui/icons";
import pb from "../lib/pocketbase";
import { theme } from "../lib/theme";

export default function Sidebar({
  onSelectNote,
  showNotes,
  onClose,
  onToggle,
  onNewNote,
  onNotesRefreshed,
}) {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const fetchNotes = async () => {
    try {
      const records = await pb.collection("notes").getFullList({
        sort: "-created",
        filter: `owner.id="${pb.authStore.model.id}"`,
        expand: "folder",
      });
      setNotes(records);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    }
  };

  const fetchFolders = async () => {
    try {
      const records = await pb.collection("folders").getFullList({
        sort: "name",
        filter: `owner.id="${pb.authStore.model.id}"`,
      });
      setFolders(records);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    try {
      await pb.collection("notes").delete(noteId);
      await fetchNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation();
    try {
      const folderNotes = getFolderNotes(folderId);
      for (const note of folderNotes) {
        await pb.collection("notes").update(note.id, { folder: null });
      }
      await pb.collection("folders").delete(folderId);
      await fetchFolders();
      await fetchNotes();
      onNotesRefreshed?.();
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName || !folderName.trim()) return;

    try {
      await pb.collection("folders").create({
        name: folderName.trim(),
        owner: pb.authStore.model.id,
      });
      await fetchFolders();
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const toggleFolder = (folderId) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, [showNotes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById("notes-sidebar");
      const toggle = document.querySelector(".notes-toggle");
      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        onClose();
      }
    };

    if (showNotes) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotes, onClose]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.background = theme.colors.background.hover;
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    e.currentTarget.style.background = "transparent";
  };

  const handleDrop = async (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.background = "transparent";

    const noteId = e.dataTransfer.getData("text/plain");
    if (!noteId) return;

    try {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;

      await pb.collection("notes").update(noteId, { folder: folderId });
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, folder: [folder] } : note,
        ),
      );
      onNotesRefreshed?.();
    } catch (err) {
      console.error("Failed to move note to folder:", err);
    }
  };

  const handleNoteDragStart = (e, noteId) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", noteId);
  };

  const handleFolderClick = (e, folderId) => {
    e.stopPropagation();
    toggleFolder(folderId);
  };

  const uncategorizedNotes = useMemo(() => {
    return notes.filter((note) => {
      if (
        !note.folder ||
        !Array.isArray(note.folder) ||
        note.folder.length === 0
      )
        return true;
      const folderItem = note.folder[0];
      if (!folderItem) return true;
      const folderId =
        typeof folderItem === "object" && folderItem.id
          ? folderItem.id
          : folderItem;
      return !folders.some((folder) => folder.id === folderId);
    });
  }, [notes, folders]);

  const getFolderNotes = (folderId) => {
    return notes.filter((note) => {
      if (
        !note.folder ||
        !Array.isArray(note.folder) ||
        note.folder.length === 0
      )
        return false;
      const folderItem = note.folder[0];
      if (!folderItem) return false;
      const noteFolderId =
        typeof folderItem === "object" && folderItem.id
          ? folderItem.id
          : folderItem;
      return noteFolderId === folderId;
    });
  };

  return (
    <div>
      <div
        className="notes-toggle"
        onClick={onToggle}
        style={{
          position: "fixed",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: theme.opacity.subtle,
          transition: "opacity 0.2s",
          zIndex: 50,
        }}
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            padding: `${theme.spacing.xl}px ${theme.spacing.md}px`,
            cursor: "pointer",
            background: theme.colors.background.tertiary,
            borderRadius: `0 ${theme.radius.md}px ${theme.radius.md}px 0`,
            color: theme.colors.text.primary,
            fontSize: 13,
            opacity: isHovered ? 1 : theme.opacity.disabled,
            transition: "opacity 0.2s",
          }}
        >
          {showNotes ? "← Notes" : "Notes →"}
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
        .icon-button { opacity: ${theme.opacity.muted}; transition: opacity 0.15s; }
        .icon-button:hover { opacity: 1; }
        .delete-button { opacity: 0.3; transition: opacity 0.15s; }
        .delete-button:hover { opacity: 1; }
        .note-item { transition: background 0.15s; }
        .note-item:hover { background: ${theme.colors.background.hover}; }
      `}</style>

      {showNotes && (
        <div
          id="notes-sidebar"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            width: 280,
            background: theme.colors.background.secondary,
            padding: theme.spacing.lg,
            overflowY: "auto",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: theme.colors.text.primary,
              }}
            >
              Notes
            </span>
            <button
              onClick={onNewNote}
              title="New note"
              className="icon-button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: theme.colors.text.primary,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Plus style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing.sm,
            }}
          >
            {folders.map((folder) => {
              const folderNotes = getFolderNotes(folder.id);
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
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: theme.spacing.xs,
                      color: theme.colors.text.tertiary,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.6,
                      }}
                    >
                      {isCollapsed ? (
                        <ChevronRight style={{ width: 14, height: 14 }} />
                      ) : (
                        <ChevronDown style={{ width: 14, height: 14 }} />
                      )}
                    </span>
                    <span>{folder.name}</span>
                    <span style={{ opacity: 0.5, fontSize: 11 }}>
                      {" "}
                      ({folderNotes.length})
                    </span>
                    <button
                      onClick={(e) => handleDeleteFolder(e, folder.id)}
                      className="delete-button"
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: theme.colors.text.danger,
                        padding: theme.spacing.xs,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <TrashBin style={{ width: 14, height: 14 }} />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div
                      style={{
                        marginLeft: theme.spacing.md,
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.spacing.xs,
                      }}
                    >
                      {folderNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(note);
                          }}
                          draggable
                          onDragStart={(e) => handleNoteDragStart(e, note.id)}
                          className="note-item"
                          style={{
                            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                            borderRadius: theme.radius.sm,
                            cursor: "pointer",
                            background: theme.colors.background.transparent,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div
                              style={{
                                fontWeight: 500,
                                fontSize: 13,
                                color: theme.colors.text.primary,
                              }}
                            >
                              {note.title || "Untitled"}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                opacity: theme.opacity.disabled,
                                color: theme.colors.text.tertiary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                marginTop: 2,
                              }}
                            >
                              {note.content?.substring(0, 60) || "No content"}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNote(e, note.id)}
                            className="delete-button"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: theme.colors.text.danger,
                              padding: theme.spacing.xs,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <TrashBin style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      ))}
                      {folderNotes.length === 0 && (
                        <div
                          style={{
                            textAlign: "center",
                            opacity: theme.opacity.disabled,
                            padding: theme.spacing.md,
                            color: theme.colors.text.tertiary,
                            fontSize: 11,
                          }}
                        >
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
                    e.currentTarget.style.background = "transparent";
                    const noteId = e.dataTransfer.getData("text/plain");
                    if (noteId) {
                      try {
                        await pb
                          .collection("notes")
                          .update(noteId, { folder: null });
                        setNotes((prevNotes) =>
                          prevNotes.map((note) =>
                            note.id === noteId
                              ? { ...note, folder: null }
                              : note,
                          ),
                        );
                        onNotesRefreshed?.();
                      } catch (err) {
                        console.error(
                          "Failed to move note to uncategorized:",
                          err,
                        );
                      }
                    }
                  }}
                  style={{
                    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                    color: theme.colors.text.tertiary,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginTop: theme.spacing.md,
                    userSelect: "none",
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
                    className="note-item"
                    style={{
                      padding: theme.spacing.md,
                      borderRadius: theme.radius.md,
                      cursor: "pointer",
                      background: theme.colors.background.transparent,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: theme.colors.text.primary,
                        }}
                      >
                        {note.title || "Untitled"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          opacity: theme.opacity.disabled,
                          color: theme.colors.text.tertiary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 4,
                        }}
                      >
                        {note.content?.substring(0, 60) || "No content"}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      className="delete-button"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: theme.colors.text.danger,
                        padding: theme.spacing.xs,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <TrashBin style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ))}
                {uncategorizedNotes.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      opacity: theme.opacity.disabled,
                      padding: theme.spacing.md,
                      color: theme.colors.text.tertiary,
                      fontSize: 11,
                    }}
                  >
                    No notes
                  </div>
                )}
              </>
            )}

            {folders.length === 0 && uncategorizedNotes.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  opacity: theme.opacity.disabled,
                  padding: theme.spacing.xl,
                  color: theme.colors.text.tertiary,
                  fontSize: 13,
                }}
              >
                No notes or folders yet
              </div>
            )}

            <div
              style={{
                marginTop: "auto",
                paddingTop: theme.spacing.md,
              }}
            >
              <button
                onClick={handleCreateFolder}
                style={{
                  width: "100%",
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  background: "none",
                  border: "none",
                  borderRadius: theme.radius.sm,
                  cursor: "pointer",
                  color: theme.colors.text.tertiary,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing.xs,
                  opacity: theme.opacity.muted,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = 1)}
                onMouseLeave={(e) =>
                  (e.target.style.opacity = theme.opacity.muted)
                }
              >
                <Plus style={{ width: 16, height: 16 }} />
                Add folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
