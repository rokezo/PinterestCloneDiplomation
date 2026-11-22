import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { notificationsService } from "../api/notifications";
import CreatePinModal from "./CreatePinModal";
import CreateBoardModal from "./CreateBoardModal";
import CreateCollageModal from "./CreateCollageModal";
import NotificationsModal from "./NotificationsModal";
import ChatPanel from "./ChatPanel";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  // include setter so we can clear query when switching views
  const [searchParams, setSearchParams] = useSearchParams();
  const [createHovered, setCreateHovered] = useState(false);
  const [createPosition, setCreatePosition] = useState({ top: 0, left: 0 });
  const createTimeoutRef = useRef(null);
  const createButtonRef = useRef(null);
  const [createPinModalOpen, setCreatePinModalOpen] = useState(false);
  const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
  const [createCollageModalOpen, setCreateCollageModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const { chatPanelOpen, togglePanel, closePanel } = useChat();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const handleCreateItemClick = (type) => {
    setCreateHovered(false);
    if (type === "pin") setCreatePinModalOpen(true);
    else if (type === "board") setCreateBoardModalOpen(true);
    else if (type === "collage") setCreateCollageModalOpen(true);
  };

  const handleCreateClick = (e) => {
    e.stopPropagation();
    if (createButtonRef.current) {
      const rect = createButtonRef.current.getBoundingClientRect();
      setCreatePosition({ top: rect.top, left: rect.right + 8 });
    }
    setCreateHovered(!createHovered);
  };

  const handleCreateDropdownEnter = () => {
    if (createTimeoutRef.current) clearTimeout(createTimeoutRef.current);
  };

  const handleCreateMenuLeave = () => {
    createTimeoutRef.current = setTimeout(() => setCreateHovered(false), 300);
  };

  const handleNotificationsClick = () => setNotificationsModalOpen(true);
  const handleSettingsClick = () => navigate("/settings");
  const handleDiscoverClick = () => {
    // "Discover" should take the user to their boards section rather than the home feed
    // clear any existing search params first
    setSearchParams({});
    navigate("/boards");
  };
  const handleChatClick = () => {
    togglePanel();
  };

  useEffect(() => {
    if (isAuthenticated) {
      notificationsService.getUnreadCount().then(data => setUnreadCount(data.count || 0)).catch(() => {});
      const interval = setInterval(() => {
        notificationsService.getUnreadCount().then(data => setUnreadCount(data.count || 0)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createHovered && createButtonRef.current && !createButtonRef.current.contains(e.target)) {
        const dropdown = document.querySelector(".create-dropdown");
        if (dropdown && !dropdown.contains(e.target)) setCreateHovered(false);
      }
    };
    if (createHovered) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createHovered]);

  return (
    <aside className="sidebar inspira-sidebar">
      <div className="sidebar-content">
        {/* Upload / Create */}
        <div className="sidebar-create-wrapper">
          <button
            ref={createButtonRef}
            className={`sidebar-item ${createHovered ? "active" : ""}`}
            onClick={handleCreateClick}
            title="Створити"
          >
            <span className="sidebar-icon">
              <img src="/icons/icon-square-plus.png" alt="Створити" />
            </span>
          </button>
          {createHovered && (
            <div
              className="create-dropdown inspira-dropdown"
              style={{ position: "fixed", top: `${createPosition.top}px`, left: `${createPosition.left}px`, zIndex: 10000 }}
              onMouseEnter={handleCreateDropdownEnter}
              onMouseLeave={handleCreateMenuLeave}
            >
              <button className="create-dropdown-item" onClick={() => handleCreateItemClick("pin")}>
                <span className="create-dropdown-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </span>
                <span>Пін</span>
              </button>
              <button className="create-dropdown-item" onClick={() => handleCreateItemClick("board")}>
                <span className="create-dropdown-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </span>
                <span>Дошка</span>
              </button>
              <button className="create-dropdown-item" onClick={() => handleCreateItemClick("collage")}>
                <span className="create-dropdown-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </span>
                <span>Колаж</span>
              </button>
            </div>
          )}
        </div>

        {/* Messages / Chat */}
        {isAuthenticated && (
          <button className={`sidebar-item ${chatPanelOpen ? "active" : ""}`} onClick={handleChatClick} title="Повідомлення">
            <span className="sidebar-icon">
              <img src="/icons/icon-chat-duo.png" alt="Повідомлення" />
            </span>
          </button>
        )}

        {/* Notifications */}
        {isAuthenticated && (
          <button className="sidebar-item sidebar-notifications" onClick={handleNotificationsClick} title="Сповіщення">
            <span className="sidebar-icon">
              <img src="/icons/icon-bell.png" alt="Сповіщення" />
            </span>
            {unreadCount > 0 && <span className="sidebar-notification-badge">{unreadCount}</span>}
          </button>
        )}

        {/* Discover / Grid */}
        <button className="sidebar-item" onClick={handleDiscoverClick} title="Досліджувати">
          <span className="sidebar-icon">
            <img src="/icons/icon-grid.png" alt="Досліджувати" />
          </span>
        </button>

        {/* Settings - at bottom */}
        <div className="sidebar-spacer"></div>
        <button className="sidebar-item sidebar-settings" onClick={handleSettingsClick} title="Налаштування">
          <span className="sidebar-icon">
            <img src="/icons/icon-gear.png" alt="Налаштування" />
          </span>
        </button>
      </div>

      <CreatePinModal isOpen={createPinModalOpen} onClose={() => setCreatePinModalOpen(false)} onSuccess={() => navigate("/")} />
      <CreateBoardModal isOpen={createBoardModalOpen} onClose={() => setCreateBoardModalOpen(false)} onSuccess={() => {}} />
      <CreateCollageModal isOpen={createCollageModalOpen} onClose={() => setCreateCollageModalOpen(false)} />
      <NotificationsModal isOpen={notificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} onNotificationClick={() => notificationsService.getUnreadCount().then(d => setUnreadCount(d.count || 0))} />
      {chatPanelOpen && <ChatPanel onClose={closePanel} />}
    </aside>
  );
};

export default Sidebar;
