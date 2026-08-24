import { useEffect, useRef, useState } from "react";

import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  User,
  LoaderCircle,
  MessageCircle,
} from "lucide-react";

import "./App.css";

const suggestions = [
  "Explain artificial intelligence in simple terms.",
  "Give me 5 Python project ideas.",
  "What is the difference between SQL and NoSQL?",
  "Help me prepare for a technical interview.",
];

function App() {
  // Stores the entire conversation
  const [messages, setMessages] = useState([]);

  // Stores what the user is currently typing
  const [input, setInput] = useState("");

  // Shows whether the AI is responding
  const [loading, setLoading] = useState(false);

  // Used to automatically scroll to the newest message
  const messagesEndRef = useRef(null);

  // Automatically scroll to the bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Send a message to the backend
  const sendMessage = async (messageText = input) => {
    const trimmedMessage = messageText.trim();

    // Don't send empty messages
    if (!trimmedMessage || loading) {
      return;
    }

    // Create the user's message
    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    /*
      Add the new user message to the existing conversation.

      Example:

      First message:
      [
        {
          role: "user",
          content: "Hello"
        }
      ]

      Second message:
      [
        {
          role: "user",
          content: "Hello"
        },
        {
          role: "assistant",
          content: "Hi! How can I help?"
        },
        {
          role: "user",
          content: "What is Python?"
        }
      ]
    */
    const updatedMessages = [...messages, userMessage];

    // Immediately display the user's message
    setMessages(updatedMessages);

    // Clear input box
    setInput("");

    // Show loading
    setLoading(true);

    try {
      // Send the ENTIRE conversation to our backend
const response = await fetch("http://localhost:5000/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: updatedMessages,
  }),
});

      const data = await response.json();

      // Check if backend returned an error
      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Create the AI message
      const assistantMessage = {
        role: "assistant",
        content: data.message,
      };

      /*
        Add the AI response to the conversation.

        This is important because the AI response becomes
        part of the conversation history for the next question.
      */
      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Error:", error);

      // Show an error inside the chat
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the AI server. Please make sure the backend is running.",
          error: true,
        },
      ]);
    } finally {
      // Stop loading
      setLoading(false);
    }
  };

  // Handle pressing Send
  const handleSubmit = (event) => {
    event.preventDefault();

    sendMessage();
  };

  // Clear the entire conversation
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="app">
      {/* ================= NAVBAR ================= */}

      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Bot size={24} />
          </div>

          <div>
            <h1>AI Assistant</h1>

            <span>Powered by OpenAI</span>
          </div>
        </div>

        <button
          className="clear-button"
          onClick={clearChat}
          disabled={messages.length === 0}
        >
          <Trash2 size={18} />

          Clear
        </button>
      </header>

      {/* ================= MAIN CHAT ================= */}

      <main className="chat-container">
        {messages.length === 0 ? (
          /* ================= WELCOME SCREEN ================= */

          <section className="welcome">
            <div className="welcome-icon">
              <Sparkles size={34} />
            </div>

            <h2>How can I help you?</h2>

            <p>
              Ask me anything about programming, technology, studying,
              projects, or general topics.
            </p>

            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="suggestion-card"
                  onClick={() => sendMessage(suggestion)}
                >
                  <MessageCircle size={18} />

                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          /* ================= MESSAGE HISTORY ================= */

          <section className="messages">
            {messages.map((message, index) => (
              <div
                className={`message-row ${message.role}`}
                key={`${message.role}-${index}`}
              >
                {/* Avatar */}

                <div className="avatar">
                  {message.role === "user" ? (
                    <User size={18} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>

                {/* Message */}

                <div
                  className={`message ${
                    message.error ? "error-message" : ""
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}

            {loading && (
              <div className="message-row assistant">
                <div className="avatar">
                  <Bot size={18} />
                </div>

                <div className="message loading-message">
                  <LoaderCircle className="spinner" size={18} />

                  Thinking...
                </div>
              </div>
            )}

            {/* Invisible element used for scrolling */}

            <div ref={messagesEndRef} />
          </section>
        )}

        {/* ================= INPUT ================= */}

        <form className="input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Message AI Assistant..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <LoaderCircle className="spinner" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>

        <p className="disclaimer">
          AI can make mistakes. Check important information.
        </p>
      </main>
    </div>
  );
}

export default App;
