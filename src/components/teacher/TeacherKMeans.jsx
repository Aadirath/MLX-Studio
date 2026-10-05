import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TeacherWorkspaceLayout from './TeacherWorkspaceLayout.jsx'
import TeacherPlaybackControls from './TeacherPlaybackControls.jsx'
import TeacherExplanationPanel from './TeacherExplanationPanel.jsx'
import './TeacherKMeans.css'

// Cluster Palette
const CLUSTER_COLORS = [
  { name: 'Blue', hex: '#2F5D8A', bg: '#E4ECF3' },
  { name: 'Rust', hex: '#A6462D', bg: '#F3E4DF' },
  { name: 'Green', hex: '#3F7D53', bg: '#E4F0E8' },
  { name: 'Purple', hex: '#7C3AED', bg: '#EDE9FE' },
  { name: 'Amber', hex: '#D97706', bg: '#FEF3C7' },
]

const UNASSIGNED_COLOR = { hex: '#726C5D', bg: '#EAE6D8' }

// Datasets
const KM_DATASETS = {
  twoBlobs: {
    id: 'twoBlobs',
    name: 'Two Separated Clusters (16 pts)',
    defaultK: 2,
    points: [
      [2, 2], [3, 2], [2, 3], [3, 3], [1.5, 2.5], [2.5, 1.5], [3.5, 2.8], [2, 3.6],
      [7, 7], [8, 7], [7, 8], [8, 8], [6.5, 7.5], [7.5, 6.2], [8.3, 7.6], [7, 6.3],
    ],
  },
  threeBlobs: {
    id: 'threeBlobs',
    name: 'Three Natural Groups (21 pts)',
    defaultK: 3,
    points: [
      [1.8, 2.2], [2.6, 1.8], [2.2, 3.0], [3.1, 2.5], [1.5, 2.8], [2.8, 3.2], [3.2, 1.7],
      [7.8, 2.5], [8.5, 1.9], [8.2, 3.1], [7.3, 2.0], [8.9, 2.7], [7.5, 3.2], [8.4, 3.6],
      [5.0, 7.8], [5.8, 8.2], [4.6, 7.2], [5.5, 7.0], [6.2, 7.5], [4.8, 8.5], [5.7, 8.8],
    ],
  },
  fourBlobs: {
    id: 'fourBlobs',
    name: 'Four Quadrants (24 pts)',
    defaultK: 4,
    points: [
      [2, 2.5], [2.8, 1.8], [1.8, 3.2], [3.2, 2.8], [2.2, 1.9], [2.9, 3.4],
      [7.5, 2.2], [8.2, 1.8], [7.1, 3.0], [8.5, 2.8], [7.9, 3.3], [8.7, 2.1],
      [2.2, 7.5], [3.0, 8.1], [1.9, 8.3], [2.8, 7.0], [1.7, 7.2], [3.3, 7.8],
      [7.8, 7.5], [8.5, 8.2], [7.2, 8.0], [8.8, 7.3], [8.0, 8.6], [7.3, 7.1],
    ],
  },
  noisy: {
    id: 'noisy',
    name: 'Unequal / Overlapping Clusters',
    defaultK: 3,
    points: [
      [2.0, 2.5], [2.5, 3.0], [3.0, 2.0], [2.2, 3.8], [3.5, 3.2], [1.8, 1.9],
      [4.2, 4.5], [4.8, 5.0], [5.2, 4.2], [4.5, 5.5], [5.6, 4.9], [3.8, 5.2],
      [7.0, 7.5], [7.8, 8.0], [8.2, 7.2], [7.5, 8.5], [8.5, 8.3], [6.8, 7.1],
    ],
  },
}

function dist(p1, p2) {
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1])
}

