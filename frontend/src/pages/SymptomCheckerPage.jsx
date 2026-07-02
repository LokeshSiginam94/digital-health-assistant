import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const API_BASE = "http://127.0.0.1:5000";
const MIN_SYMPTOMS_FOR_ANALYSIS = 3;
const MAX_AGE = 100;
const LOW_CONFIDENCE_THRESHOLD = 20;

const featureModules = [
  {
    title: "AI Health Risk Score",
    description:
      "Provides a preliminary risk score using symptom selection, severity signals, and duration-related inputs.",
    icon: "🩺",
  },
  {
    title: "Symptom Severity Indicator",
    description:
      "Helps users understand whether the reported condition may appear mild, moderate, or higher-risk.",
    icon: "📈",
  },
  {
    title: "Emergency Guidance Support",
    description:
      "Supports decision-making on whether symptoms can be monitored, require consultation, or need urgent attention.",
    icon: "🚑",
  },
  {
    title: "Recovery Planner",
    description:
      "Offers a day-wise recovery support plan with simple guidance for rest, hydration, food, and routine care.",
    icon: "📅",
  },
  {
    title: "Indian Home Care Tips",
    description:
      "Shares supportive household wellness suggestions commonly followed in India with appropriate disclaimers.",
    icon: "🏠",
  },
  {
    title: "Seasonal Health Alerts",
    description:
      "Highlights common seasonal health risks in India through a simple awareness-based model.",
    icon: "🌦️",
  },
];

const popularSymptoms = [
  "fatigue",
  "vomiting",
  "high_fever",
  "loss_of_appetite",
  "nausea",
  "headache",
  "abdominal_pain",
  "chills",
  "joint_pain",
  "skin_rash",
  "cough",
  "breathlessness",
];

const defaultSeverity = {
  label: "Not available yet",
  color: "text-slate-300",
  bg: "bg-slate-500/10",
  border: "border-white/10",
};

const defaultEmergencyGuidance = {
  level: "Not available yet",
  message: "Emergency guidance will appear after analysis.",
  color: "text-slate-300",
  bg: "bg-slate-500/10",
  border: "border-white/10",
};

