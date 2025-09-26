// components/legend.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./Legend.module.css";

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
  const handleEnter = () => onEnter?.();
  const handleLeave = () => onLeave?.();

  return (
    <li
      className={`${styles.item} ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className={styles.swatch} style={{ background: color }} />
      <span>{label}</span>
    </li>
  );
}

export default function Legend({ locale = FALLBACK_LOCALE, mapScopeSelector }) {
  void mapScopeSelector;

  const [open, setOpen] = useState(true);
  const [userOverride, setUserOverride] = useState(() => getStoredLocale() !== null);
  const [currentLocale, setCurrentLocale] = useState(() =>
    getStoredLocale() ?? normalizeLocale(locale) ?? FALLBACK_LOCALE
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
    <div className={styles.legendContainer}>
      <aside className={styles.legend} role="region" aria-label={t("legendTitle")}>
        {/* Header with title + toggle button (upper-right) */}
        <div className={styles.legendHeader}>
          <div className={styles.legendTitle}>{t("legendTitle")}</div>

          <div className={styles.legendControls}>
            <div className={styles.localeToggle} role="group" aria-label={t("languageLabel")}>
              {SUPPORTED_LOCALES.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`${styles.localeButton} ${
                    currentLocale === code ? styles.localeButtonActive : ""
                  }`}
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
              className={styles.legendToggle}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="legend-body"
              title={open ? t("toggleHide") : t("toggleShow")}
            >
              {open ? "\u2212" : "+"}
            </button>
          </div>
        </div>

        {/* Collapsible body */}
        <div id="legend-body" hidden={!open} className={styles.legendBody}>
          <ul className={styles.list}>
            {BASE_ITEMS.map((item) => (
              <SwatchItem
                key={item.labelKey}
                color={item.color}
                label={t(item.labelKey)}
                {...getHoverHandlers(item.labelKey)}
              />
            ))}

            {/* Section: Parking */}
            <li className={styles.sectionHeading}>
              <span>{t("parking")}</span>
              <ul className={styles.sublist}>
                {PARKING_ITEMS.map((item) => (
                  <SwatchItem
                    key={item.labelKey}
                    color={item.color}
                    label={t(item.labelKey)}
                    className={styles.subitem}
                    {...getHoverHandlers(item.labelKey)}
                  />
                ))}
              </ul>
            </li>

            <SwatchItem
              color="#9ca3af"
              label={t("restrictedArea")}
              className={styles.sectionLabel}
              {...getHoverHandlers("restrictedArea")}
            />
          </ul>
        </div>
      </aside>
    </div>
  );
}
