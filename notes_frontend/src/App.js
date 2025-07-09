import React, { useState, useRef } from 'react';
import './App.css';

// Define colors and theme
const COLORS = {
  accent: "#ffca28",
  primary: "#1976d2",
  secondary: "#424242"
};

// PUBLIC_INTERFACE
function App() {
  // Notes state -- each note: {id, title, content, updated}
  const [notes, setNotes] = useState([
    { id: 1, title: "Welcome!", content: "This is your first note.", updated: new Date() }
  ]);
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0].id);
  const [editingNote, setEditingNote] = useState(null); // note id or null if not editing
  const [showSidebar, setShowSidebar] = useState(true);

  // For responsive: collapse sidebar on mobile menu tap
  const sidebarRef = useRef();

  // Helper: find note by id
  const findNote = (id) => notes.find(n => n.id === id);

  // PUBLIC_INTERFACE
  const handleAddNote = () => {
    const newId = notes.length === 0
      ? 1
      : Math.max(...notes.map(n => n.id)) + 1;
    const newNote = { id: newId, title: "Untitled", content: "", updated: new Date() };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newId);
    setEditingNote(newId);
  };

  // PUBLIC_INTERFACE
  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
    setEditingNote(null);
    // If sidebar is collapsed on mobile, close it after selection
    if (window.innerWidth <= 768) setShowSidebar(false);
  };

  // PUBLIC_INTERFACE
  const handleDeleteNote = (id) => {
    const idx = notes.findIndex(n => n.id === id);
    const newList = notes.filter(n => n.id !== id);
    setNotes(newList);

    if (idx === -1) return;
    if (id === selectedNoteId && newList.length > 0) {
      setSelectedNoteId(newList[Math.min(idx, newList.length-1)].id);
    } else if (newList.length === 0) {
      setSelectedNoteId(null);
    }
    setEditingNote(null);
  };

  // PUBLIC_INTERFACE
  const handleEditNote = (id) => {
    setEditingNote(id);
  };

  // PUBLIC_INTERFACE
  const handleSaveNote = (id, newTitle, newContent) => {
    setNotes(notes.map(n => (
      n.id === id
        ? { ...n, title: newTitle || "Untitled", content: newContent, updated: new Date() }
        : n
    )));
    setEditingNote(null);
  };

  // Keyboard shortcuts: Cmd/Ctrl+B for new note
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleAddNote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [notes]);

  // Responsive sidebar: hide by default on mobile
  React.useEffect(() => {
    const resizeListener = () => {
      if (window.innerWidth > 768) {
        setShowSidebar(true);
      }
    };
    window.addEventListener('resize', resizeListener);
    return () => window.removeEventListener('resize', resizeListener);
  }, []);

  const selectedNote = notes.length > 0 ? findNote(selectedNoteId) : null;

  return (
    <div className="notes-root light-theme">
      <div className="navbar" style={{background: COLORS.primary}}>
        <div className="navbar-title" style={{color: "#fff", fontWeight: 700}}>
          <span style={{marginRight: 8}}>📝</span> Notemaster
        </div>
        <button
          className="navbar-add-btn"
          onClick={handleAddNote}
          style={{background: COLORS.accent, color: "#fff"}}
          title="New Note (Ctrl+B)"
        >
          ＋ Add Note
        </button>
        <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
          ☰
        </button>
      </div>
      <div className="main-container">
        <aside
          className={`sidebar ${showSidebar ? "open" : ""}`}
          ref={sidebarRef}
        >
          <NotesList
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelect={handleSelectNote}
            onDelete={handleDeleteNote}
            onEdit={handleEditNote}
            accentColor={COLORS.accent}
            secondaryColor={COLORS.secondary}
          />
        </aside>
        <main className="main">
          {selectedNote ? (
            editingNote === selectedNote.id
              ? (
                <NoteEditor
                  note={selectedNote}
                  onSave={(title, content) =>
                    handleSaveNote(selectedNote.id, title, content)
                  }
                  onCancel={() => setEditingNote(null)}
                  accentColor={COLORS.accent}
                  primaryColor={COLORS.primary}
                />
              )
              : (
                <NoteViewer
                  note={selectedNote}
                  onEdit={() => handleEditNote(selectedNote.id)}
                  accentColor={COLORS.accent}
                />
              )
          ) : (
            <EmptyState accentColor={COLORS.accent} />
          )}
        </main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NotesList({ notes, selectedNoteId, onSelect, onDelete, onEdit, accentColor, secondaryColor }) {
  return (
    <div className="notes-list">
      <div className="notes-list-header" style={{color: secondaryColor}}>
        Notes
      </div>
      {notes.length === 0 ? (
        <div className="notes-list-empty">No notes yet.</div>
      ) : (
        <ul className="notes-scrolllist">
          {notes.map(note => (
            <li
              key={note.id}
              className={`note-item${note.id === selectedNoteId ? " selected" : ""}`}
              onClick={() => onSelect(note.id)}
              aria-label={`Select note: ${note.title}`}
              tabIndex={0}
              style={{
                borderLeft: note.id === selectedNoteId ? `4px solid ${accentColor}` : "4px solid transparent"
              }}
            >
              <div className="note-item-title">
                {note.title.length > 32
                  ? note.title.substr(0, 32) + "…"
                  : note.title }
              </div>
              <div className="note-item-actions">
                <button
                  className="icon-btn"
                  onClick={e => {e.stopPropagation(); onEdit(note.id);}}
                  title="Edit"
                  aria-label="Edit"
                  style={{color: accentColor}}
                >✎</button>
                <button
                  className="icon-btn"
                  onClick={e => {e.stopPropagation(); onDelete(note.id);}}
                  title="Delete"
                  aria-label="Delete"
                >🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteViewer({ note, onEdit, accentColor }) {
  return (
    <div className="note-viewer">
      <div className="note-viewer-header">
        <h2>{note.title}</h2>
        <button
          className="accent-btn"
          onClick={onEdit}
          style={{background: accentColor}}
        >Edit</button>
      </div>
      <div className="note-viewer-content">
        <pre>{note.content || <span style={{opacity: 0.5}}>No content.</span>}</pre>
      </div>
      <div className="note-viewer-updated">
        Last updated: {note.updated ? new Date(note.updated).toLocaleString() : "Unknown"}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onSave, onCancel, accentColor, primaryColor }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  return (
    <form
      className="note-editor"
      onSubmit={e => {
        e.preventDefault();
        onSave(title, content);
      }}
      spellCheck={true}
    >
      <input
        className="note-title-input"
        style={{borderColor: primaryColor}}
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={64}
        aria-label="Note title"
        required
      />
      <textarea
        className="note-content-input"
        style={{borderColor: primaryColor}}
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={10}
        aria-label="Note content"
        required
      />
      <div className="editor-buttons">
        <button
          className="accent-btn"
          type="submit"
          style={{background: accentColor}}
        >Save</button>
        <button
          className="plain-btn"
          type="button"
          onClick={onCancel}
        >Cancel</button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
function EmptyState({ accentColor }) {
  return (
    <div className="empty-state" style={{textAlign: "center", opacity: 0.6, marginTop: "3rem"}}>
      <div style={{fontSize: "3rem"}}>🗒️</div>
      <div style={{fontWeight: 600, margin: "0.5rem 0"}}>No note selected</div>
      <p>
        Click <span style={{color: accentColor, fontWeight: 500}}>＋ Add Note</span> to create your first note.
      </p>
    </div>
  );
}

export default App;

