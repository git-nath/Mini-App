import { useEffect, useState } from "react";

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
  image: string;
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
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
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
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
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
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value);
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
  const [saved, setSaved] = useState<number[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", area: "", price: "", beds: "2", baths: "1", broker: "", description: "" });

  useEffect(() => {
    if (!telegram) return;
    telegram.ready();
    telegram.expand();
  }, [telegram]);

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

  const requestViewing = () => {
    if (!listing) return;
    notify(`Viewing request sent for ${listing.title}.`, { action: "request_viewing", listingId: listing.id });
  };

  const handlePost = (event: React.FormEvent) => {
    event.preventDefault();
    const newListing: Listing = {
      id: Date.now(), title: form.title, area: form.area, price: Number(form.price), beds: Number(form.beds), baths: Number(form.baths),
      type: "Apartment", broker: form.broker, verified: false, description: form.description,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    };
    setListings((current) => [newListing, ...current]);
    setActiveIndex(0);
    setMode("home");
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
        <textarea required rows={5} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="publish-button" type="submit">Publish listing</button>
      </form>
    </main>;
  }

  return <main className="home-screen">
    {listing ? <section className="property-story" style={{ backgroundImage: `url(${listing.image})` }}>
      <div className="story-shade" />
      <header className="story-header">
        <button className="live-button"><span className="live-dot" /> HOMES</button>
        <div className="story-tabs"><button className="muted-tab amharic">ሱቅ</button><button className="selected-tab amharic">ቤት</button></div>
        <button className="icon-button" onClick={() => setSearchOpen((open) => !open)}><Icon name="search" /></button>
      </header>
      {searchOpen && <div className="search-box"><Icon name="search" /><input autoFocus placeholder="Search area or broker" value={search} onChange={(e) => setSearch(e.target.value)} /></div>}
      <div className="story-content">
        <div className="story-copy"><span className="listing-kicker">{listing.type} {listing.verified && "• Verified"}</span><h1>{listing.title}</h1><p className="story-location"><span className="amharic">ከተማ:</span> Addis Ababa</p><p className="story-location"><span className="amharic">ቀበሌ:</span> {listing.area.split(",")[0]}</p><p>{listing.description}</p><div className="story-meta"><strong>{formatCurrency(listing.price)}<small>/month</small></strong><span>{listing.beds} beds</span><span>{listing.baths} baths</span></div><button className="view-button" onClick={requestViewing}>Request viewing</button></div>
        <aside className="action-rail">
          <button className="broker-avatar" onClick={() => notify(`Broker: ${listing.broker}`)}><span>{listing.broker.charAt(0)}</span></button>
          <button className={saved.includes(listing.id) ? "action active" : "action"} onClick={() => setSaved((items) => items.includes(listing.id) ? items.filter((id) => id !== listing.id) : [...items, listing.id])}><Icon name="heart" /><small>{saved.includes(listing.id) ? "Saved" : "Save"}</small></button>
          <button className="action" onClick={() => notify(`Call ${listing.broker} will be connected to Telegram.`)}><Icon name="phone" /><small className="amharic">ደውል</small></button>
          <button className="action" onClick={() => notify(`Address: ${listing.area}`)}><Icon name="share" /><small className="amharic">አድራሻ</small></button>
        </aside>
      </div>
      <div className="story-progress">{visibleListings.map((item, index) => <button key={item.id} className={index === activeIndex ? "current" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show home ${index + 1}`} />)}</div>
    </section> : <div className="empty-state"><h1>No homes found</h1><p>Try another area or broker name.</p></div>}
    <nav className="bottom-nav"><button className="nav-item active"><Icon name="home" /><span className="amharic">ተከራይ</span><b>9</b></button><button className="add-home" onClick={() => setMode("broker")}><Icon name="plus" /><span className="amharic">አከራይ</span></button><button className="nav-item" onClick={() => notify(telegramUser ? `${telegramUser.first_name}'s profile is coming soon.` : "Profile is coming soon.")}><Icon name="user" /><span className="amharic">ተከራይ</span></button></nav>
  </main>;
}
