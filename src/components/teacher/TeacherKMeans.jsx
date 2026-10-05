import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TeacherWorkspaceLayout from './TeacherWorkspaceLayout.jsx'
import TeacherDatasetSelector from './TeacherDatasetSelector.jsx'
import TeacherPlaybackControls from './TeacherPlaybackControls.jsx'
import TeacherExplanationPanel from './TeacherExplanationPanel.jsx'
import TeacherCodeEditor from './TeacherCodeEditor.jsx'
import TeacherConceptWhiteboard from './TeacherConceptWhiteboard.jsx'
import { explainKMeansPoint, explainKMeansTwoPoints, explainKMeansCentroid } from './teacherConceptExplainer.jsx'
import { KM_CODE, KM_CODE_MAPPINGS } from './teacherAlgorithmCode.js'
import './TeacherKMeans.css'

const CLUSTER_COLORS = [
  { name: 'Blue', hex: '#2F5D8A', bg: '#E4ECF3' },
  { name: 'Rust', hex: '#A6462D', bg: '#F3E4DF' },
  { name: 'Green', hex: '#3F7D53', bg: '#E4F0E8' },
  { name: 'Purple', hex: '#7C3AED', bg: '#EDE9FE' },
  { name: 'Amber', hex: '#D97706', bg: '#FEF3C7' },
]

const UNASSIGNED_COLOR = { hex: '#726C5D', bg: '#EAE6D8' }

// Sample Presets
const SAMPLE_PRESETS = [
  {
    id: 'twoBlobs',
    name: 'Two Separated Clusters (16 pts)',
    defaultK: 2,
    col1: 'Feature X₁',
    col2: 'Feature X₂',
    points: [
      [2, 2], [3, 2], [2, 3], [3, 3], [1.5, 2.5], [2.5, 1.5], [3.5, 2.8], [2, 3.6],
      [7, 7], [8, 7], [7, 8], [8, 8], [6.5, 7.5], [7.5, 6.2], [8.3, 7.6], [7, 6.3],
    ],
  },
  {
    id: 'threeBlobs',
    name: 'Three Natural Groups (21 pts)',
    defaultK: 3,
    col1: 'Income ($k)',
    col2: 'Spend Score',
    points: [
      [1.8, 2.2], [2.6, 1.8], [2.2, 3.0], [3.1, 2.5], [1.5, 2.8], [2.8, 3.2], [3.2, 1.7],
      [7.8, 2.5], [8.5, 1.9], [8.2, 3.1], [7.3, 2.0], [8.9, 2.7], [7.5, 3.2], [8.4, 3.6],
      [5.0, 7.8], [5.8, 8.2], [4.6, 7.2], [5.5, 7.0], [6.2, 7.5], [4.8, 8.5], [5.7, 8.8],
    ],
  },
  {
    id: 'fourBlobs',
    name: 'Four Quadrants (24 pts)',
    defaultK: 4,
    col1: 'Feature A',
    col2: 'Feature B',
    points: [
      [2, 2.5], [2.8, 1.8], [1.8, 3.2], [3.2, 2.8], [2.2, 1.9], [2.9, 3.4],
      [7.5, 2.2], [8.2, 1.8], [7.1, 3.0], [8.5, 2.8], [7.9, 3.3], [8.7, 2.1],
      [2.2, 7.5], [3.0, 8.1], [1.9, 8.3], [2.8, 7.0], [1.7, 7.2], [3.3, 7.8],
      [7.8, 7.5], [8.5, 8.2], [7.2, 8.0], [8.8, 7.3], [8.0, 8.6], [7.3, 7.1],
    ],
  },
]

function dist(p1, p2) {
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1])
}

function getInitialCentroids(points, k, strategy, bounds) {
  if (!points || points.length === 0) return []
  if (strategy === 'poor') {
    const base = points[0]
    const spanX = bounds.xMax - bounds.xMin || 10
    const spanY = bounds.yMax - bounds.yMin || 10
    return Array.from({ length: k }, (_, i) => [
      Number((base[0] + i * spanX * 0.05).toFixed(2)),
      Number((base[1] + i * spanY * 0.05).toFixed(2)),
    ])
  }
  // Smart spread (K-Means++)
  const centroids = [points[0].slice()]
  while (centroids.length < k) {
    let bestPt = points[0]
    let maxDist = -1
    for (const p of points) {
      let minDist = Infinity
      for (const c of centroids) {
        const d = dist(p, c)
        if (d < minDist) minDist = d
      }
      if (minDist > maxDist) {
        maxDist = minDist
        bestPt = p
      }
    }
    centroids.push(bestPt.slice())
  }
  return centroids
}

