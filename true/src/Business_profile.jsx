import { useEffect, useState } from "react";

const API_HOST = "http://127.0.0.1:8000";
const API_BASE_URL = `${API_HOST}/api`;
const ENDPOINTS = { PROFILES: "/business-profiles/" };

// Loading spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px] text-xl font-semibold">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mr-3"></div>
    Loading...
  </div>
);

// Profile card
const ProfileCard = ({ profile, onEdit, onDelete }) => {
  const photoSrc = profile.photo
    ? profile.photo.startsWith("http")
      ? profile.photo
      : `${API_HOST}${profile.photo}`
    : null;

  return (
    <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-gray-200 hover:shadow-2xl transition-transform duration-300 hover:scale-[1.01]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={`${profile.name} logo`}
              className="w-20 h-20 rounded-full border object-cover shadow-md"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-full border flex items-center justify-center text-gray-500">
              No Photo
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{profile.name || "Unnamed Business"}</h2>
            <p className="text-gray-600">{profile.tagline || "—"}</p>
          </div>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => onEdit(profile)}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(profile.id)}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-sm">
        {profile.gmail && (
          <p><span className="font-semibold">Email:</span> <span className="text-blue-700">{profile.gmail}</span></p>
        )}
        {profile.phone && (
          <p><span className="font-semibold">Phone:</span> <span className="text-blue-700">{profile.phone}</span></p>
        )}
        {profile.website && (
          <p>
            <span className="font-semibold">Website:</span>{" "}
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              {profile.website}
            </a>
          </p>
        )}
        {profile.location && (
          <p><span className="font-semibold">Location:</span> {profile.location}</p>
        )}
        {profile.business_hours && (
          <p><span className="font-semibold">Hours:</span> {profile.business_hours}</p>
        )}
      </div>

      {profile.description && (
        <div className="mt-3">
          <p className="font-semibold">Description</p>
          <p className="text-gray-800">{profile.description}</p>
        </div>
      )}

      {profile.services && (
        <div className="mt-3">
          <p className="font-semibold">Services</p>
          <p className="text-gray-800 whitespace-pre-line">{profile.services}</p>
        </div>
      )}
    </div>
  );
};

