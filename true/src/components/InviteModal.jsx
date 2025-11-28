// src/components/InviteModal.jsx
import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function InviteModal({
  open = false,
  onClose = () => {},
  inviteLink = window.location.href,
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log("[InviteModal] render. open=", open, "inviteLink=", inviteLink);
    if (!open) return;
    QRCode.toDataURL(inviteLink || window.location.href, { margin: 1, width: 300 })
      .then(url => {
        console.log("[InviteModal] QR generated");
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error("[InviteModal] QR gen error:", err);
        setQrDataUrl("");
      });
  }, [open, inviteLink]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log("[InviteModal] link copied");
    } catch (e) {
      console.warn("[InviteModal] copy failed", e);
      try {
        const input = document.getElementById("inviteLinkInputDebug");
        input && input.select();
      } catch {}
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(inviteLink);
    const url = `https://wa.me/?text=${text}`;
    console.log("[InviteModal] opening WhatsApp URL:", url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Improved email open: try mailto then fallback to Gmail (and optionally Outlook)
  const openMailClient = () => {
    const subject = encodeURIComponent("Join my meeting");
    const body = encodeURIComponent(`Join my meeting: ${inviteLink}`);
    const mailto = `mailto:?subject=${subject}&body=${body}`;

    try {
      // Try opening the default mail client
      window.location.href = mailto;

      // Fallback after short delay: open Gmail compose in new tab
      setTimeout(() => {
        const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`;
        const outlook = `https://outlook.live.com/owa/?path=/mail/action/compose&to=&subject=${subject}&body=${body}`;
        // open gmail in new tab (user can switch to it)
        window.open(gmail, "_blank", "noopener,noreferrer");
        // Optionally you can also open outlook; commented out to avoid spamming tabs:
        // window.open(outlook, "_blank", "noopener,noreferrer");
      }, 700);
    } catch (e) {
      console.error("[InviteModal] openMailClient failed:", e);
      const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`;
      window.open(gmail, "_blank", "noopener,noreferrer");
    }
  };

  if (!open) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Invite people</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          <input
            id="inviteLinkInputDebug"
            style={styles.input}
            value={inviteLink}
            readOnly
            onFocus={(e) => e.target.select()}
          />

          <div style={{ ...styles.actionsRow, border: "2px dashed rgba(255,255,255,0.06)" }}>
            <button onClick={copyToClipboard} style={styles.actionBtn}>
              {copied ? "Copied!" : "Copy link"}
            </button>

            <button onClick={openMailClient} style={styles.actionBtn}>
              Email
            </button>

            <button onClick={openWhatsApp} style={{ ...styles.actionBtn, ...styles.whatsappBtn }}>
              WhatsApp
            </button>

            <button onClick={onClose} style={styles.actionBtn}>
              Close
            </button>
          </div>

          <div style={{ ...styles.qrSection, border: "2px dashed rgba(255,255,255,0.03)" }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>Scan QR to join</div>

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="invite-qr"
                style={styles.qrImage}
                onError={(e) => {
                  console.error("[InviteModal] qr image error", e);
                  setQrDataUrl("");
                }}
              />
            ) : (
              <div style={styles.qrPlaceholder}>
                <div>
                  <div>QR not available</div>
                  <a href={inviteLink} target="_blank" rel="noreferrer" style={{ color: "#9fd" }}>
                    Open link
                  </a>
                </div>
              </div>
            )}

            <div style={{ marginTop: 8, color: "#cde", textAlign: "center", fontSize: 13, wordBreak: "break-all" }}>
              {inviteLink}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 80,
    zIndex: 9999,
  },
  modal: {
    width: "min(900px, 95%)",
    background: "#0f2430",
    color: "#fff",
    borderRadius: 8,
    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
    overflow: "visible",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
  },
  body: {
    padding: 20,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 12,
    background: "#fff",
    color: "#000",
  },
  actionsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 16,
    alignItems: "center",
  },
  actionBtn: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
  },
  whatsappBtn: {
    background: "#25D366",
    color: "#000",
    border: "none",
  },
  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 20,
  },
  qrImage: {
    width: 200,
    height: 200,
    background: "#fff",
    borderRadius: 6,
    padding: 6,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 6,
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