const KM_STEPS = [
  {
    key: 'dataset',
    title: 'Unclustered Points',
    short: 'Unlabelled feature space',
    what: 'We observe unlabelled 2D data points. There are no predefined classes or ground-truth targets.',
    why: 'Unsupervised learning discovers natural grouping patterns solely based on spatial distance.',
    talkingPoint: 'Ask the class: Without knowing any labels, how many distinct groups do you see?',
  },
  {
    key: 'choose_k',
    title: 'Select K',
    short: 'Setting number of cluster prototypes',
    what: 'The practitioner chooses K upfront. K determines how many centroids will be spawned in the space.',
    why: 'K-Means cannot automatically guess the true number of clusters.',
    talkingPoint: 'Try changing K from 2 to 3 to 4. What happens when K does not match natural groups?',
  },
  {
    key: 'init_centroids',
    title: 'Initialise Centroids',
    short: 'Placing initial centroid markers',
    what: 'K centroid prototypes are placed in the feature space as initial cluster representatives.',
    why: 'Starting positions matter! A poor start can slow convergence or trap the model in a local minimum.',
    talkingPoint: 'Compare "Spread Out (K-Means++)" vs "Deliberate Poor Start" to see sensitivity to starting positions.',
  },
  {
    key: 'assignment',
    title: 'Assignment Step',
    short: 'Assign each point to nearest centroid',
    what: 'We compute the Euclidean distance from every point to all K centroids. Each point joins its closest centroid.',
    why: 'This partitions the entire feature space into Voronoi cells based on similarity.',
    talkingPoint: 'Even a point that is only 0.01 units closer to Blue than Rust will join Blue 100%.',
  },
  {
    key: 'update_centroids',
    title: 'Update Centroids',
    short: 'Centroids move to cluster means',
    what: 'For each cluster, we compute the arithmetic mean (average X, average Y). The centroid glides to this new center of mass.',
    why: 'The mean is the spatial position that minimizes the within-cluster sum of squared errors.',
    talkingPoint: 'Watch the dashed movement trail lines showing where centroids traveled from!',
  },
  {
    key: 'reassignment',
    title: 'Reassignment',
    short: 'Re-evaluating points with moved centroids',
    what: 'Because the centroids moved, border points re-evaluate distances and may switch clusters.',
    why: 'Centroid movement alters boundaries, causing allegiance shifts.',
    talkingPoint: 'Did any border points switch colors this iteration?',
  },
  {
    key: 'repeat',
    title: 'Iterative Loop',
    short: 'Alternating assignment and mean updates',
    what: 'K-Means repeats: (1) Assign points to nearest centroid, (2) Update centroids to cluster means.',
    why: 'Each alternating phase is mathematically guaranteed to decrease or maintain inertia.',
    talkingPoint: 'This is the Expectation-Maximization (EM) cycle in action.',
  },
  {
    key: 'convergence',
    title: 'Convergence',
    short: 'Centroids stabilized; clustering complete',
    what: 'No points changed clusters and centroids moved less than threshold ε. The algorithm halts.',
    why: 'Once assignments stabilize, the cluster means stay fixed. Local optimum reached.',
    talkingPoint: 'Check the final Inertia (WCSS) score measuring overall cluster compactness.',
  },
]

