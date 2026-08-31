import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type Listing = {
  id: number;
  title: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  type: string;
  broker: string;
  verified: boolean;
  description: string;
  images: string[];
};

const initialListings: Listing[] = [
  {
    id: 1,
    title: "Sunlit 2 Bedroom Apartment",
    area: "Bole, Addis Ababa",
    price: 28000,
    beds: 2,
    baths: 2,
    type: "Apartment",
    broker: "Mekdes Homes",
    verified: true,
    description: "Newly finished apartment with a balcony, secure entrance, and fast internet.",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85"],
  },
  {
    id: 2,
    title: "Family House with Garden",
    area: "CMC, Addis Ababa",
    price: 45000,
    beds: 4,
    baths: 3,
    type: "House",
    broker: "Alem Property",
    verified: true,
    description: "A quiet compound with parking space and a private backyard for family living.",
    images: ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85"],
  },
  {
    id: 3,
    title: "Compact Studio Near Transport",
    area: "Piazza, Addis Ababa",
    price: 12000,
    beds: 1,
    baths: 1,
    type: "Studio",
    broker: "Tsega Brokers",
    verified: false,
    description: "A bright studio for students or solo renters with easy access to transport.",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85"],
  },
];

const locationSuggestions = [
  "Akaki Kality",
  "Bole",
  "CMC",
  "Piazza",
  "Kazanchis",
  "Megenagna",
  "Sar Bet",
  "Old Airport",
  "Gerji",
  "Summit",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapListing(row: Record<string, unknown>): Listing {
  const rawImages = row.image_urls;
  const images = Array.isArray(rawImages)
    ? rawImages.filter((image): image is string => typeof image === "string" && image.length > 0).slice(0, 10)
    : [];

  return {
    id: Number(row.id),
    title: String(row.title),
    area: String(row.area),
    price: Number(row.price),
    beds: Number(row.beds),
    baths: Number(row.baths),
    type: String(row.type),
    broker: String(row.broker),
    verified: Boolean(row.verified),
    description: String(row.description),
    images: images.length ? images : [String(row.image_url)],
  };
}

function Icon({ name }: { name: "home" | "search" | "heart" | "chat" | "phone" | "share" | "user" | "plus" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-6h6v6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    heart: <path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.8 2.3Z" />,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8 8 0 0 1-3.5-.8L4 20l1.5-4A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></>,
    phone: <><path d="M6.5 3.5 9 7 7 9c1 2.2 2.8 4 5 5l2-2 3.5 2.5-.8 3.2c-.2.8-1 1.3-1.8 1.2C8.3 18.1 3.9 13.7 3.1 7.1c-.1-.8.4-1.6 1.2-1.8Z" /><path d="M14 4a6 6 0 0 1 6 6M14 7a3 3 0 0 1 3 3" /></>,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function App() {
  const telegram = window.Telegram?.WebApp;
  const telegramUser = telegram?.initDataUnsafe.user;
  const [listings, setListings] = useState(initialListings);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<"home" | "broker">("home");
  const [slideIndexes, setSlideIndexes] = useState<Record<number, number>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ title: "", area: "", price: "", beds: "2", baths: "1", broker: "", description: "" });
  const feedRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number; listingId: number } | null>(null);

  useEffect(() => {
    if (!telegram) return;
    telegram.ready();
    telegram.expand();
  }, [telegram]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const loadListings = async () => {
      const { data, error } = await client.from("listings").select("*").order("created_at", { ascending: false });
      if (error) {
        setLoadError("Supabase is connected, but the listings table is not ready yet.");
        return;
      }
      if (data?.length) setListings(data.map((row) => mapListing(row as Record<string, unknown>)));
    };

    void loadListings();
  }, []);

  const visibleListings = listings.filter((listing) => {
    const query = search.toLowerCase();
    return !query || `${listing.title} ${listing.area} ${listing.broker}`.toLowerCase().includes(query);
  });
  const listing = visibleListings[activeIndex] ?? visibleListings[0];

  const notify = (message: string, payload?: object) => {
    if (telegram) {
      if (payload && telegram.isVersionAtLeast?.("6.1")) telegram.sendData(JSON.stringify(payload));
      telegram.showAlert(message);
    } else window.alert(message);
  };

  const requestViewing = (selectedListing = listing) => {
    if (!selectedListing) return;
    notify(`Viewing request sent for ${selectedListing.title}.`, { action: "request_viewing", listingId: selectedListing.id });
  };

  const handlePost = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    if (supabase && imageFiles.length) {
      const client = supabase;
      if (imageFiles.length > 10) {
        setSaving(false);
        setLoadError("Please choose no more than 10 images.");
        return;
      }

      let uploadedImages: string[];
      try {
        uploadedImages = await Promise.all(imageFiles.map(async (file) => {
          const filePath = `${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
          const { error: uploadError } = await client.storage.from("listing-images").upload(filePath, file, { contentType: file.type, upsert: false });
          if (uploadError) throw uploadError;
          return client.storage.from("listing-images").getPublicUrl(filePath).data.publicUrl;
        }));
      } catch (error) {
        setSaving(false);
        setLoadError(error instanceof Error ? error.message : "Image upload failed.");
        return;
      }
      const { data, error } = await client.from("listings").insert({
        title: form.title, area: form.area, city: "Addis Ababa", price: Number(form.price), beds: Number(form.beds), baths: Number(form.baths),
        type: "Apartment", broker: form.broker, description: form.description, image_url: uploadedImages[0], image_urls: uploadedImages, verified: false,
      }).select().single();
      setSaving(false);
      if (error) {
        setLoadError(error.message);
        return;
      }
      if (data) setListings((current) => [mapListing(data as Record<string, unknown>), ...current]);
      setActiveIndex(0);
      setMode("home");
      setImageFiles([]);
      setForm({ title: "", area: "", price: "", beds: "2", baths: "1", broker: "", description: "" });
      return;
    }

    const newListing: Listing = {
      id: Date.now(), title: form.title, area: form.area, price: Number(form.price), beds: Number(form.beds), baths: Number(form.baths),
      type: "Apartment", broker: form.broker, verified: false, description: form.description,
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85"],
    };
    setListings((current) => [newListing, ...current]);
    setActiveIndex(0);
    setMode("home");
    setImageFiles([]);
    setSaving(false);
    setForm({ title: "", area: "", price: "", beds: "2", baths: "1", broker: "", description: "" });
  };

  if (mode === "broker") {
    return <main className="broker-screen">
      <button className="back-button" onClick={() => setMode("home")}>Back to homes</button>
      <div className="broker-heading"><span className="eyebrow amharic">አከራይ</span><h1>Post a home</h1><p>Reach renters looking for their next place in Addis Ababa.</p></div>
      <form className="listing-form" onSubmit={handlePost}>
        <input required placeholder="Home title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input required placeholder="Area / neighborhood" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        <div className="form-row"><input required type="number" min="0" placeholder="Monthly price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /><select value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })}><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option><option value="4">4 bedrooms</option></select></div>
        <input required placeholder="Broker / agency name" value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })} />
        <label className="image-picker"><span>{imageFiles.length ? `${imageFiles.length} image${imageFiles.length === 1 ? "" : "s"} selected (max 10)` : "Choose 1 to 10 home photos"}</span><input required={isSupabaseConfigured} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setImageFiles(Array.from(e.target.files ?? []).slice(0, 10))} /></label>
        <textarea required rows={5} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="publish-button" type="submit" disabled={saving}>{saving ? "Publishing..." : "Publish listing"}</button>
        {loadError && <p className="form-error">{loadError}</p>}
      </form>
    </main>;
  }

  return <main className="home-screen">
    <header className="story-header feed-header">
      <button className="live-button">HOMES</button>
      <div className="story-tabs"><button className="muted-tab amharic">ሱቅ</button><button className="selected-tab amharic">ቤት</button></div>
      <button className="icon-button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search homes"><Icon name="search" /></button>
    </header>
    {searchOpen && <div className="search-box"><Icon name="search" /><input autoFocus list="home-location-suggestions" placeholder="Search area or broker" value={search} onChange={(e) => setSearch(e.target.value)} /><datalist id="home-location-suggestions">{locationSuggestions.map((location) => <option key={location} value={location} />)}</datalist></div>}
    {listing ? <div className="property-feed" ref={feedRef} onScroll={(event) => setActiveIndex(Math.round(event.currentTarget.scrollTop / event.currentTarget.clientHeight))}>
      {visibleListings.map((item, index) => <section className="property-story" key={item.id}>
        <div
          className="image-carousel"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY, listingId: item.id };
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const touch = event.changedTouches[0];
            touchStart.current = null;
            if (!start || start.listingId !== item.id) return;

            const deltaX = touch.clientX - start.x;
            const deltaY = touch.clientY - start.y;
            if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;

            const currentSlide = slideIndexes[item.id] ?? 0;
            const nextSlide = Math.max(0, Math.min(item.images.length - 1, currentSlide + (deltaX < 0 ? 1 : -1)));
            setSlideIndexes((current) => ({ ...current, [item.id]: nextSlide }));
          }}
        >
          <div className="image-track" style={{ transform: `translateX(-${(slideIndexes[item.id] ?? 0) * 100}%)` }}>
            {item.images.map((image) => <div className="post-image" key={image} style={{ backgroundImage: `url(${image})` }} />)}
          </div>
        </div>
        <div className="post-details amharic">
          <p><strong>አድራሻ:</strong> {item.area}</p>
          <p><strong>ከተማ:</strong> Addis Ababa</p>
          <p><strong>ቀበሌ:</strong> {item.area.split(",")[0]}</p>
        </div>
        <aside className="action-rail">
          <button className="broker-avatar" onClick={() => notify(`Broker: ${item.broker}`)} aria-label="Open broker"><Icon name="user" /></button>
          <button className="action" onClick={() => notify(`Message ${item.broker} will be connected to Telegram.`)} aria-label="Message broker"><Icon name="chat" /><small className="amharic">መልዕክት</small></button>
          <button className="action" onClick={() => notify(`Call ${item.broker} will be connected to Telegram.`)} aria-label="Call broker"><Icon name="phone" /><small className="amharic">ደውል</small></button>
          <button className="action" onClick={() => notify(`Address: ${item.area}`)} aria-label="Show address"><Icon name="share" /></button>
        </aside>
        <div className="story-progress">{item.images.map((image, imageIndex) => <button key={image} className={imageIndex === (slideIndexes[item.id] ?? 0) ? "current" : ""} aria-label={`Image ${imageIndex + 1} of ${item.images.length}`} />)}</div>
      </section>)}
    </div> : <div className="empty-state"><h1>No homes found</h1><p>Try another area or broker name.</p></div>}
    <nav className="bottom-nav"><button className="nav-item active"><Icon name="home" /><span className="amharic">ተከራይ</span><b>9</b></button><button className="add-home" onClick={() => setMode("broker")}><Icon name="plus" /><span className="amharic">አከራይ</span></button><button className="nav-item" onClick={() => notify(telegramUser ? `${telegramUser.first_name}'s profile is coming soon.` : "Profile is coming soon.")}><Icon name="user" /><span className="amharic">መገለጫ</span></button></nav>
  </main>;
}
