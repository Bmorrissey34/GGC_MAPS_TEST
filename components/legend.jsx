// components/legend.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

const HOVER_TARGETS = {
  academicBuilding: { selector: ".building-group:not(.student-housing)" },
  studentHousing: { selector: ".building-group.student-housing" },
  parkingFacultyStaff: { selector: ".staff-parking" },
  parkingResidents: { selector: ".resident-parking" },
  parkingStudents: { selector: ".student-parking" },
  parkingHandicap: { selector: ".handicap-parking" },
  restrictedArea: { selector: ".restricted-area" },
};

const TRANSLATIONS = {
  en: {
    legendTitle: "Legend",
    toggleHide: "Hide legend",
    toggleShow: "Show legend",
    languageLabel: "Language",
    languageEnglish: "English",
    languageSpanish: "Spanish",
    academicBuilding: "Academic Building",
    studentHousing: "Student Housing",
    parking: "Parking",
    parkingFacultyStaff: "Faculty/Staff",
    parkingResidents: "Residents",
    parkingStudents: "Students",
    parkingHandicap: "Handicap",
    restrictedArea: "Restricted Area",
  },
  es: {
    legendTitle: "Leyenda",
    toggleHide: "Ocultar leyenda",
    toggleShow: "Mostrar leyenda",
    languageLabel: "Idioma",
    languageEnglish: "Ingl\u00e9s",
    languageSpanish: "Espa\u00f1ol",
    academicBuilding: "Edificio acad\u00e9mico",
    studentHousing: "Residencias estudiantiles",
    parking: "Estacionamiento",
    parkingFacultyStaff: "Personal/Profesorado",
    parkingResidents: "Residentes",
    parkingStudents: "Estudiantes",
    parkingHandicap: "Acceso para discapacitados",
    restrictedArea: "\u00c1rea restringida",
  },
};

const FALLBACK_LOCALE = "en";
const SUPPORTED_LOCALES = ["en", "es"];

const BASE_ITEMS = [
  { color: "#0f5132", labelKey: "academicBuilding" },
  { color: "#6b21a8", labelKey: "studentHousing" },
];

const PARKING_ITEMS = [
  { color: "#e874be", labelKey: "parkingFacultyStaff" },
  { color: "#e8bf74", labelKey: "parkingResidents" },
  { color: "#86efac", labelKey: "parkingStudents" },
  { color: "#93c5fd", labelKey: "parkingHandicap" },
];

const LEGEND_CONTAINER_STYLE = {
  top: "clamp(80px, 15vh, 250px)",
  right: "clamp(40px, 6vw, 200px)",
  zIndex: 1000,
  pointerEvents: "auto",
};

const LEGEND_PANEL_STYLE = {
  width: "clamp(160px, 18vw, 280px)",   // narrower
  maxWidth: "min(80vw, 240px)",         // cap at 280px
  maxHeight: "clamp(210px, 48vh, 420px)",
  overflowY: "auto",
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  color: "#0f172a",
  lineHeight: 1.35,
  fontSize: "clamp(0.86rem, 0.9vw, 0.95rem)",
  border: "1px solid rgba(0,0,0,0.25)",
  borderRadius: "0.75rem",
  boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
};

const normalizeLocale = (value) => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (SUPPORTED_LOCALES.includes(lower)) return lower;
  return SUPPORTED_LOCALES.find((loc) => lower.startsWith(loc)) ?? null;
};

const getStoredLocale = () => {
  if (typeof window === "undefined") return null;
  return normalizeLocale(window.localStorage.getItem("legendLocale"));
};

/** Reusable row with color square + label */
function SwatchItem({ color, label, className = "", onEnter, onLeave }) {
  const classes = ["d-flex align-items-center gap-2", className].filter(Boolean).join(" ");
  return (
    <li
      className={classes}
      onMouseEnter={() => onEnter?.()}
      onMouseLeave={() => onLeave?.()}
      style={{ wordBreak: "break-word" }}
    >
      <span
        className="d-inline-block border rounded"
        style={{ width: "14px", height: "14px", backgroundColor: color, flexShrink: 0 }}
      />
      <span>{label}</span>
    </li>
  );
}

