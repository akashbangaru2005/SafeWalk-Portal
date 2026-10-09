import React from "react";
import { useEffect, useMemo, useState } from "react";

import {
  Camera,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  Upload,
  X,
  CheckCircle2,
  Clock3,
  Navigation,
  LocateFixed,
} from "lucide-react";

import { api } from "./api";
import MapView from "./MapView";

const issueTypes = [
  ["OPEN_MANHOLE", "Open manhole"],
  ["ROAD_DAMAGE", "Road damage"],
  ["DRAINAGE", "Drainage / flooding"],
  ["BROKEN_LIGHT", "Broken street light"],
  ["OBSTRUCTION", "Walking obstruction"],
  ["OTHER", "Other hazard"],
];

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function normalizeReports(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.reports)) {
    return data.reports;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function formatIssue(issueType) {
  return (
    issueTypes.find((item) => item[0] === issueType)?.[1] ||
    issueType ||
    "Unknown issue"
  );
}

function formatStatus(status) {
  return String(status || "OPEN").replaceAll("_", " ");
}

function resolvePhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://") || photoUrl.startsWith("data:")) {
    return photoUrl;
  }
  const baseUrl = (api?.base || "").replace(/\/$/, "");
  const path = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `${baseUrl}${path}`;
}

function parseCoordinate(val) {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

/* ---------------------------------------------------------
   Location Hook
--------------------------------------------------------- */

function useLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locate = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        });

        setLoading(false);
      },
      (e) => {
        setError(
          e.message || "Location permission is required."
        );

        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  };

  return {
    location,
    loading,
    error,
    locate,
  };
}

/* ---------------------------------------------------------
   Brand
--------------------------------------------------------- */

