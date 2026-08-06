import { Bell, Check, Inbox } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { notificationsApi } from "../../api/notificationsApi";
import "./NotificationBell.css";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setNotifications(await notificationsApi.getMine());
    } catch (error) {
      if (open) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    const interval = setInterval(() => void load(), 30000);
    const refreshOnFocus = () => void load();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [load]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  async function markAsRead(notification) {
    if (notification.isRead) return;
    try {
      await notificationsApi.markAsRead(notification.id);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )));
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="notification-bell-button"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <section className="notification-panel" >
          <header><div><strong>Notifications</strong><span>{unreadCount} unread</span></div></header>
          <div className="notification-list">
            {loading ? <p className="notification-empty">Loading notifications...</p> : notifications.length === 0 ? (
              <div className="notification-empty"><Inbox size={22} /><span>You have no notifications.</span></div>
            ) : notifications.slice(0, 12).map((notification) => (
              <button
                type="button"
                className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                key={notification.id}
                onClick={() => markAsRead(notification)}
              >
                <span className="notification-item-icon">{notification.isRead ? <Check size={14} /> : <Bell size={14} />}</span>
                <span className="notification-item-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time>{new Date(notification.createdAt).toLocaleString("en-GB")}</time>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