function getInitialCentroids(points, k, strategy) {
  if (strategy === 'poor') {
    // Deliberately pack 2 or more centroids in the bottom left
    const base = [
      [1.8, 1.8],
      [2.6, 2.5],
      [7.5, 7.2],
      [8.0, 2.5],
      [2.5, 7.5],
    ]
    return base.slice(0, k)
  }
  if (strategy === 'spread') {
    if (k === 2) return [[2.0, 2.0], [7.5, 7.5]]
    if (k === 3) return [[2.0, 2.5], [8.0, 2.5], [5.5, 7.8]]
    if (k === 4) return [[2.5, 2.5], [8.0, 2.5], [2.5, 7.5], [8.0, 7.5]]
    if (k === 5) return [[2.5, 2.5], [8.0, 2.5], [2.5, 7.5], [8.0, 7.5], [5.0, 5.0]]
  }
  // Random picking from points
  const step = Math.floor(points.length / k)
  return Array.from({ length: k }, (_, i) => points[(i * step + 1) % points.length].slice())
}

const KM_STEPS = [
  {
    key: 'dataset',
    label: '1. Dataset',
    title: 'Unclustered Feature Space',
    what: 'We observe unlabelled 2D data points. There are no predefined classes or ground-truth targets.',
    why: 'Unsupervised learning discovers natural grouping patterns solely based on feature similarities (distances) without human labels.',
    talkingPoint:
      'Ask the class: Without knowing any labels, how many distinct groups or clusters do you visually detect in this data?',
  },
  {
    key: 'choose_k',
    label: '2. Choose K',
    title: 'Hyperparameter Selection: Number of Clusters (K)',
    what: 'The practitioner must specify the number of clusters K upfront. Here K determines how many centroids will be spawned.',
    why: 'K-Means cannot automatically guess the true number of clusters. Choosing K too low merges distinct groups; choosing K too high fractures natural groups.',
    talkingPoint:
      'Discuss: What happens if we pick K=1? What happens if K is larger than the natural groups in the dataset?',
  },
  {
    key: 'init_centroids',
    label: '3. Initialise Centroids',
    title: 'Centroid Initial Placement',
    what: 'K centroid prototypes are placed in the feature space. Each centroid will act as the representative center for its cluster.',
    why: 'Starting positions matter! A poor initial placement can slow convergence or trap the algorithm in a suboptimal local minimum.',
    talkingPoint:
      'Note the initial centroid positions. In modern algorithms like K-Means++, centroids are placed as far apart from each other as possible.',
  },
  {
    key: 'assignment',
    label: '4. Assignment Step',
    title: 'Assign Every Point to Nearest Centroid',
    what: 'We compute the Euclidean distance from every point to all K centroids. Each point is assigned to its closest centroid and color-coded.',
    why: 'This partitions the entire feature space into Voronoi cells. Every point joins the prototype it resembles most closely.',
    talkingPoint:
      'Point out the distance dashed lines. Even if a point is only 0.01 units closer to Blue than Rust, it is assigned 100% to Blue.',
  },
  {
    key: 'update_centroids',
    label: '5. Update Centroids',
    title: 'Recompute Centroids as Cluster Means',
    what: 'For each cluster, we calculate the arithmetic mean (average X, average Y) of all its assigned points. The centroid glides to this new center of mass.',
    why: 'The mean is the exact spatial point that minimizes the sum of squared distances to all points in that cluster.',
    talkingPoint:
      'Watch the dashed trail lines showing the centroids traveling! The centroid moves directly toward the center of gravity of its members.',
  },
  {
    key: 'reassignment',
    label: '6. Reassignment Step',
    title: 'Re-evaluating Cluster Boundaries',
    what: 'Because the centroids moved, the distance boundaries shifted. Points near the boundaries may now be closer to a different centroid and switch clusters.',
    why: 'Centroid movement alters the nearest-neighbor landscape, necessitating reassignment.',
    talkingPoint:
      'Look closely: Did any border points switch colors? When points switch clusters, their new groups will pull the centroids further next iteration.',
  },
  {
    key: 'repeat',
    label: '7. Repeat Iteration',
    title: 'Alternating Optimization Cycle',
    what: 'K-Means repeats the two alternating phases: (1) Assign points to nearest centroid, then (2) Update centroids to new cluster means.',
    why: 'Each alternating phase is mathematically guaranteed to either decrease or maintain the total Within-Cluster Sum of Squares (Inertia).',
    talkingPoint:
      'Explain Expectation-Maximization (EM): Assignment is the E-step, and updating centroids is the M-step.',
  },
  {
    key: 'convergence',
    label: '8. Convergence',
    title: 'Stabilization & Convergence',
    what: 'Not a single point changed cluster membership, and centroids moved less than the convergence threshold (ε < 0.01). The algorithm halts.',
    why: 'Once assignments stop changing, the cluster means will not change either. The local optimum has been reached.',
    talkingPoint:
      'Celebrate convergence! Show students the final WCSS (Within-Cluster Sum of Squares) score measuring how compact the clusters are.',
  },
]

