import { useState, useRef } from "react";
import { MOODS, MEMORY_TYPES } from "@/types/memory";
import { Music, X, Users, Plus, Globe, Lock, ImagePlus, Loader2, Sparkles } from "lucide-react";
import SongSearch from "@/components/SongSearch";
import { compressImage } from "@/lib/compressImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { Memory } from "@/types/memory";

interface AddMemoryFormProps {
  onAdd: (memory: {
    title: string;
    description: string;
    songTitle: string;
    artist: string;
    date: string;
    mood: string;
    people: string[];
    isPublic: boolean;
    imageUrl?: string | null;
    tags?: string[];
  }) => void;
  onClose: () => void;
  editingMemory?: Memory | null;
}

const AddMemoryForm = ({ onAdd, onClose, editingMemory }: AddMemoryFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(editingMemory?.title ?? "");
  const [description, setDescription] = useState(editingMemory?.description ?? "");
  const [songTitle, setSongTitle] = useState(editingMemory?.songTitle ?? "");
  const [artist, setArtist] = useState(editingMemory?.artist ?? "");
  const [date, setDate] = useState(editingMemory?.date ?? new Date().toISOString().split("T")[0]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(
    editingMemory?.mood ? editingMemory.mood.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  const [people, setPeople] = useState<string[]>(editingMemory?.people ?? []);
  const [personInput, setPersonInput] = useState("");
  const [customMoodInput, setCustomMoodInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(editingMemory?.tags ?? []);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(editingMemory?.isPublic ?? false);
  const [imagePreview, setImagePreview] = useState<string | null>(editingMemory?.imageUrl ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateCover = async () => {
    if (!title) {
      toast.error("Add a title first so AI knows what to create");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      toast.error("Sign in again before generating a cover");
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover`, {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          mood: selectedMoods.join(", "),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `Cover generation failed (${response.status})`);
      }
      if (data?.imageUrl) {
        setImagePreview(data.imageUrl);
        setImageFile(null);
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.error("No image was returned");
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to generate cover image";
      toast.error(message);
    }
    setGenerating(false);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return imagePreview; // Keep existing URL if editing
    setUploading(true);
    try {
      const compressed = await compressImage(imageFile);
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("memory-images")
        .upload(fileName, compressed, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("memory-images")
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addPerson = () => {
    const name = personInput.trim();
    if (name && !people.includes(name)) {
      setPeople([...people, name]);
    }
    setPersonInput("");
  };

  const removePerson = (name: string) => {
    setPeople(people.filter((p) => p !== name));
  };

  const toggleMood = (moodLabel: string) => {
    setSelectedMoods((prev) => {
      if (prev.includes(moodLabel)) return prev.filter((m) => m !== moodLabel);
      // If nothing selected yet, single-select (replace)
      if (prev.length === 0) return [moodLabel];
      // After first pick, allow multi-select (add)
      return [...prev, moodLabel];
    });
  };

  const addCustomMood = () => {
    const mood = customMoodInput.trim();
    if (mood && !selectedMoods.includes(mood)) {
      setSelectedMoods((prev) => prev.length === 0 ? [mood] : [...prev, mood]);
    }
    setCustomMoodInput("");
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setCustomTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !songTitle || !artist || selectedMoods.length === 0) return;
    const imageUrl = await uploadImage();
    onAdd({ title, description, songTitle, artist, date, mood: selectedMoods.join(", "), people, isPublic, imageUrl, tags: selectedTags });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-lg bg-background sm:rounded-2xl p-6 h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold">{editingMemory ? "Edit Memory" : "New Music Memory"}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 flex items-center justify-between">
              <span>Describe it in a short phrase</span>
              <span className={`text-xs font-normal ${title.length > 70 ? "text-destructive" : "text-muted-foreground"}`}>{80 - title.length}</span>
            </label>
            <input
              value={title}
              onChange={(e) => { if (e.target.value.length <= 80) setTitle(e.target.value); }}
              placeholder="e.g. Dancing in the rain after finals"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
              maxLength={80}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Tell the story</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how it felt..."
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Image upload / generate */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <span className="flex items-center gap-1.5"><ImagePlus size={14} className="text-primary" /> Cover image</span>
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-32 w-full rounded-lg object-cover border border-border" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-foreground/60 text-background flex items-center justify-center hover:bg-foreground/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : generating ? (
              <div className="h-32 w-full rounded-lg border-2 border-dashed border-primary/30 bg-card flex flex-col items-center justify-center gap-2">
                <Loader2 size={20} className="text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Generating cover…</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-20 rounded-lg border-2 border-dashed border-border bg-card flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  <ImagePlus size={18} />
                  <span className="text-[10px] mt-1">Upload</span>
                </button>
                <button
                  type="button"
                  onClick={generateCover}
                  className="flex-1 h-20 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  <Sparkles size={18} />
                  <span className="text-[10px] mt-1">AI Generate</span>
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          <div className="gradient-warm rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Music size={16} className="text-primary" />
              The Soundtrack
            </div>
            <SongSearch
              songTitle={songTitle}
              artist={artist}
              onSongTitleChange={setSongTitle}
              onArtistChange={setArtist}
              onSelect={(s, a) => { setSongTitle(s); setArtist(a); }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">When was this?</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              <span className="flex items-center gap-1.5"><Users size={14} className="text-primary" /> Who was there?</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={personInput}
                onChange={(e) => setPersonInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPerson(); } }}
                placeholder="Add a name..."
                className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addPerson}
                className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {people.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {people.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-foreground border border-primary/20">
                    {p}
                    <button type="button" onClick={() => removePerson(p)} className="hover:text-destructive"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">How did it feel?</label>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedMoods.length === 0 ? "Pick your primary mood" : "Tap more to layer feelings"}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MOODS.map((m) => {
                const label = `${m.emoji} ${m.label}`;
                const active = selectedMoods.includes(label);
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => toggleMood(label)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                );
              })}
              {selectedMoods
                .filter((sm) => !MOODS.some((m) => `${m.emoji} ${m.label}` === sm))
                .map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    onClick={() => toggleMood(custom)}
                    className="px-3 py-1.5 rounded-full text-sm border transition-all border-primary bg-primary text-primary-foreground shadow-sm"
                  >
                    {custom}
                    <X size={12} className="inline ml-1 -mr-0.5" />
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customMoodInput}
                onChange={(e) => setCustomMoodInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomMood(); } }}
                placeholder="Create a custom mood…"
                className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addCustomMood}
                disabled={!customMoodInput.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Memory Type Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">What kind of memory was this?</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MEMORY_TYPES.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {selectedTags
                .filter((t) => !MEMORY_TYPES.includes(t as any))
                .map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    onClick={() => toggleTag(custom)}
                    className="px-3 py-1.5 rounded-full text-sm border transition-all border-primary bg-primary text-primary-foreground shadow-sm"
                  >
                    {custom}
                    <X size={12} className="inline ml-1 -mr-0.5" />
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                placeholder="Add a custom tag…"
                className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customTagInput.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Visibility</label>
            <div className="inline-flex rounded-full border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !isPublic
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lock size={14} />
                Private
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isPublic
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe size={14} />
                Public
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!title || !songTitle || !artist || selectedMoods.length === 0 || uploading}
          className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading && <Loader2 size={16} className="animate-spin" />}
          {uploading ? "Uploading…" : editingMemory ? "Update Memory" : "Save Memory"}
        </button>
      </form>
    </div>
  );
};

export default AddMemoryForm;