// Add/Edit form with submit-time validation + photo upload
const ProfileForm = ({ onSuccess, existingProfile, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    gmail: "",
    phone: "",
    description: "",
    website: "",
    location: "",
    business_hours: "",
    services: "",
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const isEditing = !!existingProfile;

  // Load selected profile into form on Edit
  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: existingProfile.name || "",
        tagline: existingProfile.tagline || "",
        gmail: existingProfile.gmail || "",
        phone: existingProfile.phone || "",
        description: existingProfile.description || "",
        website: existingProfile.website || "",
        location: existingProfile.location || "",
        business_hours: existingProfile.business_hours || "",
        services: existingProfile.services || "",
        photo: null, // keep null unless user picks a new file
      });
      setErrors({});
    } else {
      // reset when switching back to Add
      setFormData({
        name: "",
        tagline: "",
        gmail: "",
        phone: "",
        description: "",
        website: "",
        location: "",
        business_hours: "",
        services: "",
        photo: null,
      });
      setErrors({});
    }
  }, [isEditing, existingProfile]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData((prev) => ({ ...prev, photo: files && files[0] ? files[0] : null }));
      setErrors((prev) => ({ ...prev, photo: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Please enter Name ";
    if (!formData.gmail.trim()) newErrors.gmail = "Please enter email";
    if (!formData.phone.trim()) newErrors.phone = "Please enter phone number";
    if (!formData.description.trim()) newErrors.description = "Please enter description";
    if (!formData.services.trim()) newErrors.services = "Please enter services";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors); // show messages only after submit
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Only append defined values
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, value);
        }
      });

      const url = isEditing
        ? `${API_BASE_URL}${ENDPOINTS.PROFILES}${existingProfile.id}/`
        : `${API_BASE_URL}${ENDPOINTS.PROFILES}`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Save failed: ${res.status} ${txt}`);
      }

      await res.json();
      onSuccess(); // refresh list
      if (isEditing) onCancel(); // exit edit mode
      // reset form after add
      if (!isEditing) {
        setFormData({
          name: "",
          tagline: "",
          gmail: "",
          phone: "",
          description: "",
          website: "",
          location: "",
          business_hours: "",
          services: "",
          photo: null,
        });
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setErrors((prev) => ({ ...prev, submit: "Failed to save. Please try again." }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-lg border border-blue-200"
    >
      <h2 className="text-2xl font-bold text-blue-700 mb-4">
        {isEditing ? "Edit Business Profile" : "Add New Business Profile"}
      </h2>

      {errors.submit && (
        <p className="text-red-600 font-medium mb-3">{errors.submit}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            className={`border p-3 rounded-md w-full focus:outline-none focus:ring-2 ${
              errors.name ? "border-red-500 focus:ring-red-400" : "border-blue-300 focus:ring-blue-500"
            }`}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <input
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            placeholder="Tagline"
            className="border border-blue-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <input
            name="gmail"
            value={formData.gmail}
            onChange={handleChange}
            placeholder="Email"
            className={`border p-3 rounded-md w-full focus:outline-none focus:ring-2 ${
              errors.gmail ? "border-red-500 focus:ring-red-400" : "border-blue-300 focus:ring-blue-500"
            }`}
          />
          {errors.gmail && <p className="text-red-500 text-sm mt-1">{errors.gmail}</p>}
        </div>

        <div>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            className={`border p-3 rounded-md w-full focus:outline-none focus:ring-2 ${
              errors.phone ? "border-red-500 focus:ring-red-400" : "border-blue-300 focus:ring-blue-500"
            }`}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="Website"
            className="border border-blue-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            className="border border-blue-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <input
            name="business_hours"
            value={formData.business_hours}
            onChange={handleChange}
            placeholder="Business Hours"
            className="border border-blue-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4">
  <label htmlFor="photo" className="block text-sm font-semibold text-blue-700 mb-2">
    Upload your photo
  </label>

  <div className="flex items-center space-x-4">
    <label
      htmlFor="photo"
      className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 transition"
    >
      Choose File
    </label>

    <span className="text-gray-600 text-sm">
      {formData.photo ? formData.photo.name : "No file chosen"}
    </span>
  </div>

  <input
    type="file"
    id="photo"
    name="photo"
    accept="image/*"
    onChange={handleChange}
    className="hidden"
  />
</div>
      </div>

      <div className="mt-4">
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          className={`border p-3 rounded-md w-full focus:outline-none focus:ring-2 ${
            errors.description ? "border-red-500 focus:ring-red-400" : "border-blue-300 focus:ring-blue-500"
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div className="mt-4">
        <textarea
          name="services"
          value={formData.services}
          onChange={handleChange}
          placeholder="Services"
          className={`border p-3 rounded-md w-full focus:outline-none focus:ring-2 ${
            errors.services ? "border-red-500 focus:ring-red-400" : "border-blue-300 focus:ring-blue-500"
          }`}
        />
        {errors.services && <p className="text-red-500 text-sm mt-1">{errors.services}</p>}
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          {isEditing ? "Update" : "Save"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

// Main component
export default function BusinessProfile() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [editingProfile, setEditingProfile] = useState(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await fetch(`${API_BASE_URL}${ENDPOINTS.PROFILES}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Fetch failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchError("Failed to load profiles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}${ENDPOINTS.PROFILES}${id}/`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed: ${res.status} ${txt}`);
      }
      await fetchProfiles();
    } catch (err) {
      console.error("Delete error:", err);
      // Optional: show a toast or inline error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-blue-800 tracking-tight">
          Business Profile Details
        </h1>

        {/* Add/Edit Form */}
        <ProfileForm
          onSuccess={fetchProfiles}
          existingProfile={editingProfile}
          onCancel={() => setEditingProfile(null)}
        />

        {/* Fetch states and list */}
        {loading ? (
          <LoadingSpinner />
        ) : fetchError ? (
          <div className="text-red-600 font-semibold">{fetchError}</div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 text-lg font-semibold py-10">
            <div className="text-5xl mb-3">🏢</div>
            No business profiles found.
          </div>
        ) : (
          <div className="space-y-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id || `${profile.name}-${Math.random()}`}
                profile={profile}
                onEdit={setEditingProfile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}