export default function Legend({ locale = FALLBACK_LOCALE, mapScopeSelector }) {
  void mapScopeSelector;

  const [open, setOpen] = useState(true);
  const [userOverride, setUserOverride] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(
    () => normalizeLocale(locale) ?? FALLBACK_LOCALE
  );

  const messages = useMemo(
    () => TRANSLATIONS[currentLocale] ?? TRANSLATIONS[FALLBACK_LOCALE],
    [currentLocale]
  );
  const fallbackMessages = TRANSLATIONS[FALLBACK_LOCALE];
  const t = (key) => messages[key] ?? fallbackMessages[key] ?? key;

  const sendHover = (source, detail) => {
    if (typeof window === "undefined" || !detail) return;
    window.dispatchEvent(new CustomEvent("ggcmap-hover", { detail: { source, ...detail } }));
  };

  const clearHover = (source) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("ggcmap-hover-clear", { detail: { source } }));
  };

  const getHoverHandlers = (key) => {
    const detail = HOVER_TARGETS[key];
    if (!detail) return {};
    const source = `legend:${key}`;
    return {
      onEnter: () => sendHover(source, detail),
      onLeave: () => clearHover(source),
    };
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLocale = getStoredLocale();
    if (storedLocale) {
      setCurrentLocale(storedLocale);
      setUserOverride(true);
    }
  }, []);

  // remember panel open state between sessions
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("legendOpen");
    if (saved !== null) setOpen(saved === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("legendOpen", open ? "1" : "0");
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (userOverride) {
      window.localStorage.setItem("legendLocale", currentLocale);
    } else {
      window.localStorage.removeItem("legendLocale");
    }
  }, [currentLocale, userOverride]);

  useEffect(() => {
    if (userOverride) return;
    const normalized = normalizeLocale(locale);
    if (normalized && normalized !== currentLocale) {
      setCurrentLocale(normalized);
    }
  }, [locale, currentLocale, userOverride]);

  const handleLocaleChange = (code) => {
    if (code === currentLocale) return;
    setCurrentLocale(code);
    setUserOverride(true);
  };

  return (
    <div className="position-absolute" style={LEGEND_CONTAINER_STYLE}>
      <aside
        className="shadow rounded-3 py-3 px-4"
        role="region"
        aria-label={t("legendTitle")}
        style={LEGEND_PANEL_STYLE}
      >
        {/* Header row: title + EN/ES cluster close together, collapse button floats right */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className="fw-bold">{t("legendTitle")}</div>

          <div className="btn-group btn-group-sm ms-2" role="group" aria-label={t("languageLabel")}>
            {SUPPORTED_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                className={`btn btn-sm ${currentLocale === code ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => handleLocaleChange(code)}
                aria-pressed={currentLocale === code}
                aria-label={t(code === "en" ? "languageEnglish" : "languageSpanish")}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary ms-3"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="legend-body"
            title={open ? t("toggleHide") : t("toggleShow")}
          >
            {open ? <i className="bi bi-dash-lg"></i> : <i className="bi bi-plus-lg"></i>}
          </button>
        </div>

        <div id="legend-body" hidden={!open} className="pt-2">
          <ul className="list-unstyled mb-0">
            {BASE_ITEMS.map((item) => (
              <SwatchItem
                key={item.labelKey}
                color={item.color}
                label={t(item.labelKey)}
                className="mb-2"
                {...getHoverHandlers(item.labelKey)}
              />
            ))}

            <li className="mt-3">
              <div className="fw-semibold" style={{ paddingLeft: "22px" }}>
                {t("parking")}
              </div>
              <ul className="list-unstyled mb-0 ps-3 mt-2">
                {PARKING_ITEMS.map((item) => (
                  <SwatchItem
                    key={item.labelKey}
                    color={item.color}
                    label={t(item.labelKey)}
                    className="mb-2"
                    {...getHoverHandlers(item.labelKey)}
                  />
                ))}
              </ul>
            </li>

            <SwatchItem
              color="#9ca3af"
              label={t("restrictedArea")}
              className="mt-3 mb-0"
              {...getHoverHandlers("restrictedArea")}
            />
          </ul>
        </div>
      </aside>
    </div>
  );
}
