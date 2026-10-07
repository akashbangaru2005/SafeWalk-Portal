import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  RefreshCw,
  MapPinned,
} from "lucide-react";

import { api } from "./api";
import MapView from "./MapView";

/*
|--------------------------------------------------------------------------
| Issue types
|--------------------------------------------------------------------------
*/

const issueTypes = [
  ["OPEN_MANHOLE", "Open manhole"],
  ["ROAD_DAMAGE", "Road damage"],
  ["DRAINAGE", "Drainage / flooding"],
  ["BROKEN_LIGHT", "Broken street light"],
  ["OBSTRUCTION", "Walking obstruction"],
  ["OTHER", "Other hazard"],
];

/*
|--------------------------------------------------------------------------
| Utility
|--------------------------------------------------------------------------
*/

function formatIssue(type) {
  return (
    issueTypes.find(
      ([value]) => value === type
    )?.[1] || type || "Unknown issue"
  );
}

function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ");
}

function formatCoordinates(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return "Location unavailable";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/*
|--------------------------------------------------------------------------
| GPS hook
|--------------------------------------------------------------------------
*/

function useLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locate = () => {
    if (!navigator.geolocation) {
      setError(
        "Location is not supported by this browser."
      );

      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLoading(false);
      },

      (error) => {
        setError(
          error.message ||
            "Location permission is required."
        );

        setLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
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

/*
|--------------------------------------------------------------------------
| Brand
|--------------------------------------------------------------------------
*/

function Brand({ admin = false }) {
  return (
    <div className="brand">

      <div className="brand-mark">
        <ShieldCheck size={21} />
      </div>

      <div className="brand-copy">
        <strong>SafeWalk</strong>

        <span>
          {admin
            ? "Municipal Control"
            : "Community Safety"}
        </span>
      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

function PinLogin({ onUser, onAdmin }) {
  const [mode, setMode] = useState("user");

  const [value, setValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [step, setStep] = useState("login");
  // login | create

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setValue("");
    setConfirmPin("");
    setStep("login");
    setError("");
    setMessage("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetForm();
  };

  const checkUserPin = async () => {
    setError("");
    setMessage("");

    if (!/^\d{4}$/.test(value)) {
      setError("Enter exactly 4 digits.");
      return;
    }

    setBusy(true);

    try {
      const result = await api.checkUserPin(value);

      if (result.exists) {
        // Existing user
        const loginResult = await api.userLogin(value);

        onUser(loginResult);
      } else {
        // New user
        setStep("create");
        setConfirmPin("");
        setMessage(
          "This PIN is available. Create your SafeWalk account."
        );
      }
    } catch (e) {
      setError(
        e.message ||
          "Unable to check this PIN. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const createUser = async () => {
    setError("");
    setMessage("");

    if (!/^\d{4}$/.test(value)) {
      setError("PIN must contain exactly 4 digits.");
      return;
    }

    if (value !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await api.registerUser(value);

      setMessage("Account created successfully.");

      onUser(result);
    } catch (e) {
      setError(
        e.message ||
          "Unable to create the account."
      );
    } finally {
      setBusy(false);
    }
  };

  const submitAdmin = async () => {
    setError("");
    setMessage("");

    if (!/^\d{10}$/.test(value)) {
      setError("Enter exactly 10 digits.");
      return;
    }

    setBusy(true);

    try {
      const result = await api.adminLogin(value);

      onAdmin(result);
    } catch (e) {
      setError(
        e.message ||
          "Invalid administrator password."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "admin") {
      submitAdmin();
      return;
    }

    if (step === "create") {
      createUser();
    } else {
      checkUserPin();
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
            ? step === "create"
              ? "Create your SafeWalk PIN"
              : "Report a hazard"
            : "Admin control"}
        </h1>

        <p className="muted">

          {mode === "user"
            ? step === "create"
              ? "Confirm your 4-digit PIN to create your personal SafeWalk account."
              : "Use your personal 4-digit PIN to access your community safety space."
            : "Municipal officers use the 10-digit admin password."}

        </p>

        {/* USER / ADMIN SWITCH */}

        <div className="segmented">

          <button
            type="button"
            className={mode === "user" ? "active" : ""}
            onClick={() => switchMode("user")}
          >
            User
          </button>

          <button
            type="button"
            className={mode === "admin" ? "active" : ""}
            onClick={() => switchMode("admin")}
          >
            Admin
          </button>

        </div>

        {/* FIRST PIN */}

        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={mode === "user" ? 4 : 10}
          placeholder={
            mode === "user"
              ? "Enter 4-digit PIN"
              : "Enter 10-digit password"
          }
          value={value}
          onChange={(e) => {
            setValue(
              e.target.value.replace(/\D/g, "")
            );
            setError("");
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              step !== "create"
            ) {
              handleSubmit();
            }
          }}
          autoFocus
        />

        {/* CONFIRM PIN */}

        {mode === "user" && step === "create" && (
          <input
            className="pin-input"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="Confirm 4-digit PIN"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(
                e.target.value.replace(/\D/g, "")
              );
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />
        )}

        {/* MESSAGE */}

        {message && (
          <div className="success-box">
            <CheckCircle2 size={17} />
            <span>{message}</span>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="error-box">
            <CircleAlert size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* MAIN BUTTON */}

        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit}
          disabled={busy}
        >
          {busy
            ? "Please wait..."
            : mode === "user" && step === "create"
              ? "Create account"
              : "Continue"}

          <ChevronRight size={19} />
        </button>

        {/* BACK BUTTON */}

        {mode === "user" && step === "create" && (
          <button
            type="button"
            className="secondary-btn"
            onClick={resetForm}
            disabled={busy}
          >
            Use another PIN
          </button>
        )}

        <div className="login-note">

          <CheckCircle2 size={16} />

          <span>
            Your PIN is securely stored and belongs only to your account.
          </span>

        </div>

      </section>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| User Page
|--------------------------------------------------------------------------
*/

function UserPage({ session, logout }) {
  const {
    location,
    loading,
    error: locationError,
    locate,
  } = useLocation();

  const [photo, setPhoto] =
    useState(null);

  const [preview, setPreview] =
    useState("");

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

  /*
  | Load location and reports
  */

  useEffect(() => {
    locate();

    api
      .mine(session.token)
      .then(setReports)
      .catch(() => {});
  }, [session.token]);

  /*
  | Attach coordinates to address field
  */

  useEffect(() => {
    if (!location) {
      return;
    }

    setAddress(
      `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
    );
  }, [location]);

  /*
  | Photo selection
  */

  const selectPhoto = (file) => {
    if (!file) {
      return;
    }

    setPhoto(file);

    setPreview(
      URL.createObjectURL(file)
    );

    setMessage("");
  };

  /*
  | Submit report
  */

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
      const form =
        new FormData();

      form.append(
        "photo",
        photo
      );

      form.append(
        "issueType",
        issueType
      );

      form.append(
        "description",
        description
      );

      form.append(
        "latitude",
        location.lat
      );

      form.append(
        "longitude",
        location.lng
      );

      form.append(
        "address",
        address
      );

      await api.createReport(
        session.token,
        form
      );

      setMessage(
        "Report submitted successfully. Municipal officers can now see the photo and exact location."
      );

      setPhoto(null);
      setPreview("");
      setDescription("");

      const updated =
        await api.mine(
          session.token
        );

      setReports(updated);

    } catch (error) {
      setMessage(
        error?.message ||
          "Unable to submit the report."
      );

    } finally {
      setSubmitting(false);
    }
  };

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
            Help keep your walking routes safe
            by sending a photo and exact location
            to the municipal team.
          </p>

        </section>

        {/* MAP */}

        <section className="glass map-card">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                LIVE LOCATION
              </span>

              <h2>
                Your walking area
              </h2>
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
              height={360}
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
                  "Allow GPS access to attach your location."}
              </span>

              <button
                type="button"
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
                {location.lat.toFixed(6)},{" "}
                {location.lng.toFixed(6)}
              </span>

              <small>
                ±{Math.round(location.accuracy)}m
              </small>

            </div>
          )}

        </section>

        {/* NEW REPORT */}

        <section className="glass report-card">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                NEW REPORT
              </span>

              <h2>
                What did you find?
              </h2>
            </div>

            <CircleAlert size={22} />

          </div>

          {/* ISSUE */}

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

          {/* PHOTO */}

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
                    onChange={(event) =>
                      selectPhoto(
                        event.target.files?.[0]
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
                    onChange={(event) =>
                      selectPhoto(
                        event.target.files?.[0]
                      )
                    }
                  />

                </label>

              </div>

            )}

          </div>

          {/* DESCRIPTION */}

          <label className="field-label">
            Short description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Example: Open manhole near the bus stop..."
            rows={4}
          />

          {/* LOCATION */}

          <div className="location-confirm">

            <MapPin size={19} />

            <div>

              <strong>
                Location attached
              </strong>

              <span>
                {location
                  ? formatCoordinates(
                      location.lat,
                      location.lng
                    )
                  : "Enable GPS to attach location"}
              </span>

            </div>

            {location && (
              <CheckCircle2 size={19} />
            )}

          </div>

          {/* MESSAGE */}

          {message && (
            <div
              className={
                message
                  .toLowerCase()
                  .includes("success")
                  ? "success-box"
                  : "error-box"
              }
            >
              <CircleAlert size={17} />

              <span>
                {message}
              </span>
            </div>
          )}

          {/* SUBMIT */}

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

              <h2>
                Recent reports
              </h2>
            </div>

            <ClipboardList size={22} />

          </div>

          {reports.length === 0 ? (

            <div className="empty-card">
              Your submitted reports will
              appear here.
            </div>

          ) : (

            reports
              .slice(0, 5)
              .map((report) => (

                <div
                  className="activity-card glass"
                  key={report.id}
                >

                  <div
                    className={`status-dot ${
                      String(
                        report.status
                      ).toLowerCase()
                    }`}
                  />

                  <div>

                    <strong>
                      {formatIssue(
                        report.issueType
                      )}
                    </strong>

                    <span>
                      {new Date(
                        report.reportedAt
                      ).toLocaleString()}
                    </span>

                  </div>

                  <b
                    className={`status ${
                      String(
                        report.status
                      ).toLowerCase()
                    }`}
                  >
                    {formatStatus(
                      report.status
                    )}
                  </b>

                </div>

              ))

          )}

        </section>

      </main>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Admin Page
|--------------------------------------------------------------------------
*/

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

  /*
  | Load dashboard
  */

  const load = async () => {
    setLoading(true);

    try {
      const [reportData, statsData] =
        await Promise.all([
          api.reports(session.token),
          api.stats(session.token),
        ]);

      setReports(
        Array.isArray(reportData)
          ? reportData
          : []
      );

      setStats(
        statsData || {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
        }
      );

    } catch (error) {
      if (
        String(
          error?.message
        ).toLowerCase()
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

  /*
  | Filtering
  */

  const filtered = useMemo(() => {
    if (filter === "ALL") {
      return reports;
    }

    return reports.filter(
      (report) =>
        report.status === filter
    );
  }, [reports, filter]);

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
            value={stats.total ?? 0}
          />

          <Stat
            icon={<CircleAlert />}
            label="Open"
            value={stats.open ?? 0}
          />

          <Stat
            icon={<Clock3 />}
            label="In progress"
            value={
              stats.inProgress ?? 0
            }
          />

          <Stat
            icon={<CheckCircle2 />}
            label="Resolved"
            value={
              stats.resolved ?? 0
            }
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

            <MapPinned size={22} />

          </div>

          {reports.length > 0 ? (

            <MapView
              lat={reports[0].latitude}
              lng={reports[0].longitude}
              markerLabel="Latest report"
              height={390}
            />

          ) : (

            <div className="map-placeholder clay-inset">

              <MapPin size={30} />

              <strong>
                No reports yet
              </strong>

              <span>
                New user reports will
                appear here.
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
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />

              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>

          {/* FILTERS */}

          <div className="filter-row">

            {[
              "ALL",
              "OPEN",
              "IN_PROGRESS",
              "RESOLVED",
              "REJECTED",
            ].map((status) => (

              <button
                type="button"
                key={status}
                className={
                  filter === status
                    ? "filter active"
                    : "filter"
                }
                onClick={() =>
                  setFilter(status)
                }
              >
                {formatStatus(
                  status
                )}
              </button>

            ))}

          </div>

          {/* REPORTS */}

          <div className="report-list">

            {filtered.map((report) => (

              <button
                type="button"
                className="report-row"
                key={report.id}
                onClick={() =>
                  setSelected(report)
                }
              >

                <div className="report-thumb">

                  {report.photoUrl ? (

                    <img
                      src={`${api.base}${report.photoUrl}`}
                      alt="Reported hazard"
                    />

                  ) : (

                    <CircleAlert />

                  )}

                </div>

                <div className="report-row-content">

                  <strong>
                    {formatIssue(
                      report.issueType
                    )}
                  </strong>

                  <span>
                    {report.address ||
                      formatCoordinates(
                        report.latitude,
                        report.longitude
                      )}
                  </span>

                  <small>
                    {new Date(
                      report.reportedAt
                    ).toLocaleString()}
                  </small>

                </div>

                <b
                  className={`status ${
                    String(
                      report.status
                    ).toLowerCase()
                  }`}
                >
                  {formatStatus(
                    report.status
                  )}
                </b>

              </button>

            ))}

            {filtered.length === 0 && (
              <div className="empty-card">
                No reports match this filter.
              </div>
            )}

          </div>

        </section>

      </main>

      {/* REPORT DRAWER */}

      {selected && (
        <ReportDrawer
          report={selected}
          token={session.token}
          close={() =>
            setSelected(null)
          }
          onChanged={async () => {
            await load();

            const latest =
              await api.reports(
                session.token
              );

            const updated =
              latest.find(
                (item) =>
                  item.id ===
                  selected.id
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

/*
|--------------------------------------------------------------------------
| Stat card
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Report Details Drawer
|--------------------------------------------------------------------------
*/

function ReportDrawer({ report, token, close, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(report.status);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentStatus(report.status);
  }, [report.id, report.status]);

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

  const changeStatus = async (newStatus) => {
    if (busy || newStatus === currentStatus) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    // Optimistic UI update
    setCurrentStatus(newStatus);

    try {
      console.log(
        "Updating report:",
        report.id,
        "from:",
        currentStatus,
        "to:",
        newStatus
      );

      const updatedReport = await api.updateStatus(
        token,
        report.id,
        newStatus
      );

      console.log("Status update response:", updatedReport);

      setCurrentStatus(updatedReport.status || newStatus);
      setMessage(`Status changed to ${newStatus.replace("_", " ")}.`);

      // Refresh admin dashboard
      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      console.error("Status update failed:", err);

      // Restore old status if API failed
      setCurrentStatus(report.status);

      setError(
        err?.message ||
          "Unable to update the report status. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={close}>
      <aside
        className="report-drawer clay"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="drawer-header">
          <div>
            <span className="section-kicker">
              CASE #{report.id}
            </span>

            <h2>Report details</h2>
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
        {report.photoUrl && (
          <img
            className="drawer-photo"
            src={`${api.base}${report.photoUrl}`}
            alt="Reported hazard"
          />
        )}

        {/* ISSUE DETAILS */}
        <div className="detail-card">
          <strong>
            {issueTypes.find(
              (item) => item[0] === report.issueType
            )?.[1] || report.issueType}
          </strong>

          <p>
            {report.description || "No description provided."}
          </p>
        </div>

        {/* MAP */}
        <MapView
          lat={report.latitude}
          lng={report.longitude}
          markerLabel="Hazard report"
        />

        {/* GPS */}
        <div className="coordinates">
          <MapPin size={17} />

          <span>
            {Number(report.latitude).toFixed(6)},{" "}
            {Number(report.longitude).toFixed(6)}
          </span>
        </div>

        {/* CURRENT STATUS */}
        <div className="current-status-box">
          <span className="section-kicker">
            CURRENT STATUS
          </span>

          <strong>
            {currentStatus.replace("_", " ")}
          </strong>
        </div>

        {/* STATUS BUTTONS */}
        <div className="status-actions">

          {statusOptions.map((item) => {
            const selected = currentStatus === item.value;

            return (
              <button
                type="button"
                key={item.value}
                disabled={busy}
                className={`status-action ${
                  selected ? "selected" : ""
                }`}
                onClick={() => changeStatus(item.value)}
              >
                {item.icon}

                <span>{item.label}</span>

                {selected && (
                  <span className="status-check">
                    ✓
                  </span>
                )}
              </button>
            );
          })}

        </div>

        {/* LOADING */}
        {busy && (
          <div className="status-info">
            Updating report status...
          </div>
        )}

        {/* SUCCESS */}
        {message && !busy && (
          <div className="status-success">
            <CheckCircle2 size={17} />
            <span>{message}</span>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="status-error">
            <CircleAlert size={17} />
            <span>{error}</span>
          </div>
        )}

      </aside>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Main App
|--------------------------------------------------------------------------
*/

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

  /*
  | Save session
  */

  const saveSession = (sessionData) => {
    localStorage.setItem(
      "safewalk_session",
      JSON.stringify(
        sessionData
      )
    );

    setSession(sessionData);
  };

  /*
  | Logout
  */

  const logout = () => {
    localStorage.removeItem(
      "safewalk_session"
    );

    setSession(null);
  };

  /*
  | Login screen
  */

  if (!session) {
    return (
      <PinLogin
        onUser={saveSession}
        onAdmin={saveSession}
      />
    );
  }

  /*
  | Dashboard
  */

  if (
    session.role === "ADMIN"
  ) {
    return (
      <AdminPage
        session={session}
        logout={logout}
      />
    );
  }

  return (
    <UserPage
      session={session}
      logout={logout}
    />
  );
}