function Brand({ admin = false }) {
  return (
    <div className="brand">
      <div className="brand-mark">
        <ShieldCheck size={20} />
      </div>

      <div>
        <strong>SafeWalk</strong>
        <span>
          {admin ? "Municipal Control" : "Community Safety"}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Login
--------------------------------------------------------- */

function PinLogin({ onUser, onAdmin }) {
  const [mode, setMode] = useState("user");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");

    const expected = mode === "user" ? 4 : 10;

    if (value.length !== expected) {
      setError(`Enter exactly ${expected} digits.`);
      return;
    }

    setBusy(true);

    try {
      const result =
        mode === "user"
          ? await api.userLogin(value)
          : await api.adminLogin(value);

      if (mode === "user") {
        onUser(result);
      } else {
        onAdmin(result);
      }
    } catch (e) {
      setError(
        e?.message || "Unable to sign in."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-orbit orbit-a" />
      <div className="login-orbit orbit-b" />

      <section className="glass login-card">
        <Brand />

        <div className="login-icon">
          <ShieldCheck size={34} />
        </div>

        <p className="eyebrow">
          SECURE ACCESS
        </p>

        <h1>
          {mode === "user"
            ? "Report a hazard"
            : "Admin control"}
        </h1>

        <p className="muted">
          {mode === "user"
            ? "Use your unique 4-digit PIN to enter your community safety space."
            : "Municipal officers use the 10-digit admin password."}
        </p>

        <div className="segmented">
          <button
            type="button"
            className={mode === "user" ? "active" : ""}
            onClick={() => {
              setMode("user");
              setValue("");
              setError("");
            }}
          >
            User
          </button>

          <button
            type="button"
            className={mode === "admin" ? "active" : ""}
            onClick={() => {
              setMode("admin");
              setValue("");
              setError("");
            }}
          >
            Admin
          </button>
        </div>

        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          maxLength={mode === "user" ? 4 : 10}
          placeholder={
            mode === "user"
              ? "••••"
              : "••••••••••"
          }
          value={value}
          onChange={(e) =>
            setValue(
              e.target.value.replace(/\D/g, "")
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submit();
            }
          }}
          autoFocus
        />

        {error && (
          <div className="error-box">
            <CircleAlert size={17} />
            {error}
          </div>
        )}

        <button
          className="primary-btn"
          onClick={submit}
          disabled={busy}
        >
          {busy ? "Checking..." : "Continue"}
          <ChevronRight size={19} />
        </button>

        <div className="login-note">
          <CheckCircle2 size={16} />
          <span>
            Encrypted session token · Mobile-first access
          </span>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   User Page
--------------------------------------------------------- */

function UserPage({ session, logout }) {
  const {
    location,
    loading,
    error: locationError,
    locate,
  } = useLocation();

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [issueType, setIssueType] =
    useState("OPEN_MANHOLE");
  const [description, setDescription] =
    useState("");
  const [address, setAddress] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [reports, setReports] =
    useState([]);

  /* Load location + reports */
  useEffect(() => {
    locate();

    api
      .mine(session.token)
      .then((data) => {
        setReports(normalizeReports(data));
      })
      .catch(() => {
        setReports([]);
      });
  }, [session.token]);

  /* Attach coordinates to address */
  useEffect(() => {
    if (!location) {
      return;
    }

    setAddress(
      `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
    );
  }, [location]);

  /* Photo selection */
  const selectPhoto = (file) => {
    if (!file) {
      return;
    }

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  };

  /* Submit report */
  const submit = async () => {
    setMessage("");

    if (!photo) {
      setMessage(
        "Please capture or select a photo first."
      );
      return;
    }

    if (!location) {
      setMessage(
        "Please allow location access before submitting."
      );
      return;
    }

    setSubmitting(true);

    try {
      const form = new FormData();

      form.append("photo", photo);
      form.append("issueType", issueType);
      form.append("description", description);
      form.append("latitude", location.lat);
      form.append("longitude", location.lng);
      form.append("address", address);

      await api.createReport(
        session.token,
        form
      );

      setMessage(
        "Report submitted successfully. Municipal officers can now see the location and photo."
      );

      setPhoto(null);
      setPreview("");
      setDescription("");

      const updated =
        await api.mine(session.token);

      setReports(
        normalizeReports(updated)
      );
    } catch (e) {
      setMessage(
        e?.message ||
          "Unable to submit the report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const safeReports = Array.isArray(reports) ? reports : [];

  return (
    <div className="user-page">

      {/* TOP BAR */}
      <header className="topbar glass">
        <Brand />

        <button
          type="button"
          className="icon-btn"
          onClick={logout}
          aria-label="Logout"
        >
          <LogOut size={19} />
        </button>
      </header>

      <main className="user-main">

        {/* HERO */}
        <section className="hero-copy">
          <p className="eyebrow">
            COMMUNITY REPORTING
          </p>

          <h1>
            Spot it.
            <br />
            <span>Report it.</span>
          </h1>

          <p className="muted">
            Help keep your walking routes safe by
            sending a photo and exact location to
            the municipal team.
          </p>
        </section>

        {/* MAP */}
        <section className="glass map-card">

          <div className="section-heading">
            <div>
              <span className="section-kicker">
                LIVE LOCATION
              </span>

              <h2>Your walking area</h2>
            </div>

            <button
              type="button"
              className="round-btn"
              onClick={locate}
              title="Refresh location"
            >
              <LocateFixed size={18} />
            </button>
          </div>

          {location ? (
            <MapView
              lat={location.lat}
              lng={location.lng}
              markerLabel="Your location"
            />
          ) : (
            <div className="map-placeholder">
              <MapPin size={30} />

              <strong>
                {loading
                  ? "Finding your location..."
                  : "Location permission needed"}
              </strong>

              <span>
                {locationError ||
                  "Tap the button to enable GPS."}
              </span>

              <button
                className="secondary-btn"
                onClick={locate}
              >
                Enable location
              </button>
            </div>
          )}

          {location && (
            <div className="coordinate-row">
              <Navigation size={16} />

              <span>
                {location.lat.toFixed(5)},{" "}
                {location.lng.toFixed(5)}
              </span>

              <small>
                ±{Math.round(location.accuracy)}m
              </small>
            </div>
          )}
        </section>

        {/* REPORT FORM */}
        <section className="glass report-card">

          <div className="section-heading">
            <div>
              <span className="section-kicker">
                NEW REPORT
              </span>

              <h2>What did you find?</h2>
            </div>

            <CircleAlert size={22} />
          </div>

          <label className="field-label">
            Issue type
          </label>

          <div className="issue-grid">
            {issueTypes.map(
              ([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={
                    issueType === value
                      ? "issue-chip active"
                      : "issue-chip"
                  }
                  onClick={() =>
                    setIssueType(value)
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>

          <label className="field-label">
            Photo evidence
          </label>

          <div className="photo-area">
            {preview ? (
              <div className="preview-wrap">

                <img
                  src={preview}
                  alt="Selected report"
                />

                <button
                  type="button"
                  className="remove-photo"
                  onClick={() => {
                    setPhoto(null);
                    setPreview("");
                  }}
                >
                  <X size={18} />
                </button>

              </div>
            ) : (
              <div className="photo-actions">

                <label className="camera-btn">
                  <Camera size={27} />

                  <strong>
                    Take photo
                  </strong>

                  <span>
                    Camera
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) =>
                      selectPhoto(
                        e.target.files?.[0]
                      )
                    }
                  />
                </label>

                <label className="upload-btn">
                  <Upload size={25} />

                  <strong>
                    Upload
                  </strong>

                  <span>
                    From gallery
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      selectPhoto(
                        e.target.files?.[0]
                      )
                    }
                  />
                </label>

              </div>
            )}
          </div>

          <label className="field-label">
            Short description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Example: Open manhole near the bus stop..."
            rows="3"
          />

          <div className="location-confirm">
            <MapPin size={19} />

            <div>
              <strong>
                Location attached
              </strong>

              <span>
                {location
                  ? `${location.lat.toFixed(
                      5
                    )}, ${location.lng.toFixed(5)}`
                  : "Enable GPS to attach location"}
              </span>
            </div>

            {location && (
              <CheckCircle2 size={19} />
            )}
          </div>

          {message && (
            <div
              className={
                message
                  .toLowerCase()
                  .includes("successfully")
                  ? "success-box"
                  : "error-box"
              }
            >
              <CircleAlert size={17} />
              {message}
            </div>
          )}

          <button
            type="button"
            className="primary-btn report-submit"
            onClick={submit}
            disabled={submitting}
          >
            {submitting
              ? "Sending report..."
              : "Send report"}

            <ChevronRight size={19} />
          </button>
        </section>

        {/* RECENT REPORTS */}
        <section className="recent-section">

          <div className="section-heading plain">
            <div>
              <span className="section-kicker">
                MY ACTIVITY
              </span>

              <h2>Recent reports</h2>
            </div>

            <ClipboardList size={22} />
          </div>

          {safeReports.length === 0 ? (
            <div className="empty-card">
              Your submitted reports will appear here.
            </div>
          ) : (
            safeReports
              .slice(0, 5)
              .map((report) => {

                const status =
                  String(
                    report?.status || "OPEN"
                  ).toLowerCase();

                return (
                  <div
                    className="activity-card glass"
                    key={report.id}
                  >

                    <div
                      className={`status-dot ${status}`}
                    />

                    <div>
                      <strong>
                        {formatIssue(
                          report.issueType
                        )}
                      </strong>

                      <span>
                        {report.reportedAt
                          ? new Date(
                              report.reportedAt
                            ).toLocaleString()
                          : "Recently submitted"}
                      </span>
                    </div>

                    <b
                      className={`status ${status}`}
                    >
                      {formatStatus(
                        report.status
                      )}
                    </b>

                  </div>
                );
              })
          )}
        </section>

      </main>
    </div>
  );
}

/* ---------------------------------------------------------
   Admin Page
--------------------------------------------------------- */

function AdminPage({ session, logout }) {
  const [reports, setReports] =
    useState([]);

  const [stats, setStats] =
    useState({
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
    });

  const [filter, setFilter] =
    useState("ALL");

  const [selected, setSelected] =
    useState(null);

  const [menu, setMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /* Load dashboard */
  const load = async () => {
    setLoading(true);

    try {
      const [
        reportData,
        statsData,
      ] = await Promise.all([
        api.reports(session.token),
        api.stats(session.token),
      ]);

      const reportList = normalizeReports(reportData);

      console.log("ADMIN REPORTS:", reportList);
      console.log("ADMIN STATS:", statsData);

      setReports(reportList);

      setStats(
        statsData || {
          total: reportList.length,
          open: reportList.filter((r) => r.status === "OPEN").length,
          inProgress: reportList.filter((r) => r.status === "IN_PROGRESS").length,
          resolved: reportList.filter((r) => r.status === "RESOLVED").length,
        }
      );
    } catch (error) {
      if (
        String(error?.message || "")
          .toLowerCase()
          .includes("session")
      ) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [session.token]);

  const safeReports = Array.isArray(reports) ? reports : [];

  const filtered = useMemo(() => {
    if (filter === "ALL") {
      return safeReports;
    }

    return safeReports.filter(
      (report) =>
        report.status === filter
    );
  }, [safeReports, filter]);

  const latestMapReport = safeReports.find((r) => {
    const lat = parseCoordinate(r.latitude);
    const lng = parseCoordinate(r.longitude);
    return lat !== null && lng !== null;
  });

  return (
    <div className="admin-page">

      {/* TOP BAR */}
      <header className="admin-topbar clay">

        <Brand admin />

        <div className="admin-header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() =>
              setMenu(!menu)
            }
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        </div>

        {menu && (
          <div className="admin-menu">
            <button
              type="button"
              onClick={logout}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}

      </header>

      <main className="admin-main">

        {/* WELCOME */}
        <section className="admin-welcome">

          <p className="eyebrow">
            MUNICIPAL OPERATIONS
          </p>

          <h1>
            Good evening,{" "}
            <span>Officer.</span>
          </h1>

          <p>
            Monitor hazards reported by
            SafeWalk users and dispatch
            the right field team.
          </p>

        </section>

        {/* STATS */}
        <section className="stats-grid">

          <Stat
            icon={<ClipboardList />}
            label="Total reports"
            value={stats?.total ?? 0}
          />

          <Stat
            icon={<CircleAlert />}
            label="Open"
            value={stats?.open ?? 0}
          />

          <Stat
            icon={<Clock3 />}
            label="In progress"
            value={stats?.inProgress ?? 0}
          />

          <Stat
            icon={<CheckCircle2 />}
            label="Resolved"
            value={stats?.resolved ?? 0}
          />

        </section>

        {/* FIELD MAP */}
        <section className="clay admin-map-card">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                FIELD MAP
              </span>

              <h2>
                Reported hazards
              </h2>
            </div>

            <Navigation size={22} />

          </div>

          {latestMapReport ? (
            <MapView
              lat={parseCoordinate(latestMapReport.latitude)}
              lng={parseCoordinate(latestMapReport.longitude)}
              markerLabel="Latest report"
            />
          ) : (
            <div className="map-placeholder clay-inset">

              <MapPin size={30} />

              <strong>
                No reports yet
              </strong>

              <span>
                New user reports will appear here.
              </span>

            </div>
          )}

        </section>

        {/* REPORT QUEUE */}
        <section className="reports-panel clay">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                CASE QUEUE
              </span>

              <h2>
                Incoming reports
              </h2>
            </div>

            <button
              type="button"
              className="refresh-btn"
              onClick={load}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>

          <div className="filter-row">

            {[
              "ALL",
              "OPEN",
              "IN_PROGRESS",
              "RESOLVED",
              "REJECTED",
            ].map((x) => (
              <button
                type="button"
                key={x}
                className={
                  filter === x
                    ? "filter active"
                    : "filter"
                }
                onClick={() =>
                  setFilter(x)
                }
              >
                {x.replaceAll("_", " ")}
              </button>
            ))}

          </div>

          <div className="report-list">

            {filtered.map((report) => {

              const status =
                String(
                  report?.status || "OPEN"
                ).toLowerCase();

              const photoSrc = resolvePhotoUrl(report.photoUrl);

              const lat = parseCoordinate(report.latitude);
              const lng = parseCoordinate(report.longitude);
              const hasCoords = lat !== null && lng !== null;

              return (
                <button
                  type="button"
                  className="report-row"
                  key={report.id}
                  onClick={() =>
                    setSelected(report)
                  }
                >

                  <div className="report-thumb">

                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt="Report"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="thumb-fallback"
                      style={{
                        display: photoSrc ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <CircleAlert />
                    </div>

                  </div>

                  <div className="report-row-content">

                    <strong>
                      {formatIssue(
                        report.issueType
                      )}
                    </strong>

                    <span>
                      {report.address ||
                        (hasCoords
                          ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                          : "No location attached")}
                    </span>

                    <small>
                      {report.reportedAt
                        ? new Date(
                            report.reportedAt
                          ).toLocaleString()
                        : "Recently submitted"}
                    </small>

                  </div>

                  <b
                    className={`status ${status}`}
                  >
                    {formatStatus(
                      report.status
                    )}
                  </b>

                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="empty-card">
                No reports match this filter.
              </div>
            )}

          </div>

        </section>

      </main>

      {selected && (
        <ReportDrawer
          report={selected}
          token={session.token}
          close={() =>
            setSelected(null)
          }
          onChanged={async () => {
            await load();

            const latestData =
              await api.reports(
                session.token
              );

            const latest =
              normalizeReports(
                latestData
              );

            const updated =
              latest.find(
                (item) =>
                  item.id === selected.id
              );

            setSelected(
              updated || null
            );
          }}
        />
      )}

    </div>
  );
}

/* ---------------------------------------------------------
   Stat Card
--------------------------------------------------------- */

function Stat({
  icon,
  label,
  value,
}) {
  return (
    <div className="stat-card clay">

      <div className="stat-icon">
        {icon}
      </div>

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}

/* ---------------------------------------------------------
   Report Details Drawer
--------------------------------------------------------- */

function ReportDrawer({
  report,
  token,
  close,
  onChanged,
}) {
  const [busy, setBusy] =
    useState(false);

  const [currentStatus, setCurrentStatus] =
    useState(
      report?.status || "OPEN"
    );

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    setCurrentStatus(
      report?.status || "OPEN"
    );
  }, [report?.id, report?.status]);

  const statusOptions = [
    {
      value: "OPEN",
      label: "OPEN",
      icon: <CircleAlert size={18} />,
    },
    {
      value: "IN_PROGRESS",
      label: "IN PROGRESS",
      icon: <Clock3 size={18} />,
    },
    {
      value: "RESOLVED",
      label: "RESOLVED",
      icon: <CheckCircle2 size={18} />,
    },
    {
      value: "REJECTED",
      label: "REJECTED",
      icon: <X size={18} />,
    },
  ];

  const changeStatus = async (
    newStatus
  ) => {
    if (
      busy ||
      newStatus === currentStatus
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const oldStatus = currentStatus;

    setCurrentStatus(newStatus);

    try {
      const updatedReport =
        await api.updateStatus(
          token,
          report.id,
          newStatus
        );

      const actualStatus =
        updatedReport?.status ||
        newStatus;

      setCurrentStatus(
        actualStatus
      );

      setMessage(
        `Status changed to ${formatStatus(
          actualStatus
        )}.`
      );

      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      setCurrentStatus(oldStatus);

      setError(
        err?.message ||
          "Unable to update the report status. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const photoSrc = resolvePhotoUrl(report.photoUrl);
  const lat = parseCoordinate(report.latitude);
  const lng = parseCoordinate(report.longitude);
  const hasCoords = lat !== null && lng !== null;

  return (
    <div
      className="drawer-backdrop"
      onClick={close}
    >

      <aside
        className="report-drawer clay"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* HEADER */}
        <div className="drawer-header">

          <div>
            <span className="section-kicker">
              CASE #{report.id}
            </span>

            <h2>
              Report details
            </h2>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={close}
            aria-label="Close report"
          >
            <X size={22} />
          </button>

        </div>

        {/* PHOTO */}
        {photoSrc ? (
          <img
            className="drawer-photo"
            src={photoSrc}
            alt="Reported hazard"
          />
        ) : (
          <div className="empty-photo-placeholder">
            <CircleAlert size={32} />
            <span>No photo uploaded</span>
          </div>
        )}

        {/* ISSUE */}
        <div className="detail-card">

          <strong>
            {formatIssue(
              report.issueType
            )}
          </strong>

          <p>
            {report.description ||
              "No description provided."}
          </p>

        </div>

        {/* MAP */}
        {hasCoords ? (
          <MapView
            lat={lat}
            lng={lng}
            markerLabel="Hazard report"
          />
        ) : (
          <div className="map-placeholder clay-inset">
            <MapPin size={24} />
            <span>No valid map coordinates available</span>
          </div>
        )}

        {/* ADDRESS AND COORDINATES */}
        <div className="location-details-card">
          {report.address && (
            <div className="address-line">
              <strong>Address: </strong>
              <span>{report.address}</span>
            </div>
          )}

          <div className="coordinates">
            <MapPin size={17} />
            <span>
              {hasCoords
                ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                : "Coordinates unavailable"}
            </span>
          </div>
        </div>

        {/* STATUS */}
        <div className="status-actions">

          {statusOptions.map(
            (option) => (
              <button
                type="button"
                disabled={busy}
                key={option.value}
                className={
                  `status-action ${
                    currentStatus ===
                    option.value
                      ? "selected"
                      : ""
                  }`
                }
                onClick={() =>
                  changeStatus(
                    option.value
                  )
                }
              >
                {option.icon}
                {option.label}
              </button>
            )
          )}

        </div>

        {message && (
          <div className="success-box">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        {error && (
          <div className="error-box">
            <CircleAlert size={17} />
            {error}
          </div>
        )}

      </aside>

    </div>
  );
}

/* ---------------------------------------------------------
   Main App
--------------------------------------------------------- */

export default function App() {
  const [session, setSession] =
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(
            "safewalk_session"
          ) || "null"
        );
      } catch {
        return null;
      }
    });

  const logout = () => {
    localStorage.removeItem(
      "safewalk_session"
    );

    setSession(null);
  };

  const save = (s) => {
    localStorage.setItem(
      "safewalk_session",
      JSON.stringify(s)
    );

    setSession(s);
  };

  if (!session) {
    return (
      <PinLogin
        onUser={save}
        onAdmin={save}
      />
    );
  }

  return session.role === "ADMIN" ? (
    <AdminPage
      session={session}
      logout={logout}
    />
  ) : (
    <UserPage
      session={session}
      logout={logout}
    />
  );
}