// src/pages/employee/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

/**
 * Admin Reports dashboard with user-controlled / customizable reports.
 *
 * Uses these endpoints:
 *  - GET /api/reports/animals-per-exhibit
 *  - GET /api/vetvisit
 *  - GET /api/reports/medical-alerts?days=N
 *  - GET /api/public/ticket-types        (ticket sales by type – demo data)
 *  - GET /api/reports/memberships        (membership details)
 *  - GET /api/reports/membership-summary (membership summary by tier – new)
 *
 * Only admin can access this route (see App.jsx ProtectedRoute).
 */

// helper for default date range (last 90 days)
function defaultMsDateRange() {
  const today = new Date();
  const to = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 90);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

function formatMoneyFromCents(cents) {
  if (cents == null) return "—";
  const n = Number(cents) / 100;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatPercent(pct) {
  if (pct == null) return "—";
  const n = Number(pct);
  return `${n.toFixed(2)}%`;
}

export default function Reports() {
  const { token } = useAuth();

  const [reportType, setReportType] = useState("animalsPerExhibit");

  // ---------- DATA STATES ----------
  const [animalsData, setAnimalsData] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(false);
  const [animalsError, setAnimalsError] = useState("");

  const [visitsData, setVisitsData] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState("");

  const [alertsData, setAlertsData] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");

  // Ticket sales (by type)
  const [ticketData, setTicketData] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");

  // Memberships (detailed)
  const [membershipData, setMembershipData] = useState([]);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState("");

  // Membership summary by tier (NEW)
  const msDefaults = defaultMsDateRange();
  const [msFrom, setMsFrom] = useState(msDefaults.from);
  const [msTo, setMsTo] = useState(msDefaults.to);
  const [msTier, setMsTier] = useState("");
  const [msSource, setMsSource] = useState("");
  const [msData, setMsData] = useState([]);
  const [msLoading, setMsLoading] = useState(false);
  const [msError, setMsError] = useState("");

    // Insights dashboard (custom)
  const [insFrom, setInsFrom] = useState(msDefaults.from);
  const [insTo, setInsTo] = useState(msDefaults.to);
  const [insCategory, setInsCategory] = useState("Food");

  const [insShowOverview, setInsShowOverview] = useState(true);
  const [insShowMembershipImpact, setInsShowMembershipImpact] =
    useState(true);
  const [insShowProductPerf, setInsShowProductPerf] = useState(true);

  const [finOverview, setFinOverview] = useState(null);
  const [finLoading, setFinLoading] = useState(false);
  const [finError, setFinError] = useState("");

  const [prodPerf, setProdPerf] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState("");

  // Custom revenue explorer (advanced)
  const [crFrom, setCrFrom] = useState(msDefaults.from);
  const [crTo, setCrTo] = useState(msDefaults.to);
  const [crMetric, setCrMetric] = useState("revenue"); // 'revenue' | 'units'
  const [crGroupBy, setCrGroupBy] = useState("source_type");

  const [crSourceTypes, setCrSourceTypes] = useState({
    Ticket: true,
    POS: true,
    Membership: true,
    Donation: true,
  });

  const [crMembershipTiers, setCrMembershipTiers] = useState(""); // comma-separated
  const [crPosBuckets, setCrPosBuckets] = useState({
    Food: true,
    Merch: true,
  });
  const [crChannel, setCrChannel] = useState(""); // "", "online", "onsite", "staff"
  const [crMinAmount, setCrMinAmount] = useState(""); // dollars
  const [crMaxAmount, setCrMaxAmount] = useState(""); // dollars

  const [crRows, setCrRows] = useState([]);
  const [crLoading, setCrLoading] = useState(false);
  const [crError, setCrError] = useState("");


  // ---------- FILTER / CONFIG STATE ----------
  // Animals per exhibit
  const [animalsMinCount, setAnimalsMinCount] = useState(0);
  const [animalsCols, setAnimalsCols] = useState({
    exhibit: true,
    animal_count: true,
  });

  // Vet visits
  const [visitsFrom, setVisitsFrom] = useState("");
  const [visitsTo, setVisitsTo] = useState("");
  const [visitsSearch, setVisitsSearch] = useState("");
  const [visitsCols, setVisitsCols] = useState({
    visit_id: true,
    visit_date: true,
    animal_name: true,
    species: true,
    reason: true,
    diagnosis: true,
    vet_id: true,
  });

  // Medical alerts
  const [alertsDays, setAlertsDays] = useState(30);
  const [alertsSev, setAlertsSev] = useState({
    info: false,
    low: false,
    medium: true,
    high: true,
    critical: true,
  });
  const [alertsCols, setAlertsCols] = useState({
    log_datetime: true,
    animal_name: true,
    species: true,
    exhibit: true,
    severity: true,
    category: true,
    summary: true,
    details: false,
    vet_name: true,
    vet_visit_id: false,
  });

  // Ticket sales filters / columns
  const [ticketMinQty, setTicketMinQty] = useState(0);
  const [ticketCols, setTicketCols] = useState({
    name: true,
    price: true,
    quantity: true,
    revenue: true,
  });

  // Membership (detailed) filters / columns
  const [memberFrom, setMemberFrom] = useState("");
  const [memberTo, setMemberTo] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatus, setMemberStatus] = useState({
    active: true,
    cancelled: true,
    expired: true,
  });
  const [memberCols, setMemberCols] = useState({
    member_id: true,
    member_name: true,
    email: true,
    tier_name: true,
    status: true,
    start_date: true,
    end_date: true,
    auto_renew: false,
  });

  // Membership summary columns (NEW)
  const [msCols, setMsCols] = useState({
    membership_tier: true,
    txn_count: true,
    revenue_cents: true,
    discount_cents: true,
    avg_discount_pct: true,
    online_count: true,
    onsite_count: true,
    staff_count: true,
  });
  // Custom revenue explorer columns
  const [crCols, setCrCols] = useState({
    group_key: true,
    source_type: true,
    units: true,
    revenue_cents: true,
    metric_value: true,
  });

  // ---------- LOAD DATA ONCE (animals, visits) ----------
  useEffect(() => {
    if (!token) return;

    const loadAnimals = async () => {
      setAnimalsLoading(true);
      setAnimalsError("");
      try {
        const res = await fetchAuth(`${api}/api/reports/animals-per-exhibit`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load animals-per-exhibit");
        const data = await res.json();
        setAnimalsData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setAnimalsError("Failed to load animals per exhibit.");
      } finally {
        setAnimalsLoading(false);
      }
    };

    const loadVisits = async () => {
      setVisitsLoading(true);
      setVisitsError("");
      try {
        const res = await fetchAuth(`${api}/api/vetvisit`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load vet visits");
        const raw = await res.json();
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.results)
          ? raw.results
          : [];
        setVisitsData(list);
      } catch (err) {
        console.error(err);
        setVisitsError("Failed to load vet visits.");
      } finally {
        setVisitsLoading(false);
      }
    };

    loadAnimals();
    loadVisits();
  }, [token]);

  // ---------- LOAD ALERTS (depends on days filter) ----------
  useEffect(() => {
    if (!token) return;

    const days = Number(alertsDays) || 30;
    setAlertsLoading(true);
    setAlertsError("");
    (async () => {
      try {
        const res = await fetchAuth(
          `${api}/api/reports/medical-alerts?days=${days}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to load medical alerts");
        const data = await res.json();
        setAlertsData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setAlertsError("Failed to load medical alerts.");
      } finally {
        setAlertsLoading(false);
      }
    })();
  }, [token, alertsDays]);

  // ---------- LOAD TICKET SALES (by type) ----------
  useEffect(() => {
    // Only fetch when user selects the ticket report, and we haven't loaded yet
    if (reportType !== "ticketSales") return;
    if (ticketLoading || ticketData.length) return;

    const loadTickets = async () => {
      setTicketLoading(true);
      setTicketError("");
      try {
        const res = await fetch(`${api}/api/public/ticket-types`);
        if (!res.ok) throw new Error("Failed to load ticket types");
        const data = await res.json();

        // Demo quantities / revenue – same idea as TicketStats.
        let seed = 42;
        const rand = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };

        const chartData = data.map((t) => {
          const quantity = Math.floor(rand() * 50) + 10; // 10–59
          const price = (t.price_cents || 0) / 100;
          return {
            name: t.name,
            price,
            quantity,
            revenue: quantity * price,
          };
        });

        setTicketData(chartData);
      } catch (err) {
        console.error(err);
        setTicketError("Failed to load ticket sales data.");
      } finally {
        setTicketLoading(false);
      }
    };

    loadTickets();
  }, [reportType, ticketData.length, ticketLoading]);

  // ---------- LOAD MEMBERSHIPS (detailed) ----------
  useEffect(() => {
    if (!token) return;
    if (reportType !== "memberships") return;
    if (membershipLoading || membershipData.length) return;

    const loadMemberships = async () => {
      setMembershipLoading(true);
      setMembershipError("");
      try {
        const res = await fetchAuth(`${api}/api/reports/memberships`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load memberships");
        const data = await res.json();
        // Expect an array of rows:
        // { member_id, member_name, email, tier_name, status, start_date, end_date, auto_renew }
        setMembershipData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMembershipError(
          "Failed to load membership report data (check /api/reports/memberships)."
        );
      } finally {
        setMembershipLoading(false);
      }
    };

    loadMemberships();
  }, [token, reportType, membershipData.length, membershipLoading]);

  // ---------- LOAD MEMBERSHIP SUMMARY (NEW) ----------
  useEffect(() => {
    if (!token) return;
    if (reportType !== "membershipSummary") return;

    const controller = new AbortController();

    const loadMs = async () => {
      setMsLoading(true);
      setMsError("");
      try {
        const params = new URLSearchParams();
        if (msFrom) params.set("from", msFrom);
        if (msTo) params.set("to", msTo);
        if (msTier.trim()) params.set("tier", msTier.trim());
        if (msSource) params.set("source", msSource);

        const qs = params.toString();
        const url = `${api}/api/reports/membership-summary${
          qs ? `?${qs}` : ""
        }`;

        const res = await fetchAuth(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load membership summary");
        }

        const data = await res.json();
        setMsData(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setMsError(
          err.message || "Failed to load membership summary report data."
        );
      } finally {
        setMsLoading(false);
      }
    };

    loadMs();

    return () => controller.abort();
  }, [token, reportType, msFrom, msTo, msTier, msSource]);

  const msHasFilters = useMemo(
    () => !!(msFrom || msTo || msTier || msSource),
    [msFrom, msTo, msTier, msSource]
  );

    // ---------- LOAD INSIGHTS: finance overview ----------
  useEffect(() => {
    if (!token) return;
    if (reportType !== "insightsDashboard") return;
    if (!insShowOverview && !insShowMembershipImpact) return;

    const params = new URLSearchParams();
    if (insFrom) params.set("from", insFrom);
    if (insTo) params.set("to", insTo);

    const url = `${api}/api/reports/insights/finance-overview${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    setFinLoading(true);
    setFinError("");
    fetchAuth(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load finance overview");
        return res.json();
      })
      .then((data) => {
        setFinOverview(data);
      })
      .catch((err) => {
        console.error(err);
        setFinError("Failed to load finance overview.");
        setFinOverview(null);
      })
      .finally(() => setFinLoading(false));
  }, [
    token,
    reportType,
    insShowOverview,
    insShowMembershipImpact,
    insFrom,
    insTo,
  ]);

  // ---------- LOAD INSIGHTS: product performance ----------
  useEffect(() => {
    if (!token) return;
    if (reportType !== "insightsDashboard") return;
    if (!insShowProductPerf) return;

    const params = new URLSearchParams();
    params.set("type", insCategory);
    if (insFrom) params.set("from", insFrom);
    if (insTo) params.set("to", insTo);

    const url = `${api}/api/reports/insights/product-performance?${params.toString()}`;

    setProdLoading(true);
    setProdError("");
    fetchAuth(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load product performance");
        return res.json();
      })
      .then((data) => {
        setProdPerf(Array.isArray(data.items) ? data.items : []);
      })
      .catch((err) => {
        console.error(err);
        setProdError("Failed to load product performance.");
        setProdPerf([]);
      })
      .finally(() => setProdLoading(false));
  }, [token, reportType, insShowProductPerf, insCategory, insFrom, insTo]);

   // ---------- LOAD INSIGHTS: custom revenue explorer ----------
  useEffect(() => {
    if (!token) return;
    if (reportType !== "customRevenue") return;

    const activeSourceTypes = Object.entries(crSourceTypes)
      .filter(([, on]) => on)
      .map(([k]) => k);

    const activePosBuckets = Object.entries(crPosBuckets)
      .filter(([, on]) => on)
      .map(([k]) => k);

    const tiers = crMembershipTiers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const filters = {};

    if (activeSourceTypes.length) {
      filters.sourceTypes = activeSourceTypes;
    }
    if (activePosBuckets.length && activeSourceTypes.includes("POS")) {
      filters.posBuckets = activePosBuckets;
    }
    if (tiers.length && activeSourceTypes.includes("Membership")) {
      filters.membershipTiers = tiers;
    }
    if (crChannel) {
      filters.channel = crChannel;
    }
    if (crMinAmount) {
      filters.minAmount = Math.round(Number(crMinAmount) * 100); // dollars → cents
    }
    if (crMaxAmount) {
      filters.maxAmount = Math.round(Number(crMaxAmount) * 100);
    }

    const body = {
      from: crFrom,
      to: crTo,
      metric: crMetric, // 'revenue' | 'units'
      groupBy: crGroupBy,
      filters,
    };

    setCrLoading(true);
    setCrError("");
    fetchAuth(`${api}/api/reports/insights/custom-revenue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load custom revenue insights");
        }
        return res.json();
      })
      .then((data) => {
        setCrRows(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch((err) => {
        console.error(err);
        setCrError(
          err.message || "Failed to load custom revenue insights."
        );
        setCrRows([]);
      })
      .finally(() => setCrLoading(false));
  }, [
    token,
    reportType,
    crFrom,
    crTo,
    crMetric,
    crGroupBy,
    crSourceTypes,
    crMembershipTiers,
    crPosBuckets,
    crChannel,
    crMinAmount,
    crMaxAmount,
  ]);


  // ---------- DERIVED / FILTERED DATA ----------
  const filteredAnimals = useMemo(() => {
    const min = Number(animalsMinCount) || 0;
    return animalsData.filter((row) => Number(row.animal_count) >= min);
  }, [animalsData, animalsMinCount]);

  const filteredVisits = useMemo(() => {
    let list = [...visitsData];

    if (visitsFrom) {
      const fromTime = new Date(visitsFrom).getTime();
      list = list.filter((v) => new Date(v.visit_date).getTime() >= fromTime);
    }
    if (visitsTo) {
      const toTime = new Date(visitsTo + "T23:59:59").getTime();
      list = list.filter((v) => new Date(v.visit_date).getTime() <= toTime);
    }

    const term = visitsSearch.trim().toLowerCase();
    if (term) {
      list = list.filter((v) => {
        const fields = [
          v.animal_name,
          v.species,
          v.reason,
          v.diagnosis,
          v.visit_id,
          v.animal_id,
        ];
        return fields
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(term));
      });
    }

    list.sort(
      (a, b) =>
        new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
    );

    return list;
  }, [visitsData, visitsFrom, visitsTo, visitsSearch]);

  const filteredAlerts = useMemo(() => {
    const activeSev = Object.entries(alertsSev)
      .filter(([, val]) => val)
      .map(([k]) => k);
    const sevSet = new Set(activeSev);

    let list = [...alertsData];
    if (sevSet.size > 0) {
      list = list.filter((a) => sevSet.has(a.severity));
    }

    list.sort(
      (a, b) =>
        new Date(b.log_datetime).getTime() - new Date(a.log_datetime).getTime()
    );

    return list;
  }, [alertsData, alertsSev]);

  const filteredTickets = useMemo(() => {
    const min = Number(ticketMinQty) || 0;
    return ticketData.filter((t) => Number(t.quantity) >= min);
  }, [ticketData, ticketMinQty]);

  const ticketTotals = useMemo(() => {
    let totalQty = 0;
    let totalRev = 0;
    for (const t of filteredTickets) {
      totalQty += t.quantity || 0;
      totalRev += t.revenue || 0;
    }
    return { totalQty, totalRev };
  }, [filteredTickets]);

  const insightMembershipStats = useMemo(() => {
    if (!finOverview || !Array.isArray(finOverview.revenue_by_type)) {
      return { membershipRevenueCents: 0, sharePct: 0 };
    }
    const total = Number(finOverview.total_revenue_cents) || 0;
    const membershipRow = finOverview.revenue_by_type.find(
      (r) => r.product_type === "Membership"
    );
    const membershipRevenueCents = membershipRow
      ? Number(membershipRow.revenue_cents) || 0
      : 0;
    const sharePct = total > 0 ? (membershipRevenueCents / total) * 100 : 0;
    return { membershipRevenueCents, sharePct };
  }, [finOverview]);

  const filteredMemberships = useMemo(() => {
    let list = [...membershipData];

    // Date range on start_date (can adjust to created_at if your schema differs)
    if (memberFrom) {
      const fromTime = new Date(memberFrom).getTime();
      list = list.filter((m) => new Date(m.start_date).getTime() >= fromTime);
    }
    if (memberTo) {
      const toTime = new Date(memberTo + "T23:59:59").getTime();
      list = list.filter((m) => new Date(m.start_date).getTime() <= toTime);
    }

    // Status filter
    const activeStatuses = Object.entries(memberStatus)
      .filter(([, val]) => val)
      .map(([k]) => k);
    const statusSet = new Set(activeStatuses);
    if (statusSet.size > 0) {
      list = list.filter((m) => statusSet.has((m.status || "").toLowerCase()));
    }

    // Search by name/email/plan/id
    const term = memberSearch.trim().toLowerCase();
    if (term) {
      list = list.filter((m) => {
        const fields = [
          m.member_name,
          m.email,
          m.tier_name,
          m.member_id,
          m.status,
        ];
        return fields
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(term));
      });
    }

    // Newest memberships first
    list.sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    return list;
  }, [membershipData, memberFrom, memberTo, memberSearch, memberStatus]);

  const membershipTotals = useMemo(() => {
    const total = filteredMemberships.length;
    const activeCount = filteredMemberships.filter(
      (m) => (m.status || "").toLowerCase() === "active"
    ).length;
    return { total, activeCount };
  }, [filteredMemberships]);

  // Membership summary currently doesn't have extra client-side filtering;
  // msData is already aggregated by the backend.
  const msRows = useMemo(() => msData, [msData]);

  // ---------- HELPERS ----------
  const toggleCols = (setFn, key) => {
    setFn((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onChangeSev = (sev) => {
    setAlertsSev((prev) => ({ ...prev, [sev]: !prev[sev] }));
  };

  const toggleMemberStatus = (statusKey) => {
    setMemberStatus((prev) => ({ ...prev, [statusKey]: !prev[statusKey] }));
  };

  const exportToCSV = (rows, colsConfig, filename) => {
    const enabledCols = Object.entries(colsConfig)
      .filter(([, on]) => on)
      .map(([k]) => k);
    if (!enabledCols.length || !rows.length) return;

    const header = enabledCols.join(",");
    const lines = rows.map((row) =>
      enabledCols
        .map((col) => {
          const val = row[col] ?? "";
          const safe = String(val).replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",")
    );
    const blob = new Blob([header + "\n" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ---------- RENDER ----------
  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: Controls / Query Builder */}
        <div
          className="card"
          style={{
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            background: "#fffef8",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Reports</h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#555",
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            Choose the dataset, filters, and columns you want. Then review or
            export the generated report.
          </p>

          {/* Report type selector */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Report type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            >
              <option value="insightsDashboard">
                Insights dashboard (custom)
              </option>
              <option value="customRevenue">
                Custom revenue explorer (advanced)
              </option>
              <option value="animalsPerExhibit">
                Animals per exhibit (summary)
              </option>
              <option value="vetVisits">Vet visits (detailed)</option>
              <option value="ticketSales">Ticket sales (by type)</option>
              <option value="memberships">Memberships (detailed)</option>
              <option value="membershipSummary">
                Membership summary (by tier)
              </option>
              <option value="medicalAlerts">
                Medical alerts (high / critical)
              </option>
            </select>
          </div>

          {/* ---- Controls per report type ---- */}
          {reportType === "animalsPerExhibit" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Animals per exhibit – options
              </h3>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Minimum animal count
                </label>
                <input
                  type="number"
                  min={0}
                  value={animalsMinCount}
                  onChange={(e) => setAnimalsMinCount(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Columns
                </div>
                <label style={{ display: "block", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={animalsCols.exhibit}
                    onChange={() => toggleCols(setAnimalsCols, "exhibit")}
                  />{" "}
                  Exhibit
                </label>
                <label style={{ display: "block", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={animalsCols.animal_count}
                    onChange={() => toggleCols(setAnimalsCols, "animal_count")}
                  />{" "}
                  Animal count
                </label>
              </div>

              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  exportToCSV(
                    filteredAnimals,
                    animalsCols,
                    "animals-per-exhibit.csv"
                  )
                }
                disabled={
                  animalsLoading ||
                  !filteredAnimals.length ||
                  !Object.values(animalsCols).some(Boolean)
                }
              >
                Export CSV
              </button>
            </>
          )}

          {reportType === "vetVisits" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Vet visits – filters
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    From date
                  </label>
                  <input
                    type="date"
                    value={visitsFrom}
                    onChange={(e) => setVisitsFrom(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    To date
                  </label>
                  <input
                    type="date"
                    value={visitsTo}
                    onChange={(e) => setVisitsTo(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Search (animal, species, reason, diagnosis…)
                </label>
                <input
                  type="text"
                  value={visitsSearch}
                  onChange={(e) => setVisitsSearch(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                  placeholder="e.g. alligator, infection, Dr. 108…"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Columns
                </div>

                {[
                  ["visit_id", "Visit ID"],
                  ["visit_date", "Date / time"],
                  ["animal_name", "Animal"],
                  ["species", "Species"],
                  ["reason", "Reason"],
                  ["diagnosis", "Diagnosis"],
                  ["vet_id", "Vet ID"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={visitsCols[key]}
                      onChange={() => toggleCols(setVisitsCols, key)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  exportToCSV(
                    filteredVisits,
                    visitsCols,
                    "vet-visits-report.csv"
                  )
                }
                disabled={
                  visitsLoading ||
                  !filteredVisits.length ||
                  !Object.values(visitsCols).some(Boolean)
                }
              >
                Export CSV
              </button>
            </>
          )}

          {reportType === "ticketSales" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Ticket sales – options
              </h3>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Minimum quantity sold
                </label>
                <input
                  type="number"
                  min={0}
                  value={ticketMinQty}
                  onChange={(e) => setTicketMinQty(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Columns
                </div>
                {[
                  ["name", "Ticket type"],
                  ["price", "Price"],
                  ["quantity", "Quantity sold"],
                  ["revenue", "Revenue"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={ticketCols[key]}
                      onChange={() => toggleCols(setTicketCols, key)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  exportToCSV(
                    filteredTickets,
                    ticketCols,
                    "ticket-sales-report.csv"
                  )
                }
                disabled={
                  ticketLoading ||
                  !filteredTickets.length ||
                  !Object.values(ticketCols).some(Boolean)
                }
              >
                Export CSV
              </button>
            </>
          )}

          {reportType === "memberships" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Memberships – filters
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Start date from
                  </label>
                  <input
                    type="date"
                    value={memberFrom}
                    onChange={(e) => setMemberFrom(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Start date to
                  </label>
                  <input
                    type="date"
                    value={memberTo}
                    onChange={(e) => setMemberTo(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Search (name, email, plan, status…)
                </label>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                  placeholder="e.g. Nguyen, Family Pass, active…"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Status to include
                </div>
                {["active", "cancelled", "expired"].map((s) => (
                  <label
                    key={s}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      marginRight: 10,
                      fontSize: "0.85rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={memberStatus[s]}
                      onChange={() => toggleMemberStatus(s)}
                    />{" "}
                    {s}
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Columns
                </div>
                {[
                  ["member_id", "Member ID"],
                  ["member_name", "Name"],
                  ["email", "Email"],
                  ["tier_name", "Plan / tier"],
                  ["status", "Status"],
                  ["start_date", "Start date"],
                  ["end_date", "End date"],
                  ["auto_renew", "Auto-renew"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={memberCols[key]}
                      onChange={() => toggleCols(setMemberCols, key)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  exportToCSV(
                    filteredMemberships,
                    memberCols,
                    "memberships-report.csv"
                  )
                }
                disabled={
                  membershipLoading ||
                  !filteredMemberships.length ||
                  !Object.values(memberCols).some(Boolean)
                }
              >
                Export CSV
              </button>
            </>
          )}

          {reportType === "membershipSummary" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Membership summary – filters
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Started from
                  </label>
                  <input
                    type="date"
                    value={msFrom}
                    onChange={(e) => setMsFrom(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Started to
                  </label>
                  <input
                    type="date"
                    value={msTo}
                    onChange={(e) => setMsTo(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Tier (exact code)
                </label>
                <input
                  type="text"
                  value={msTier}
                  onChange={(e) => setMsTier(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                  placeholder="e.g. IND, FAM, VIP"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Source
                </label>
                <select
                  value={msSource}
                  onChange={(e) => setMsSource(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                >
                  <option value="">All sources</option>
                  <option value="online">Online</option>
                  <option value="onsite">Onsite</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Columns
                </div>
                {[
                  ["membership_tier", "Tier"],
                  ["txn_count", "Txn count"],
                  ["revenue_cents", "Revenue"],
                  ["discount_cents", "Discount"],
                  ["avg_discount_pct", "Avg. discount %"],
                  ["online_count", "Online count"],
                  ["onsite_count", "Onsite count"],
                  ["staff_count", "Staff count"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={msCols[key]}
                      onChange={() => toggleCols(setMsCols, key)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  exportToCSV(msRows, msCols, "membership-summary-by-tier.csv")
                }
                disabled={
                  msLoading ||
                  !msRows.length ||
                  !Object.values(msCols).some(Boolean)
                }
              >
                Export CSV
              </button>
            </>
          )}
          {reportType === "insightsDashboard" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Insights dashboard – filters
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Start date from
                  </label>
                  <input
                    type="date"
                    value={insFrom}
                    onChange={(e) => setInsFrom(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Start date to
                  </label>
                  <input
                    type="date"
                    value={insTo}
                    onChange={(e) => setInsTo(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Product category for performance
                </label>
                <select
                  value={insCategory}
                  onChange={(e) => setInsCategory(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                >
                  <option value="Ticket">Tickets</option>
                  <option value="Membership">Memberships</option>
                  <option value="Food">Food / snacks</option>
                  <option value="Merch">Merchandise</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Sections to include
                </div>
                <label style={{ display: "block", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={insShowOverview}
                    onChange={() => setInsShowOverview((v) => !v)}
                  />{" "}
                  Overall revenue overview
                </label>
                <label style={{ display: "block", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={insShowMembershipImpact}
                    onChange={() => setInsShowMembershipImpact((v) => !v)}
                  />{" "}
                  Membership impact on revenue
                </label>
                <label style={{ display: "block", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={insShowProductPerf}
                    onChange={() => setInsShowProductPerf((v) => !v)}
                  />{" "}
                  Product performance (by item)
                </label>
              </div>
            </>
          )}
          
             {reportType === "customRevenue" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Custom revenue explorer – filters
              </h3>

              {/* Date range */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    From date
                  </label>
                  <input
                    type="date"
                    value={crFrom}
                    onChange={(e) => setCrFrom(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    To date
                  </label>
                  <input
                    type="date"
                    value={crTo}
                    onChange={(e) => setCrTo(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  />
                </div>
              </div>

              {/* Metric + groupBy */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Metric
                  </label>
                  <select
                    value={crMetric}
                    onChange={(e) => setCrMetric(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  >
                    <option value="revenue">Revenue (cents)</option>
                    <option value="units">Units sold</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Group by
                  </label>
                  <select
                    value={crGroupBy}
                    onChange={(e) => setCrGroupBy(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                  >
                    <option value="source_type">Source type</option>
                    <option value="date">Date</option>
                    <option value="month">Month</option>
                    <option value="product_name">Product / ticket</option>
                    <option value="membership_tier">Membership tier</option>
                    <option value="pos_bucket">POS bucket (Food/Merch)</option>
                    <option value="channel">Channel (online/onsite/staff)</option>
                  </select>
                </div>
              </div>

              {/* Source types */}
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Source types
                </div>
                {["Ticket", "POS", "Membership", "Donation"].map((st) => (
                  <label
                    key={st}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={crSourceTypes[st]}
                      onChange={() =>
                        setCrSourceTypes((prev) => ({
                          ...prev,
                          [st]: !prev[st],
                        }))
                      }
                    />{" "}
                    {st}
                  </label>
                ))}
              </div>

              {/* Membership tiers (only if Membership selected) */}
              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Membership tiers (comma-separated)
                </label>
                <input
                  type="text"
                  value={crMembershipTiers}
                  onChange={(e) => setCrMembershipTiers(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                  placeholder="e.g. family, supporter, individual"
                />
              </div>

              {/* POS buckets */}
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  POS buckets
                </div>
                {["Food", "Merch"].map((b) => (
                  <label
                    key={b}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={crPosBuckets[b]}
                      onChange={() =>
                        setCrPosBuckets((prev) => ({
                          ...prev,
                          [b]: !prev[b],
                        }))
                      }
                    />{" "}
                    {b}
                  </label>
                ))}
              </div>

              {/* Channel */}
              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Channel
                </label>
                <select
                  value={crChannel}
                  onChange={(e) => setCrChannel(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                >
                  <option value="">All channels</option>
                  <option value="online">Online</option>
                  <option value="onsite">Onsite</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {/* Amount range */}
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Amount range (per group, in dollars)
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                    gap: 8,
                  }}
                >
                  <input
                    type="number"
                    min={0}
                    value={crMinAmount}
                    onChange={(e) => setCrMinAmount(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    min={0}
                    value={crMaxAmount}
                    onChange={(e) => setCrMaxAmount(e.target.value)}
                    style={{ width: "100%", padding: 6 }}
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Columns for export / table */}
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Columns
                </div>
                {[
                  ["group_key", "Group key"],
                  ["source_type", "Source type"],
                  ["units", "Units"],
                  ["revenue_cents", "Revenue (cents)"],
                  ["metric_value", "Metric value"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={crCols[key]}
                      onChange={() => toggleCols(setCrCols, key)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  exportToCSV(crRows, crCols, "custom-revenue-explorer.csv")
                }
                disabled={
                  crLoading ||
                  !crRows.length ||
                  !Object.values(crCols).some(Boolean)
                }
              >
                Export CSV
              </button>
            </>
          )}
              

          {reportType === "medicalAlerts" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                Medical alerts – filters
              </h3>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Look back (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={alertsDays}
                  onChange={(e) => setAlertsDays(e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                />
                <div style={{ fontSize: "0.8rem", color: "#777" }}>
                  Changing this will re-fetch data from the server.
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Severities to include
                </div>
                {["info", "low", "medium", "high", "critical"].map((sev) => (
                  <label
                    key={sev}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      marginRight: 10,
                      fontSize: "0.85rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={alertsSev[sev]}
                      onChange={() => onChangeSev(sev)}
                    />{" "}
                    {sev}
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Columns
                </div>
                {[
                  ["log_datetime", "Date / time"],
                  ["animal_name", "Animal"],
                  ["species", "Species"],
                  ["exhibit", "Exhibit"],
                  ["severity", "Severity"],
                  ["category", "Category"],
                  ["summary", "Summary"],
                  ["details", "Details"],
                  ["vet_name", "Vet name"],
                  ["vet_visit_id", "Linked visit ID"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: "block", fontSize: "0.85rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={alertsCols[key]}
                      onChange={() => toggleCols(setAlertsCols, key)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  exportToCSV(
                    filteredAlerts,
                    alertsCols,
                    "medical-alerts-report.csv"
                  )
                }
                disabled={
                  alertsLoading ||
                  !filteredAlerts.length ||
                  !Object.values(alertsCols).some(Boolean)
                }
              >
                Export CSV
              </button>
            </>
          )}
        </div>

        {/* RIGHT: Results table */}
        <div
          className="card"
          style={{
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            background: "#ffffff",
            minHeight: 300,
          }}
        >
          {reportType === "animalsPerExhibit" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Animals per exhibit
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Summary of how many animals are assigned to each exhibit. Use
                the controls to filter and customize columns.
              </p>

              {animalsLoading && <div>Loading animals per exhibit…</div>}
              {animalsError && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {animalsError}
                </div>
              )}

              {!animalsLoading && !animalsError && (
                <>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Showing {filteredAnimals.length} exhibits (min count{" "}
                    {animalsMinCount || 0})
                  </div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          {animalsCols.exhibit && <th>Exhibit</th>}
                          {animalsCols.animal_count && <th>Animal count</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAnimals.map((row) => (
                          <tr key={row.exhibit}>
                            {animalsCols.exhibit && <td>{row.exhibit}</td>}
                            {animalsCols.animal_count && (
                              <td>{row.animal_count}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {reportType === "vetVisits" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Vet visits (detailed)
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Detailed log of vet visits. Filter by date and free text, and
                choose exactly which columns you want in the report.
              </p>

              {visitsLoading && <div>Loading vet visits…</div>}
              {visitsError && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {visitsError}
                </div>
              )}

              {!visitsLoading && !visitsError && (
                <>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Showing {filteredVisits.length} visits
                    {visitsFrom && ` from ${visitsFrom}`}
                    {visitsTo && ` to ${visitsTo}`}
                    {visitsSearch && ` • matching "${visitsSearch}"`}
                  </div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          {visitsCols.visit_id && <th>Visit ID</th>}
                          {visitsCols.visit_date && <th>Date / time</th>}
                          {visitsCols.animal_name && <th>Animal</th>}
                          {visitsCols.species && <th>Species</th>}
                          {visitsCols.reason && <th>Reason</th>}
                          {visitsCols.diagnosis && <th>Diagnosis</th>}
                          {visitsCols.vet_id && <th>Vet ID</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisits.map((v) => (
                          <tr key={v.visit_id}>
                            {visitsCols.visit_id && <td>{v.visit_id}</td>}
                            {visitsCols.visit_date && (
                              <td>{new Date(v.visit_date).toLocaleString()}</td>
                            )}
                            {visitsCols.animal_name && <td>{v.animal_name}</td>}
                            {visitsCols.species && <td>{v.species}</td>}
                            {visitsCols.reason && <td>{v.reason}</td>}
                            {visitsCols.diagnosis && <td>{v.diagnosis}</td>}
                            {visitsCols.vet_id && <td>{v.vet_id}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {reportType === "ticketSales" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Ticket sales (by type)
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Summary of ticket performance by ticket type. Uses the ticket
                catalog plus demo quantity/revenue data, with full control over
                columns and CSV export.
              </p>

              {ticketLoading && <div>Loading ticket sales data…</div>}
              {ticketError && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {ticketError}
                </div>
              )}

              {!ticketLoading && !ticketError && (
                <>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Showing {filteredTickets.length} ticket types
                    {ticketMinQty
                      ? ` (min quantity ${ticketMinQty || 0})`
                      : ""}{" "}
                    • Total qty {ticketTotals.totalQty} • Total revenue $
                    {ticketTotals.totalRev.toFixed(2)}
                  </div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          {ticketCols.name && <th>Ticket type</th>}
                          {ticketCols.price && <th>Price</th>}
                          {ticketCols.quantity && <th>Quantity sold</th>}
                          {ticketCols.revenue && <th>Revenue</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((t) => (
                          <tr key={t.name}>
                            {ticketCols.name && <td>{t.name}</td>}
                            {ticketCols.price && (
                              <td>${t.price.toFixed(2)}</td>
                            )}
                            {ticketCols.quantity && <td>{t.quantity}</td>}
                            {ticketCols.revenue && (
                              <td>${t.revenue.toFixed(2)}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {reportType === "memberships" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Memberships (detailed)
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Detailed view of zoo memberships. Filter by start date, status,
                and search text, then choose exactly which columns you want in
                the report.
              </p>

              {membershipLoading && <div>Loading memberships…</div>}
              {membershipError && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {membershipError}
                </div>
              )}

              {!membershipLoading && !membershipError && (
                <>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Showing {membershipTotals.total} memberships
                    {memberFrom && ` from ${memberFrom}`}
                    {memberTo && ` to ${memberTo}`}
                    {memberSearch && ` • matching "${memberSearch}"`}
                    {" • "}
                    Active: {membershipTotals.activeCount}
                  </div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          {memberCols.member_id && <th>Member ID</th>}
                          {memberCols.member_name && <th>Name</th>}
                          {memberCols.email && <th>Email</th>}
                          {memberCols.tier_name && <th>Plan / tier</th>}
                          {memberCols.status && <th>Status</th>}
                          {memberCols.start_date && <th>Start date</th>}
                          {memberCols.end_date && <th>End date</th>}
                          {memberCols.auto_renew && <th>Auto-renew</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMemberships.map((m) => (
                          <tr key={m.member_id}>
                            {memberCols.member_id && <td>{m.member_id}</td>}
                            {memberCols.member_name && (
                              <td>{m.member_name}</td>
                            )}
                            {memberCols.email && <td>{m.email}</td>}
                            {memberCols.tier_name && <td>{m.tier_name}</td>}
                            {memberCols.status && <td>{m.status}</td>}
                            {memberCols.start_date && (
                              <td>
                                {m.start_date
                                  ? new Date(
                                      m.start_date
                                    ).toLocaleDateString()
                                  : "—"}
                              </td>
                            )}
                            {memberCols.end_date && (
                              <td>
                                {m.end_date
                                  ? new Date(
                                      m.end_date
                                    ).toLocaleDateString()
                                  : "—"}
                              </td>
                            )}
                            {memberCols.auto_renew && (
                              <td>
                                {String(m.auto_renew).toLowerCase() === "1" ||
                                String(m.auto_renew).toLowerCase() === "true"
                                  ? "Yes"
                                  : "No"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {reportType === "membershipSummary" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Membership summary by tier
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Aggregates <code>membership_txn</code> by{" "}
                <code>membership_tier</code>, computing transaction counts,
                total revenue, discounts, and a breakdown of online/onsite/staff
                sales. Use the filters on the left to adjust date range, tier,
                and source.
              </p>

              {msLoading && <div>Loading membership summary…</div>}
              {msError && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>{msError}</div>
              )}

              {!msLoading && !msError && (
                <>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Showing {msRows.length} tier
                    {msRows.length === 1 ? "" : "s"}{" "}
                    {msHasFilters && "(filters active)"}
                  </div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          {msCols.membership_tier && <th>Tier</th>}
                          {msCols.txn_count && <th>Txn count</th>}
                          {msCols.revenue_cents && <th>Revenue</th>}
                          {msCols.discount_cents && <th>Total discount</th>}
                          {msCols.avg_discount_pct && <th>Avg. discount %</th>}
                          {msCols.online_count && <th>Online</th>}
                          {msCols.onsite_count && <th>Onsite</th>}
                          {msCols.staff_count && <th>Staff</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {msRows.map((row) => (
                          <tr key={row.membership_tier}>
                            {msCols.membership_tier && (
                              <td>{row.membership_tier}</td>
                            )}
                            {msCols.txn_count && <td>{row.txn_count}</td>}
                            {msCols.revenue_cents && (
                              <td>{formatMoneyFromCents(row.revenue_cents)}</td>
                            )}
                            {msCols.discount_cents && (
                              <td>
                                {formatMoneyFromCents(row.discount_cents)}
                              </td>
                            )}
                            {msCols.avg_discount_pct && (
                              <td>{formatPercent(row.avg_discount_pct)}</td>
                            )}
                            {msCols.online_count && (
                              <td>{row.online_count}</td>
                            )}
                            {msCols.onsite_count && (
                              <td>{row.onsite_count}</td>
                            )}
                            {msCols.staff_count && <td>{row.staff_count}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
          
          {reportType === "insightsDashboard" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Insights dashboard
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Flexible view combining revenue, membership impact, and product
                performance for the selected date range. Turn sections on or off
                using the controls on the left.
              </p>

              {(finError || prodError) && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {finError || prodError}
                </div>
              )}

              {finLoading && (
                <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                  Loading finance overview…
                </div>
              )}
              {prodLoading && (
                <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                  Loading product performance…
                </div>
              )}

              {/* Overall revenue overview */}
              {insShowOverview && finOverview && (
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #eee",
                    padding: 12,
                    marginBottom: 16,
                    background: "#fafdf9",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      marginTop: 0,
                      marginBottom: 6,
                    }}
                  >
                    Overall revenue
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 16,
                      fontSize: "0.9rem",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <strong>Orders:</strong> {finOverview.order_count}
                    </div>
                    <div>
                      <strong>Total revenue:</strong>{" "}
                      {formatMoneyFromCents(
                        finOverview.total_revenue_cents || 0
                      )}
                    </div>
                  </div>

                  {Array.isArray(finOverview.revenue_by_type) &&
                    finOverview.revenue_by_type.length > 0 && (
                      <>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#777",
                            marginBottom: 4,
                          }}
                        >
                          Revenue by category
                        </div>
                        {finOverview.revenue_by_type.map((row, idx) => {
                          const max =
                            Number(
                              finOverview.revenue_by_type[0].revenue_cents
                            ) || 1;
                          const pct =
                            (Number(row.revenue_cents || 0) / max) * 100;
                          return (
                            <div
                              key={row.product_type || idx}
                              style={{ marginBottom: 6 }}
                            >
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  marginBottom: 2,
                                }}
                              >
                                {row.product_type || "Other"} —{" "}
                                {formatMoneyFromCents(row.revenue_cents)}
                              </div>
                              <div
                                style={{
                                  background: "#f1f1f1",
                                  borderRadius: 999,
                                  overflow: "hidden",
                                  height: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    background: "#4a9c5c",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                </div>
              )}

              {/* Membership impact card */}
              {insShowMembershipImpact && finOverview && (
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #eee",
                    padding: 12,
                    marginBottom: 16,
                    background: "#fefaf6",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      marginTop: 0,
                      marginBottom: 6,
                    }}
                  >
                    Membership impact on revenue
                  </h3>
                  <div style={{ fontSize: "0.9rem" }}>
                    <div>
                      <strong>Membership revenue:</strong>{" "}
                      {formatMoneyFromCents(
                        insightMembershipStats.membershipRevenueCents
                      )}
                    </div>
                    <div>
                      <strong>Share of total revenue:</strong>{" "}
                      {formatPercent(insightMembershipStats.sharePct)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginTop: 4,
                    }}
                  >
                    Based on the same orders used in the finance overview, using
                    product_type = "Membership".
                  </div>
                </div>
              )}
              {/* Product performance card */}
              {insShowProductPerf && !prodLoading && !prodError && (
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #eee",
                    padding: 12,
                    marginBottom: 4,
                    background: "#f8fbff",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      marginTop: 0,
                      marginBottom: 6,
                    }}
                  >
                    {insCategory} performance (top items)
                  </h3>

                  {prodPerf.length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>
                      No items found for this range / category.
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Units sold</th>
                            <th>Revenue</th>
                            <th>Avg. price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prodPerf.map((p) => (
                            <tr key={p.product_name}>
                              <td>{p.product_name}</td>
                              <td>{p.units_sold}</td>
                              <td>
                                {formatMoneyFromCents(p.revenue_cents)}
                              </td>
                              <td>
                                {formatMoneyFromCents(p.avg_price_cents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {reportType === "customRevenue" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Custom revenue explorer
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Ad-hoc revenue view across tickets, POS, memberships, and
                donations. Combine filters and groupings on the left to answer
                specific business questions.
              </p>

              {crLoading && <div>Loading custom revenue insights…</div>}
              {crError && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {crError}
                </div>
              )}

              {!crLoading && !crError && (
                <>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Showing {crRows.length} groups • Metric:{" "}
                    {crMetric === "revenue" ? "Revenue" : "Units"} • Grouped by{" "}
                    {crGroupBy}
                    {crFrom && ` • from ${crFrom}`}
                    {crTo && ` to ${crTo}`}
                  </div>

                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          {crCols.group_key && <th>Group key</th>}
                          {crCols.source_type && <th>Source type</th>}
                          {crCols.units && <th>Units</th>}
                          {crCols.revenue_cents && <th>Revenue</th>}
                          {crCols.metric_value && <th>Metric value</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {crRows.map((row, idx) => (
                          <tr key={idx}>
                            {crCols.group_key && <td>{row.group_key}</td>}
                            {crCols.source_type && (
                              <td>{row.source_type}</td>
                            )}
                            {crCols.units && <td>{row.units}</td>}
                            {crCols.revenue_cents && (
                              <td>{formatMoneyFromCents(row.revenue_cents)}</td>
                            )}
                            {crCols.metric_value && (
                              <td>
                                {crMetric === "revenue"
                                  ? formatMoneyFromCents(row.metric_value)
                                  : row.metric_value}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {reportType === "medicalAlerts" && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 8 }}>
                Medical alerts (high / critical)
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                High-priority medical log entries. Choose severities, columns,
                and date window to build a custom report.
              </p>

              {alertsLoading && <div>Loading medical alerts…</div>}
              {alertsError && (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {alertsError}
                </div>
              )}

              {!alertsLoading && !alertsError && (
                <>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Showing {filteredAlerts.length} alerts in last{" "}
                    {alertsDays || 30} days
                  </div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          {alertsCols.log_datetime && <th>Date / time</th>}
                          {alertsCols.animal_name && <th>Animal</th>}
                          {alertsCols.species && <th>Species</th>}
                          {alertsCols.exhibit && <th>Exhibit</th>}
                          {alertsCols.severity && <th>Severity</th>}
                          {alertsCols.category && <th>Category</th>}
                          {alertsCols.summary && <th>Summary</th>}
                          {alertsCols.details && <th>Details</th>}
                          {alertsCols.vet_name && <th>Vet</th>}
                          {alertsCols.vet_visit_id && <th>Visit ID</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAlerts.map((a) => (
                          <tr key={a.log_id}>
                            {alertsCols.log_datetime && (
                              <td>
                                {new Date(a.log_datetime).toLocaleString()}
                              </td>
                            )}
                            {alertsCols.animal_name && (
                              <td>{a.animal_name}</td>
                            )}
                            {alertsCols.species && <td>{a.species}</td>}
                            {alertsCols.exhibit && <td>{a.exhibit}</td>}
                            {alertsCols.severity && (
                              <td style={{ textTransform: "capitalize" }}>
                                {a.severity}
                              </td>
                            )}
                            {alertsCols.category && <td>{a.category}</td>}
                            {alertsCols.summary && <td>{a.summary}</td>}
                            {alertsCols.details && <td>{a.details}</td>}
                            {alertsCols.vet_name && <td>{a.vet_name}</td>}
                            {alertsCols.vet_visit_id && (
                              <td>{a.vet_visit_id}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
