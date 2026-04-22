import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config/api";
import PageHelmet from "../components/PageHelmet";

function authHeaders() {
  const token = localStorage.getItem("mandalart_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Total size per gallery action (drag/drop or file picker), bytes. Matches PHP post_max_size. */
const GALLERY_UPLOAD_BYTES_MAX = 500 * 1024 * 1024;
/**
 * Max body size per HTTP request (multipart is slightly larger than file sum).
 * Cloudflare Free ~100 MB/request — staying under avoids 413 before traffic hits your VPS.
 */
const GALLERY_UPLOAD_CHUNK_BYTES_MAX = 90 * 1024 * 1024;

function chunkGalleryFilesByRequestSize(files, maxChunkBytes) {
  const list = Array.from(files || []);
  const chunks = [];
  let cur = [];
  let sum = 0;
  for (const f of list) {
    if (f.size > maxChunkBytes) {
      return {
        error: `"${f.name}" is larger than ${Math.round(maxChunkBytes / (1024 * 1024))} MB per upload request. Compress it, or temporarily bypass strict proxies (e.g. turn off Cloudflare proxy for admin) to upload very large single files.`,
      };
    }
    if (cur.length && sum + f.size > maxChunkBytes) {
      chunks.push(cur);
      cur = [];
      sum = 0;
    }
    cur.push(f);
    sum += f.size;
  }
  if (cur.length) chunks.push(cur);
  return { chunks };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "Backend response is not valid JSON. Please check that the PHP server is running."
    );
  }
  return { res, data };
}

