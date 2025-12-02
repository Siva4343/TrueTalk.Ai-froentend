import React, { useState, useEffect, useCallback, useRef } from "react";
import moment from "moment-timezone";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import api from "../api";
import "react-big-calendar/lib/css/react-big-calendar.css";
import CalendarAssistant from "../Components/chatbot";

const localizer = momentLocalizer(moment);
const TZ = "Asia/Kolkata";

/* Toast component used for in-app reminder popups */
function Toast({ item, onDismiss }) {
  const remindLocal = item.remind_at ? moment.parseZone(item.remind_at).tz(TZ).format("YYYY-MM-DD HH:mm") : "";
  return (
    <div className="bg-white border-l-4 border-orange-500 p-3 rounded shadow mb-2">
      <div className="flex justify-between">
        <div>
          <div className="font-semibold text-orange-600">{item.event?.title || "Reminder"}</div>
          <div className="text-sm text-gray-700">{item.message || item.event?.title}</div>
          <div className="text-xs text-gray-500 mt-1">At: {remindLocal}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700" onClick={() => { window.focus(); }}>Open</button>
          <button className="text-xs px-2 py-1 rounded border text-red-600" onClick={() => onDismiss(item.id)}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  // --- state & form (unchanged logic) ---
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    is_all_day: false,
    recurrence: "none",
    reminders: []
  };
  const [form, setForm] = useState(emptyForm);

  const lastCheckRef = useRef(null);
  const DEFAULT_WINDOW_MINUTES = 10;

  // view state for UI controls
  const [calendarView, setCalendarView] = useState("month");
  const [currentDate, setCurrentDate] = useState(moment().toDate());

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/events/");
      const data = res.data.map(e => {
        const start = e.start_time ? moment.parseZone(e.start_time).tz(TZ).toDate() : null;
        const end = e.end_time ? moment.parseZone(e.end_time).tz(TZ).toDate() : start;
        return { id: e.id, title: e.title, start, end, resource: e };
      });
      setEvents(data);
    } catch (err) {
      console.error("fetchEvents:", err);
    }
  }, []);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // reminders poll (kept)
  useEffect(() => {
    let mounted = true;
    async function handleDue(reminders) {
      for (const rem of reminders) {
        setToasts(prev => [rem, ...prev]);
        const remindLocal = rem.remind_at ? moment.parseZone(rem.remind_at).tz(TZ).format("YYYY-MM-DD HH:mm") : "";
        const title = `Reminder — ${rem.event?.title || 'Event'}`;
        const body = rem.message || rem.event?.title || remindLocal;
        try {
          if (window.Notification && Notification.permission === "granted") {
            const n = new Notification(title, { body });
            n.onclick = () => window.focus();
          } else if (window.Notification && Notification.permission !== "granted") {
            Notification.requestPermission().catch(()=>{});
          } else {
            console.info("Reminder:", title, body);
          }
        } catch (e) {
          console.error("Notification error", e);
        }
        try {
          await api.patch(`/reminders/${rem.id}/`, { is_sent: true });
        } catch (err) {
          console.warn("Failed to mark reminder sent", err);
        }
      }
    }
    async function poll() {
      try {
        const now = moment();
        let sinceIso = lastCheckRef.current ? moment(lastCheckRef.current).toISOString() : moment(now).subtract(DEFAULT_WINDOW_MINUTES, "minutes").toISOString();
        const r = await api.get(`/reminders/due/?since=${encodeURIComponent(sinceIso)}`);
        if (!mounted) return;
        const windowStart = moment(now).subtract(DEFAULT_WINDOW_MINUTES, "minutes");
        const filtered = (r.data || []).filter(rem => rem.remind_at && moment.parseZone(rem.remind_at).isBetween(windowStart, now, undefined, "[]"));
        if (filtered.length) await handleDue(filtered);
        lastCheckRef.current = now.toISOString();
      } catch (err) {
        console.error("poll reminders error", err);
      }
    }

    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission().catch(()=>{});
    }
    poll();
    const interval = setInterval(poll, 20000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // reminder helpers (kept)
  function addRelativeReminder(label) { setForm(prev => ({ ...prev, reminders: [...(prev.reminders || []), { type: "relative", offset: label, message: `${label} before` }] })); }
  function addAbsoluteReminder(dtISO) { const isoWithZone = moment.parseZone(dtISO).tz(TZ).format(); setForm(prev => ({ ...prev, reminders: [...(prev.reminders || []), { type: "absolute", remind_at: isoWithZone, message: "" }] })); }
  function removeReminderAt(index) { setForm(prev => { const arr = [...(prev.reminders || [])]; arr.splice(index, 1); return { ...prev, reminders: arr }; }); }
  function updateReminderAt(index, changes) { setForm(prev => { const arr = [...(prev.reminders || [])]; arr[index] = { ...arr[index], ...changes }; return { ...prev, reminders: arr }; }); }

  // calendar interactions (kept)
  async function onSelectSlot(slotInfo) {
    setSelectedEvent(null);
    const startISO = moment(slotInfo.start).tz(TZ).format();
    const endISO = moment((slotInfo.end || slotInfo.start)).tz(TZ).format();
    setForm({ ...emptyForm, start_time: startISO, end_time: endISO, reminders: [] });
    setShowForm(true);
  }

  async function onSelectEvent(ev) {
    const e = ev.resource;
    try {
      const resp = await api.get(`/events/${e.id}/`);
      const eventObj = resp.data;
      const rems = (eventObj.reminders || []).map(r => ({ type: "absolute", remind_at: r.remind_at, message: r.message, id: r.id }));
      setSelectedEvent(eventObj);
      setForm({
        title: eventObj.title || "",
        description: eventObj.description || "",
        start_time: eventObj.start_time || "",
        end_time: eventObj.end_time || "",
        is_all_day: eventObj.is_all_day || false,
        recurrence: eventObj.recurrence || "none",
        reminders: rems
      });
      setShowForm(true);
    } catch (err) {
      console.error("onSelectEvent", err);
    }
  }

  async function saveEvent() {
    setLoading(true);
    try {
      if (!form.title || !form.start_time) { alert("Title and start time required"); setLoading(false); return; }
      const startIso = moment.parseZone(form.start_time).tz(TZ).format();
      const endIso = form.end_time ? moment.parseZone(form.end_time).tz(TZ).format() : startIso;
      const payload = { title: form.title, description: form.description, start_time: startIso, end_time: endIso, is_all_day: form.is_all_day, recurrence: form.recurrence || "none" };
      let eventResp;
      if (selectedEvent && selectedEvent.id) eventResp = await api.patch(`/events/${selectedEvent.id}/`, payload);
      else eventResp = await api.post("/events/", payload);
      const eventId = eventResp.data.id;

      // sync reminders (kept)
      const existingRemResp = await api.get(`/reminders/?event=${eventId}`).catch(()=>({data:[]})); const existingRems = existingRemResp.data || [];
      const desired = [];
      for (const r of (form.reminders || [])) {
        if (r.type === "relative") {
          const start = moment.parseZone(startIso).tz(TZ);
          if (!start.isValid()) continue;
          let minutes = 0;
          if (r.offset.endsWith("m")) minutes = parseInt(r.offset.slice(0, -1), 10);
          else if (r.offset.endsWith("h")) minutes = parseInt(r.offset.slice(0, -1), 10) * 60;
          else if (r.offset.endsWith("d")) minutes = parseInt(r.offset.slice(0, -1), 10) * 60 * 24;
          else minutes = parseInt(r.offset, 10) || 0;
          const remindAt = start.clone().subtract(minutes, "minutes").tz(TZ).format();
          desired.push({ remind_at: remindAt, message: r.message || `${r.offset} before`, id: r.id || null });
        } else if (r.type === "absolute") {
          const iso = moment.parseZone(r.remind_at).tz(TZ).format();
          desired.push({ remind_at: iso, message: r.message || "", id: r.id || null });
        }
      }
      const keptIds = [];
      for (const d of desired) {
        if (d.id) { try { await api.patch(`/reminders/${d.id}/`, { remind_at: d.remind_at, message: d.message }); keptIds.push(d.id); } catch (e) { console.warn(e); } }
        else { try { const created = await api.post(`/reminders/`, { event: eventId, remind_at: d.remind_at, message: d.message }); if (created.data?.id) keptIds.push(created.data.id); } catch (e) { console.warn(e); } }
      }
      for (const ex of existingRems) if (!keptIds.includes(ex.id)) { try { await api.delete(`/reminders/${ex.id}/`); } catch (e) { console.warn(e); } }

      await fetchEvents();
      setShowForm(false);
      setSelectedEvent(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("saveEvent", err);
      alert("Failed to save event or reminders. See console.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent() {
    if (!selectedEvent || !selectedEvent.id) return;
    if (!confirm("Delete this event? This will also remove its reminders.")) return;
    try {
      await api.delete(`/events/${selectedEvent.id}/`);
      setShowForm(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (err) {
      console.error("deleteEvent", err);
      alert("Failed to delete");
    }
  }

  function renderRemindersForm() {
    return (form.reminders || []).map((r, idx) => (
      <div key={idx} className="mb-2 p-2 border rounded">
        <div className="flex justify-between items-center">
          <div className="text-sm w-full">
            <div className="flex gap-2 items-center">
              <select value={r.type || "absolute"} onChange={e => updateReminderAt(idx, { type: e.target.value })} className="p-1 border">
                <option value="relative">Relative</option>
                <option value="absolute">Absolute</option>
              </select>
              {r.type === "relative" ? (
                <select value={r.offset || "10m"} onChange={e => updateReminderAt(idx, { offset: e.target.value })} className="p-1 border">
                  <option value="10m">10 minutes before</option>
                  <option value="30m">30 minutes before</option>
                  <option value="1h">1 hour before</option>
                  <option value="1d">1 day before</option>
                  <option value="0m">At start</option>
                </select>
              ) : (
                <input
                  type="datetime-local"
                  value={r.remind_at ? moment.parseZone(r.remind_at).tz(TZ).format("YYYY-MM-DDTHH:mm") : ""}
                  onChange={e => {
                    const v = e.target.value;
                    const iso = moment.tz(v, "YYYY-MM-DDTHH:mm", TZ).format();
                    updateReminderAt(idx, { remind_at: iso });
                  }}
                  className="p-1 border"
                />
              )}
            </div>
            <div className="mt-2">
              <input placeholder="Reminder message (optional)" value={r.message || ""} onChange={e => updateReminderAt(idx, { message: e.target.value })} className="w-full p-1 border" />
            </div>
          </div>
          <div className="ml-2">
            <button className="text-red-600" onClick={() => removeReminderAt(idx)}>Remove</button>
          </div>
        </div>
      </div>
    ));
  }

  // small UI helpers
  function goToToday() { setCurrentDate(moment().toDate()); }
  function prev() { setCurrentDate(moment(currentDate).subtract(1, calendarView).toDate()); } // Adjusted to subtract by current view unit
  function next() { setCurrentDate(moment(currentDate).add(1, calendarView).toDate()); } // Adjusted to add by current view unit

  // --- render UI matching the screenshot ---
  return (
    <div className="min-h-screen bg-white p-8"> {/* Changed background to match image */}
      {/* Header/Title Section */}
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold mb-4">
          <span className="text-gray-900">TT </span>
          <span className="text-orange-600">Calendar</span>
        </h1>
      </div>

      {/* Tabs & New Buttons Section */}
      <div className="mb-8 flex items-center gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-orange-500 text-white rounded-md shadow-md font-semibold">Events</button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-md font-semibold">Scheduling</button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-md font-semibold">Reminders</button>
        </div>
        {/* New Buttons */}
        <div className="ml-4 flex items-center gap-3">
          <button className="px-6 py-2 bg-orange-500 text-white rounded-lg shadow-lg font-semibold" onClick={() => { setForm({ ...emptyForm, reminders: [] }); setSelectedEvent(null); setShowForm(true); }}>New Event</button>
          <button className="px-6 py-2 border border-orange-300 text-orange-600 rounded-lg font-semibold" onClick={() => { setForm({ ...emptyForm, reminders: [{ type: 'relative', offset: '10m', message: '10m before' }] }); setShowForm(true); }}>New Reminder</button>
        </div>
      </div>

      {/* Calendar Controls Card - Matches Screenshot Layout */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-0 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Today, Arrows, Month/Year */}
            <button className="px-4 py-2 border rounded-lg bg-orange-500 text-white font-semibold" onClick={goToToday}>Today</button>
            <button className="text-xl font-bold text-gray-700 hover:text-orange-500" onClick={prev}>‹</button>
            <button className="text-xl font-bold text-gray-700 hover:text-orange-500" onClick={next}>›</button>
            <div className="ml-2 text-2xl font-semibold text-gray-800">{moment(currentDate).format("MMMM YYYY")}</div>
          </div>

          {/* View Buttons Group - Matches Screenshot Layout */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button className={`px-4 py-2 text-sm font-medium ${calendarView === "month" ? "bg-orange-500 text-white" : "bg-white text-gray-700"}`} onClick={() => { setCalendarView("month"); }}>Month</button>
            <button className={`px-4 py-2 text-sm font-medium border-l ${calendarView === "week" ? "bg-orange-500 text-white" : "bg-white text-gray-700"}`} onClick={() => { setCalendarView("week"); }}>Week</button>
            <button className={`px-4 py-2 text-sm font-medium border-l ${calendarView === "day" ? "bg-orange-500 text-white" : "bg-white text-gray-700"}`} onClick={() => { setCalendarView("day"); }}>Day</button>
            <button className={`px-4 py-2 text-sm font-medium border-l ${calendarView === "agenda" ? "bg-orange-500 text-white" : "bg-white text-gray-700"}`} onClick={() => { setCalendarView("agenda"); }}>Agenda</button>
          </div>
        </div>
      </div>

      {/* calendar area with orange weekday header */}
      <div className="bg-white rounded-b-2xl shadow-lg border-t-0 p-4 pt-0"> {/* Adjusted to attach to the control card visually */}
        <div className="rounded-b-lg overflow-hidden border"> {/* Removed top border for continuous look */}
          {/* custom header for month-style look - Now *above* the react-big-calendar component */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white grid grid-cols-7 text-sm font-semibold uppercase tracking-wide px-6 py-3">
            <div className="text-center">Sun</div>
            <div className="text-center">Mon</div>
            <div className="text-center">Tue</div>
            <div className="text-center">Wed</div>
            <div className="text-center">Thu</div>
            <div className="text-center">Fri</div>
            <div className="text-center">Sat</div>
          </div>

          <div style={{ height: 520 }} className="p-4 bg-white">
            <Calendar
              localizer={localizer}
              events={events}
              selectable
              onSelectSlot={onSelectSlot}
              onSelectEvent={onSelectEvent}
              view={calendarView}
              onView={(v) => { setCalendarView(v); }}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              views={{ month: true, week: true, day: true, agenda: true }}
              defaultView={Views.MONTH}
              components={{
                toolbar: () => null, // hide default toolbar
                header: () => null // Hide default header row in month view
              }}
              eventPropGetter={(event) => {
                return { style: { backgroundColor: "#FB923C", color: "white", borderRadius: '6px', border: '2px solid #EA580C' } };
              }}
            />
          </div>
        </div>
      </div>

      {/* toasts (reminders) */}
      <div className="fixed top-6 right-6 w-96 z-50">
        {toasts.map(t => <Toast key={t.id || t.remind_at} item={t} onDismiss={async (id) => { setToasts(prev => prev.filter(x => x.id !== id)); try { await api.patch(`/reminders/${id}/`, { is_sent: true }); } catch (e) { } }} />)}
      </div>

      {/* modal form (keeps your form logic but styled similar to screenshot controls) */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowForm(false); setSelectedEvent(null); setForm(emptyForm); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[900px] max-h-[90vh] overflow-auto p-8 border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-orange-600">{selectedEvent ? "Edit Event" : "Create Event"}</h3>
              <button className="text-gray-600" onClick={() => { setShowForm(false); setSelectedEvent(null); setForm(emptyForm); }}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input className="w-full p-3 border rounded mb-3" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full p-3 border rounded mb-3 h-28" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start</label>
                <input type="datetime-local" className="w-full p-3 border rounded mb-3" value={form.start_time ? moment.parseZone(form.start_time).tz(TZ).format("YYYY-MM-DDTHH:mm") : ""} onChange={e => { const v = e.target.value; setForm({ ...form, start_time: moment.tz(v, "YYYY-MM-DDTHH:mm", TZ).format() }); }} />
                <label className="block text-sm font-medium mb-1">End</label>
                <input type="datetime-local" className="w-full p-3 border rounded mb-3" value={form.end_time ? moment.parseZone(form.end_time).tz(TZ).format("YYYY-MM-DDTHH:mm") : ""} onChange={e => { const v = e.target.value; setForm({ ...form, end_time: moment.tz(v, "YYYY-MM-DDTHH:mm", TZ).format() }); }} />
                <label className="block text-sm font-medium mb-1">Recurrence</label>
                <select className="w-full p-3 border rounded" value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}>
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="mt-6 p-4 bg-orange-50 rounded border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <button className="px-3 py-2 bg-white border rounded" onClick={() => addRelativeReminder("10m")}>10m</button>
                <button className="px-3 py-2 bg-white border rounded" onClick={() => addRelativeReminder("30m")}>30m</button>
                <button className="px-3 py-2 bg-white border rounded" onClick={() => addRelativeReminder("1h")}>1h</button>
                <button className="px-3 py-2 bg-white border rounded" onClick={() => addRelativeReminder("1d")}>1d</button>
                <div className="ml-auto flex items-center gap-2">
                  <input type="datetime-local" onChange={e => { if (e.target.value) { const iso = moment.tz(e.target.value, "YYYY-MM-DDTHH:mm", TZ).format(); addAbsoluteReminder(iso); } }} className="p-2 border rounded" />
                  <span className="text-sm text-gray-600">Custom time</span>
                </div>
              </div>

              <div>{renderRemindersForm()}</div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="px-6 py-3 bg-orange-500 text-white rounded" onClick={saveEvent} disabled={loading}>{loading ? "Saving..." : (selectedEvent ? "Save changes" : "Create event")}</button>
              {selectedEvent && <button className="px-6 py-3 bg-red-600 text-white rounded" onClick={deleteEvent}>Delete event</button>}
              <button className="px-6 py-3 border rounded" onClick={() => { setShowForm(false); setSelectedEvent(null); setForm(emptyForm); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
        
    <CalendarAssistant/>
        
    </div>
  );
}