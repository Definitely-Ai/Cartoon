"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import type { GalleryItem } from "@/app/api/gallery/route";

export default function GalleryClient({
  initialItems,
  initialCounts,
}: {
  initialItems: GalleryItem[];
  initialCounts: Record<string, number>;
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [counts, setCounts] = useState(initialCounts);
  const [category, setCategory] = useState<string>("all");
  const [scene, setScene] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const fetchItems = useCallback(
    async (cat: string, scn: string, srt: string, q: string, pg: number, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          category: cat,
          scene: scn,
          sort: srt,
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
    },
    []
  );

  // Read URL query params on mount if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlCat = sp.get("category");
      const urlScene = sp.get("scene");
      const urlSort = sp.get("sort") as "newest" | "oldest" | null;
      const urlQ = sp.get("q") || "";
      if (urlCat || urlScene || urlSort || urlQ) {
        const cat = urlCat || "all";
        const scn = urlScene || "all";
        const srt = urlSort || "newest";
        if (urlCat) setCategory(cat);
        if (urlScene) setScene(scn);
        if (urlSort) setSortOrder(srt);
        if (urlQ) setSearch(urlQ);
        fetchItems(cat, scn, srt, urlQ, 1, false);
      }
    }
  }, [fetchItems]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setPage(1);
    fetchItems(newCat, scene, sortOrder, search, 1, false);
  };

  const handleSceneChange = (newScene: string) => {
    setScene(newScene);
    setPage(1);
    fetchItems(category, newScene, sortOrder, search, 1, false);
  };

  const handleSortToggle = () => {
    const nextSort = sortOrder === "newest" ? "oldest" : "newest";
    setSortOrder(nextSort);
    setPage(1);
    fetchItems(category, scene, nextSort, search, 1, false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    startTransition(() => {
      fetchItems(category, scene, sortOrder, q, 1, false);
    });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(category, scene, sortOrder, search, nextPage, true);
  };

  // Modal navigation
  const selectedItem = selectedIndex !== null && items[selectedIndex] ? items[selectedIndex] : null;

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : items.length - 1));
  }, [selectedIndex, items.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev < items.length - 1 ? prev + 1 : 0));
  }, [selectedIndex, items.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

  const copyPrompt = (promptText?: string) => {
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const handleImageError = (id: string) => {
    setFailedImages((prev) => new Set(prev).add(id));
  };

  return (
    <div className="gallery-wrap">
      <div className="gallery-header">
        <div className="gallery-title-row">
          <div>
            <p className="gallery-eyebrow">Studio Prints & Master Archive</p>
            <h1 className="gallery-title">The Image Vault</h1>
            <p className="gallery-sub">
              Curated finished cartoons, verified master reference plates, and production prints — sorted chronologically by time generated.
            </p>
          </div>
          <div className="gallery-actions">
            <button
              className="gallery-sort-toggle-btn"
              onClick={handleSortToggle}
              title="Toggle sort order by generation timestamp"
            >
              <span>{sortOrder === "newest" ? "⏱️ Newest Generated" : "⏱️ Oldest First"}</span>
            </button>
          </div>
        </div>

        <div className="gallery-controls">
          <div className="gallery-search-wrap">
            <span className="gallery-search-icon">🔍</span>
            <input
              type="text"
              className="gallery-search-input"
              placeholder="Search by caption, punchline, chyron, chalkboard menu, speaker..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="gallery-filters">
            <div className="gallery-tabs">
              <button
                className={`gallery-tab-btn ${category === "all" ? "active" : ""}`}
                onClick={() => handleCategoryChange("all")}
              >
                All Works ({counts.total || items.length})
              </button>
              <button
                className={`gallery-tab-btn ${category === "final" ? "active" : ""}`}
                onClick={() => handleCategoryChange("final")}
              >
                Final Editions ({counts.finals || 18})
              </button>
              <button
                className={`gallery-tab-btn ${category === "master" ? "active" : ""}`}
                onClick={() => handleCategoryChange("master")}
              >
                Master Plates ({counts.masters || 10})
              </button>
              <button
                className={`gallery-tab-btn ${category === "showcase" ? "active" : ""}`}
                onClick={() => handleCategoryChange("showcase")}
              >
                Money Series ({counts.showcase || 10})
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
                Trio (Drew, Barclay & Abby)
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
        <span>Cataloging {items.length} print{items.length === 1 ? "" : "s"} · Sorted by time generated ({sortOrder})</span>
      </div>

      <div className="gallery-grid">
        {items.map((item, index) => {
          const isFailed = failedImages.has(item.id);
          return (
            <div key={item.id} className="gallery-card" onClick={() => setSelectedIndex(index)}>
              <div className="gallery-card-thumb">
                {!isFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt={item.title}
                    className="gallery-card-img"
                    loading="lazy"
                    onError={() => handleImageError(item.id)}
                  />
                ) : (
                  <div className="gallery-card-fallback">
                    <p style={{ fontWeight: 600, color: "#c5a059", marginBottom: "0.25rem" }}>{item.category.toUpperCase()}</p>
                    <p>{item.title}</p>
                  </div>
                )}
                <span className={`gallery-badge ${item.category}`}>
                  {item.category === "final" ? "FINAL" : item.category === "master" ? "MASTER" : "SERIES"}
                </span>
                {item.sceneType && (
                  <span className="gallery-scene-tag">{item.sceneType.toUpperCase()}</span>
                )}
              </div>
              <div className="gallery-card-body">
                <h3 className="gallery-card-title">{item.title}</h3>
                {item.caption && <p className="gallery-card-caption">&ldquo;{item.caption.replace(/^.*:\s*["“]?|["”]?$/g, "")}&rdquo;</p>}
                <div className="gallery-card-meta-row">
                  <span>{item.formattedTime}</span>
                  {item.sceneType && <span>{item.sceneType.toUpperCase()}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="gallery-load-more">
          <button className="gallery-load-btn" onClick={handleLoadMore} disabled={loading}>
            {loading ? "Loading Artwork..." : "Load More Prints"}
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="gallery-modal-backdrop" onClick={() => setSelectedIndex(null)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-media">
              <button
                className="gallery-modal-nav-btn gallery-modal-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                title="Previous (Left Arrow)"
              >
                ‹
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedItem.src} alt={selectedItem.title} className="gallery-modal-img" />

              <button
                className="gallery-modal-nav-btn gallery-modal-next"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                title="Next (Right Arrow)"
              >
                ›
              </button>
            </div>

            <div className="gallery-modal-sidebar">
              <div className="gallery-modal-header">
                <div>
                  <span className={`gallery-badge ${selectedItem.category}`}>
                    {selectedItem.category === "final" ? "FINAL" : selectedItem.category === "master" ? "MASTER" : "SERIES"}
                  </span>
                  <h2 className="gallery-modal-title">{selectedItem.title}</h2>
                </div>
                <button
                  className="gallery-modal-close"
                  onClick={() => setSelectedIndex(null)}
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>

              {selectedItem.caption && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Attributed Dialogue & Caption</div>
                  <p className="gallery-meta-val" style={{ fontStyle: "italic", fontSize: "1.08rem" }}>
                    {selectedItem.caption}
                  </p>
                </div>
              )}

              {selectedItem.tv && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Television Screen · Chyron</div>
                  <p className="gallery-meta-val" style={{ fontWeight: 600 }}>{selectedItem.tv}</p>
                  {selectedItem.tvPicture && (
                    <p className="gallery-meta-val" style={{ opacity: 0.82, marginTop: "0.35rem", fontSize: "0.85rem" }}>
                      Visual: {selectedItem.tvPicture}
                    </p>
                  )}
                </div>
              )}

              {selectedItem.board && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Chalkboard Special</div>
                  <p className="gallery-meta-val gallery-chalk-text">{selectedItem.board}</p>
                </div>
              )}

              {selectedItem.action && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Staging Action Beat</div>
                  <p className="gallery-meta-val" style={{ fontSize: "0.88rem" }}>{selectedItem.action}</p>
                </div>
              )}

              {selectedItem.prompt && (
                <div className="gallery-meta-block">
                  <div className="gallery-meta-label">Generation Prompt Snippet</div>
                  <p
                    className="gallery-meta-val"
                    style={{ maxHeight: "110px", overflowY: "auto", fontSize: "0.8rem", whiteSpace: "pre-wrap" }}
                  >
                    {selectedItem.prompt}
                  </p>
                </div>
              )}

              <div className="gallery-meta-block">
                <div className="gallery-meta-label">Catalog Record</div>
                <p className="gallery-meta-val">Generated: {selectedItem.formattedTime}</p>
                {selectedItem.sceneType && (
                  <p className="gallery-meta-val">Cast Staging: {selectedItem.sceneType.toUpperCase()}</p>
                )}
              </div>

              <div className="gallery-modal-actions">
                <a
                  href={selectedItem.src}
                  target="_blank"
                  download
                  className="gallery-btn-primary"
                  rel="noreferrer"
                >
                  ⬇ Download Art
                </a>
                {selectedItem.prompt && (
                  <button className="gallery-btn-secondary" onClick={() => copyPrompt(selectedItem.prompt)}>
                    {copiedPrompt ? "✓ Copied!" : "📋 Copy Prompt"}
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
