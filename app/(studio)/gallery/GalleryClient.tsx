"use client";

import { useEffect, useState, useTransition } from "react";
import type { GalleryItem } from "@/app/api/gallery/route";

export default function GalleryClient({ initialItems, initialCounts }: { initialItems: GalleryItem[]; initialCounts: Record<string, number> }) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [counts, setCounts] = useState(initialCounts);
  const [category, setCategory] = useState<string>("all");
  const [scene, setScene] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const fetchItems = async (cat: string, scn: string, q: string, pg: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: cat,
        scene: scn,
        q,
        page: String(pg),
        limit: "40",
      });
      const res = await fetch(`/api/gallery?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (append) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setHasMore(data.pagination.hasMore);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error("Gallery fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync live on initial mount
  useEffect(() => {
    fetchItems("all", "all", "", 1, false);
  }, []);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setPage(1);
    fetchItems(newCat, scene, search, 1, false);
  };

  const handleSceneChange = (newScene: string) => {
    setScene(newScene);
    setPage(1);
    fetchItems(category, newScene, search, 1, false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    startTransition(() => {
      fetchItems(category, scene, q, 1, false);
    });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(category, scene, search, nextPage, true);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchItems(category, scene, search, 1, false);
  };

  const copyPrompt = (promptText?: string) => {
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    alert("Prompt copied to clipboard!");
  };

  return (
    <div className="gallery-wrap">
      <div className="gallery-header">
        <div className="gallery-title-row">
          <div>
            <h1 className="gallery-title">The Image Vault</h1>
            <p className="gallery-sub">
              Every generation across the studio — finals, knockout tests, and live Replicate stream.
            </p>
          </div>
          <div className="gallery-actions">
            <button className="gallery-refresh-btn" onClick={handleRefresh} disabled={loading}>
              <span>{loading ? "⟳ Syncing..." : "⟳ Refresh Feed"}</span>
            </button>
          </div>
        </div>

        <div className="gallery-controls">
          <input
            type="text"
            className="gallery-search-input"
            placeholder="Search by caption, gag headline, prompt keywords, speaker..."
            value={search}
            onChange={handleSearch}
          />

          <div className="gallery-filters">
            <div className="gallery-tabs">
              <button
                className={`gallery-tab-btn ${category === "all" ? "active" : ""}`}
                onClick={() => handleCategoryChange("all")}
              >
                All ({counts.total || items.length})
              </button>
              <button
                className={`gallery-tab-btn ${category === "final" ? "active" : ""}`}
                onClick={() => handleCategoryChange("final")}
              >
                Final Editions ({counts.finals || 23})
              </button>
              <button
                className={`gallery-tab-btn ${category === "replicate" ? "active" : ""}`}
                onClick={() => handleCategoryChange("replicate")}
              >
                Replicate Live Feed {counts.replicate ? `(${counts.replicate})` : ""}
              </button>
              <button
                className={`gallery-tab-btn ${category === "knockout" ? "active" : ""}`}
                onClick={() => handleCategoryChange("knockout")}
              >
                Knockout Runs ({counts.knockouts || 541})
              </button>
              <button
                className={`gallery-tab-btn ${category === "inspect" ? "active" : ""}`}
                onClick={() => handleCategoryChange("inspect")}
              >
                Inspect Plates ({counts.inspect || 31})
              </button>
            </div>

            <div className="gallery-scene-pills">
              <button
                className={`gallery-pill-btn ${scene === "all" ? "active" : ""}`}
                onClick={() => handleSceneChange("all")}
              >
                All Cast
              </button>
              <button
                className={`gallery-pill-btn ${scene === "trio" ? "active" : ""}`}
                onClick={() => handleSceneChange("trio")}
              >
                Trio (Abby, Drew, Barclay)
              </button>
              <button
                className={`gallery-pill-btn ${scene === "duo" ? "active" : ""}`}
                onClick={() => handleSceneChange("duo")}
              >
                Duo (Drew & Barclay)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="gallery-stats-bar">
        <span>Showing {items.length} images</span>
        {category === "replicate" && <span>⚡ Live synced from Replicate API</span>}
      </div>

      <div className="gallery-grid">
        {items.map((item) => (
          <div key={item.id} className="gallery-card" onClick={() => setSelectedItem(item)}>
            <div className="gallery-card-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.title} className="gallery-card-img" loading="lazy" />
              <span className={`gallery-badge ${item.category}`}>{item.category}</span>
            </div>
            <div className="gallery-card-body">
              <h3 className="gallery-card-title">{item.title}</h3>
              {item.caption && <p className="gallery-card-caption">{item.caption}</p>}
              <span className="gallery-card-date">{item.date} {item.model ? `· ${item.model}` : ""}</span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="gallery-load-more">
          <button className="gallery-load-btn" onClick={handleLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More Images"}
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="gallery-modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedItem.src} alt={selectedItem.title} className="gallery-modal-img" />
            </div>
            <div className="gallery-modal-sidebar">
              <div className="gallery-modal-header">
                <div>
                  <span className={`gallery-badge ${selectedItem.category}`}>{selectedItem.category}</span>
                  <h2 className="gallery-modal-title">{selectedItem.title}</h2>
                </div>
                <button className="gallery-modal-close" onClick={() => setSelectedItem(null)}>
                  ✕
                </button>
              </div>

              {selectedItem.caption && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Caption / Punchline</div>
                  <p className="gallery-meta-val" style={{ fontStyle: "italic", fontSize: "1.05rem" }}>
                    {selectedItem.caption}
                  </p>
                </div>
              )}

              {selectedItem.tv && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Television Screen & Chyron</div>
                  <p className="gallery-meta-val">{selectedItem.tv}</p>
                  {selectedItem.tvPicture && (
                    <p className="gallery-meta-val" style={{ opacity: 0.8, marginTop: "0.25rem" }}>
                      Visual: {selectedItem.tvPicture}
                    </p>
                  )}
                </div>
              )}

              {selectedItem.board && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Chalkboard Special</div>
                  <p className="gallery-meta-val">{selectedItem.board}</p>
                </div>
              )}

              {selectedItem.prompt && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Generation Prompt</div>
                  <p
                    className="gallery-meta-val"
                    style={{ maxHeight: "120px", overflowY: "auto", fontSize: "0.8rem", whiteSpace: "pre-wrap" }}
                  >
                    {selectedItem.prompt}
                  </p>
                </div>
              )}

              <div className="gallery-meta-block">
                <div className="gallery-meta-label">Details</div>
                <p className="gallery-meta-val">Date: {selectedItem.date}</p>
                {selectedItem.model && <p className="gallery-meta-val">Model: {selectedItem.model}</p>}
                {selectedItem.predictionId && (
                  <p className="gallery-meta-val">Prediction ID: {selectedItem.predictionId}</p>
                )}
              </div>

              <div className="gallery-modal-actions">
                <a href={selectedItem.src} target="_blank" download className="gallery-btn-primary" rel="noreferrer">
                  ⬇ Download High-Res
                </a>
                {selectedItem.prompt && (
                  <button className="gallery-btn-secondary" onClick={() => copyPrompt(selectedItem.prompt)}>
                    📋 Copy Prompt
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