export default function Admin() {
  const [tab, setTab] = useState("products");
  const [me, setMe] = useState(null);
  const [authError, setAuthError] = useState("");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productPickerQuery, setProductPickerQuery] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    image_url: "",
    is_active: 1,
  });

  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [galleryDropActive, setGalleryDropActive] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState("");
  const [galleryUploadSuccess, setGalleryUploadSuccess] = useState("");
  const [gallerySelectedIds, setGallerySelectedIds] = useState(() => new Set());
  const [galleryBulkDeleting, setGalleryBulkDeleting] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [contactMessages, setContactMessages] = useState([]);
  const [contactMessagesLoading, setContactMessagesLoading] = useState(false);
  const [contactMessagesError, setContactMessagesError] = useState("");

  const [contactReplyDrafts, setContactReplyDrafts] = useState({});
  const [contactReplyLoadingId, setContactReplyLoadingId] = useState(null);
  const [contactReplyError, setContactReplyError] = useState("");
  const [contactReplySuccess, setContactReplySuccess] = useState("");
  const [contactDeleteLoadingId, setContactDeleteLoadingId] = useState(null);

  const [workshopBookings, setWorkshopBookings] = useState([]);
  const [workshopBookingsLoading, setWorkshopBookingsLoading] = useState(false);
  const [workshopBookingsError, setWorkshopBookingsError] = useState("");
  const [sessionBookingBusyId, setSessionBookingBusyId] = useState(null);

  const [newWorkshopSession, setNewWorkshopSession] = useState({
    booking_date: "",
    start_time: "10:00",
    end_time: "12:00",
    available_spots: 5,
    workshop_id: null,
  });
  const [newWorkshopSessionError, setNewWorkshopSessionError] = useState("");
  const [newWorkshopSessionLoading, setNewWorkshopSessionLoading] = useState(false);

  const isAdmin = (me?.role || "") === "admin";

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        setAuthError("");
        const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_me`, {
          headers: { ...authHeaders() },
        });
        if (!res.ok || data.status !== "success") {
          throw new Error("Not authorized");
        }
        if (!cancelled) setMe({ email: data.email, role: data.role, name: data.name });
      } catch {
        if (!cancelled) {
          setMe(null);
          setAuthError(
            "You must be logged in as an admin to access this page."
          );
        }
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadProducts = async () => {
    setProductsError("");
    setProductsLoading(true);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_get_products`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      const loadedProducts = data.products || [];
      setProducts(loadedProducts);
      setSelectedProductId((prev) => {
        if (!loadedProducts.length) return "";
        if (prev && loadedProducts.some((p) => String(p.id) === String(prev))) {
          return String(prev);
        }
        return String(loadedProducts[0].id);
      });
    } catch {
      setProductsError("Failed to load products.");
    } finally {
      setProductsLoading(false);
    }
  };

  const loadGallery = async () => {
    setGalleryError("");
    setGalleryLoading(true);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_get_gallery_images`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setGallery(data.images || []);
    } catch {
      setGalleryError("Failed to load gallery images.");
    } finally {
      setGalleryLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersError("");
    setOrdersLoading(true);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_get_orders`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setOrders(data.orders || []);
    } catch {
      setOrdersError("Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadContactMessages = async () => {
    setContactMessagesError("");
    setContactMessagesLoading(true);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_get_contact_messages`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setContactMessages(data.messages || []);
    } catch {
      setContactMessagesError("Failed to load contact messages.");
    } finally {
      setContactMessagesLoading(false);
    }
  };

  const sendContactReply = async (contactMessageId) => {
    setContactReplyError("");
    setContactReplySuccess("");

    const replyText = String(contactReplyDrafts[contactMessageId] ?? "").trim();
    if (!replyText) {
      setContactReplyError("Please write a reply first.");
      return;
    }

    setContactReplyLoadingId(contactMessageId);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_reply_contact_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id: contactMessageId, reply: replyText }),
      });

      if (!res.ok || data.status !== "success") {
        const msg = data?.message || "Failed to send reply.";
        throw new Error(msg);
      }

      setContactReplySuccess("Reply sent.");
      setContactReplyDrafts((d) => ({ ...d, [contactMessageId]: "" }));
      await loadContactMessages();
    } catch (err) {
      setContactReplyError(err?.message || "Failed to send reply.");
    } finally {
      setContactReplyLoadingId(null);
    }
  };

  const deleteContactConversation = async (contactMessageId) => {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setContactReplyError("");
    setContactReplySuccess("");
    setContactDeleteLoadingId(contactMessageId);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_delete_contact_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id: contactMessageId }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setContactReplySuccess("Conversation deleted.");
      await loadContactMessages();
    } catch {
      setContactReplyError("Failed to delete conversation.");
    } finally {
      setContactDeleteLoadingId(null);
    }
  };

  const updateOrderStatus = async (orderId, orderStatus) => {
    try {
      setOrdersError("");
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_update_order_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id: orderId, order_status: orderStatus }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      await loadOrders();
    } catch {
      setOrdersError("Failed to update order status.");
    }
  };

  const loadWorkshopBookings = async () => {
    setWorkshopBookingsError("");
    setWorkshopBookingsLoading(true);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_get_workshop_sessions`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setWorkshopBookings(data.sessions || []);
    } catch {
      setWorkshopBookingsError("Failed to load workshop bookings.");
    } finally {
      setWorkshopBookingsLoading(false);
    }
  };

  const updateWorkshopSession = async (sessionId, bookingDate, startTime, endTime, availableSpots) => {
    setWorkshopBookingsError("");
    try {
      const { data } = await fetchJson(`${API_BASE_URL}/api/admin_update_workshop_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          id: sessionId,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          available_spots: availableSpots,
        }),
      });
      if (data.status !== "success") throw new Error("Failed");
      await loadWorkshopBookings();
    } catch {
      setWorkshopBookingsError("Failed to update workshop session.");
    }
  };

  const deleteWorkshopSession = async (sessionId) => {
    if (!confirm("Delete this workshop session?")) return;
    setWorkshopBookingsError("");
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_delete_workshop_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id: sessionId }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      await loadWorkshopBookings();
    } catch {
      setWorkshopBookingsError("Failed to delete workshop session.");
    }
  };

  const updateSessionBookingStatus = async (bookingId, status) => {
    setWorkshopBookingsError("");
    setSessionBookingBusyId(bookingId);
    try {
      const { res, data } = await fetchJson(
        `${API_BASE_URL}/api/admin_update_session_booking_status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ booking_id: bookingId, status }),
        }
      );
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      await loadWorkshopBookings();
    } catch {
      setWorkshopBookingsError("Failed to update booking status.");
    } finally {
      setSessionBookingBusyId(null);
    }
  };

  const deleteSessionBooking = async (bookingId, userLabel) => {
    if (
      !confirm(
        `Delete this booking${userLabel ? ` (${userLabel})` : ""}? This cannot be undone.`
      )
    ) {
      return;
    }
    setWorkshopBookingsError("");
    setSessionBookingBusyId(bookingId);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_delete_session_booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      await loadWorkshopBookings();
    } catch {
      setWorkshopBookingsError("Failed to delete booking.");
    } finally {
      setSessionBookingBusyId(null);
    }
  };

  const createWorkshopSession = async (e) => {
    e.preventDefault();
    setNewWorkshopSessionError("");
    setNewWorkshopSessionLoading(true);

    try {
      const payload = {
        workshop_id: newWorkshopSession.workshop_id,
        booking_date: newWorkshopSession.booking_date,
        start_time: newWorkshopSession.start_time,
        end_time: newWorkshopSession.end_time,
        available_spots: newWorkshopSession.available_spots,
      };

      const { res, data } = await fetchJson(
        `${API_BASE_URL}/api/admin_create_workshop_session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok || data.status !== "success") {
        throw new Error("Failed");
      }

      setNewWorkshopSession({
        booking_date: "",
        start_time: "10:00",
        end_time: "12:00",
        available_spots: 5,
        workshop_id: null,
      });
      await loadWorkshopBookings();
    } catch {
      setNewWorkshopSessionError("Failed to create workshop session.");
    } finally {
      setNewWorkshopSessionLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "products") {
      loadProducts();
      loadGallery();
    }
    if (tab === "gallery") loadGallery();
    if (tab === "orders") loadOrders();
    if (tab === "workshop") loadWorkshopBookings();
    if (tab === "contact") loadContactMessages();
  }, [tab, isAdmin]);

  useEffect(() => {
    if (!isAdmin || tab !== "contact") return;

    const pollMs = 30000;
    const timer = window.setInterval(() => {
      loadContactMessages();
    }, pollMs);

    return () => window.clearInterval(timer);
  }, [tab, isAdmin]);

  const onNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((p) => ({
      ...p,
      [name]: name === "is_active" ? Number(value) : value,
    }));
  };

  const onNumberInputKeyDown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    setProductsError("");
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_create_product`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price || 0),
          stock_quantity: Number(newProduct.stock_quantity || 0),
        }),
      });
      if (!res.ok || data.status !== "success") {
        const msg =
          (typeof data?.message === "string" && data.message.trim()) ||
          (typeof data?.status === "string" ? data.status : "") ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setNewProduct({
        name: "",
        slug: "",
        description: "",
        price: "",
        stock_quantity: "",
        category: "",
        image_url: "",
        is_active: 1,
      });
      await loadProducts();
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Failed to create product.");
    }
  };

  const updateProductField = async (id, patch) => {
    setProductsError("");
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const body = { ...current, ...patch, id };
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_update_product`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      await loadProducts();
    } catch {
      setProductsError("Failed to update product.");
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    setProductsError("");
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_delete_product`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      await loadProducts();
    } catch {
      setProductsError("Failed to delete product.");
    }
  };

  const selectedProduct = useMemo(() => {
    if (!products.length) return null;
    if (!selectedProductId) return products[0];
    return products.find((p) => String(p.id) === String(selectedProductId)) || products[0];
  }, [products, selectedProductId]);

  const productPickerOptions = useMemo(() => {
    const q = productPickerQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const idText = String(p.id);
      const nameText = String(p.name || "").toLowerCase();
      return idText.includes(q) || nameText.includes(q);
    });
  }, [products, productPickerQuery]);

  const sortedGallery = useMemo(() => {
    const g = [...gallery];
    g.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    return g;
  }, [gallery]);

  useEffect(() => {
    if (tab !== "gallery") {
      setGallerySelectedIds(new Set());
    }
  }, [tab]);

  useEffect(() => {
    const valid = new Set(gallery.map((img) => img.id));
    setGallerySelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) {
        return prev;
      }
      return next;
    });
  }, [gallery]);

  const updateGallery = async (id, patch) => {
    setGalleryError("");
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_update_gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      await loadGallery();
    } catch {
      setGalleryError("Failed to update gallery.");
    }
  };

  const deleteGalleryImage = async (id) => {
    if (!confirm("Remove this image from gallery list? (File stays on disk)")) return;
    setGalleryError("");
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_delete_gallery_image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setGallerySelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadGallery();
    } catch {
      setGalleryError("Failed to delete gallery image.");
    }
  };

  const deleteGalleryImagesBulk = async () => {
    const ids = [...gallerySelectedIds];
    if (!ids.length) return;
    if (
      !confirm(
        `Remove ${ids.length} image(s) from the gallery list? (Files stay on disk)`
      )
    ) {
      return;
    }
    setGalleryError("");
    setGalleryBulkDeleting(true);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/admin_delete_gallery_images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setGallerySelectedIds(new Set());
      await loadGallery();
    } catch {
      setGalleryError("Failed to delete gallery images.");
    } finally {
      setGalleryBulkDeleting(false);
    }
  };

  const uploadGalleryFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    setGalleryUploadError("");
    setGalleryUploadSuccess("");

    for (const f of list) {
      if (f.size > GALLERY_UPLOAD_BYTES_MAX) {
        setGalleryUploadError(
          `"${f.name}" is larger than 500 MB. Compress it or upload a smaller file.`
        );
        return;
      }
    }

    const totalBytes = list.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > GALLERY_UPLOAD_BYTES_MAX) {
      setGalleryUploadError(
        `Total size is ${(totalBytes / (1024 * 1024)).toFixed(1)} MB; maximum is 500 MB in one upload. Upload in multiple batches.`
      );
      return;
    }

    const { chunks, error: chunkErr } = chunkGalleryFilesByRequestSize(
      list,
      GALLERY_UPLOAD_CHUNK_BYTES_MAX
    );
    if (chunkErr) {
      setGalleryUploadError(chunkErr);
      return;
    }

    setGalleryUploading(true);

    try {
      let totalUploaded = 0;
      let totalSkipped = 0;

      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        const formData = new FormData();
        for (const f of chunk) {
          formData.append("files", f, f.name);
        }

        const res = await fetch(`${API_BASE_URL}/api/admin_upload_gallery_images`, {
          method: "POST",
          headers: { ...authHeaders() },
          body: formData,
        });

        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (res.status === 413) {
          throw new Error(
            "Upload rejected: payload too large (413). Your host or CDN (e.g. Cloudflare ~100 MB per request) blocked this batch. Deploy the latest nginx config (512 MB body) or upload fewer / smaller files per attempt."
          );
        }

        if (!res.ok || data.status !== "success") {
          const msg =
            (typeof data?.message === "string" && data.message.trim()) ||
            "Failed to upload images.";
          const skipped = Array.isArray(data?.skipped) ? data.skipped : [];
          const hint =
            skipped.length > 0
              ? ` (${skipped
                  .slice(0, 3)
                  .map((s) => s.filename || "file")
                  .join(", ")}${skipped.length > 3 ? "…" : ""})`
              : "";
          throw new Error(
            chunks.length > 1
              ? `${msg}${hint} (stopped after batch ${c + 1}; ${totalUploaded} file(s) had already been saved.)`
              : `${msg}${hint}`
          );
        }

        totalUploaded += data.uploaded_count ?? 0;
        totalSkipped += data.skipped_count ?? 0;
      }

      setGalleryUploadSuccess(
        `Upload successful: ${totalUploaded} file(s) added${totalSkipped ? `, ${totalSkipped} skipped` : ""}${chunks.length > 1 ? ` (${chunks.length} requests).` : "."}`
      );

      await loadGallery();
    } catch (e) {
      setGalleryUploadError(e?.message || "Failed to upload images.");
    } finally {
      setGalleryUploading(false);
      setGalleryDropActive(false);
    }
  };

  if (authError) {
    return (
      <main className="admin-page">
        <PageHelmet title="Admin" description="MandalArt administration." path="/Admin" noindex />
        <section className="profile-card">
          <h2 className="profile-title">Admin</h2>
          <p className="profile-error">{authError}</p>
          <p className="profile-muted">
            Sign in with an admin account (users.role = <code>admin</code>), then refresh.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <PageHelmet title="Admin" description="MandalArt administration." path="/Admin" noindex />
      <section className="profile-card admin-header">
        <h2 className="profile-title">Admin</h2>
        <div className="admin-userMeta">
          {me?.email ? (
            <>
              Signed in as <b>{me.email}</b> ({me.role})
            </>
          ) : null}
        </div>
      </section>

      <div className="admin-tabs">
        <button type="button" className="admin-tabBtn" onClick={() => setTab("gallery")} disabled={tab === "gallery"}>
          Gallery
        </button>
        <button type="button" className="admin-tabBtn" onClick={() => setTab("contact")} disabled={tab === "contact"}>
          Contact messages
        </button>
        <button type="button" className="admin-tabBtn" onClick={() => setTab("workshop")} disabled={tab === "workshop"}>
          Workshop bookings
        </button>
        <button type="button" className="admin-tabBtn" onClick={() => setTab("orders")} disabled={tab === "orders"}>
          Orders
        </button>
        <button type="button" className="admin-tabBtn" onClick={() => setTab("products")} disabled={tab === "products"}>
          Products
        </button>
      </div>

      {tab === "products" ? (
        <section className="profile-card admin-section">
          <h3>Products</h3>
          {productsError ? <p className="admin-error">{productsError}</p> : null}
          {productsLoading ? <p className="admin-loading">Loading...</p> : null}

          <form onSubmit={createProduct} className="admin-form">
            <h4>Add new product</h4>
            <input name="name" placeholder="Name" value={newProduct.name} onChange={onNewProductChange} />
            <input name="slug" placeholder="Slug (optional)" value={newProduct.slug} onChange={onNewProductChange} />
            <textarea
              name="description"
              placeholder="Description"
              value={newProduct.description}
              onChange={onNewProductChange}
              rows={3}
            />
            <div className="admin-grid2">
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                className="admin-noSpinner"
                value={newProduct.price}
                onChange={onNewProductChange}
                onKeyDown={onNumberInputKeyDown}
                onWheel={(e) => e.currentTarget.blur()}
              />
              <input
                name="stock_quantity"
                type="number"
                min="0"
                placeholder="Stock quantity"
                className="admin-noSpinner"
                value={newProduct.stock_quantity}
                onChange={onNewProductChange}
                onKeyDown={onNumberInputKeyDown}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
            <div className="admin-grid2">
              <input name="category" placeholder="Category" value={newProduct.category} onChange={onNewProductChange} />
              <select
                name="image_url"
                value={newProduct.image_url}
                onChange={onNewProductChange}
                disabled={galleryLoading && sortedGallery.length === 0}
              >
                <option value="">Select image from gallery...</option>
                {sortedGallery.map((img) => {
                  const label = img.title ? `${img.title} (${img.filename})` : img.filename;
                  const value = `/gallery_images/${img.filename}`;
                  return (
                    <option key={img.id} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            {newProduct.image_url ? (
              <div className="admin-productImagePreview" aria-label="Selected product image preview">
                <img src={newProduct.image_url} alt="Selected gallery image preview" />
              </div>
            ) : null}
            <label className="admin-inlineLabel">
              <span>Active:</span>
              <select name="is_active" value={newProduct.is_active} onChange={onNewProductChange}>
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </label>
            <button type="submit" className="admin-btn">
              Create product
            </button>
          </form>

          <hr className="admin-divider" />

          <h4>Edit existing</h4>
          {products.length ? (
            <>
              <div className="admin-form" style={{ maxWidth: 420, marginBottom: 12 }}>
                <label className="admin-fieldLabel" htmlFor="admin-product-search">
                  Quick search (name or ID)
                </label>
                <input
                  id="admin-product-search"
                  type="search"
                  placeholder="Type product name or ID..."
                  value={productPickerQuery}
                  onChange={(e) => setProductPickerQuery(e.target.value)}
                />
                <label className="admin-fieldLabel" htmlFor="admin-product-select">
                  Select product
                </label>
                <select
                  id="admin-product-select"
                  value={
                    productPickerOptions.some((p) => String(p.id) === String(selectedProduct?.id))
                      ? String(selectedProduct?.id || "")
                      : ""
                  }
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {!productPickerOptions.length ? (
                    <option value="" disabled>
                      No matching products
                    </option>
                  ) : null}
                  {productPickerOptions.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      #{p.id} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct ? (
                <div className="admin-form admin-form--wide" style={{ display: "grid", gap: 12 }}>
                  <div key={selectedProduct.id} className="admin-productCard">
                    <div className="admin-productCard__head">
                      <b>#{selectedProduct.id}</b>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => deleteProduct(selectedProduct.id)}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="admin-grid2" style={{ marginTop: 10 }}>
                      <input
                        defaultValue={selectedProduct.name}
                        onBlur={(e) =>
                          updateProductField(selectedProduct.id, { name: e.target.value })
                        }
                      />
                      <input
                        defaultValue={selectedProduct.slug}
                        onBlur={(e) =>
                          updateProductField(selectedProduct.id, { slug: e.target.value })
                        }
                      />
                    </div>

                    <textarea
                      defaultValue={selectedProduct.description || ""}
                      rows={3}
                      style={{ width: "100%", marginTop: 10, boxSizing: "border-box" }}
                      onBlur={(e) =>
                        updateProductField(selectedProduct.id, { description: e.target.value })
                      }
                    />

                    <div className="admin-grid3" style={{ marginTop: 10 }}>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={selectedProduct.price}
                        onBlur={(e) =>
                          updateProductField(selectedProduct.id, {
                            price: Number(e.target.value),
                          })
                        }
                      />
                      <input
                        type="number"
                        defaultValue={selectedProduct.stock_quantity}
                        onBlur={(e) =>
                          updateProductField(selectedProduct.id, {
                            stock_quantity: Number(e.target.value),
                          })
                        }
                      />
                      <select
                        defaultValue={selectedProduct.is_active ? 1 : 0}
                        onChange={(e) =>
                          updateProductField(selectedProduct.id, {
                            is_active: Number(e.target.value),
                          })
                        }
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                      </select>
                    </div>

                    <div className="admin-grid2" style={{ marginTop: 10 }}>
                      <input
                        defaultValue={selectedProduct.category || ""}
                        onBlur={(e) =>
                          updateProductField(selectedProduct.id, { category: e.target.value })
                        }
                      />
                      <select
                        defaultValue={selectedProduct.image_url || ""}
                        disabled={galleryLoading && sortedGallery.length === 0}
                        onChange={(e) =>
                          updateProductField(selectedProduct.id, { image_url: e.target.value })
                        }
                      >
                        <option value="">No image</option>
                        {sortedGallery.map((img) => {
                          const label = img.title ? `${img.title} (${img.filename})` : img.filename;
                          const value = `/gallery_images/${img.filename}`;
                          return (
                            <option key={img.id} value={value}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {selectedProduct.image_url ? (
                      <div className="admin-productImagePreview">
                        <img src={selectedProduct.image_url} alt="Selected product preview" />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="admin-muted">No products available yet.</p>
          )}
        </section>
      ) : null}

      {tab === "orders" ? (
        <section className="profile-card admin-section">
          <h3>Orders</h3>
          {ordersError ? <p className="admin-error">{ordersError}</p> : null}
          {ordersLoading ? <p className="admin-loading">Loading...</p> : null}

          {!ordersLoading ? (
            <div className="admin-tableWrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Order date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.order_number}</td>
                      <td>{o.full_name}</td>
                      <td>{o.email}</td>
                      <td>{Number(o.total_amount).toLocaleString()} HUF</td>
                      <td>
                        <select
                          value={o.order_status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        >
                          <option value="pending">pending</option>
                          <option value="processing">processing</option>
                          <option value="shipping">shipping</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>
                      <td>{o.created_at ? new Date(o.created_at).toLocaleString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "contact" ? (
        <section className="profile-card admin-section">
          <h3>Contact messages</h3>
          {contactMessagesError ? <p className="admin-error">{contactMessagesError}</p> : null}
          {contactMessagesLoading ? <p className="admin-loading">Loading...</p> : null}

          {!contactMessagesLoading ? (
            <div className="admin-tableWrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contactMessages.map((m) => (
                    <tr key={m.id}>
                      <td>{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</td>
                      <td>
                        {m.first_name} {m.last_name}
                      </td>
                      <td>{m.email}</td>
                      <td>{m.subject || "-"}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        <div style={{ maxHeight: 220, overflow: "auto", paddingRight: 6 }}>
                          {m.message}
                        </div>
                        {m.replies && m.replies.length ? (
                          <div style={{ marginTop: 12, display: "grid", gap: 10, maxHeight: 260, overflow: "auto", paddingRight: 6 }}>
                            {m.replies.map((r) => (
                              <div
                                key={r.id}
                                style={{
                                  borderRadius: 10,
                                  padding: 12,
                                  background: "rgba(185, 108, 156, 0.10)",
                                  border: "1px solid rgba(185, 108, 156, 0.20)",
                                }}
                              >
                                <div style={{ fontWeight: 900 }}>
                                  {r.sender_type === "user" ? "Your reply" : "Support reply"}
                                </div>
                                <div className="admin-muted" style={{ fontSize: 13 }}>
                                  {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                                </div>
                                <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
                                  {r.reply_message}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div style={{ marginTop: 10 }}>
                          <textarea
                            value={contactReplyDrafts[m.id] ?? ""}
                            onChange={(e) =>
                              setContactReplyDrafts((d) => ({ ...d, [m.id]: e.target.value }))
                            }
                            placeholder="Write a support reply..."
                            rows={3}
                            maxLength={300}
                            style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, padding: 12 }}
                          />
                          <div className="admin-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            {(contactReplyDrafts[m.id] ?? "").length}/300
                          </div>
                          <button
                            type="button"
                            className="admin-btn"
                            style={{ marginTop: 10 }}
                            disabled={contactReplyLoadingId === m.id}
                            onClick={() => sendContactReply(m.id)}
                          >
                            {contactReplyLoadingId === m.id ? "Sending..." : "Send reply"}
                          </button>
                        </div>
                      </td>
                      <td style={{ verticalAlign: "top" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          disabled={contactDeleteLoadingId === m.id}
                          onClick={() => deleteContactConversation(m.id)}
                        >
                          {contactDeleteLoadingId === m.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {contactReplyError ? <p className="admin-error" style={{ marginTop: 12 }}>{contactReplyError}</p> : null}
          {contactReplySuccess ? (
            <p className="info-message" style={{ marginTop: 12 }}>
              {contactReplySuccess}
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "workshop" ? (
        <section className="profile-card admin-section">
          <h3>Workshop sessions</h3>
          {workshopBookingsError ? <p className="admin-error">{workshopBookingsError}</p> : null}
          {workshopBookingsLoading ? <p className="admin-loading">Loading...</p> : null}

          <div className="admin-workshopForm">
            <h4>Add new session</h4>
            {newWorkshopSessionError ? (
              <p className="admin-error" style={{ marginTop: 0 }}>
                {newWorkshopSessionError}
              </p>
            ) : null}
            <form onSubmit={createWorkshopSession} className="admin-form admin-form--wide">
              <div className="admin-grid2">
                <div className="admin-fieldStack">
                  <label className="admin-fieldLabel">Date</label>
                  <input
                    type="date"
                    value={newWorkshopSession.booking_date}
                    onChange={(e) =>
                      setNewWorkshopSession((p) => ({ ...p, booking_date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="admin-fieldStack">
                  <label className="admin-fieldLabel">Available spots</label>
                  <input
                    type="number"
                    min="1"
                    value={newWorkshopSession.available_spots}
                    onChange={(e) =>
                      setNewWorkshopSession((p) => ({
                        ...p,
                        available_spots: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="admin-grid2">
                <div className="admin-fieldStack">
                  <label className="admin-fieldLabel">Start time</label>
                  <input
                    type="time"
                    value={newWorkshopSession.start_time}
                    onChange={(e) =>
                      setNewWorkshopSession((p) => ({ ...p, start_time: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="admin-fieldStack">
                  <label className="admin-fieldLabel">End time</label>
                  <input
                    type="time"
                    value={newWorkshopSession.end_time}
                    onChange={(e) =>
                      setNewWorkshopSession((p) => ({ ...p, end_time: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <button type="submit" className="admin-btn" disabled={newWorkshopSessionLoading}>
                {newWorkshopSessionLoading ? "Creating..." : "Add session"}
              </button>
            </form>
          </div>

          {!workshopBookingsLoading ? (
            <div className="admin-form admin-form--wide" style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {workshopBookings.map((s) => (
                <div key={s.id} className="admin-workshopCard">
                  <div className="admin-productCard__head">
                    <div>
                      <b>Session #{s.id}</b>
                      <div className="admin-muted" style={{ fontSize: 13, marginTop: 4 }}>
                        {s.workshop_title}
                      </div>
                      <div className="admin-muted" style={{ fontSize: 13 }}>
                        {s.booking_date} {s.start_time} - {s.end_time}
                      </div>
                      <div className="admin-muted" style={{ fontSize: 13 }}>
                        Available spots: <b>{s.available_spots}</b>
                      </div>
                    </div>
                    <button type="button" className="admin-btn admin-btn--danger" onClick={() => deleteWorkshopSession(s.id)}>
                      Delete
                    </button>
                  </div>

                  <div className="admin-grid2" style={{ marginTop: 12 }}>
                    <div className="admin-fieldStack">
                      <label className="admin-fieldLabel">Date</label>
                      <input type="date" defaultValue={s.booking_date} id={`ws_date_${s.id}`} />
                    </div>
                    <div className="admin-fieldStack">
                      <label className="admin-fieldLabel">Available spots</label>
                      <input
                        type="number"
                        min="1"
                        defaultValue={s.available_spots}
                        id={`ws_spots_${s.id}`}
                      />
                    </div>
                  </div>

                  <div className="admin-grid2" style={{ marginTop: 10 }}>
                    <div className="admin-fieldStack">
                      <label className="admin-fieldLabel">Start time</label>
                      <input type="time" defaultValue={s.start_time} id={`ws_start_${s.id}`} />
                    </div>
                    <div className="admin-fieldStack">
                      <label className="admin-fieldLabel">End time</label>
                      <input type="time" defaultValue={s.end_time} id={`ws_end_${s.id}`} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => {
                        const dateEl = document.getElementById(`ws_date_${s.id}`);
                        const startEl = document.getElementById(`ws_start_${s.id}`);
                        const endEl = document.getElementById(`ws_end_${s.id}`);
                        const spotsEl = document.getElementById(`ws_spots_${s.id}`);

                        const newDate = dateEl ? dateEl.value : s.booking_date;
                        const newStart = startEl ? startEl.value : s.start_time;
                        const newEnd = endEl ? endEl.value : s.end_time;
                        const newSpots = spotsEl ? Number(spotsEl.value) : s.available_spots;

                        updateWorkshopSession(s.id, newDate, newStart, newEnd, newSpots);
                      }}
                    >
                      Update session
                    </button>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <b>Bookings</b>
                    {s.bookings && s.bookings.length ? (
                      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        {s.bookings.map((b) => (
                          <div
                            key={b.booking_id}
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 10,
                              fontSize: 13,
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                              background: "rgba(255,255,255,0.5)",
                            }}
                          >
                            <span className="admin-muted">
                              <b>{b.user_name}</b> ({b.user_email}) — {b.user_phone}
                            </span>
                            <label className="admin-fieldLabel" style={{ margin: 0 }}>
                              Status
                            </label>
                            <select
                              className="admin-workshopStatusSelect"
                              value={b.booking_status || "pending"}
                              disabled={sessionBookingBusyId === b.booking_id}
                              onChange={(e) =>
                                updateSessionBookingStatus(b.booking_id, e.target.value)
                              }
                              aria-label={`Booking status for ${b.user_name}`}
                            >
                              <option value="pending">pending</option>
                              <option value="confirmed">confirmed</option>
                              <option value="cancelled">cancelled</option>
                              <option value="attended">attended</option>
                            </select>
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              disabled={sessionBookingBusyId === b.booking_id}
                              onClick={() =>
                                deleteSessionBooking(
                                  b.booking_id,
                                  b.user_name || b.user_email || ""
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-muted" style={{ fontSize: 13, marginTop: 6 }}>
                        No bookings yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "gallery" ? (
        <section className="profile-card admin-section">
          <h3>Gallery</h3>
          {galleryError ? <p className="admin-error">{galleryError}</p> : null}
          {galleryLoading ? <p className="admin-loading">Loading...</p> : null}

          <p className="admin-hint">
            Drag & drop or choose multiple images (up to <b>500 MB total</b> per action; large sets are sent in
            several ~90 MB requests so CDNs like Cloudflare do not return 413). Files go to{" "}
            <code>public/gallery_images</code> and are registered in the database automatically.
          </p>

          <div
            className={`admin-galleryDropzone ${galleryDropActive ? "is-active" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Upload gallery images"
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setGalleryDropActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setGalleryDropActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setGalleryDropActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setGalleryDropActive(false);
              if (e.dataTransfer?.files?.length) uploadGalleryFiles(e.dataTransfer.files);
            }}
          >
            <div className="admin-galleryDropzone__inner">
              <b>{galleryUploading ? "Uploading..." : "Drop images here"}</b>
              <div className="admin-galleryDropzone__sub">
                or{" "}
                <label className="admin-galleryDropzone__label">
                  click to choose
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={galleryUploading}
                    onChange={(e) => {
                      if (e.target.files?.length) uploadGalleryFiles(e.target.files);
                      e.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              {galleryUploadError ? (
                <p className="admin-error" style={{ margin: 0, marginTop: 8 }}>
                  {galleryUploadError}
                </p>
              ) : null}
              {galleryUploadSuccess ? (
                <p className="info-message" style={{ margin: 0, marginTop: 8 }}>
                  {galleryUploadSuccess}
                </p>
              ) : null}
            </div>
          </div>

          {sortedGallery.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    sortedGallery.length > 0 &&
                    sortedGallery.every((img) => gallerySelectedIds.has(img.id))
                  }
                  onChange={() => {
                    const allSelected =
                      sortedGallery.length > 0 &&
                      sortedGallery.every((img) => gallerySelectedIds.has(img.id));
                    if (allSelected) {
                      setGallerySelectedIds(new Set());
                    } else {
                      setGallerySelectedIds(new Set(sortedGallery.map((i) => i.id)));
                    }
                  }}
                />
                Select all
              </label>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={gallerySelectedIds.size === 0 || galleryBulkDeleting}
                onClick={deleteGalleryImagesBulk}
              >
                {galleryBulkDeleting
                  ? "Removing…"
                  : `Remove selected (${gallerySelectedIds.size})`}
              </button>
            </div>
          ) : null}

          <div className="admin-form admin-form--wide" style={{ display: "grid", gap: 12 }}>
            {sortedGallery.map((img) => (
              <div key={img.id} className="admin-galleryRow">
                <div className="admin-galleryRowThumb">
                  <input
                    type="checkbox"
                    checked={gallerySelectedIds.has(img.id)}
                    onChange={() => {
                      setGallerySelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(img.id)) next.delete(img.id);
                        else next.add(img.id);
                        return next;
                      });
                    }}
                    aria-label={`Select ${img.filename} for bulk remove`}
                  />
                  <img src={`/gallery_images/${img.filename}`} alt={img.title || img.filename} />
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div className="admin-grid3">
                    <input
                      placeholder="Title (optional)"
                      defaultValue={img.title || ""}
                      onBlur={(e) => updateGallery(img.id, { title: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Sort"
                      defaultValue={img.sort_order || 0}
                      onBlur={(e) => updateGallery(img.id, { sort_order: Number(e.target.value) })}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 2 }}>
                      <input
                        type="checkbox"
                        checked={(img.active ?? 1) === 1}
                        onChange={(e) =>
                          updateGallery(img.id, { active: e.target.checked ? 1 : 0 })
                        }
                        aria-label="Active"
                      />
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--muted)" }}>
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="admin-galleryFilename">{img.filename}</div>
                </div>
                <div>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => deleteGalleryImage(img.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

