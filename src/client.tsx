import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { useGameConnection } from "./useGameConnection";
import ScreenMode from "./ScreenMode";
import PlayerMode from "./PlayerMode";

function App() {
  const { isConnected, isPlayer } = useGameConnection();

  if (!isConnected) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center overflow-hidden animate-fadeIn">
        <div className="text-center animate-slideUp">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-white absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-white text-lg font-medium animate-fadeIn">Connecting to game...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (isPlayer) {
    return <PlayerMode />;
  }

  return <ScreenMode />;
}

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);
root.render(<App />);