function TeacherKMeans() {
  const [datasetId, setDatasetId] = useState('twoBlobs')
  const ds = KM_DATASETS[datasetId]
  const [k, setK] = useState(ds.defaultK)
  const [initStrategy, setInitStrategy] = useState('spread')

  // Simulation State
  const [stepIndex, setStepIndex] = useState(0)
  const [centroids, setCentroids] = useState(() =>
    getInitialCentroids(ds.points, ds.defaultK, 'spread'),
  )
  const [centroidHistory, setCentroidHistory] = useState([])
  const [assignments, setAssignments] = useState(() => ds.points.map(() => null))
  const [iteration, setIteration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  // Auxiliary toggles
  const [showDistanceLines, setShowDistanceLines] = useState(true)
  const [showCentroidTrails, setShowCentroidTrails] = useState(true)
  const [showCoordinates, setShowCoordinates] = useState(false)

  // Re-initialize when dataset, k, or strategy changes
  const resetSimulation = useCallback(
    (newK = k, newStrat = initStrategy, newPoints = ds.points) => {
      const initial = getInitialCentroids(newPoints, newK, newStrat)
      setCentroids(initial)
      setCentroidHistory([initial.map((c) => c.slice())])
      setAssignments(newPoints.map(() => null))
      setStepIndex(0)
      setIteration(0)
      setIsPlaying(false)
    },
    [k, initStrategy, ds.points],
  )

  const handleDatasetChange = (newDsId) => {
    setDatasetId(newDsId)
    const newDs = KM_DATASETS[newDsId]
    setK(newDs.defaultK)
    resetSimulation(newDs.defaultK, initStrategy, newDs.points)
  }

  const handleKChange = (newK) => {
    setK(newK)
    resetSimulation(newK, initStrategy, ds.points)
  }

  const handleStrategyChange = (newStrat) => {
    setInitStrategy(newStrat)
    resetSimulation(k, newStrat, ds.points)
  }

  // Pure Assignment logic
  const computeAssignment = useCallback(
    (pts, curCentroids) => {
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
    },
    [],
  )

  // Pure Centroid Update logic
  const computeMeans = useCallback(
    (pts, curAssign, numK, curCentroids) => {
      return Array.from({ length: numK }, (_, idx) => {
        const clusterPts = pts.filter((_, pIdx) => curAssign[pIdx] === idx)
        if (clusterPts.length === 0) return curCentroids[idx].slice()
        const meanX = clusterPts.reduce((a, p) => a + p[0], 0) / clusterPts.length
        const meanY = clusterPts.reduce((a, p) => a + p[1], 0) / clusterPts.length
        return [Number(meanX.toFixed(2)), Number(meanY.toFixed(2))]
      })
    },
    [],
  )

  // Within-Cluster Sum of Squares (Inertia)
  const currentWCSS = useMemo(() => {
    if (stepIndex < 3 || assignments.every((a) => a === null)) return 0
    let total = 0
    ds.points.forEach((p, idx) => {
      const cIdx = assignments[idx]
      if (cIdx !== null && centroids[cIdx]) {
        total += dist(p, centroids[cIdx]) ** 2
      }
    })
    return total
  }, [ds.points, assignments, centroids, stepIndex])

  // Cluster Sizes
  const clusterCounts = useMemo(() => {
    return Array.from({ length: k }, (_, i) => assignments.filter((a) => a === i).length)
  }, [assignments, k])

  // Step transitions
  const handleJumpStep = useCallback(
    (targetIdx) => {
      setStepIndex(targetIdx)
      const initial = getInitialCentroids(ds.points, k, initStrategy)

      if (targetIdx <= 1) {
        setAssignments(ds.points.map(() => null))
        setCentroids(initial)
        setCentroidHistory([initial.map((c) => c.slice())])
        setIteration(0)
      } else if (targetIdx === 2) {
        setCentroids(initial)
        setCentroidHistory([initial.map((c) => c.slice())])
        setAssignments(ds.points.map(() => null))
        setIteration(0)
      } else if (targetIdx === 3) {
        const assign1 = computeAssignment(ds.points, initial)
        setCentroids(initial)
        setCentroidHistory([initial.map((c) => c.slice())])
        setAssignments(assign1)
        setIteration(1)
      } else if (targetIdx === 4) {
        const assign1 = computeAssignment(ds.points, initial)
        const mean1 = computeMeans(ds.points, assign1, k, initial)
        setCentroids(mean1)
        setCentroidHistory([initial.map((c) => c.slice()), mean1.map((c) => c.slice())])
        setAssignments(assign1)
        setIteration(1)
      } else if (targetIdx === 5 || targetIdx === 6) {
        const assign1 = computeAssignment(ds.points, initial)
        const mean1 = computeMeans(ds.points, assign1, k, initial)
        const assign2 = computeAssignment(ds.points, mean1)
        const mean2 = computeMeans(ds.points, assign2, k, mean1)
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
        let curA = ds.points.map(() => null)
        for (let iter = 0; iter < 6; iter++) {
          curA = computeAssignment(ds.points, curC)
          const nextC = computeMeans(ds.points, curA, k, curC)
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
    [ds.points, k, initStrategy, computeAssignment, computeMeans],
  )

  const handleNext = useCallback(() => {
    if (stepIndex < KM_STEPS.length - 1) {
      handleJumpStep(stepIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }, [stepIndex, handleJumpStep])

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      handleJumpStep(stepIndex - 1)
    }
  }, [stepIndex, handleJumpStep])

  // Autoplay
  const timerRef = useRef(null)
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return undefined
    }

    const intervalMs = Math.round(1800 / speed)
    timerRef.current = setInterval(() => {
      setStepIndex((cur) => {
        if (cur >= KM_STEPS.length - 1) {
          setIsPlaying(false)
          return cur
        }
        const next = cur + 1
        handleJumpStep(next)
        return next
      })
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, handleJumpStep])

  // SVG Scales
  const SVG_W = 600
  const SVG_H = 380
  const PAD = { l: 48, r: 24, t: 24, b: 44 }
  const plotW = SVG_W - PAD.l - PAD.r
  const plotH = SVG_H - PAD.t - PAD.b
  const px = useCallback((x) => PAD.l + (x / 10) * plotW, [PAD.l, plotW])
  const py = useCallback((y) => PAD.t + plotH - (y / 10) * plotH, [PAD.t, plotH])

  const curStep = KM_STEPS[stepIndex]

  // Dynamic Metrics for Explanation Panel
  const panelMetrics = [
    { label: 'Clusters (K)', value: k },
    { label: 'Iteration', value: iteration },
    {
      label: 'Inertia (WCSS)',
      value: currentWCSS > 0 ? currentWCSS.toFixed(2) : '—',
      status: stepIndex === 7 ? 'good' : undefined,
    },
    { label: 'Data Points', value: ds.points.length },
    {
      label: 'Status',
      value: stepIndex === 7 ? 'Converged' : stepIndex >= 3 ? 'Iterating' : 'Setup',
      status: stepIndex === 7 ? 'good' : undefined,
    },
  ]

  // Controls Elements
  const controlsElement = (
    <>
      <div className="tw-ctrl-group">
        <span className="tw-ctrl-label">Dataset:</span>
        <select
          className="tw-select"
          value={datasetId}
          onChange={(e) => handleDatasetChange(e.target.value)}
        >
          {Object.values(KM_DATASETS).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tw-divider" />

      <div className="tw-ctrl-group">
        <span className="tw-ctrl-label">K Clusters:</span>
        {[2, 3, 4, 5].map((val) => (
          <button
            key={val}
            type="button"
            className={`tw-btn-chip ${k === val ? 'active' : ''}`}
            onClick={() => handleKChange(val)}
          >
            K={val}
          </button>
        ))}
      </div>

      <div className="tw-divider" />

      <div className="tw-ctrl-group">
        <span className="tw-ctrl-label">Initialization:</span>
        <select
          className="tw-select"
          value={initStrategy}
          onChange={(e) => handleStrategyChange(e.target.value)}
        >
          <option value="spread">Spread Out (K-Means++)</option>
          <option value="random">Random Sampling</option>
          <option value="poor">Deliberate Poor Start (Trapped)</option>
        </select>
      </div>
    </>
  )

  const areCentroidsVisible = stepIndex >= 2
  const areAssignmentsVisible = stepIndex >= 3

  // Visualization Area
  const visualizationElement = (
    <>
      <div className="tw-vis-card-header">
        <div className="tw-km-clusters-bar">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
            Clusters:
          </span>
          {Array.from({ length: k }).map((_, idx) => (
            <span
              key={idx}
              className="tw-km-cluster-badge"
              style={{
                borderColor: CLUSTER_COLORS[idx].hex,
                background: CLUSTER_COLORS[idx].bg,
                color: CLUSTER_COLORS[idx].hex,
              }}
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
              Cluster {idx + 1}: {clusterCounts[idx]} pts
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
          <label className="tw-checkbox-label">
            <input
              type="checkbox"
              checked={showCoordinates}
              onChange={(e) => setShowCoordinates(e.target.checked)}
            />
            Coordinates
          </label>
        </div>
      </div>

      <svg
        className="tw-km-svg"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        role="img"
        aria-label="K-Means 2D cluster scatter plot with centroids"
      >
        {/* Grid lines */}
        <g className="tw-km-grid">
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`gx-${i}`} x1={px(i)} y1={py(0)} x2={px(i)} y2={py(10)} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`gy-${i}`} x1={px(0)} y1={py(i)} x2={px(10)} y2={py(i)} />
          ))}
        </g>

        {/* Axes */}
        <line className="tw-km-axis" x1={px(0)} y1={py(0)} x2={px(10)} y2={py(0)} />
        <line className="tw-km-axis" x1={px(0)} y1={py(0)} x2={px(0)} y2={py(10)} />

        {/* Ticks and Labels */}
        {Array.from({ length: 6 }).map((_, i) => (
          <text
            key={`tx-${i}`}
            className="tw-km-label"
            x={px(i * 2)}
            y={py(0) + 16}
            textAnchor="middle"
          >
            {i * 2}
          </text>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <text
            key={`ty-${i}`}
            className="tw-km-label"
            x={px(0) - 8}
            y={py(i * 2) + 4}
            textAnchor="end"
          >
            {i * 2}
          </text>
        ))}

        <text
          className="tw-km-label"
          x={PAD.l + plotW / 2}
          y={SVG_H - 10}
          textAnchor="middle"
          style={{ fontWeight: 600, fill: 'var(--ink)' }}
        >
          Feature X₁
        </text>
        <text
          className="tw-km-label"
          x={14}
          y={PAD.t + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${PAD.t + plotH / 2})`}
          style={{ fontWeight: 600, fill: 'var(--ink)' }}
        >
          Feature X₂
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

        {/* Distance Lines from points to their nearest centroid */}
        {showDistanceLines &&
          areCentroidsVisible &&
          areAssignmentsVisible &&
          ds.points.map((p, idx) => {
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

        {/* Data Points */}
        {ds.points.map((p, idx) => {
          const cIdx = areAssignmentsVisible ? assignments[idx] : null
          const fillColor =
            cIdx !== null && cIdx !== undefined
              ? CLUSTER_COLORS[cIdx].hex
              : UNASSIGNED_COLOR.hex
          return (
            <circle
              key={`pt-${idx}`}
              className="tw-km-point"
              cx={px(p[0])}
              cy={py(p[1])}
              r={5.5}
              fill={fillColor}
            >
              <title>{`Point (${p[0]}, ${p[1]})${cIdx !== null ? ` -> Cluster ${cIdx + 1}` : ''}`}</title>
            </circle>
          )
        })}

        {/* Centroid Markers */}
        {areCentroidsVisible &&
          centroids.map((c, idx) => {
            const col = CLUSTER_COLORS[idx]
            const cx = px(c[0])
            const cy = py(c[1])
            return (
              <g key={`cent-${idx}`} className="tw-km-centroid" transform={`translate(${cx}, ${cy})`}>
                {/* Outermost pulsing ring */}
                <circle r={14} fill={col.hex} opacity={0.2} />
                {/* White backing disc */}
                <circle r={10} fill="#fff" stroke={col.hex} strokeWidth={2.5} />
                {/* Cross marker */}
                <line x1={-5} y1={0} x2={5} y2={0} stroke={col.hex} strokeWidth={2} />
                <line x1={0} y1={-5} x2={0} y2={5} stroke={col.hex} strokeWidth={2} />
                {/* Coordinate label */}
                {showCoordinates && (
                  <text
                    x={0}
                    y={-14}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill={col.hex}
                  >
                    ({c[0]}, {c[1]})
                  </text>
                )}
              </g>
            )
          })}

        {/* Step 8 Convergence Banner */}
        {stepIndex === 7 && (
          <g transform={`translate(${SVG_W / 2}, ${PAD.t + 16})`}>
            <rect
              x="-85"
              y="-14"
              width="170"
              height="28"
              rx="14"
              fill="var(--good)"
              opacity="0.95"
            />
            <text
              x="0"
              y="4"
              fill="#fff"
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
            >
              ✓ Clusters Converged!
            </text>
          </g>
        )}
      </svg>
    </>
  )

  return (
    <TeacherWorkspaceLayout
      title="K-Means Clustering"
      subtitle="Demonstrate how K-Means groups data points by repeatedly assigning points to clusters and updating cluster centroids."
      controls={controlsElement}
      visualization={visualizationElement}
      explanationPanel={
        <TeacherExplanationPanel
          stepNumber={stepIndex + 1}
          totalSteps={KM_STEPS.length}
          stepTitle={curStep.title}
          whatIsHappening={curStep.what}
          whyItMatters={curStep.why}
          metrics={panelMetrics}
          talkingPoint={curStep.talkingPoint}
        />
      }
      playbackControls={
        <TeacherPlaybackControls
          currentStep={stepIndex}
          totalSteps={KM_STEPS.length}
          stepLabels={KM_STEPS.map((s) => s.label)}
          isPlaying={isPlaying}
          speed={speed}
          canPrev={stepIndex > 0}
          canNext={stepIndex < KM_STEPS.length - 1}
          onReset={() => resetSimulation()}
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onJumpStep={handleJumpStep}
          onSpeedChange={setSpeed}
        />
      }
    />
  )
}

export default TeacherKMeans
