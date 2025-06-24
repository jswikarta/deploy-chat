import { useEffect, useRef, useState } from "react";
import userImage from "../assets/user.png";
import FormChat from "./components/FormChat";
import Navbar from "./Navbar";

function Chat({ ws, selectedRoom, setSelectedRoom }) {
  const [firstLoad, setFirstLoad] = useState([]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref untuk div chat messages
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollToBottom = (behavior) => {
    messagesEndRef.current?.scrollIntoView({ behavior: behavior });
  };

  useEffect(() => {
    if (messages.length > firstLoad.length) {
      scrollToBottom("smooth");
    } else {
      scrollToBottom("auto");
    }
  }, [messages, firstLoad]);

  useEffect(() => {
    const fetchChat = async (id) => {
      const response = await fetch(
        `https://www.chat.neuvgame.my.id/rooms/${id}/chats`,
      );
      const data = await response.json();
      setMessages(data);
      setFirstLoad(data);
    };

    fetchChat(selectedRoom.id);
  }, [selectedRoom.id]);

  useEffect(() => {
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "ping") return;
      if (data.type === "welcome") return;
      if (data.type === "confirm_subscription") return;

      const identifier = JSON.parse(data.identifier || "{}");
      if (
        identifier.channel === "ChatChannel" &&
        identifier.room_id === selectedRoom.id
      ) {
        setMessages((prevData) => [...prevData, data.message]);
      }
    };
  }, [ws, selectedRoom.id]);

  useEffect(() => {
    const handleResize = () => {
      // Ini adalah cara yang sangat sederhana dan tidak 100% akurat
      // untuk mendeteksi keyboard virtual.
      // Anda mungkin perlu menyesuaikan ambang batas (threshold) ini.
      const initialViewportHeight = window.innerHeight;
      const currentViewportHeight = window.visualViewport.height; // Lebih baik menggunakan visualViewport

      // Jika tinggi visualViewport berkurang secara signifikan, kemungkinan keyboard terbuka
      if (initialViewportHeight - currentViewportHeight > 100) {
        // Angka 100 ini bisa disesuaikan
        setKeyboardOpen(true);
      } else {
        setKeyboardOpen(false);
      }
    };

    // Gunakan window.visualViewport jika tersedia (lebih akurat untuk keyboard virtual)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return (
    <>
      <div className="flex max-h-screen flex-col bg-gray-200">
        <Navbar selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />

        <div
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto px-8 pt-14 ${
            keyboardOpen ? "pb-[var(--keyboard-height)]" : "pb-24" // Sesuaikan padding-bottom
          }`}
          style={{
            paddingBottom: keyboardOpen
              ? `${window.innerHeight - window.visualViewport.height + 20}px`
              : "6rem", // Menambah padding sesuai tinggi keyboard
          }}
        >
          <ul className="flex flex-col justify-end">
            <li className="h-5"></li>
            {messages.length > 0 &&
              messages.map((message) => (
                <li className="flex pt-2" key={message.id}>
                  <img
                    src={userImage}
                    className="mr-4 h-12 w-12 rounded-full border border-green-400"
                  />
                  <div className="">
                    <div className="rounded-tr-xl rounded-br-xl rounded-bl-xl bg-white px-4 py-2 shadow-sm">
                      <div className="text-blue-600">{message.name}</div>
                      <div className="break-all">{message.body}</div>
                    </div>
                    <div className="text-end text-xs text-gray-400">
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
          <div ref={messagesEndRef} />
        </div>

        <FormChat roomId={selectedRoom.id} />
      </div>
    </>
  );
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default Chat;
