import { useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const symptoms = [
  'Fever',
  'Cough',
  'Fatigue',
  'Headache',
  'Body Pain',
  'Vomiting',
  'Sore Throat',
  'Breathing Difficulty',
  'Dizziness',
  'Stomach Pain',
  'Cold',
  'Joint Pain',
]

const featureModules = [
  {
    title: 'AI Health Risk Score',
    description:
      'Provides a preliminary risk score using symptom selection, severity signals, and duration-related inputs.',
    icon: '🧠',
  },
  {
    title: 'Symptom Severity Indicator',
    description:
      'Helps users understand whether the reported condition may appear mild, moderate, or higher-risk.',
    icon: '💙',
  },
  {
    title: 'Emergency Guidance Support',
    description:
      'Supports decision-making on whether symptoms can be monitored, require consultation, or need urgent attention.',
    icon: '🛡️',
  },
  {
    title: 'Recovery Planner',
    description:
      'Offers a day-wise recovery support plan with simple guidance for rest, hydration, food, and routine care.',
    icon: '📅',
  },
  {
    title: 'Indian Home Care Tips',
    description:
      'Shares supportive household wellness suggestions commonly followed in India with appropriate disclaimers.',
    icon: '🍃',
  },
  {
    title: 'Seasonal Health Alerts',
    description:
      'Highlights common seasonal health risks in India through a simple awareness-based model.',
    icon: '🌡️',
  },
]

const getHomeCareTips = (selectedSymptoms = [], duration = '') => {
  const tips = []

  if (
    selectedSymptoms.includes('Fever') ||
    selectedSymptoms.includes('Body Pain') ||
    selectedSymptoms.includes('Fatigue')
  ) {
    tips.push('Take adequate rest and avoid overexertion.')
    tips.push('Drink enough water, soups, or oral fluids to stay hydrated.')
  }

  if (
    selectedSymptoms.includes('Cough') ||
    selectedSymptoms.includes('Sore Throat') ||
    selectedSymptoms.includes('Cold')
  ) {
    tips.push('Use warm fluids such as warm water or soup for throat comfort.')
    tips.push('Avoid very cold drinks, smoke exposure, and dust irritation.')
  }

  if (
    selectedSymptoms.includes('Vomiting') ||
    selectedSymptoms.includes('Stomach Pain')
  ) {
    tips.push('Eat light food in small portions and avoid oily or spicy meals.')
    tips.push('Sip fluids slowly to reduce dehydration risk.')
  }

  if (
    selectedSymptoms.includes('Headache') ||
    selectedSymptoms.includes('Dizziness')
  ) {
    tips.push('Rest in a calm, quiet place and avoid prolonged screen exposure.')
  }

  if (duration === 'More than 1 Week') {
    tips.push(
      'Because symptoms have lasted more than a week, medical consultation is recommended.'
    )
  }

  if (tips.length === 0) {
    tips.push('Monitor symptoms, stay hydrated, eat light meals, and get proper rest.')
  }

  return [...new Set(tips)].slice(0, 5)
}

const getWarningSigns = (selectedSymptoms = [], duration = '') => {
  const warnings = []

  if (selectedSymptoms.includes('Breathing Difficulty')) {
    warnings.push(
      'Seek urgent medical care for breathing difficulty or worsening shortness of breath.'
    )
  }

  if (selectedSymptoms.includes('Vomiting') && duration !== '1 Day') {
    warnings.push(
      'Persistent vomiting may require medical attention, especially if fluids cannot be retained.'
    )
  }

  if (selectedSymptoms.includes('Dizziness')) {
    warnings.push(
      'Seek prompt care if dizziness becomes severe, recurrent, or associated with fainting.'
    )
  }

  if (selectedSymptoms.includes('Fever') && duration === 'More than 1 Week') {
    warnings.push('Persistent fever for more than a week should be medically evaluated.')
  }

  if (warnings.length === 0) {
    warnings.push('Seek medical care if symptoms worsen, become severe, or do not improve.')
  }

  return warnings.slice(0, 4)
}

const getRiskScore = (selectedSymptoms = [], duration = '') => {
  let score = 18 + selectedSymptoms.length * 9

  if (selectedSymptoms.includes('Breathing Difficulty')) score += 22
  if (selectedSymptoms.includes('Vomiting')) score += 10
  if (selectedSymptoms.includes('Dizziness')) score += 8
  if (duration === '4-7 Days') score += 8
  if (duration === 'More than 1 Week') score += 15

  return Math.min(score, 100)
}

const getSeverityIndicator = (riskScore) => {
  if (riskScore >= 75) {
    return {
      label: 'Higher Risk',
      color: 'text-rose-300',
      bg: 'bg-rose-500/10',
      border: 'border-rose-400/20',
    }
  }

  if (riskScore >= 45) {
    return {
      label: 'Moderate',
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-400/20',
    }
  }

  return {
    label: 'Mild',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
  }
}

const getEmergencyGuidance = (selectedSymptoms = [], duration = '', riskScore = 0) => {
  if (
    selectedSymptoms.includes('Breathing Difficulty') ||
    riskScore >= 80
  ) {
    return {
      level: 'Urgent Attention',
      message:
        'This symptom pattern may need urgent medical evaluation, especially if breathing issues or major worsening are present.',
      color: 'text-rose-300',
      bg: 'bg-rose-500/10',
      border: 'border-rose-400/20',
    }
  }

  if (
    duration === 'More than 1 Week' ||
    riskScore >= 50 ||
    selectedSymptoms.includes('Vomiting') ||
    selectedSymptoms.includes('Dizziness')
  ) {
    return {
      level: 'Consult a Doctor',
      message:
        'This condition should be monitored closely and a medical consultation is recommended if symptoms persist or increase.',
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-400/20',
    }
  }

  return {
    level: 'Monitor at Home',
    message:
      'Current symptoms may be manageable with observation, hydration, rest, and routine supportive care unless they worsen.',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
  }
}

const getRecoveryPlanner = (selectedSymptoms = [], duration = '') => {
  const plans = [
    'Day 1: Prioritize rest, hydration, and light meals.',
    'Day 2: Continue fluids and observe whether symptoms reduce or worsen.',
    'Day 3: Resume light routine only if energy and comfort improve.',
  ]

  if (
    selectedSymptoms.includes('Fever') ||
    selectedSymptoms.includes('Fatigue') ||
    selectedSymptoms.includes('Body Pain')
  ) {
    plans.push('Add warm fluids, proper sleep, and avoid overexertion during recovery.')
  }

  if (
    selectedSymptoms.includes('Vomiting') ||
    selectedSymptoms.includes('Stomach Pain')
  ) {
    plans.push('Use bland foods, small meals, and slow fluid intake until digestion settles.')
  }

  if (duration === 'More than 1 Week') {
    plans.push('Because symptoms are prolonged, include a medical review in the recovery plan.')
  }

  return plans.slice(0, 5)
}

const getSeasonalHealthAlerts = (selectedSymptoms = [], duration = '') => {
  const alerts = []

  if (
    selectedSymptoms.includes('Cold') ||
    selectedSymptoms.includes('Cough') ||
    selectedSymptoms.includes('Sore Throat')
  ) {
    alerts.push('Seasonal viral and throat-related illnesses may be more common during weather changes.')
  }

  if (
    selectedSymptoms.includes('Fever') ||
    selectedSymptoms.includes('Body Pain') ||
    selectedSymptoms.includes('Fatigue')
  ) {
    alerts.push('Fever with body pain can overlap with seasonal infection patterns and should be monitored carefully.')
  }

  if (
    selectedSymptoms.includes('Stomach Pain') ||
    selectedSymptoms.includes('Vomiting')
  ) {
    alerts.push('Digestive symptoms can increase during food and water contamination periods.')
  }

  if (duration === 'More than 1 Week') {
    alerts.push('Long-lasting symptoms during seasonal outbreaks should not be ignored.')
  }

  if (alerts.length === 0) {
    alerts.push('Stay aware of seasonal illness trends, hydration needs, and hygiene practices.')
  }

  return alerts.slice(0, 4)
}

export default function SymptomCheckerPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [predictedDisease, setPredictedDisease] = useState(
    'Select symptoms to generate a preliminary result'
  )
  const [topPredictions, setTopPredictions] = useState([])
  const [matchedSymptoms, setMatchedSymptoms] = useState([])
  const [confidenceNote, setConfidenceNote] = useState(
    'Confidence details will appear after analysis.'
  )
  const [patternMessage, setPatternMessage] = useState(
    'A short summary will appear after symptom review.'
  )
  const [statusMessage, setStatusMessage] = useState(
    'Select at least 3 symptoms to generate preliminary guidance.'
  )
  const [homeCareTips, setHomeCareTips] = useState([])
  const [warningSigns, setWarningSigns] = useState([
    'Urgent warning signs will appear here after analysis.',
  ])
  const [riskScore, setRiskScore] = useState(0)
  const [severityIndicator, setSeverityIndicator] = useState({
    label: 'Not available yet',
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-white/10',
  })
  const [emergencyGuidance, setEmergencyGuidance] = useState({
    level: 'Not available yet',
    message: 'Emergency guidance will appear after analysis.',
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-white/10',
  })
  const [recoveryPlanner, setRecoveryPlanner] = useState([])
  const [seasonalAlerts, setSeasonalAlerts] = useState([])

  const canAnalyze = useMemo(() => selectedSymptoms.length >= 3, [selectedSymptoms])

  const toggleSymptom = (symptom) => {
    setFieldError('')

    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((item) => item !== symptom)
        : [...prev, symptom]
    )
  }

  const handleAnalyze = async () => {
    setFieldError('')

    if (!canAnalyze) {
      setFieldError('Please select at least 3 symptoms for analysis.')
      setStatusMessage('Too few symptoms selected for preliminary guidance.')
      return
    }

    if (!fullName.trim()) {
      setFieldError('Please enter the patient name.')
      return
    }

    if (!age || Number(age) <= 0) {
      setFieldError('Please enter a valid age.')
      return
    }

    if (!gender) {
      setFieldError('Please select a gender.')
      return
    }

    if (!duration) {
      setFieldError('Please select symptom duration.')
      return
    }

    try {
      setIsAnalyzing(true)
      setStatusMessage('Reviewing symptoms and generating guidance...')

      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          full_name: fullName,
          age,
          gender,
          duration,
          notes,
        }),
      })

      const data = await response.json()

      const fallbackHomeCareTips = getHomeCareTips(selectedSymptoms, duration)
      const fallbackWarningSigns = getWarningSigns(selectedSymptoms, duration)
      const fallbackRiskScore = getRiskScore(selectedSymptoms, duration)
      const fallbackSeverityIndicator = getSeverityIndicator(fallbackRiskScore)
      const fallbackEmergencyGuidance = getEmergencyGuidance(
        selectedSymptoms,
        duration,
        fallbackRiskScore
      )
      const fallbackRecoveryPlanner = getRecoveryPlanner(selectedSymptoms, duration)
      const fallbackSeasonalAlerts = getSeasonalHealthAlerts(
        selectedSymptoms,
        duration
      )

      if (!response.ok) {
        setPredictedDisease(
          data.predicted_disease || 'Preliminary guidance could not be generated'
        )
        setTopPredictions(data.top_3_predictions || [])
        setMatchedSymptoms(data.matched_symptoms || data.selected_symptoms || [])
        setConfidenceNote(
          data.confidence_note || 'Confidence details are not available for this result.'
        )
        setPatternMessage(
          data.pattern_message || 'No symptom pattern summary is available.'
        )
        setHomeCareTips(data.home_care_tips || fallbackHomeCareTips)
        setWarningSigns(data.warning_signs || fallbackWarningSigns)
        setRiskScore(data.risk_score || fallbackRiskScore)
        setSeverityIndicator(
          data.severity_indicator || fallbackSeverityIndicator
        )
        setEmergencyGuidance(
          data.emergency_guidance || fallbackEmergencyGuidance
        )
        setRecoveryPlanner(data.recovery_planner || fallbackRecoveryPlanner)
        setSeasonalAlerts(data.seasonal_health_alerts || fallbackSeasonalAlerts)
        setStatusMessage(
          data.status_message || data.error || 'Analysis could not be completed.'
        )
        setFieldError(data.error || '')
        return
      }

      setPredictedDisease(data.predicted_disease || 'No primary suggestion available')
      setTopPredictions(data.top_3_predictions || [])
      setMatchedSymptoms(data.matched_symptoms || data.selected_symptoms || [])
      setConfidenceNote(
        data.confidence_note || 'Confidence details are not available for this result.'
      )
      setPatternMessage(
        data.pattern_message || 'No symptom pattern summary is available.'
      )
      setHomeCareTips(data.home_care_tips || fallbackHomeCareTips)
      setWarningSigns(data.warning_signs || fallbackWarningSigns)
      setRiskScore(data.risk_score || fallbackRiskScore)
      setSeverityIndicator(data.severity_indicator || fallbackSeverityIndicator)
      setEmergencyGuidance(data.emergency_guidance || fallbackEmergencyGuidance)
      setRecoveryPlanner(data.recovery_planner || fallbackRecoveryPlanner)
      setSeasonalAlerts(data.seasonal_health_alerts || fallbackSeasonalAlerts)

      if ((data.top_3_predictions || []).length > 0) {
        setStatusMessage(
          data.status_message || 'Preliminary guidance generated successfully.'
        )
      } else {
        setStatusMessage(
          data.status_message ||
            'Guidance generated, but no ranked shortlist was available.'
        )
      }
    } catch (error) {
      const fallbackHomeCareTips = getHomeCareTips(selectedSymptoms, duration)
      const fallbackWarningSigns = getWarningSigns(selectedSymptoms, duration)
      const fallbackRiskScore = getRiskScore(selectedSymptoms, duration)
      const fallbackSeverityIndicator = getSeverityIndicator(fallbackRiskScore)
      const fallbackEmergencyGuidance = getEmergencyGuidance(
        selectedSymptoms,
        duration,
        fallbackRiskScore
      )
      const fallbackRecoveryPlanner = getRecoveryPlanner(selectedSymptoms, duration)
      const fallbackSeasonalAlerts = getSeasonalHealthAlerts(
        selectedSymptoms,
        duration
      )

      setPredictedDisease('Connection issue while generating guidance')
      setTopPredictions([])
      setMatchedSymptoms([])
      setConfidenceNote('The backend could not be reached.')
      setPatternMessage('Symptom pattern summary could not be completed.')
      setHomeCareTips(fallbackHomeCareTips)
      setWarningSigns(fallbackWarningSigns)
      setRiskScore(fallbackRiskScore)
      setSeverityIndicator(fallbackSeverityIndicator)
      setEmergencyGuidance(fallbackEmergencyGuidance)
      setRecoveryPlanner(fallbackRecoveryPlanner)
      setSeasonalAlerts(fallbackSeasonalAlerts)
      setStatusMessage('Connection to the Flask API failed.')
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setSelectedSymptoms([])
    setFullName('')
    setAge('')
    setGender('')
    setDuration('')
    setNotes('')
    setFieldError('')
    setIsAnalyzing(false)
    setPredictedDisease('Select symptoms to generate a preliminary result')
    setTopPredictions([])
    setMatchedSymptoms([])
    setConfidenceNote('Confidence details will appear after analysis.')
    setPatternMessage('A short summary will appear after symptom review.')
    setStatusMessage('Select at least 3 symptoms to generate preliminary guidance.')
    setHomeCareTips([])
    setWarningSigns(['Urgent warning signs will appear here after analysis.'])
    setRiskScore(0)
    setSeverityIndicator({
      label: 'Not available yet',
      color: 'text-slate-300',
      bg: 'bg-slate-500/10',
      border: 'border-white/10',
    })
    setEmergencyGuidance({
      level: 'Not available yet',
      message: 'Emergency guidance will appear after analysis.',
      color: 'text-slate-300',
      bg: 'bg-slate-500/10',
      border: 'border-white/10',
    })
    setRecoveryPlanner([])
    setSeasonalAlerts([])
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-sm font-medium text-cyan-300">
            Symptom Review & Care Guidance
          </p>
          <h1 className="text-4xl font-bold md:text-5xl">Symptom Checker</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Enter patient details, select symptoms, and review preliminary health
            guidance, likely matches, risk scoring, severity indication, recovery
            support, home care tips, warning signs, and seasonal health alerts.
          </p>
        </div>

        <section className="mb-10">
          <div className="mb-6 max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-1 text-sm font-medium tracking-[0.25em] text-blue-300 uppercase">
              Feature Modules
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Core modules available in the platform
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              These modules focus on symptom analysis, preventive support, health
              awareness, and basic next-step guidance based on the current project
              build.
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
                <h3 className="mt-6 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
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
              Fill in the basic details and choose at least 3 symptoms to generate preliminary guidance.
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
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter age"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
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
              <h3 className="text-xl font-semibold text-white">Select Symptoms</h3>
              <p className="mt-2 text-sm text-slate-400">
                Choose symptoms currently observed by the patient.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {symptoms.map((symptom) => {
                  const isSelected = selectedSymptoms.includes(symptom)

                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                          : 'border-white/10 bg-slate-900/70 text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300'
                      }`}
                    >
                      {symptom}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-400">
                  Selected symptoms:{' '}
                  <span className="font-semibold text-cyan-300">
                    {selectedSymptoms.length}
                  </span>
                </p>

                {!canAnalyze && (
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                    Select at least 3 symptoms to enable guidance
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Additional Notes
              </label>
              <textarea
                rows="4"
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
                disabled={!canAnalyze || isAnalyzing}
                className={`rounded-xl px-6 py-3 font-semibold transition ${
                  !canAnalyze || isAnalyzing
                    ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {isAnalyzing ? 'Generating Guidance...' : 'Analyze Symptoms'}
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
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">AI Health Risk Score</h2>
              <div className="mt-5 rounded-2xl bg-cyan-500/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-cyan-300">Preliminary risk estimate</p>
                  <p className="text-3xl font-bold text-white">{riskScore}%</p>
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
                <p className="text-sm text-cyan-300">Initial symptom-based guidance</p>
                <p className="mt-2 text-3xl font-bold text-white">{predictedDisease}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Most Relevant Possibilities</h2>
              <div className="mt-5 space-y-4">
                {topPredictions.length > 0 ? (
                  topPredictions.map((item, index) => (
                    <div
                      key={`${item.disease}-${index}`}
                      className="rounded-2xl bg-slate-900/60 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-white">{item.disease}</p>
                        <p className="text-cyan-300">{item.confidence}%</p>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-cyan-400"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Complete symptom selection to view the most relevant matches.
                  </p>
                )}
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
                      {symptom.replace(/_/g, ' ')}
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

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Check Status</h2>
              <div className="mt-5 rounded-2xl bg-slate-900/60 p-5">
                <p className="text-sm leading-7 text-slate-200">{statusMessage}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Important Disclaimer</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                This tool provides preliminary symptom-based guidance only. It is not a
                medical diagnosis and does not replace a licensed doctor, clinical evaluation,
                or emergency care. If symptoms are severe, worsening, or urgent, seek medical
                help immediately.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}