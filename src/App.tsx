import { useEffect, useMemo, useState } from "react";

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
    description: "Newly finished unit with balcony, secure entrance, and fast internet.",
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
    description: "Quiet compound, parking space, and a private backyard for family living.",
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
    description: "Great for students or solo renters who want easy access to transit.",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function App() {
  const telegram = window.Telegram?.WebApp;
  const telegramUser = telegram?.initDataUnsafe.user;
  const [mode, setMode] = useState<"rent" | "broker">("rent");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState(initialListings);
  const [selectedType, setSelectedType] = useState("All");
  const [form, setForm] = useState({
    title: "",
    area: "",
    price: "",
    beds: "2",
    baths: "1",
    type: "Apartment",
    broker: "",
    description: "",
  });

  useEffect(() => {
    if (!telegram) return;

    telegram.ready();
    telegram.expand();

    Object.entries(telegram.themeParams).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--tg-${key.replaceAll("_", "-")}`, value);
    });
  }, [telegram]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch =
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        listing.area.toLowerCase().includes(search.toLowerCase()) ||
        listing.broker.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedType === "All" || listing.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [listings, search, selectedType]);

  const handlePostListing = (event: React.FormEvent) => {
    event.preventDefault();
    setListings((current) => [
      {
        id: Date.now(),
        title: form.title,
        area: form.area,
        price: Number(form.price),
        beds: Number(form.beds),
        baths: Number(form.baths),
        type: form.type,
        broker: form.broker,
        verified: false,
        description: form.description,
      },
      ...current,
    ]);
    setForm({
      title: "",
      area: "",
      price: "",
      beds: "2",
      baths: "1",
      type: "Apartment",
      broker: "",
      description: "",
    });
    setMode("rent");
  };

  const notifyTelegram = (message: string, payload?: object) => {
    if (telegram) {
      if (payload && telegram.isVersionAtLeast?.("6.1")) {
        telegram.sendData(JSON.stringify(payload));
      }
      telegram.showAlert(message);
      return;
    }

    window.alert(message);
  };

  const handleViewingRequest = (listing: Listing) => {
    notifyTelegram(`Your viewing request for “${listing.title}” was sent to ${listing.broker}.`, {
      action: "request_viewing",
      listingId: listing.id,
      renter: telegramUser?.username ?? telegramUser?.first_name ?? "guest",
    });
  };

  return (
    <div className="app-shell">
      <div className="backdrop backdrop-a" />
      <div className="backdrop backdrop-b" />

      <main className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">Telegram Mini App</p>
            <h1>HomeBridge</h1>
          </div>
          <div className="status-pill">Live broker feed</div>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <p className="hero-tag">
              {telegramUser ? `Welcome, ${telegramUser.first_name}.` : "Find homes faster."} Post listings in seconds.
            </p>
            <h2>Connect renters and brokers in one simple mini app.</h2>
            <p className="hero-text">
              Renters can browse verified homes, send view requests, and chat with brokers.
              Brokers can publish new homes and respond to interested renters from the same place.
            </p>
          </div>

          <div className="mode-switch" role="tablist" aria-label="App mode">
            <button className={mode === "rent" ? "active" : ""} onClick={() => setMode("rent")}>
              I want to rent
            </button>
            <button className={mode === "broker" ? "active" : ""} onClick={() => setMode("broker")}>
              I’m a broker
            </button>
          </div>
        </section>

        {mode === "rent" ? (
          <>
            <section className="toolbar">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by area, broker, or home name"
              />
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                <option>All</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Studio</option>
              </select>
            </section>

            <section className="listing-grid">
              {filteredListings.map((listing) => (
                <article className="listing-card" key={listing.id}>
                  <div className="listing-top">
                    <div>
                      <p className="listing-type">{listing.type}</p>
                      <h3>{listing.title}</h3>
                    </div>
                    {listing.verified && <span className="verified-badge">Verified</span>}
                  </div>
                  <p className="listing-area">{listing.area}</p>
                  <p className="listing-desc">{listing.description}</p>
                  <div className="listing-meta">
                    <span>{listing.beds} beds</span>
                    <span>{listing.baths} baths</span>
                    <span>{formatCurrency(listing.price)}/mo</span>
                  </div>
                  <div className="listing-footer">
                    <strong>{listing.broker}</strong>
                    <button className="primary-button" onClick={() => handleViewingRequest(listing)}>
                      Request viewing
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="broker-panel">
            <div className="panel-copy">
              <h3>Post a new home</h3>
              <p>
                Add a listing and it appears in the renter feed immediately. This is a clean
                starting point for Telegram bot integration, payment collection, or broker
                verification later.
              </p>
            </div>

            <form className="listing-form" onSubmit={handlePostListing}>
              <input
                required
                placeholder="Home title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                required
                placeholder="Area / neighborhood"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
              <div className="form-row">
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Monthly price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>Apartment</option>
                  <option>House</option>
                  <option>Studio</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Beds"
                  value={form.beds}
                  onChange={(e) => setForm({ ...form, beds: e.target.value })}
                />
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Baths"
                  value={form.baths}
                  onChange={(e) => setForm({ ...form, baths: e.target.value })}
                />
              </div>
              <input
                required
                placeholder="Broker / agency name"
                value={form.broker}
                onChange={(e) => setForm({ ...form, broker: e.target.value })}
              />
              <textarea
                required
                rows={4}
                placeholder="Short description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <button className="primary-button submit-button" type="submit">
                Publish listing
              </button>
            </form>
          </section>
        )}

        <footer className="bottom-bar">
          <div>
            <strong>3 active homes</strong>
            <p>Built for Telegram chat-first discovery</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => notifyTelegram("Broker inbox is ready for the Telegram bot connection.")}
          >
            Open broker inbox
          </button>
        </footer>
      </main>
    </div>
  );
}
