import React, { useState } from 'react';
import StartPage from './pages/StartPage';
import ReaderPage from './pages/ReaderPage';

function App() {
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);

  const handleOpenBook = (bookId: string) => {
    setCurrentBookId(bookId);
  };

  const handleCloseBook = () => {
    setCurrentBookId(null);
  };

  return (
    <div className="app">
      {currentBookId ? (
        <ReaderPage bookId={currentBookId} onClose={handleCloseBook} />
      ) : (
        <StartPage onOpenBook={handleOpenBook} />
      )}
    </div>
  );
}

export default App;