function TeacherKMeans() {
  // Dataset State
  const [selectedPresetId, setSelectedPresetId] = useState('twoBlobs')
  const [isCustomCsv, setIsCustomCsv] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const [col1, setCol1] = useState('')
  const [col2, setCol2] = useState('')

  // Active Points & Labels
  const activeData = useMemo(() => {
    if (isCustomCsv && csvData && col1 && col2) {
      const validPoints = []
      csvData.rows.forEach((row) => {
        const x = Number(row[col1])
        const y = Number(row[col2])
        if (Number.isFinite(x) && Number.isFinite(y)) {
          validPoints.push([x, y])
        }
      })
      return {
        points: validPoints,
        col1,
        col2,
        defaultK: 3,
      }
    }
    const preset = SAMPLE_PRESETS.find((p) => p.id === selectedPresetId) || SAMPLE_PRESETS[0]
    return {
      points: preset.points,
      col1: preset.col1,
      col2: preset.col2,
      defaultK: preset.defaultK,
    }
  }, [isCustomCsv, csvData, col1, col2, selectedPresetId])

  // Bounds
  const bounds = useMemo(() => {
    const pts = activeData.points
    if (pts.length === 0) return { xMin: 0, xMax: 10, yMin: 0, yMax: 10 }
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const padX = (maxX - minX) * 0.12 || 1
    const padY = (maxY - minY) * 0.12 || 1
    return {
      xMin: minX - padX,
      xMax: maxX + padX,
      yMin: minY - padY,
      yMax: maxY + padY,
    }
  }, [activeData.points])

  // Cluster State
  const [k, setK] = useState(activeData.defaultK)
  const [initStrategy, setInitStrategy] = useState('spread')

  // Teaching Mode & Split Focus (Default: Visual mode)
  const [teachingMode, setTeachingMode] = useState('visual')
  const [focusMode, setFocusMode] = useState('balanced')

  // Simulation State
  const [stepIndex, setStepIndex] = useState(0)
  const [centroids, setCentroids] = useState(() =>
    getInitialCentroids(activeData.points, activeData.defaultK, 'spread', bounds),
  )
  const [centroidHistory, setCentroidHistory] = useState([])
  const [assignments, setAssignments] = useState(() => activeData.points.map(() => null))
  const [iteration, setIteration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [snapshot, setSnapshot] = useState(null) // Baseline snapshot comparison

  // Concept-First Interactive Whiteboard States
  const [selectedPointIndex, setSelectedPointIndex] = useState(null)
  const [selectedPointBIndex, setSelectedPointBIndex] = useState(null)
  const [selectedCentroidIndex, setSelectedCentroidIndex] = useState(null)

  // Auxiliary toggles
  const [showDistanceLines, setShowDistanceLines] = useState(false)
  const [showCentroidTrails, setShowCentroidTrails] = useState(true)

  // Pure Assignment logic
  const computeAssignment = useCallback((pts, curCentroids) => {
    return pts.map((p) => {
      let bestIdx = 0
      let bestDist = Infinity
      curCentroids.forEach((c, idx) => {
        const d = dist(p, c)
        if (d < bestDist) {
          bestDist = d
          bestIdx = idx
        }
      })
      return bestIdx
    })
  }, [])

  // Pure Centroid Update logic
  const computeMeans = useCallback((pts, curAssign, numK, curCentroids) => {
    return Array.from({ length: numK }, (_, idx) => {
      const clusterPts = pts.filter((_, pIdx) => curAssign[pIdx] === idx)
      if (clusterPts.length === 0) return curCentroids[idx].slice()
      const meanX = clusterPts.reduce((a, p) => a + p[0], 0) / clusterPts.length
      const meanY = clusterPts.reduce((a, p) => a + p[1], 0) / clusterPts.length
      return [Number(meanX.toFixed(2)), Number(meanY.toFixed(2))]
    })
  }, [])

  // Reset simulation whenever dataset, K, or strategy changes
  const resetSimulation = useCallback(
    (newK = k, newStrat = initStrategy) => {
      const initC = getInitialCentroids(activeData.points, newK, newStrat, bounds)
      setCentroids(initC)
      setCentroidHistory([initC.map((c) => c.slice())])
      setAssignments(activeData.points.map(() => null))
      setStepIndex(0)
      setIteration(0)
      setIsPlaying(false)
      setSelectedPointIndex(null)
      setSelectedPointBIndex(null)
      setSelectedCentroidIndex(null)
    },
    [k, initStrategy, activeData.points, bounds],
  )

  // Compute selected whiteboard explanation object
  const whiteboardObject = useMemo(() => {
    if (selectedPointIndex !== null && selectedPointBIndex !== null) {
      const ptA = activeData.points[selectedPointIndex]
      const ptB = activeData.points[selectedPointBIndex]
      if (ptA && ptB) {
        return explainKMeansTwoPoints(ptA, ptB, selectedPointIndex, selectedPointBIndex, activeData.col1, activeData.col2)
      }
    }
    if (selectedPointIndex !== null) {
      const pt = activeData.points[selectedPointIndex]
      if (pt) {
        return explainKMeansPoint(pt, selectedPointIndex, centroids, assignments, activeData.col1, activeData.col2)
      }
    }
    if (selectedCentroidIndex !== null) {
      const c = centroids[selectedCentroidIndex]
      if (c) {
        return explainKMeansCentroid(c, selectedCentroidIndex, activeData.points, assignments, activeData.col1, activeData.col2)
      }
    }
    return null
  }, [selectedPointIndex, selectedPointBIndex, selectedCentroidIndex, activeData, centroids, assignments])

  const handlePointClick = (idx) => {
    setSelectedCentroidIndex(null)
    if (selectedPointIndex === null) {
      setSelectedPointIndex(idx)
      setSelectedPointBIndex(null)
    } else if (selectedPointIndex === idx) {
      setSelectedPointIndex(null)
      setSelectedPointBIndex(null)
    } else if (selectedPointBIndex === null) {
      setSelectedPointBIndex(idx)
    } else if (selectedPointBIndex === idx) {
      setSelectedPointBIndex(null)
    } else {
      setSelectedPointIndex(idx)
      setSelectedPointBIndex(null)
    }
  }

  const handleCentroidClick = (cIdx) => {
    setSelectedPointIndex(null)
    setSelectedPointBIndex(null)
    setSelectedCentroidIndex((prev) => (prev === cIdx ? null : cIdx))
  }

  const handleClearSelection = () => {
    setSelectedPointIndex(null)
    setSelectedPointBIndex(null)
    setSelectedCentroidIndex(null)
  }

  const handleQuickInspectPoint = () => {
    setSelectedCentroidIndex(null)
    setSelectedPointBIndex(null)
    setSelectedPointIndex(0)
  }

  const handleQuickInspectCentroid = () => {
    setSelectedPointIndex(null)
    setSelectedPointBIndex(null)
    setSelectedCentroidIndex(0)
  }

  // Changing K immediately resets and updates visualization
  const handleKChange = (newK) => {
    setK(newK)
    resetSimulation(newK, initStrategy)
  }

  // CSV Load Handler
  const handleCsvLoaded = (parsedResult) => {
    setCsvData(parsedResult)
    setIsCustomCsv(true)
    const numCols = parsedResult.numericColumns
    const c1 = numCols[0] || parsedResult.headers[0]
    const c2 = numCols[1] || numCols[0] || parsedResult.headers[1]
    setCol1(c1)
    setCol2(c2)
    resetSimulation(k, initStrategy)
  }

  const handleResetToSample = () => {
    setIsCustomCsv(false)
    setCsvData(null)
    setSelectedPresetId('twoBlobs')
    setK(2)
    resetSimulation(2, initStrategy)
  }

  // Within-Cluster Sum of Squares (Inertia)
  const currentWCSS = useMemo(() => {
    if (stepIndex < 3 || assignments.every((a) => a === null)) return 0
    let total = 0
    activeData.points.forEach((p, idx) => {
      const cIdx = assignments[idx]
      if (cIdx !== null && centroids[cIdx]) {
        total += dist(p, centroids[cIdx]) ** 2
      }
    })
    return total
  }, [activeData.points, assignments, centroids, stepIndex])

  // Synchronized Code Mappings & Live Variables
  const activeMapping = KM_CODE_MAPPINGS[stepIndex] || KM_CODE_MAPPINGS[0]

  const kmLiveVariables = useMemo(() => {
    const pts = activeData.points
    const counts = Array.from({ length: k }, (_, cIdx) => assignments.filter((a) => a === cIdx).length)
    let maxShift = 0
    if (centroidHistory.length >= 2) {
      const prev = centroidHistory[centroidHistory.length - 2]
      const cur = centroidHistory[centroidHistory.length - 1]
      maxShift = Math.max(...cur.map((c, i) => (prev[i] ? dist(c, prev[i]) : 0)))
    }

    return [
      { name: 'N', value: `${pts.length} pts`, highlight: stepIndex === 0 },
      { name: 'K', value: k, highlight: stepIndex === 1 },
      {
        name: 'centroids',
        value: centroids.slice(0, 3).map((c, i) => `C${i + 1}[${c[0].toFixed(1)},${c[1].toFixed(1)}]`).join(' '),
        highlight: stepIndex === 2 || stepIndex === 4,
      },
      {
        name: 'cluster_sizes',
        value: stepIndex >= 3 ? `[${counts.join(', ')}]` : 'unassigned',
        highlight: stepIndex === 3,
      },
      {
        name: 'inertia (WCSS)',
        value: currentWCSS > 0 ? currentWCSS.toFixed(1) : '—',
        highlight: stepIndex === 6 || stepIndex === 7,
      },
      {
        name: 'shift',
        value: maxShift > 0 ? maxShift.toFixed(2) : stepIndex >= 4 ? '0.00' : '—',
        highlight: stepIndex === 5,
      },
      { name: 'iter', value: iteration },
    ]
  }, [activeData.points, k, assignments, centroidHistory, centroids, currentWCSS, stepIndex, iteration])

  // Step transitions
  const handleJumpStep = useCallback(
    (targetIdx) => {
      setStepIndex(targetIdx)
      const initial = getInitialCentroids(activeData.points, k, initStrategy, bounds)

      if (targetIdx <= 1) {
        setAssignments(activeData.points.map(() => null))
        setCentroids(initial)
        setCentroidHistory([initial.map((c) => c.slice())])
        setIteration(0)
      } else if (targetIdx === 2) {
        setCentroids(initial)
        setCentroidHistory([initial.map((c) => c.slice())])
        setAssignments(activeData.points.map(() => null))
        setIteration(0)
      } else if (targetIdx === 3) {
        const assign1 = computeAssignment(activeData.points, initial)
        setCentroids(initial)
        setCentroidHistory([initial.map((c) => c.slice())])
        setAssignments(assign1)
        setIteration(1)
      } else if (targetIdx === 4) {
        const assign1 = computeAssignment(activeData.points, initial)
        const mean1 = computeMeans(activeData.points, assign1, k, initial)
        setCentroids(mean1)
        setCentroidHistory([initial.map((c) => c.slice()), mean1.map((c) => c.slice())])
        setAssignments(assign1)
        setIteration(1)
      } else if (targetIdx === 5 || targetIdx === 6) {
        const assign1 = computeAssignment(activeData.points, initial)
        const mean1 = computeMeans(activeData.points, assign1, k, initial)
        const assign2 = computeAssignment(activeData.points, mean1)
        const mean2 = computeMeans(activeData.points, assign2, k, mean1)
        setCentroids(mean2)
        setCentroidHistory([
          initial.map((c) => c.slice()),
          mean1.map((c) => c.slice()),
          mean2.map((c) => c.slice()),
        ])
        setAssignments(assign2)
        setIteration(2)
      } else if (targetIdx === 7) {
        // Run to convergence
        let curC = initial.map((c) => c.slice())
        let history = [curC.map((c) => c.slice())]
        let curA = activeData.points.map(() => null)
        for (let iter = 0; iter < 8; iter++) {
          curA = computeAssignment(activeData.points, curC)
          const nextC = computeMeans(activeData.points, curA, k, curC)
          history.push(nextC.map((c) => c.slice()))
          const totalMoved = nextC.reduce((s, nc, i) => s + dist(nc, curC[i]), 0)
          curC = nextC
          if (totalMoved < 0.02) break
        }
        setCentroids(curC)
        setCentroidHistory(history)
        setAssignments(curA)
        setIteration(history.length - 1)
      }
    },
    [activeData.points, k, initStrategy, bounds, computeAssignment, computeMeans],
  )

  // Iteration-Level Playback (Projector-first classroom unit)
  const handleNextIteration = useCallback(() => {
    if (stepIndex < 2) {
      handleJumpStep(2)
      return
    }
    const curA = computeAssignment(activeData.points, centroids)
    const nextC = computeMeans(activeData.points, curA, k, centroids)
    const totalMoved = nextC.reduce((s, nc, i) => s + dist(nc, centroids[i]), 0)
    setCentroids(nextC)
    setCentroidHistory((prev) => [...prev, nextC.map((c) => c.slice())])
    setAssignments(curA)
    const nextIter = iteration + 1
    setIteration(nextIter)
    if (totalMoved < 0.02 || nextIter >= 8) {
      setStepIndex(7) // converged
    } else {
      setStepIndex(5) // updated
    }
  }, [stepIndex, activeData.points, centroids, computeAssignment, computeMeans, k, iteration, handleJumpStep])

  const handlePrevIteration = useCallback(() => {
    if (centroidHistory.length > 2) {
      const newHistory = centroidHistory.slice(0, -1)
      const prevC = newHistory[newHistory.length - 1]
      const prevA = computeAssignment(activeData.points, prevC)
      setCentroids(prevC)
      setCentroidHistory(newHistory)
      setAssignments(prevA)
      setIteration((it) => Math.max(0, it - 1))
      setStepIndex(4)
    } else {
      resetSimulation(k, initStrategy)
    }
  }, [centroidHistory, activeData.points, computeAssignment, resetSimulation, k, initStrategy])

  // Teacher-Edited Python Code Execution Handler
  const handleRunTeacherCode = useCallback(
    (extracted) => {
      let newK = k
      let newStrat = initStrategy
      if (extracted.K !== undefined && Number.isInteger(extracted.K) && extracted.K >= 2 && extracted.K <= 5) {
        newK = extracted.K
        setK(newK)
      }
      if (extracted.strategy && typeof extracted.strategy === 'string') {
        newStrat = extracted.strategy.toLowerCase().includes('poor') ? 'poor' : 'spread'
        setInitStrategy(newStrat)
      }
      const initial = getInitialCentroids(activeData.points, newK, newStrat, bounds)
      const assign1 = computeAssignment(activeData.points, initial)
      const mean1 = computeMeans(activeData.points, assign1, newK, initial)
      setCentroids(mean1)
      setCentroidHistory([initial.map((c) => c.slice()), mean1.map((c) => c.slice())])
      setAssignments(assign1)
      setIteration(1)
      setStepIndex(4)
    },
    [k, initStrategy, activeData.points, bounds, computeAssignment, computeMeans],
  )

  const handleNext = () => {
    if (stepIndex < KM_STEPS.length - 1) {
      handleJumpStep(stepIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }


  // Autoplay (Cycles iterations smoothly)
  const timerRef = useRef(null)
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return undefined
    }
    const intervalMs = Math.round(1500 / speed)
    timerRef.current = setInterval(() => {
      setStepIndex((cur) => {
        if (cur >= KM_STEPS.length - 1) {
          setIsPlaying(false)
          return cur
        }
        return cur
      })
      handleNextIteration()
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, handleNextIteration])

  // SVG Scales
  const SVG_W = 680
  const SVG_H = 360
  const PAD = { l: 56, r: 24, t: 20, b: 44 }
  const plotW = SVG_W - PAD.l - PAD.r
  const plotH = SVG_H - PAD.t - PAD.b

  const px = useCallback(
    (x) => PAD.l + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotW,
    [bounds, PAD.l, plotW],
  )
  const py = useCallback(
    (y) => PAD.t + plotH - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * plotH,
    [bounds, PAD.t, plotH],
  )

  const curStep = KM_STEPS[stepIndex]
  const areCentroidsVisible = stepIndex >= 2
  const areAssignmentsVisible = stepIndex >= 3

  return (
    <TeacherWorkspaceLayout
      title="K-Means Clustering Playground"
      subtitle="Demonstrate how points are partitioned into clusters and centroids update iteratively. Upload any 2D CSV dataset or use presets."
      datasetSelector={
        <TeacherDatasetSelector
          samplePresets={SAMPLE_PRESETS}
          selectedPresetId={selectedPresetId}
          onSelectPreset={(id) => {
            setSelectedPresetId(id)
            setIsCustomCsv(false)
            resetSimulation(k, initStrategy)
          }}
          isCustomCsv={isCustomCsv}
          csvData={csvData}
          onCsvLoaded={handleCsvLoaded}
          onResetToSample={handleResetToSample}
          col1Label="Feature 1 (X)"
          col2Label="Feature 2 (Y)"
          selectedCol1={col1}
          selectedCol2={col2}
          onCol1Change={setCol1}
          onCol2Change={setCol2}
        />
      }
      visualization={
        <>
          <div className="tw-vis-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                Clusters ({k}):
              </span>
              {Array.from({ length: k }).map((_, idx) => (
                <span
                  key={idx}
                  className="tw-km-cluster-badge"
                  style={{
                    borderColor: CLUSTER_COLORS[idx].hex,
                    background: CLUSTER_COLORS[idx].bg,
                    color: CLUSTER_COLORS[idx].hex,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleCentroidClick(idx)}
                  title={`Click to inspect Cluster ${idx + 1} centroid calculation`}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: CLUSTER_COLORS[idx].hex,
                    }}
                  />
                  Cluster {idx + 1}
                </span>
              ))}
            </div>

            <div className="tw-vis-toggles">
              <label className="tw-checkbox-label">
                <input
                  type="checkbox"
                  checked={showDistanceLines}
                  onChange={(e) => setShowDistanceLines(e.target.checked)}
                />
                Distance Lines
              </label>
              <label className="tw-checkbox-label">
                <input
                  type="checkbox"
                  checked={showCentroidTrails}
                  onChange={(e) => setShowCentroidTrails(e.target.checked)}
                />
                Centroid Trails
              </label>
            </div>
          </div>

          <svg
            className="tw-km-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label="K-Means scatter plot and centroids"
            onClick={handleClearSelection}
            style={{ cursor: 'crosshair' }}
          >
            {/* Grid lines */}
            <g className="tw-km-grid">
              {Array.from({ length: 6 }).map((_, i) => {
                const xVal = bounds.xMin + (i * (bounds.xMax - bounds.xMin)) / 5
                return (
                  <line key={`gx-${i}`} x1={px(xVal)} y1={py(bounds.yMin)} x2={px(xVal)} y2={py(bounds.yMax)} />
                )
              })}
              {Array.from({ length: 6 }).map((_, i) => {
                const yVal = bounds.yMin + (i * (bounds.yMax - bounds.yMin)) / 5
                return (
                  <line key={`gy-${i}`} x1={px(bounds.xMin)} y1={py(yVal)} x2={px(bounds.xMax)} y2={py(yVal)} />
                )
              })}
            </g>

            {/* Axes */}
            <line className="tw-km-axis" x1={px(bounds.xMin)} y1={py(bounds.yMin)} x2={px(bounds.xMax)} y2={py(bounds.yMin)} />
            <line className="tw-km-axis" x1={px(bounds.xMin)} y1={py(bounds.yMin)} x2={px(bounds.xMin)} y2={py(bounds.yMax)} />

            {/* Axis titles */}
            <text className="tw-km-label" x={PAD.l + plotW / 2} y={SVG_H - 10} textAnchor="middle" style={{ fontWeight: 600 }}>
              {activeData.col1}
            </text>
            <text className="tw-km-label" x={14} y={PAD.t + plotH / 2} textAnchor="middle" transform={`rotate(-90 14 ${PAD.t + plotH / 2})`} style={{ fontWeight: 600 }}>
              {activeData.col2}
            </text>

            {/* Centroid Movement Trails */}
            {showCentroidTrails &&
              centroidHistory.length > 1 &&
              Array.from({ length: k }).map((_, cIdx) => {
                const trailPts = centroidHistory.map((stepC) => stepC[cIdx])
                const polylinePoints = trailPts
                  .map((p) => `${px(p[0])},${py(p[1])}`)
                  .join(' ')
                return (
                  <polyline
                    key={`trail-${cIdx}`}
                    className="tw-km-trail"
                    points={polylinePoints}
                    stroke={CLUSTER_COLORS[cIdx].hex}
                    fill="none"
                  />
                )
              })}

            {/* Normal Distance Lines from points to their nearest centroid */}
            {showDistanceLines &&
              areCentroidsVisible &&
              areAssignmentsVisible &&
              selectedPointIndex === null &&
              activeData.points.map((p, idx) => {
                const cIdx = assignments[idx]
                if (cIdx === null || !centroids[cIdx]) return null
                const c = centroids[cIdx]
                return (
                  <line
                    key={`dline-${idx}`}
                    className="tw-km-dist-line"
                    x1={px(p[0])}
                    y1={py(p[1])}
                    x2={px(c[0])}
                    y2={py(c[1])}
                    stroke={CLUSTER_COLORS[cIdx].hex}
                  />
                )
              })}

            {/* Interactive Distance Rulers from Selected Point A to All Centroids */}
            {selectedPointIndex !== null && selectedPointBIndex === null && (
              <g className="tw-km-interactive-rulers">
                {centroids.map((c, cIdx) => {
                  const ptA = activeData.points[selectedPointIndex]
                  if (!ptA || !c) return null
                  const dx = ptA[0] - c[0]
                  const dy = ptA[1] - c[1]
                  const distVal = Math.sqrt(dx * dx + dy * dy)
                  const isClosest = assignments[selectedPointIndex] === cIdx
                  const midX = (px(ptA[0]) + px(c[0])) / 2
                  const midY = (py(ptA[1]) + py(c[1])) / 2
                  const strokeCol = isClosest ? 'var(--good)' : CLUSTER_COLORS[cIdx].hex
                  return (
                    <g key={`interactive-ruler-${cIdx}`}>
                      <line
                        x1={px(ptA[0])}
                        y1={py(ptA[1])}
                        x2={px(c[0])}
                        y2={py(c[1])}
                        stroke={strokeCol}
                        strokeWidth={isClosest ? 2.8 : 1.5}
                        strokeDasharray="4 3"
                        opacity={isClosest ? 1 : 0.65}
                      />
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-26"
                          y="-10"
                          width="52"
                          height="20"
                          rx="4"
                          fill="#fff"
                          stroke={strokeCol}
                          strokeWidth={isClosest ? 2 : 1}
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fontSize="10.5"
                          fontWeight={isClosest ? '700' : '600'}
                          fill={strokeCol}
                        >
                          {distVal.toFixed(2)}{isClosest ? ' ★' : ''}
                        </text>
                      </g>
                    </g>
                  )
                })}
              </g>
            )}

            {/* Interactive Distance Ruler between Point A and Point B */}
            {selectedPointIndex !== null && selectedPointBIndex !== null && (() => {
              const ptA = activeData.points[selectedPointIndex]
              const ptB = activeData.points[selectedPointBIndex]
              if (!ptA || !ptB) return null
              const dx = ptB[0] - ptA[0]
              const dy = ptB[1] - ptA[1]
              const distVal = Math.sqrt(dx * dx + dy * dy)
              const midX = (px(ptA[0]) + px(ptB[0])) / 2
              const midY = (py(ptA[1]) + py(ptB[1])) / 2
              return (
                <g key="interactive-two-point-ruler">
                  <line
                    x1={px(ptA[0])}
                    y1={py(ptA[1])}
                    x2={px(ptB[0])}
                    y2={py(ptB[1])}
                    stroke="var(--rust)"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                  />
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#fff" stroke="var(--rust)" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--rust)">
                      {distVal.toFixed(2)}
                    </text>
                  </g>
                </g>
              )
            })()}

            {/* Data Points */}
            {activeData.points.map((p, idx) => {
              const cIdx = areAssignmentsVisible ? assignments[idx] : null
              const fillColor =
                cIdx !== null && cIdx !== undefined
                  ? CLUSTER_COLORS[cIdx].hex
                  : UNASSIGNED_COLOR.hex
              const isSelectedA = selectedPointIndex === idx
              const isSelectedB = selectedPointBIndex === idx
              const isClusterMember = selectedCentroidIndex !== null && assignments[idx] === selectedCentroidIndex

              return (
                <g key={`pt-${idx}`}>
                  {/* Cluster Member highlight halo when centroid is selected */}
                  {isClusterMember && (
                    <circle
                      cx={px(p[0])}
                      cy={py(p[1])}
                      r={10}
                      fill="none"
                      stroke={CLUSTER_COLORS[selectedCentroidIndex].hex}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                  )}

                  {/* Selection highlight rings & labels */}
                  {(isSelectedA || isSelectedB) && (
                    <>
                      <circle
                        cx={px(p[0])}
                        cy={py(p[1])}
                        r={12}
                        fill="none"
                        stroke={isSelectedA ? 'var(--blue)' : 'var(--rust)'}
                        strokeWidth={2.5}
                        strokeDasharray="3 2"
                      />
                      <text
                        x={px(p[0])}
                        y={py(p[1]) - 14}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="800"
                        fill={isSelectedA ? 'var(--blue)' : 'var(--rust)'}
                      >
                        {isSelectedA ? 'Point A' : 'Point B'}
                      </text>
                    </>
                  )}

                  {/* Main Point Circle */}
                  <circle
                    className="tw-km-point"
                    cx={px(p[0])}
                    cy={py(p[1])}
                    r={isSelectedA || isSelectedB ? 7 : 5.5}
                    fill={fillColor}
                  >
                    <title>{`Point (${p[0]}, ${p[1]})${cIdx !== null ? ` -> Cluster ${cIdx + 1}` : ''}`}</title>
                  </circle>

                  {/* Invisible enlarged hit target for easy touch/mouse clicking */}
                  <circle
                    cx={px(p[0])}
                    cy={py(p[1])}
                    r={16}
                    fill="transparent"
                    cursor="pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePointClick(idx)
                    }}
                  />
                </g>
              )
            })}

            {/* Centroid Markers */}
            {areCentroidsVisible &&
              centroids.map((c, idx) => {
                const col = CLUSTER_COLORS[idx]
                const cx = px(c[0])
                const cy = py(c[1])
                const isSelectedCentroid = selectedCentroidIndex === idx
                return (
                  <g
                    key={`cent-${idx}`}
                    className="tw-km-centroid"
                    transform={`translate(${cx}, ${cy})`}
                    cursor="pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCentroidClick(idx)
                    }}
                  >
                    {isSelectedCentroid && (
                      <circle r={24} fill="none" stroke={col.hex} strokeWidth={2.5} strokeDasharray="4 2" />
                    )}
                    <circle r={14} fill={col.hex} opacity={0.2} />
                    <circle r={10} fill="#fff" stroke={col.hex} strokeWidth={2.5} />
                    <line x1={-5} y1={0} x2={5} y2={0} stroke={col.hex} strokeWidth={2} />
                    <line x1={0} y1={-5} x2={0} y2={5} stroke={col.hex} strokeWidth={2} />
                    <title>{`Centroid C${idx + 1} (${c[0].toFixed(2)}, ${c[1].toFixed(2)}) - Click to inspect calculation`}</title>
                  </g>
                )
              })}

            {/* Convergence indicator */}
            {stepIndex === 7 && (
              <g transform={`translate(${SVG_W / 2}, ${PAD.t + 16})`}>
                <rect x="-85" y="-14" width="170" height="28" rx="14" fill="var(--good)" opacity="0.95" />
                <text x="0" y="4" fill="#fff" textAnchor="middle" fontSize="11.5" fontWeight="600">
                  ✓ Clusters Converged
                </text>
              </g>
            )}
          </svg>

          {/* Interactive ML Concept Whiteboard / Inspector */}
          <TeacherConceptWhiteboard
            selectedObject={whiteboardObject}
            onClearSelection={handleClearSelection}
            onQuickInspectPoint={handleQuickInspectPoint}
            onQuickInspectCentroid={handleQuickInspectCentroid}
            algorithmType="kmeans"
          />
        </>
      }
      parameterControls={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Quick Number of Clusters (K) Selector */}
          <div className="tw-ctrl-group">
            <span className="tw-ctrl-label" style={{ fontWeight: 600 }}>
              Clusters (K):
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="tw-btn-chip"
                onClick={() => handleKChange(Math.max(2, k - 1))}
                disabled={k <= 2}
                title="Decrease K"
                style={{ padding: '3px 8px', fontWeight: 'bold' }}
              >
                −
              </button>
              <span style={{ fontSize: '14px', fontWeight: 700, padding: '0 6px', color: 'var(--ink)' }}>
                {k}
              </span>
              <button
                type="button"
                className="tw-btn-chip"
                onClick={() => handleKChange(Math.min(5, k + 1))}
                disabled={k >= 5}
                title="Increase K"
                style={{ padding: '3px 8px', fontWeight: 'bold' }}
              >
                +
              </button>
            </div>
            {[2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                className={`tw-btn-chip ${k === val ? 'active' : ''}`}
                onClick={() => handleKChange(val)}
                style={{ padding: '2px 7px', fontSize: '11px' }}
              >
                K={val}
              </button>
            ))}
          </div>

          <div className="tw-divider" />

          {/* Centroid Placement Strategy */}
          <div className="tw-ctrl-group">
            <span className="tw-ctrl-label">Initialization:</span>
            <select
              className="tw-select"
              value={initStrategy}
              onChange={(e) => {
                setInitStrategy(e.target.value)
                resetSimulation(k, e.target.value)
              }}
            >
              <option value="spread">Spread Out (K-Means++)</option>
              <option value="poor">Deliberate Poor Start (Trapped)</option>
            </select>
          </div>
        </div>
      }
      playbackControls={
        <TeacherPlaybackControls
          isPlaying={isPlaying}
          speed={speed}
          canPrev={iteration > 0 || stepIndex > 0}
          canNext={stepIndex < KM_STEPS.length - 1}
          onReset={() => resetSimulation(k, initStrategy)}
          onPrev={handlePrevIteration}
          onNext={handleNextIteration}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onSpeedChange={setSpeed}
          nextLabel="Next Iteration"
          prevLabel="Prev"
          canStep={true}
          onStep={handleNext}
          stepLabel="Step Phase"
          statusPill={
            <span>
              Iteration <b>{iteration}</b> · K=<b>{k}</b> · WCSS <b>{currentWCSS > 0 ? currentWCSS.toFixed(1) : '—'}</b>
            </span>
          }
        />
      }
      teachingMode={teachingMode}
      onTeachingModeChange={setTeachingMode}
      focusMode={focusMode}
      onFocusModeChange={setFocusMode}
      onTogglePlay={() => setIsPlaying((p) => !p)}
      onNext={handleNextIteration}
      onPrev={handlePrevIteration}
      onReset={() => resetSimulation(k, initStrategy)}
      snapshotBar={
        snapshot ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}>
            <span style={{ color: 'var(--rust)', fontWeight: 600 }}>
              📌 Baseline: K={snapshot.k}, WCSS={snapshot.inertia.toFixed(1)}
            </span>
            <span style={{ color: 'var(--muted)' }}>➔ Current: <b>{currentWCSS.toFixed(1)}</b></span>
            <button
              type="button"
              className="tw-btn-chip"
              onClick={() => setSnapshot(null)}
              style={{ fontSize: '10.5px', padding: '1px 6px' }}
            >
              ✕ Clear
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="tw-btn-chip"
            onClick={() => setSnapshot({ k, inertia: currentWCSS, iteration })}
            title="Save baseline clustering to compare before and after changes"
            style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span>📌</span> Save Snapshot
          </button>
        )
      }
      codePanel={
        <TeacherCodeEditor
          algorithmType="k-means"
          filename="kmeans.py"
          codeLines={KM_CODE}
          activeLineRange={activeMapping.lines}
          stepNumber={stepIndex + 1}
          totalSteps={KM_STEPS.length}
          stepLabel={activeMapping.label}
          liveVariables={kmLiveVariables}
          visualNotice={activeMapping.visualNotice}
          onRunCode={handleRunTeacherCode}
        />
      }
      statusExplanation={
        <TeacherExplanationPanel
          stepNumber={stepIndex + 1}
          totalSteps={KM_STEPS.length}
          stepTitle={curStep.title}
          shortSummary={curStep.short}
          whatIsHappening={curStep.what}
          whyItMatters={curStep.why}
          metrics={[
            { label: 'K', value: k },
            { label: 'Iteration', value: iteration },
            { label: 'Inertia (WCSS)', value: currentWCSS > 0 ? currentWCSS.toFixed(1) : '—' },
            { label: 'Points', value: activeData.points.length },
          ]}
          talkingPoint={curStep.talkingPoint}
        />
      }
    />
  )
}

export default TeacherKMeans