const formatSymptomLabel = (symptom) =>
  String(symptom || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

const normalizeArrayUnique = (items) => {
  const seen = new Set();
  const result = [];

  for (const item of items || []) {
    const normalized = normalizeText(item);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
};

const normalizeCategoryMap = (rawCategories) => {
  const normalized = {};
  Object.entries(rawCategories || {}).forEach(([category, symptoms]) => {
    normalized[category] = normalizeArrayUnique(symptoms);
  });
  return normalized;
};

const normalizeAlphabeticalMap = (rawGroups) => {
  const normalized = {};
  Object.entries(rawGroups || {}).forEach(([letter, symptoms]) => {
    normalized[letter] = normalizeArrayUnique(symptoms);
  });
  return normalized;
};

const sortCategoriesWithOtherLast = (categoryMap) => {
  const entries = Object.entries(categoryMap || {});
  const nonOther = [];
  const other = [];

  entries.forEach(([key, value]) => {
    if (normalizeText(key) === "other") {
      other.push([key, value]);
    } else {
      nonOther.push([key, value]);
    }
  });

  nonOther.sort(([a], [b]) => a.localeCompare(b));
  return [...nonOther, ...other];
};

const getHomeCareTips = (selectedSymptoms, duration) => {
  const tips = [];

  if (
    selectedSymptoms.includes("high fever") ||
    selectedSymptoms.includes("mild fever") ||
    selectedSymptoms.includes("fatigue") ||
    selectedSymptoms.includes("lethargy") ||
    selectedSymptoms.includes("malaise") ||
    selectedSymptoms.includes("chills")
  ) {
    tips.push("Take adequate rest and avoid overexertion.");
    tips.push("Drink enough water, soups, or oral fluids to stay hydrated.");
  }

  if (
    selectedSymptoms.includes("cough") ||
    selectedSymptoms.includes("phlegm") ||
    selectedSymptoms.includes("breathlessness")
  ) {
    tips.push("Use warm fluids such as warm water or soup for throat comfort.");
    tips.push("Avoid smoke exposure, dust, and strong cold air.");
  }

  if (
    selectedSymptoms.includes("vomiting") ||
    selectedSymptoms.includes("abdominal pain") ||
    selectedSymptoms.includes("nausea") ||
    selectedSymptoms.includes("diarrhoea") ||
    selectedSymptoms.includes("loss of appetite")
  ) {
    tips.push("Eat light food in small portions and avoid oily or spicy meals.");
    tips.push("Sip fluids slowly to reduce dehydration risk.");
  }

  if (
    selectedSymptoms.includes("headache") ||
    selectedSymptoms.includes("dizziness")
  ) {
    tips.push("Rest in a calm, quiet place and avoid prolonged screen exposure.");
  }

  if (
    selectedSymptoms.includes("joint pain") ||
    selectedSymptoms.includes("muscle pain") ||
    selectedSymptoms.includes("chest pain")
  ) {
    tips.push("Avoid unnecessary strain and allow the body enough rest for recovery.");
  }

  if (duration === "More than 1 Week") {
    tips.push("Because symptoms have lasted more than a week, medical consultation is recommended.");
  }

  if (tips.length === 0) {
    tips.push("Monitor symptoms, stay hydrated, eat light meals, and get proper rest.");
  }

  return [...new Set(tips)].slice(0, 5);
};

const getWarningSigns = (selectedSymptoms, duration, backendFlags) => {
  const warnings = [];

  if (backendFlags.length > 0) {
    backendFlags.forEach((flag) => {
      warnings.push(`Urgent attention may be needed for ${formatSymptomLabel(flag)}.`);
    });
  }

  if (selectedSymptoms.includes("breathlessness")) {
    warnings.push("Seek urgent medical care for breathing difficulty or worsening breathlessness.");
  }

  if (selectedSymptoms.includes("chest pain")) {
    warnings.push("Chest pain should be medically evaluated promptly, especially if severe or persistent.");
  }

  if (selectedSymptoms.includes("vomiting") && duration !== "1 Day") {
    warnings.push("Persistent vomiting may require medical attention, especially if fluids cannot be retained.");
  }

  if (selectedSymptoms.includes("dizziness")) {
    warnings.push("Seek prompt care if dizziness becomes severe, recurrent, or associated with collapse.");
  }

  if (
    (selectedSymptoms.includes("high fever") || selectedSymptoms.includes("mild fever")) &&
    duration === "More than 1 Week"
  ) {
    warnings.push("Persistent fever for more than a week should be medically evaluated.");
  }

  if (
    selectedSymptoms.includes("yellowish skin") ||
    selectedSymptoms.includes("yellowing of eyes") ||
    selectedSymptoms.includes("dark urine")
  ) {
    warnings.push("Yellow skin, yellow eyes, or dark urine should be medically reviewed because they may suggest liver-related illness.");
  }

  if (warnings.length === 0) {
    warnings.push("Seek medical care if symptoms worsen, become severe, or do not improve.");
  }

  return [...new Set(warnings)].slice(0, 5);
};

const getRiskScore = (selectedSymptoms, duration, visiblePredictions, backendFlags, backendRiskScore = null) => {
  if (typeof backendRiskScore === "number" && !Number.isNaN(backendRiskScore)) {
    return Math.min(Math.max(backendRiskScore, 0), 100);
  }

  let score = 10 + selectedSymptoms.length * 4;

  if (visiblePredictions.length > 0) {
    score += Math.round((visiblePredictions[0]?.confidence_percent || 0) * 0.25);
  }

  if (selectedSymptoms.includes("breathlessness")) score += 18;
  if (selectedSymptoms.includes("chest pain")) score += 18;
  if (selectedSymptoms.includes("vomiting")) score += 8;
  if (selectedSymptoms.includes("dizziness")) score += 6;
  if (selectedSymptoms.includes("high fever")) score += 10;
  if (selectedSymptoms.includes("yellowish skin")) score += 12;
  if (selectedSymptoms.includes("yellowing of eyes")) score += 12;
  if (selectedSymptoms.includes("dark urine")) score += 10;
  if (duration === "4-7 Days") score += 6;
  if (duration === "More than 1 Week") score += 12;
  if (backendFlags.length > 0) score += 15;

  return Math.min(score, 100);
};

const getSeverityIndicator = (riskScore, backendSeverity = "") => {
  const normalized = normalizeText(backendSeverity);

  if (normalized.includes("higher") || normalized.includes("high")) {
    return {
      label: "Higher Risk",
      color: "text-rose-300",
      bg: "bg-rose-500/10",
      border: "border-rose-400/20",
    };
  }

  if (normalized.includes("moderate")) {
    return {
      label: "Moderate",
      color: "text-amber-300",
      bg: "bg-amber-500/10",
      border: "border-amber-400/20",
    };
  }

  if (normalized.includes("low evidence")) {
    return {
      label: "Low Evidence",
      color: "text-sky-300",
      bg: "bg-sky-500/10",
      border: "border-sky-400/20",
    };
  }

  if (normalized.includes("mild") || normalized.includes("low")) {
    return {
      label: "Mild",
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
      border: "border-emerald-400/20",
    };
  }

  if (riskScore >= 75) {
    return {
      label: "Higher Risk",
      color: "text-rose-300",
      bg: "bg-rose-500/10",
      border: "border-rose-400/20",
    };
  }

  if (riskScore >= 45) {
    return {
      label: "Moderate",
      color: "text-amber-300",
      bg: "bg-amber-500/10",
      border: "border-amber-400/20",
    };
  }

  return {
    label: "Mild",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/20",
  };
};

const getEmergencyGuidance = (
  selectedSymptoms,
  duration,
  riskScore = 0,
  backendFlags = [],
  backendGuidance = ""
) => {
  const normalized = normalizeText(backendGuidance);

  if (normalized.includes("urgent")) {
    return {
      level: "Urgent Attention",
      message:
        "This symptom pattern may need urgent medical evaluation, especially if breathing issues, chest pain, severe weakness, yellowing signs, or major worsening are present.",
      color: "text-rose-300",
      bg: "bg-rose-500/10",
      border: "border-rose-400/20",
    };
  }

  if (normalized.includes("doctor") || normalized.includes("consult")) {
    return {
      level: "Consult a Doctor",
      message:
        "This condition should be monitored closely and a medical consultation is recommended if symptoms persist or increase.",
      color: "text-amber-300",
      bg: "bg-amber-500/10",
      border: "border-amber-400/20",
    };
  }

  if (normalized.includes("add more symptoms")) {
    return {
      level: "Add More Symptoms",
      message:
        "Please select at least 3 symptoms so the model can produce a more reliable ranked result.",
      color: "text-sky-300",
      bg: "bg-sky-500/10",
      border: "border-sky-400/20",
    };
  }

  if (
    selectedSymptoms.includes("breathlessness") ||
    selectedSymptoms.includes("chest pain") ||
    selectedSymptoms.includes("yellowish skin") ||
    selectedSymptoms.includes("yellowing of eyes") ||
    backendFlags.length > 0 ||
    riskScore >= 80
  ) {
    return {
      level: "Urgent Attention",
      message:
        "This symptom pattern may need urgent medical evaluation, especially if breathing issues, chest pain, severe dehydration, jaundice-like signs, or major worsening are present.",
      color: "text-rose-300",
      bg: "bg-rose-500/10",
      border: "border-rose-400/20",
    };
  }

  if (
    duration === "More than 1 Week" ||
    riskScore >= 50 ||
    selectedSymptoms.includes("vomiting") ||
    selectedSymptoms.includes("dizziness") ||
    selectedSymptoms.includes("high fever")
  ) {
    return {
      level: "Consult a Doctor",
      message:
        "This condition should be monitored closely and a medical consultation is recommended if symptoms persist or increase.",
      color: "text-amber-300",
      bg: "bg-amber-500/10",
      border: "border-amber-400/20",
    };
  }

  return {
    level: "Monitor at Home",
    message:
      "Current symptoms may be manageable with observation, hydration, rest, and routine supportive care unless they worsen.",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/20",
  };
};

const getRecoveryPlanner = (selectedSymptoms, duration, backendPlanner = []) => {
  if (Array.isArray(backendPlanner) && backendPlanner.length > 0) {
    return backendPlanner.slice(0, 5);
  }

  const plans = [
    "Day 1: Prioritize rest, hydration, and light meals.",
    "Day 2: Continue fluids and observe whether symptoms reduce or worsen.",
    "Day 3: Resume light routine only if energy and comfort improve.",
  ];

  if (
    selectedSymptoms.includes("high fever") ||
    selectedSymptoms.includes("mild fever") ||
    selectedSymptoms.includes("fatigue") ||
    selectedSymptoms.includes("lethargy") ||
    selectedSymptoms.includes("malaise")
  ) {
    plans.push("Add warm fluids, proper sleep, and avoid overexertion during recovery.");
  }

  if (
    selectedSymptoms.includes("vomiting") ||
    selectedSymptoms.includes("abdominal pain") ||
    selectedSymptoms.includes("nausea") ||
    selectedSymptoms.includes("diarrhoea")
  ) {
    plans.push("Use bland foods, small meals, and slow fluid intake until digestion settles.");
  }

  if (
    selectedSymptoms.includes("joint pain") ||
    selectedSymptoms.includes("muscle pain")
  ) {
    plans.push("Use gentle stretching, light movement, and rest if body pain is limiting activity.");
  }

  if (duration === "More than 1 Week") {
    plans.push("Because symptoms are prolonged, include a medical review in the recovery plan.");
  }

  return [...new Set(plans)].slice(0, 5);
};

const getSeasonalHealthAlerts = (selectedSymptoms, duration, backendAlerts = []) => {
  if (Array.isArray(backendAlerts) && backendAlerts.length > 0) {
    return backendAlerts.slice(0, 4);
  }

  const alerts = [];

  if (
    selectedSymptoms.includes("cough") ||
    selectedSymptoms.includes("phlegm") ||
    selectedSymptoms.includes("breathlessness")
  ) {
    alerts.push("Respiratory illnesses may become more common during seasonal weather changes and infection waves.");
  }

  if (
    selectedSymptoms.includes("high fever") ||
    selectedSymptoms.includes("mild fever") ||
    selectedSymptoms.includes("fatigue") ||
    selectedSymptoms.includes("chills") ||
    selectedSymptoms.includes("joint pain")
  ) {
    alerts.push("Fever with weakness or body pain can overlap with seasonal infection patterns and should be monitored carefully.");
  }

  if (
    selectedSymptoms.includes("abdominal pain") ||
    selectedSymptoms.includes("vomiting") ||
    selectedSymptoms.includes("diarrhoea")
  ) {
    alerts.push("Digestive symptoms can increase during food and water contamination periods.");
  }

  if (
    selectedSymptoms.includes("skin rash") ||
    selectedSymptoms.includes("itching")
  ) {
    alerts.push("Skin-related complaints may increase with heat, humidity, allergies, or seasonal infections.");
  }

  if (duration === "More than 1 Week") {
    alerts.push("Long-lasting symptoms during seasonal outbreaks should not be ignored.");
  }

  if (alerts.length === 0) {
    alerts.push("Stay aware of seasonal illness trends, hydration needs, and hygiene practices.");
  }

  return alerts.slice(0, 4);
};

const sanitizeAgeInput = (value) => {
  if (value === "") return "";
  const digitsOnly = String(value).replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  const numeric = Math.min(Number(digitsOnly), MAX_AGE);
  return String(numeric);
};

export default function SymptomCheckerPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState({});
  const [alphabeticalSymptoms, setAlphabeticalSymptoms] = useState({});
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [symptomLoading, setSymptomLoading] = useState(true);

  const [predictedDisease, setPredictedDisease] = useState(
    `Select at least ${MIN_SYMPTOMS_FOR_ANALYSIS} symptoms to generate a preliminary result.`
  );
  const [topPredictions, setTopPredictions] = useState([]);
  const [matchedSymptoms, setMatchedSymptoms] = useState([]);
  const [confidenceNote, setConfidenceNote] = useState(
    "Confidence details will appear after analysis."
  );
  const [patternMessage, setPatternMessage] = useState(
    "A short summary will appear after symptom review."
  );
  const [statusMessage, setStatusMessage] = useState(
    `Select at least ${MIN_SYMPTOMS_FOR_ANALYSIS} symptoms to generate preliminary guidance.`
  );
  const [homeCareTips, setHomeCareTips] = useState([]);
  const [warningSigns, setWarningSigns] = useState([
    "Urgent warning signs will appear here after analysis.",
  ]);
  const [riskScore, setRiskScore] = useState(0);
  const [severityIndicator, setSeverityIndicator] = useState(defaultSeverity);
  const [emergencyGuidance, setEmergencyGuidance] = useState(defaultEmergencyGuidance);
  const [recoveryPlanner, setRecoveryPlanner] = useState([]);
  const [seasonalAlerts, setSeasonalAlerts] = useState([]);
  const [apiModelSummary, setApiModelSummary] = useState(null);
  const [disclaimerText, setDisclaimerText] = useState(
    "This tool provides preliminary symptom-based guidance only. It is not a medical diagnosis and does not replace a licensed doctor."
  );

  const canAnalyze = useMemo(
    () => selectedSymptoms.length >= MIN_SYMPTOMS_FOR_ANALYSIS,
    [selectedSymptoms]
  );

  const orderedCategoryEntries = useMemo(() => {
    return sortCategoriesWithOtherLast(categories);
  }, [categories]);

  const currentCategorySymptoms = useMemo(() => {
    return categories[activeCategory] || [];
  }, [categories, activeCategory]);

  const alphabeticalList = useMemo(() => {
    return Object.entries(alphabeticalSymptoms).sort(([a], [b]) => a.localeCompare(b));
  }, [alphabeticalSymptoms]);

  const selectedSymptomValues = useMemo(
    () => selectedSymptoms.map((item) => item.value),
    [selectedSymptoms]
  );

  const getCategorySelectedCount = (category) => {
    const categorySymptoms = categories[category] || [];
    if (!categorySymptoms.length) return 0;
    return categorySymptoms.filter((symptom) =>
      selectedSymptomValues.includes(symptom)
    ).length;
  };

  useEffect(() => {
    const loadSymptoms = async () => {
      try {
        setSymptomLoading(true);

        const [categoriesRes, alphabeticalRes, allRes] = await Promise.all([
          fetch(`${API_BASE}/symptoms/categories`),
          fetch(`${API_BASE}/symptoms/alphabetical`),
          fetch(`${API_BASE}/symptoms`),
        ]);

        const categoriesData = await categoriesRes.json();
        const alphabeticalData = await alphabeticalRes.json();
        const allData = await allRes.json();

        const loadedCategories = normalizeCategoryMap(categoriesData?.categories || {});
        const loadedAlphabetical = normalizeAlphabeticalMap(alphabeticalData?.groups || {});
        const loadedSymptoms = normalizeArrayUnique(allData?.symptoms || {});

        setCategories(loadedCategories);
        setAlphabeticalSymptoms(loadedAlphabetical);
        setAllSymptoms(loadedSymptoms);

        const ordered = sortCategoriesWithOtherLast(loadedCategories);
        if (ordered.length > 0) {
          setActiveCategory(ordered[0][0]);
        }
      } catch (error) {
        console.error("Failed to load symptoms", error);
        setFieldError("Could not load symptoms from the backend.");
      } finally {
        setSymptomLoading(false);
      }
    };

    loadSymptoms();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/symptoms/search?q=${encodeURIComponent(searchTerm)}`
        );
        const data = await response.json();

        const normalizedResults = (data?.results || []).map((item) => {
          const value = normalizeText(item.symptom);
          return {
            value,
            label: item.display_name || formatSymptomLabel(value),
          };
        });

        setSearchResults(normalizedResults);
      } catch (error) {
        console.error("Symptom search failed", error);
      }
    };

    const timeout = setTimeout(handleSearch, 250);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const isSymptomSelected = (symptom) => {
    const normalized = normalizeText(symptom);
    return selectedSymptomValues.includes(normalized);
  };

  const toggleSymptom = (symptom, customLabel = null) => {
    setFieldError("");
    const value = normalizeText(symptom);
    const label = customLabel || formatSymptomLabel(value);

    setSelectedSymptoms((prev) => {
      const exists = prev.some((item) => item.value === value);

      if (exists) {
        return prev.filter((item) => item.value !== value);
      }

      return [...prev, { value, label }];
    });
  };

  const resetAnalysisOutput = () => {
    setPredictedDisease(
      `Select at least ${MIN_SYMPTOMS_FOR_ANALYSIS} symptoms to generate a preliminary result.`
    );
    setTopPredictions([]);
    setMatchedSymptoms([]);
    setConfidenceNote("Confidence details will appear after analysis.");
    setPatternMessage("A short summary will appear after symptom review.");
    setStatusMessage(
      `Select at least ${MIN_SYMPTOMS_FOR_ANALYSIS} symptoms to generate preliminary guidance.`
    );
    setHomeCareTips([]);
    setWarningSigns(["Urgent warning signs will appear here after analysis."]);
    setRiskScore(0);
    setSeverityIndicator(defaultSeverity);
    setEmergencyGuidance(defaultEmergencyGuidance);
    setRecoveryPlanner([]);
    setSeasonalAlerts([]);
    setApiModelSummary(null);
  };

  const buildPatternMessage = (responseData, durationValue) => {
    const summary = responseData?.symptom_pattern_summary || {};
    const matchedCount =
      summary?.matched_symptoms_count ?? responseData?.matched_symptoms?.length ?? 0;
    const prediction =
      summary?.top_ranked_condition ||
      responseData?.primary_health_suggestion ||
      "No clear first-ranked condition";
    const triage = summary?.triage_level || "routine";
    const note = summary?.note || "No summary available.";

    return `Matched ${matchedCount} symptoms. Top ranked condition: ${prediction}. Triage level: ${triage}. ${note}${
      durationValue ? ` Duration reported: ${durationValue}.` : ""
    }`;
  };

  const buildConfidenceNote = (responseData, predictionsVisible) => {
    const resultConfidence = responseData?.result_confidence || {};
    const topRankedScore = resultConfidence?.top_ranked_score ?? 0;
    const accuracy = resultConfidence?.validation_accuracy;
    const top3 = resultConfidence?.top3_validation_accuracy;
    const note = resultConfidence?.note || "";

    const lowConfidenceSuffix = predictionsVisible
      ? Number(topRankedScore || 0) < LOW_CONFIDENCE_THRESHOLD
        ? " The model returned a low-confidence shortlist, so use these ranks cautiously."
        : ""
      : "";

    return `Top ranked score: ${topRankedScore}. Model validation accuracy: ${accuracy ?? "NA"}. Top-3 validation accuracy: ${
      top3 ?? "NA"
    }. This is a ranked preliminary suggestion, not a confirmed diagnosis.${note ? ` ${note}` : ""}${lowConfidenceSuffix}`;
  };

  const normalizeBackendPredictions = (items) => {
    return (items || []).map((item, index) => ({
      rank: item?.rank ?? index + 1,
      disease: item?.disease || item?.display_name || "Unknown",
      display_name: item?.disease || item?.display_name || "Unknown",
      raw_label: item?.disease || item?.raw_label || "Unknown",
      confidence_percent:
        typeof item?.confidence_percent === "number"
          ? item.confidence_percent
          : Number(item?.confidence_percent || 0),
      adjusted_score:
        typeof item?.confidence_percent === "number"
          ? item.confidence_percent
          : Number(item?.confidence_percent || 0),
      severity: item?.severity || "mild",
      triage: item?.triage || "routine",
      estimated_duration: item?.estimated_duration || "1-3 days",
      common_symptoms: item?.common_symptoms || [],
      home_care_tips: item?.home_care_tips || [],
      warning_signs: item?.warning_signs || [],
    }));
  };

  const handleAnalyze = async () => {
    setFieldError("");

    if (!fullName.trim()) {
      setFieldError("Please enter the patient name.");
      return;
    }

    if (!age || Number(age) <= 0 || Number(age) > MAX_AGE) {
      setFieldError(`Please enter a valid age between 1 and ${MAX_AGE}.`);
      return;
    }

    if (!gender) {
      setFieldError("Please select a gender.");
      return;
    }

    if (!duration) {
      setFieldError("Please select symptom duration.");
      return;
    }

    const symptomValues = selectedSymptoms.map((item) => item.value);
    const visibleLabels = selectedSymptoms.map((item) => item.label);

    if (!canAnalyze) {
      setFieldError(
        `Please select at least ${MIN_SYMPTOMS_FOR_ANALYSIS} symptoms for analysis.`
      );
      return;
    }

    try {
      setIsAnalyzing(true);
      setStatusMessage("Reviewing symptoms and generating guidance...");

      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: symptomValues,
          full_name: fullName,
          age: Number(age),
          gender,
          duration,
          notes,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFieldError(data?.error || "Analysis failed.");
        setStatusMessage(data?.error || "Analysis could not be completed.");
        return;
      }

      const backendFlags = normalizeArrayUnique(data?.red_flag_symptoms || data?.warning_signs || []);
      const backendPredictions = normalizeBackendPredictions(data?.top_3 || []);
      const backendMatchedRaw = normalizeArrayUnique(data?.matched_symptoms || []);
      const backendMatchedLabels =
        backendMatchedRaw.length > 0
          ? backendMatchedRaw.map((item) => formatSymptomLabel(item))
          : visibleLabels;

      const visiblePredictions = backendPredictions.slice(0, 3);

      const calculatedRiskScore = getRiskScore(
        symptomValues,
        duration,
        visiblePredictions,
        backendFlags,
        data?.ai_health_risk_score
      );

      const calculatedSeverityIndicator = getSeverityIndicator(
        calculatedRiskScore,
        data?.symptom_severity_indicator
      );

      const calculatedEmergencyGuidance = getEmergencyGuidance(
        symptomValues,
        duration,
        calculatedRiskScore,
        backendFlags,
        data?.emergency_guidance_support
      );

      const calculatedHomeCareTips =
        Array.isArray(data?.indian_home_care_tips) && data.indian_home_care_tips.length > 0
          ? data.indian_home_care_tips
          : getHomeCareTips(symptomValues, duration);

      const calculatedWarningSigns =
        Array.isArray(data?.warning_signs) && data.warning_signs.length > 0
          ? data.warning_signs
          : getWarningSigns(symptomValues, duration, backendFlags);

      const calculatedRecoveryPlanner = getRecoveryPlanner(
        symptomValues,
        duration,
        data?.recovery_planner
      );

      const calculatedSeasonalAlerts = getSeasonalHealthAlerts(
        symptomValues,
        duration,
        data?.seasonal_health_alerts
      );

      setPredictedDisease(
        data?.primary_health_suggestion || "No primary suggestion available."
      );
      setTopPredictions(visiblePredictions);
      setMatchedSymptoms(backendMatchedLabels);
      setConfidenceNote(buildConfidenceNote(data, visiblePredictions.length > 0));
      setPatternMessage(buildPatternMessage(data, duration));
      setHomeCareTips(calculatedHomeCareTips);
      setWarningSigns(calculatedWarningSigns);
      setRiskScore(calculatedRiskScore);
      setSeverityIndicator(calculatedSeverityIndicator);
      setEmergencyGuidance(calculatedEmergencyGuidance);
      setRecoveryPlanner(calculatedRecoveryPlanner);
      setSeasonalAlerts(calculatedSeasonalAlerts);
      setApiModelSummary({
        selected_model: data?.model_summary?.selected_model,
        validation_accuracy: data?.model_summary?.validation_accuracy,
        validation_top3_accuracy:
          data?.model_summary?.top3_accuracy ?? data?.model_summary?.validation_top3_accuracy,
        training_rows: data?.model_summary?.training_rows,
      });
      setDisclaimerText(
        data?.important_disclaimer ||
          data?.disclaimer ||
          "This tool provides preliminary symptom-based guidance only. It is not a medical diagnosis and does not replace a licensed doctor."
      );
      setStatusMessage(
        data?.check_status || "Preliminary guidance generated successfully."
      );
    } catch (error) {
      const symptomValues = selectedSymptoms.map((item) => item.value);
      const visibleLabels = selectedSymptoms.map((item) => item.label);
      const fallbackRiskScore = getRiskScore(symptomValues, duration, [], []);
      const fallbackSeverityIndicator = getSeverityIndicator(fallbackRiskScore);
      const fallbackEmergencyGuidance = getEmergencyGuidance(
        symptomValues,
        duration,
        fallbackRiskScore,
        []
      );
      const fallbackHomeCareTips = getHomeCareTips(symptomValues, duration);
      const fallbackWarningSigns = getWarningSigns(symptomValues, duration, []);
      const fallbackRecoveryPlanner = getRecoveryPlanner(symptomValues, duration);
      const fallbackSeasonalAlerts = getSeasonalHealthAlerts(symptomValues, duration);

      setPredictedDisease("Connection issue while generating guidance.");
      setTopPredictions([]);
      setMatchedSymptoms(visibleLabels);
      setConfidenceNote("The backend could not be reached.");
      setPatternMessage("Symptom pattern summary could not be completed.");
      setHomeCareTips(fallbackHomeCareTips);
      setWarningSigns(fallbackWarningSigns);
      setRiskScore(fallbackRiskScore);
      setSeverityIndicator(fallbackSeverityIndicator);
      setEmergencyGuidance(fallbackEmergencyGuidance);
      setRecoveryPlanner(fallbackRecoveryPlanner);
      setSeasonalAlerts(fallbackSeasonalAlerts);
      setStatusMessage("Connection to the Flask API failed.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setFullName("");
    setAge("");
    setGender("");
    setDuration("");
    setNotes("");
    setFieldError("");
    setIsAnalyzing(false);
    setSearchTerm("");
    setSearchResults([]);
    resetAnalysisOutput();
    setDisclaimerText(
      "This tool provides preliminary symptom-based guidance only. It is not a medical diagnosis and does not replace a licensed doctor."
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-sm font-medium text-cyan-300">
            Symptom Review • Care Guidance
          </p>
          <h1 className="text-4xl font-bold md:text-5xl">Symptom Checker</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Enter patient details, search or browse symptoms by category, and review
            preliminary health guidance, ranked disease suggestions, risk scoring,
            severity indication, recovery support, home care tips, warning signs,
            and seasonal health alerts.
          </p>
        </div>

        <section className="mb-10">
          <div className="mb-6 max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-1 text-sm font-medium uppercase tracking-[0.25em] text-blue-300">
              Feature Modules
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Core modules available in the platform
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              These modules focus on symptom analysis, preventive support, health
              awareness, and basic next-step guidance based on the current project build.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featureModules.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg shadow-cyan-950/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl">
                  <span>{feature.icon}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">Patient Details</h2>
            <p className="mt-3 text-sm text-slate-400">
              Fill in the basic details and choose at least {MIN_SYMPTOMS_FOR_ANALYSIS} symptoms to generate
              preliminary guidance.
            </p>

            {fieldError && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
              >
                {fieldError}
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max={MAX_AGE}
                  value={age}
                  onChange={(e) => setAge(sanitizeAgeInput(e.target.value))}
                  placeholder={`Enter age (1-${MAX_AGE})`}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Age must be between 1 and {MAX_AGE}.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Symptom Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">Select duration</option>
                  <option value="1 Day">1 Day</option>
                  <option value="2-3 Days">2-3 Days</option>
                  <option value="4-7 Days">4-7 Days</option>
                  <option value="More than 1 Week">More than 1 Week</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white">Search Symptoms</h3>
              <p className="mt-2 text-sm text-slate-400">
                Search symptoms by typing a keyword, then add matching results.
              </p>

              <div className="mt-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search fatigue, vomiting, high fever, nausea, headache..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
              </div>

              {searchTerm.trim().length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="mb-3 text-sm text-slate-400">Search results</p>
                  <div className="flex flex-wrap gap-3">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => {
                        const isSelected = isSymptomSelected(item.value);

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => toggleSymptom(item.value, item.label)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                                : "border-white/10 bg-slate-800 text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-400">No matching symptoms found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white">Popular Symptoms</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {popularSymptoms.map((symptom) => {
                  const normalized = normalizeText(symptom);
                  const label = formatSymptomLabel(normalized);
                  const isSelected = isSymptomSelected(normalized);

                  return (
                    <button
                      key={normalized}
                      type="button"
                      onClick={() => toggleSymptom(normalized, label)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                          : "border-white/10 bg-slate-900/70 text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white">Browse by Category</h3>
              <p className="mt-2 text-sm text-slate-400">
                Symptoms are grouped to make selection faster and more organized.
              </p>

              {symptomLoading ? (
                <p className="mt-4 text-sm text-slate-400">Loading symptoms...</p>
              ) : (
                <>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {orderedCategoryEntries.map(([category]) => {
                      const selectedCount = getCategorySelectedCount(category);
                      const isActiveCategory = activeCategory === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setActiveCategory(category)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                            isActiveCategory
                              ? "border-white/20 bg-slate-800 text-white"
                              : "border-white/10 bg-slate-900/70 text-slate-200 hover:border-white/20 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <span>{category}</span>
                          {selectedCount > 0 && (
                            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                              {selectedCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-400">
                        {activeCategory} symptoms ({currentCategorySymptoms.length})
                      </p>

                      {getCategorySelectedCount(activeCategory) > 0 && (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          {getCategorySelectedCount(activeCategory)} selected in this category
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {currentCategorySymptoms.map((symptom) => {
                        const normalized = normalizeText(symptom);
                        const label = formatSymptomLabel(normalized);
                        const isSelected = isSymptomSelected(normalized);

                        return (
                          <button
                            key={`${activeCategory}-${normalized}`}
                            type="button"
                            onClick={() => toggleSymptom(normalized, label)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                                : "border-white/10 bg-slate-800 text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white">A-Z Symptom List</h3>
              <p className="mt-2 text-sm text-slate-400">
                Backup browse mode for complete symptom coverage.
              </p>

              <div className="mt-5 max-h-[340px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="space-y-6">
                  {alphabeticalList.map(([letter, items]) => (
                    <div key={letter}>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                        {letter}
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {items.map((symptom) => {
                          const normalized = normalizeText(symptom);
                          const label = formatSymptomLabel(normalized);
                          const isSelected = isSymptomSelected(normalized);

                          return (
                            <button
                              key={`${letter}-${normalized}`}
                              type="button"
                              onClick={() => toggleSymptom(normalized, label)}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                isSelected
                                  ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                                  : "border-white/10 bg-slate-800 text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white">Selected Symptoms</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {selectedSymptoms.length > 0 ? (
                  selectedSymptoms.map((symptom) => (
                    <button
                      key={symptom.value}
                      type="button"
                      onClick={() => toggleSymptom(symptom.value, symptom.label)}
                      className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20"
                    >
                      {symptom.label}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No symptoms selected yet.</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-400">
                  Selected symptoms:{" "}
                  <span className="font-semibold text-cyan-300">
                    {selectedSymptoms.length}
                  </span>
                </p>

                {!canAnalyze && (
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                    Select at least {MIN_SYMPTOMS_FOR_ANALYSIS} symptoms to enable guidance
                  </span>
                )}

                <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                  Total backend symptoms: {allSymptoms.length}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Additional Notes
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional observations..."
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`rounded-xl px-6 py-3 font-semibold transition ${
                  isAnalyzing
                    ? "cursor-not-allowed bg-slate-700 text-slate-400"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                }`}
              >
                {isAnalyzing ? "Generating Guidance..." : "Analyze Symptoms"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/5"
              >
                Reset Form
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Top 3 Likely Diseases</h2>
              <p className="mt-2 text-sm text-slate-400">
                Preliminary shortlist from the symptom-based disease prediction model
              </p>

              <div className="mt-5 space-y-4">
                {topPredictions.length > 0 ? (
                  topPredictions.map((item, index) => (
                    <div
                      key={`${item.raw_label || item.display_name || item.disease}-${index}`}
                      className="rounded-2xl bg-slate-900/60 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-400">Rank {item.rank || index + 1}</p>
                        <p className="text-cyan-300">{item.confidence_percent}%</p>
                      </div>
                      <p className="font-semibold text-white">
                        {item.display_name || item.raw_label || item.disease}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Severity: {item.severity ?? "NA"} | Triage: {item.triage ?? "NA"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Estimated duration: {item.estimated_duration ?? "NA"}
                      </p>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-cyan-400"
                          style={{
                            width: `${Math.min(item.confidence_percent || 0, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Ranked disease suggestions will appear after successful analysis.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">AI Health Risk Score</h2>
              <div className="mt-5 rounded-2xl bg-cyan-500/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-cyan-300">Preliminary risk estimate</p>
                  <p className="text-3xl font-bold text-white">{riskScore}</p>
                </div>
                <div className="mt-4 h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Symptom Severity Indicator</h2>
              <div
                className={`mt-5 rounded-2xl border p-5 ${severityIndicator.bg} ${severityIndicator.border}`}
              >
                <p className="text-sm text-slate-300">Current severity level</p>
                <p className={`mt-2 text-2xl font-bold ${severityIndicator.color}`}>
                  {severityIndicator.label}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Emergency Guidance Support</h2>
              <div
                className={`mt-5 rounded-2xl border p-5 ${emergencyGuidance.bg} ${emergencyGuidance.border}`}
              >
                <p className={`text-lg font-semibold ${emergencyGuidance.color}`}>
                  {emergencyGuidance.level}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {emergencyGuidance.message}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Primary Health Suggestion</h2>
              <div className="mt-5 rounded-2xl bg-cyan-500/10 p-5">
                <p className="text-sm text-cyan-300">Most likely first-ranked result</p>
                <p className="mt-2 text-3xl font-bold text-white">{predictedDisease}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Reported Symptom Pattern</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {matchedSymptoms.length > 0 ? (
                  matchedSymptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300"
                    >
                      {symptom}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Selected symptoms will appear here after analysis.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Result Confidence</h2>
              <div className="mt-5 rounded-2xl bg-amber-500/10 p-5">
                <p className="text-sm leading-7 text-slate-200">{confidenceNote}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Symptom Pattern Summary</h2>
              <div className="mt-5 rounded-2xl bg-fuchsia-500/10 p-5">
                <p className="text-sm leading-7 text-slate-200">{patternMessage}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Recovery Planner</h2>
              <div className="mt-5 space-y-3">
                {recoveryPlanner.length > 0 ? (
                  recoveryPlanner.map((plan, index) => (
                    <div
                      key={`${plan}-${index}`}
                      className="rounded-2xl border border-sky-400/10 bg-sky-400/10 p-4"
                    >
                      <p className="text-sm leading-7 text-slate-100">{plan}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Recovery planning suggestions will appear here after analysis.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Indian Home Care Tips</h2>
              <div className="mt-5 space-y-3">
                {homeCareTips.length > 0 ? (
                  homeCareTips.map((tip, index) => (
                    <div
                      key={`${tip}-${index}`}
                      className="rounded-2xl border border-emerald-400/10 bg-emerald-400/10 p-4"
                    >
                      <p className="text-sm leading-7 text-slate-100">{tip}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Supportive home care guidance will appear here after analysis.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Seasonal Health Alerts</h2>
              <div className="mt-5 space-y-3">
                {seasonalAlerts.length > 0 ? (
                  seasonalAlerts.map((alert, index) => (
                    <div
                      key={`${alert}-${index}`}
                      className="rounded-2xl border border-violet-400/10 bg-violet-400/10 p-4"
                    >
                      <p className="text-sm leading-7 text-slate-100">{alert}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Seasonal health alerts will appear here after analysis.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Warning Signs</h2>
              <div className="mt-5 space-y-3">
                {warningSigns.map((warning, index) => (
                  <div
                    key={`${warning}-${index}`}
                    className="rounded-2xl border border-rose-400/10 bg-rose-400/10 p-4"
                  >
                    <p className="text-sm leading-7 text-slate-100">{warning}</p>
                  </div>
                ))}
              </div>
            </div>

            {apiModelSummary && (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold text-white">Model Summary</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Selected model</p>
                    <p className="mt-2 font-semibold text-white">
                      {apiModelSummary.selected_model ?? "NA"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Validation accuracy</p>
                    <p className="mt-2 font-semibold text-white">
                      {apiModelSummary.validation_accuracy ?? "NA"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Top-3 accuracy</p>
                    <p className="mt-2 font-semibold text-white">
                      {apiModelSummary.validation_top3_accuracy ?? "NA"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Training rows</p>
                    <p className="mt-2 font-semibold text-white">
                      {apiModelSummary.training_rows ?? "NA"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Check Status</h2>
              <div className="mt-5 rounded-2xl bg-slate-900/60 p-5">
                <p className="text-sm leading-7 text-slate-200">{statusMessage}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Important Disclaimer</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {disclaimerText ||
                  "If symptoms are severe, worsening, or urgent, seek medical help immediately."}
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}