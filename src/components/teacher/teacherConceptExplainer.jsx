// Pure computational explainer helper functions for Teacher Concept Whiteboard
// Connects live algorithm state to: Observation -> Why -> Formula -> Substitution -> Calculation -> Code

// Format numbers for display without floating point ugliness
export function formatNum(val, decimals = 2) {
  if (val === null || val === undefined || !Number.isFinite(val)) return '0.00'
  return Number(val).toFixed(decimals)
}

// ==========================================
// 1. K-MEANS EXPLANATIONS
// ==========================================

export function explainKMeansPoint(point, pointIndex, centroids, assignments, col1 = 'Feature 1', col2 = 'Feature 2') {
  const [px, py] = point
  const assignedCluster = assignments[pointIndex]
  const clusterLabel = assignedCluster !== null && assignedCluster !== undefined ? `Cluster ${assignedCluster + 1}` : 'Unassigned'

  // Calculate distance to each centroid
  const distances = centroids.map((c, cIdx) => {
    const dx = px - c[0]
    const dy = py - c[1]
    const dSquared = dx * dx + dy * dy
    const dist = Math.sqrt(dSquared)
    return {
      cIdx,
      cName: `Centroid C${cIdx + 1}`,
      coords: `(${formatNum(c[0])}, ${formatNum(c[1])})`,
      dx: formatNum(dx),
      dy: formatNum(dy),
      distNum: dist,
      dist: formatNum(dist),
      distSq: formatNum(dSquared),
    }
  })

  // Find nearest centroid
  let minIdx = 0
  for (let i = 1; i < distances.length; i++) {
    if (distances[i].distNum < distances[minIdx].distNum) {
      minIdx = i
    }
  }

  const nearest = distances[minIdx]

  return {
    type: 'point',
    badge: `POINT P#${pointIndex + 1}`,
    title: `Point (${formatNum(px)}, ${formatNum(py)}) · ${clusterLabel}`,
    coords: { x: px, y: py },
    question: `Why is this point assigned to ${clusterLabel}?`,
    observation: `This data point has coordinates ${col1} = ${formatNum(px)} and ${col2} = ${formatNum(py)}. To decide which cluster it belongs to, K-Means calculates its Euclidean distance to all ${centroids.length} centroids and assigns it to the closest one.`,
    formula: {
      name: 'Euclidean Distance Formula',
      symbolic: 'd(P, C) = √((x_P - x_C)² + (y_P - y_C)²)',
      html: (
        <span className="tc-math-expr">
          <i>d</i>(<b>P</b>, <b>C</b><sub>k</sub>) = &radic;<span className="tc-radicand">(<i>x</i><sub>P</sub> &minus; <i>x</i><sub>C<sub>k</sub></sub>)<sup>2</sup> + (<i>y</i><sub>P</sub> &minus; <i>y</i><sub>C<sub>k</sub></sub>)<sup>2</sup></span>
        </span>
      ),
      note: 'Measures straight-line distance in the 2D feature space. The point chooses whichever centroid produces the minimum distance.',
    },
    substitution: {
      title: 'Distances to All Centroids:',
      items: distances.map((d) => ({
        label: `${d.cName} at ${d.coords}:`,
        expr: `√(( ${formatNum(px)} − ${formatNum(centroids[d.cIdx][0])} )² + ( ${formatNum(py)} − ${formatNum(centroids[d.cIdx][1])} )²)`,
        result: `${d.dist}`,
        isBest: d.cIdx === minIdx,
        tag: d.cIdx === minIdx ? '★ MINIMUM' : '',
      })),
    },
    calculation: {
      steps: [
        `1. Calculate Euclidean distance from (${formatNum(px)}, ${formatNum(py)}) to each centroid.`,
        `2. Compare distance values: ${distances.map((d) => `${d.cName} = ${d.dist}`).join('  vs  ')}.`,
        `3. Centroid C${minIdx + 1} has the shortest distance (${nearest.dist}).`,
      ],
      conclusion: `Therefore, Point P#${pointIndex + 1} joins Cluster ${minIdx + 1}.`,
    },
    code: {
      snippet: `# 1. Compute Euclidean distance to all centroids\ndistances = np.sqrt(np.sum((point - centroids) ** 2, axis=1))\n\n# 2. Select closest centroid index\nassigned_cluster = np.argmin(distances)  # returns ${minIdx}`,
      explanation: 'np.argmin(distances) picks the centroid with the smallest Euclidean distance, mathematically partitioning the plane into Voronoi cells.',
    },
  }
}

export function explainKMeansTwoPoints(pointA, pointB, indexA, indexB, _col1 = 'Feature 1', _col2 = 'Feature 2') {
  const [x1, y1] = pointA
  const [x2, y2] = pointB
  const dx = x2 - x1
  const dy = y2 - y1
  const dSquared = dx * dx + dy * dy
  const dist = Math.sqrt(dSquared)

  return {
    type: 'two_points',
    badge: 'DISTANCE RULER',
    title: `Point A (#${indexA + 1}) vs Point B (#${indexB + 1})`,
    coordsA: { x: x1, y: y1 },
    coordsB: { x: x2, y: y2 },
    question: `What is the geometric distance between Point A and Point B?`,
    observation: `Point A is at (${formatNum(x1)}, ${formatNum(y1)}) and Point B is at (${formatNum(x2)}, ${formatNum(y2)}). The distance ruler illustrates how similarity is measured in unsupervised clustering.`,
    formula: {
      name: 'Pairwise Euclidean Distance',
      symbolic: 'd(A, B) = √((x₂ - x₁)² + (y₂ - y₁)²) = √(Δx² + Δy²)',
      html: (
        <span className="tc-math-expr">
          <i>d</i>(<b>A</b>, <b>B</b>) = &radic;<span className="tc-radicand">(&Delta;<i>x</i>)<sup>2</sup> + (&Delta;<i>y</i>)<sup>2</sup></span> = &radic;<span className="tc-radicand">(<i>x</i><sub>2</sub> &minus; <i>x</i><sub>1</sub>)<sup>2</sup> + (<i>y</i><sub>2</sub> &minus; <i>y</i><sub>1</sub>)<sup>2</sup></span>
        </span>
      ),
      note: 'Pythagorean distance between two points in 2-dimensional feature space.',
    },
    substitution: {
      title: 'Value Substitution:',
      items: [
        {
          label: 'Difference in X (Δx):',
          expr: `${formatNum(x2)} − ${formatNum(x1)}`,
          result: `${formatNum(dx)}  (squared: ${formatNum(dx * dx)})`,
        },
        {
          label: 'Difference in Y (Δy):',
          expr: `${formatNum(y2)} − ${formatNum(y1)}`,
          result: `${formatNum(dy)}  (squared: ${formatNum(dy * dy)})`,
        },
        {
          label: 'Total Distance:',
          expr: `&radic;( (${formatNum(dx)})² + (${formatNum(dy)})² ) = &radic;( ${formatNum(dx * dx)} + ${formatNum(dy * dy)} )`,
          result: `${formatNum(dist)}`,
          isBest: true,
          tag: 'RESULT',
        },
      ],
    },
    calculation: {
      steps: [
        `1. Calculate horizontal difference: Δx = ${formatNum(x2)} − ${formatNum(x1)} = ${formatNum(dx)}`,
        `2. Calculate vertical difference: Δy = ${formatNum(y2)} − ${formatNum(y1)} = ${formatNum(dy)}`,
        `3. Sum the squares: (${formatNum(dx)})² + (${formatNum(dy)})² = ${formatNum(dSquared)}`,
        `4. Take square root: √${formatNum(dSquared)} = ${formatNum(dist)}`,
      ],
      conclusion: `The distance between Point A and Point B is ${formatNum(dist)} units.`,
    },
    code: {
      snippet: `import numpy as np\n\npoint_a = np.array([${formatNum(x1)}, ${formatNum(y1)}])\npoint_b = np.array([${formatNum(x2)}, ${formatNum(y2)}])\n\n# Pairwise Euclidean distance\ndistance = np.linalg.norm(point_a - point_b)  # -> ${formatNum(dist)}`,
      explanation: 'np.linalg.norm computes the L2 norm (Euclidean distance) in any number of dimensions.',
    },
  }
}

export function explainKMeansCentroid(centroid, centroidIndex, points, assignments, _col1 = 'Feature 1', _col2 = 'Feature 2') {
  const [cx, cy] = centroid
  const cName = `Centroid C${centroidIndex + 1}`

  // Find cluster members
  const memberIndices = []
  let sumX = 0
  let sumY = 0
  points.forEach((p, idx) => {
    if (assignments[idx] === centroidIndex) {
      memberIndices.push(idx)
      sumX += p[0]
      sumY += p[1]
    }
  })

  const N = memberIndices.length
  const meanX = N > 0 ? sumX / N : cx
  const meanY = N > 0 ? sumY / N : cy

  // Sample members for display
  const sampleMembers = memberIndices.slice(0, 5).map((idx) => points[idx])
  const remainingCount = N - sampleMembers.length

  return {
    type: 'centroid',
    badge: `${cName.toUpperCase()}`,
    title: `${cName} at (${formatNum(cx)}, ${formatNum(cy)}) · ${N} Assigned Points`,
    coords: { x: cx, y: cy },
    question: `Why did ${cName} move to this position?`,
    observation: `${cName} is the center of mass for Cluster ${centroidIndex + 1}. Once points are assigned, K-Means recalculates each centroid as the arithmetic mean of all points assigned to that cluster.`,
    formula: {
      name: 'Centroid Update Formula (Cluster Mean)',
      symbolic: 'C_x = (1 / N) * ∑ x_i,   C_y = (1 / N) * ∑ y_i',
      html: (
        <span className="tc-math-expr">
          <b>C</b><sub>{centroidIndex + 1}</sub> = (
          <span className="tc-math-frac">
            <span className="tc-num">1</span>
            <span className="tc-den"><i>N</i></span>
          </span>
          &sum; <i>x</i><sub><i>i</i></sub>, &nbsp;
          <span className="tc-math-frac">
            <span className="tc-num">1</span>
            <span className="tc-den"><i>N</i></span>
          </span>
          &sum; <i>y</i><sub><i>i</i></sub>
          )
        </span>
      ),
      note: 'The arithmetic mean is mathematically proven to minimize the sum of squared distances to all points in the cluster.',
    },
    substitution: {
      title: `Mean Calculation for ${N} Points in Cluster ${centroidIndex + 1}:`,
      items: [
        {
          label: `Cluster Size (N):`,
          expr: `${N} data points currently assigned`,
          result: `N = ${N}`,
        },
        {
          label: `New X Coordinate:`,
          expr: `(${sampleMembers.map((p) => formatNum(p[0])).join(' + ')}${remainingCount > 0 ? ` + ... ${remainingCount} more` : ''}) / ${N}`,
          result: `${formatNum(sumX)} / ${N} = ${formatNum(meanX)}`,
          isBest: true,
          tag: 'X_MEAN',
        },
        {
          label: `New Y Coordinate:`,
          expr: `(${sampleMembers.map((p) => formatNum(p[1])).join(' + ')}${remainingCount > 0 ? ` + ... ${remainingCount} more` : ''}) / ${N}`,
          result: `${formatNum(sumY)} / ${N} = ${formatNum(meanY)}`,
          isBest: true,
          tag: 'Y_MEAN',
        },
      ],
    },
    calculation: {
      steps: [
        `1. Identify all points with label == ${centroidIndex} (total N = ${N}).`,
        `2. Sum all X coordinates: ∑ x = ${formatNum(sumX)}.`,
        `3. Divide by N: ${formatNum(sumX)} / ${N} = ${formatNum(meanX)}.`,
        `4. Sum all Y coordinates: ∑ y = ${formatNum(sumY)}.`,
        `5. Divide by N: ${formatNum(sumY)} / ${N} = ${formatNum(meanY)}.`,
      ],
      conclusion: `${cName} relocates to (${formatNum(meanX)}, ${formatNum(meanY)}).`,
    },
    code: {
      snippet: `# Recompute centroid as arithmetic mean of cluster points\ncluster_points = X[labels == ${centroidIndex}]\n\ncentroid_x = np.mean(cluster_points[:, 0])  # -> ${formatNum(meanX)}\ncentroid_y = np.mean(cluster_points[:, 1])  # -> ${formatNum(meanY)}\n\nnew_centroid = np.array([centroid_x, centroid_y])`,
      explanation: 'np.mean(axis=0) computes the column-wise mean, moving the centroid to the exact spatial centroid of its members.',
    },
  }
}

// ==========================================
// 2. LINEAR REGRESSION EXPLANATIONS
// ==========================================

export function explainLRPoint(point, pointIndex, b1, b0, xLabel = 'X', yLabel = 'Y', totalMSE = 0, nPoints = 1) {
  const { x, y } = point
  const prediction = b1 * x + b0
  const residual = y - prediction
  const residualSq = residual * residual
  const mseContribution = nPoints > 0 ? residualSq / nPoints : residualSq

  return {
    type: 'point',
    badge: `OBSERVED POINT #${pointIndex + 1}`,
    title: `Point (${formatNum(x)}, ${formatNum(y)}) · Error = ${formatNum(residual)}`,
    coords: { x, y },
    question: `Why does this point have an error of ${formatNum(residual)}?`,
    observation: `At ${xLabel} = ${formatNum(x)}, the actual observed target is ${yLabel} = ${formatNum(y)}. However, the regression model ŷ = ${formatNum(b1)}x + ${formatNum(b0)} predicts ŷ = ${formatNum(prediction)}. The vertical difference is the residual error.`,
    formula: {
      name: 'Prediction & Residual Error Formula',
      symbolic: 'ŷ = b₁·x + b₀,   e = y - ŷ,   Loss contribution = e² / N',
      html: (
        <span className="tc-math-expr">
          <i>ŷ</i> = <i>b</i><sub>1</sub><i>x</i> + <i>b</i><sub>0</sub>, &nbsp;&nbsp;
          <i>e</i> = <i>y</i> &minus; <i>ŷ</i>, &nbsp;&nbsp;
          SE = <i>e</i><sup>2</sup> = (<i>y</i> &minus; <i>ŷ</i>)<sup>2</sup>
        </span>
      ),
      note: 'The vertical red dashed line on the graph represents the residual error. The square box represents its squared error penalty.',
    },
    substitution: {
      title: 'Prediction and Error Calculation:',
      items: [
        {
          label: 'Model Prediction (ŷ):',
          expr: `(${formatNum(b1)}) · (${formatNum(x)}) + (${formatNum(b0)})`,
          result: `${formatNum(prediction)}`,
          tag: 'PREDICTION',
        },
        {
          label: 'Residual Error (e):',
          expr: `Actual Y (${formatNum(y)}) − Predicted ŷ (${formatNum(prediction)})`,
          result: `${formatNum(residual)}`,
          tag: residual >= 0 ? '+ UNDERPREDICTED' : '− OVERPREDICTED',
        },
        {
          label: 'Squared Error (e²):',
          expr: `(${formatNum(residual)})²`,
          result: `${formatNum(residualSq)}`,
          isBest: true,
          tag: 'PENALTY',
        },
        {
          label: 'Contribution to Total MSE:',
          expr: `(${formatNum(residualSq)}) / ${nPoints} points`,
          result: `${formatNum(mseContribution)}  (Total MSE: ${formatNum(totalMSE)})`,
        },
      ],
    },
    calculation: {
      steps: [
        `1. Calculate predicted ŷ: ${formatNum(b1)} · ${formatNum(x)} + ${formatNum(b0)} = ${formatNum(prediction)}.`,
        `2. Subtract predicted from actual: ${formatNum(y)} − ${formatNum(prediction)} = ${formatNum(residual)}.`,
        `3. Square the error: (${formatNum(residual)})² = ${formatNum(residualSq)}.`,
        `4. This single point accounts for ${formatNum((residualSq / (totalMSE * nPoints || 1)) * 100, 1)}% of total error!`,
      ],
      conclusion: `The vertical line shows error e = ${formatNum(residual)}. The squared error is ${formatNum(residualSq)}.`,
    },
    code: {
      snippet: `# Prediction for point x\nprediction = ${formatNum(x)} * slope + intercept  # -> ${formatNum(prediction)}\n\n# Residual error\nerror = ${formatNum(y)} - prediction  # -> ${formatNum(residual)}\n\n# Squared error penalty\nsquared_error = error ** 2  # -> ${formatNum(residualSq)}`,
      explanation: 'Linear regression optimizes parameters by adjusting slope and intercept to minimize the average of these squared errors (MSE).',
    },
  }
}

export function explainLRTwoPoints(pointA, pointB, indexA, indexB, _xLabel = 'X', _yLabel = 'Y') {
  const dx = pointB.x - pointA.x
  const dy = pointB.y - pointA.y
  const slope = dx !== 0 ? dy / dx : 0
  const intercept = pointA.y - slope * pointA.x

  return {
    type: 'two_points',
    badge: 'TWO-POINT SECANT LINE',
    title: `Point A (#${indexA + 1}) to Point B (#${indexB + 1}) · Slope m = ${formatNum(slope)}`,
    coordsA: pointA,
    coordsB: pointB,
    question: `What is the slope and line connecting these two points?`,
    observation: `Point A is at (${formatNum(pointA.x)}, ${formatNum(pointA.y)}) and Point B is at (${formatNum(pointB.x)}, ${formatNum(pointB.y)}). The dashed secant line shows the instantaneous rate of change between these two observations.`,
    formula: {
      name: 'Slope & Line Equation Formula',
      symbolic: 'm = (y₂ - y₁) / (x₂ - x₁),   b = y₁ - m·x₁',
      html: (
        <span className="tc-math-expr">
          <i>m</i> =
          <span className="tc-math-frac">
            <span className="tc-num"><i>y</i><sub>2</sub> &minus; <i>y</i><sub>1</sub></span>
            <span className="tc-den"><i>x</i><sub>2</sub> &minus; <i>x</i><sub>1</sub></span>
          </span>
          =
          <span className="tc-math-frac">
            <span className="tc-num">&Delta;<i>y</i></span>
            <span className="tc-den">&Delta;<i>x</i></span>
          </span>
        </span>
      ),
      note: 'Slope measures how much Y increases per 1-unit increase in X between these two points.',
    },
    substitution: {
      title: 'Slope Calculation:',
      items: [
        {
          label: 'Change in Y (Δy):',
          expr: `${formatNum(pointB.y)} − ${formatNum(pointA.y)}`,
          result: `${formatNum(dy)}`,
        },
        {
          label: 'Change in X (Δx):',
          expr: `${formatNum(pointB.x)} − ${formatNum(pointA.x)}`,
          result: `${formatNum(dx)}`,
        },
        {
          label: 'Secant Slope (m):',
          expr: `(${formatNum(dy)}) / (${formatNum(dx)})`,
          result: `${formatNum(slope)}`,
          isBest: true,
          tag: 'SLOPE',
        },
        {
          label: 'Intercept (b):',
          expr: `${formatNum(pointA.y)} − (${formatNum(slope)}) · (${formatNum(pointA.x)})`,
          result: `${formatNum(intercept)}`,
          tag: 'INTERCEPT',
        },
      ],
    },
    calculation: {
      steps: [
        `1. Calculate vertical delta: Δy = ${formatNum(pointB.y)} − ${formatNum(pointA.y)} = ${formatNum(dy)}.`,
        `2. Calculate horizontal delta: Δx = ${formatNum(pointB.x)} − ${formatNum(pointA.x)} = ${formatNum(dx)}.`,
        `3. Compute ratio: ${formatNum(dy)} / ${formatNum(dx)} = ${formatNum(slope)}.`,
      ],
      conclusion: `Connecting line: ŷ = ${formatNum(slope)}·x + ${formatNum(intercept)}.`,
    },
    code: {
      snippet: `dx = ${formatNum(pointB.x)} - ${formatNum(pointA.x)}\ndy = ${formatNum(pointB.y)} - ${formatNum(pointA.y)}\n\nslope = dy / dx  # -> ${formatNum(slope)}\nintercept = ${formatNum(pointA.y)} - slope * ${formatNum(pointA.x)}  # -> ${formatNum(intercept)}`,
      explanation: 'While two points uniquely define a line, OLS linear regression finds the best-fit line across ALL points simultaneously.',
    },
  }
}

export function explainLRLine(b1, b0, ols, currentMSE, learningRate = 0.05, xLabel = 'X', yLabel = 'Y') {
  const slopeDiff = ols ? b1 - ols.b1 : 0
  const interceptDiff = ols ? b0 - ols.b0 : 0

  return {
    type: 'line',
    badge: 'HYPOTHESIS MODEL LINE',
    title: `Current Line: ŷ = ${formatNum(b1)}x + ${formatNum(b0)} (MSE: ${formatNum(currentMSE)})`,
    question: `How does the algorithm adjust this regression line?`,
    observation: `The current model predicts ${yLabel} using slope b₁ = ${formatNum(b1)} and intercept b₀ = ${formatNum(b0)}. The target analytical OLS optimal line is ŷ = ${formatNum(ols?.b1 || 0)}x + ${formatNum(ols?.b0 || 0)}.`,
    formula: {
      name: 'Gradient Descent Parameter Update Rule',
      symbolic: 'b₁ ← b₁ - α · (∂MSE / ∂b₁),   b₀ ← b₀ - α · (∂MSE / ∂b₀)',
      html: (
        <span className="tc-math-expr">
          <i>b</i><sub>1</sub> &larr; <i>b</i><sub>1</sub> &minus; &alpha; &middot;
          <span className="tc-math-frac">
            <span className="tc-num">&part;MSE</span>
            <span className="tc-den">&part;<i>b</i><sub>1</sub></span>
          </span>
          , &nbsp;&nbsp;
          <i>b</i><sub>0</sub> &larr; <i>b</i><sub>0</sub> &minus; &alpha; &middot;
          <span className="tc-math-frac">
            <span className="tc-num">&part;MSE</span>
            <span className="tc-den">&part;<i>b</i><sub>0</sub></span>
          </span>
        </span>
      ),
      note: 'Learning rate α determines step size. The partial derivatives specify how much the error changes when tweaking slope and intercept.',
    },
    substitution: {
      title: 'Current Parameter Status & OLS Benchmark:',
      items: [
        {
          label: 'Current Slope (b₁):',
          expr: `${formatNum(b1)}  (OLS Optimum: ${formatNum(ols?.b1 || 0)})`,
          result: `Gap: ${formatNum(slopeDiff)}`,
        },
        {
          label: 'Current Intercept (b₀):',
          expr: `${formatNum(b0)}  (OLS Optimum: ${formatNum(ols?.b0 || 0)})`,
          result: `Gap: ${formatNum(interceptDiff)}`,
        },
        {
          label: 'Current Loss (MSE):',
          expr: `Mean of squared residuals across all points`,
          result: `MSE = ${formatNum(currentMSE)}`,
          isBest: true,
          tag: 'LOSS',
        },
        {
          label: 'Active Learning Rate (α):',
          expr: `Step multiplier`,
          result: `α = ${learningRate}`,
        },
      ],
    },
    calculation: {
      steps: [
        `1. Calculate predictions ŷ = ${formatNum(b1)}x + ${formatNum(b0)} for all data points.`,
        `2. Calculate error e = y − ŷ for every point.`,
        `3. Compute gradients: ∂MSE/∂b₁ = -(2/N)∑ x·e,  ∂MSE/∂b₀ = -(2/N)∑ e.`,
        `4. Update parameters by taking a step proportional to learning rate α = ${learningRate}.`,
      ],
      conclusion: `As iterations proceed, slope and intercept adjust until gradients reach 0 at the minimum MSE.`,
    },
    code: {
      snippet: `# Parameter update step\ngrad_slope = (2 / N) * np.sum(error * X)\ngrad_intercept = (2 / N) * np.sum(error)\n\nslope = slope - learning_rate * grad_slope\nintercept = intercept - learning_rate * grad_intercept`,
      explanation: 'Each gradient update rotates and translates the regression line to reduce total squared error.',
    },
  }
}

// ==========================================
// 3. GRADIENT DESCENT EXPLANATIONS
// ==========================================

export function explainGDPoint(b1, b0, learningRate, dm, db, currentMSE, stats, pathLength = 1) {
  const stepSizeM = -learningRate * dm
  const stepSizeB = -learningRate * db
  const nextB1 = b1 + stepSizeM
  const nextB0 = b0 + stepSizeB
  const gradMagnitude = Math.sqrt(dm * dm + db * db)

  return {
    type: 'gradient_point',
    badge: `LANDSCAPE POSITION (STEP #${pathLength})`,
    title: `θ = [b₁: ${formatNum(b1)}, b₀: ${formatNum(b0)}] · Loss = ${formatNum(currentMSE)}`,
    coords: { b1, b0 },
    question: `Why does Gradient Descent step in this direction?`,
    observation: `The current parameter state is at slope b₁ = ${formatNum(b1)} and intercept b₀ = ${formatNum(b0)}. The gradient vector points in the direction of steepest uphill error ascent. Gradient descent takes a step in the EXACT OPPOSITE direction (downhill).`,
    formula: {
      name: 'Downhill Gradient Update Formula',
      symbolic: 'θ_new = θ_old - α · ∇J(θ)',
      html: (
        <span className="tc-math-expr">
          <b>&theta;</b><sub>new</sub> = <b>&theta;</b><sub>old</sub> &minus; &alpha; &middot; &nabla;<i>J</i>(<b>&theta;</b>) =
          [ <i>b</i><sub>1</sub> &minus; &alpha; &middot; <i>g</i><sub>1</sub>, &nbsp; <i>b</i><sub>0</sub> &minus; &alpha; &middot; <i>g</i><sub>0</sub> ]
        </span>
      ),
      note: 'The rust arrow indicates steepest uphill gradient (∇J). The green arrow indicates the negative gradient step (-α·∇J).',
    },
    substitution: {
      title: 'Gradient Vector and Step Size Calculation:',
      items: [
        {
          label: 'Current Gradient (∇J):',
          expr: `[ ∂J/∂b₁: ${formatNum(dm)},  ∂J/∂b₀: ${formatNum(db)} ]`,
          result: `Magnitude: ${formatNum(gradMagnitude)}`,
          tag: 'UPHILL',
        },
        {
          label: 'Learning Rate (α):',
          expr: `Step size scalar`,
          result: `α = ${learningRate}`,
        },
        {
          label: 'Slope Step (-α · dm):',
          expr: `−(${learningRate}) · (${formatNum(dm)})`,
          result: `${formatNum(stepSizeM, 3)}`,
          tag: 'Δb₁',
        },
        {
          label: 'Intercept Step (-α · db):',
          expr: `−(${learningRate}) · (${formatNum(db)})`,
          result: `${formatNum(stepSizeB, 3)}`,
          tag: 'Δb₀',
        },
      ],
    },
    calculation: {
      steps: [
        `1. Evaluate partial derivatives at current coordinates: [${formatNum(dm)}, ${formatNum(db)}].`,
        `2. Scale by learning rate: α · ∇J = [${formatNum(learningRate * dm, 3)}, ${formatNum(learningRate * db, 3)}].`,
        `3. Subtract from current position: b₁ = ${formatNum(b1)} + (${formatNum(stepSizeM, 3)}) = ${formatNum(nextB1, 3)}.`,
        `4. Intercept update: b₀ = ${formatNum(b0)} + (${formatNum(stepSizeB, 3)}) = ${formatNum(nextB0, 3)}.`,
      ],
      conclusion: `The parameter vector advances to [${formatNum(nextB1, 3)}, ${formatNum(nextB0, 3)}], descending toward the gold star optimum.`,
    },
    code: {
      snippet: `# Compute gradient vector\ngradient = np.array([grad_slope, grad_intercept])\n\n# Take downhill step\nstep = -learning_rate * gradient\ntheta = theta + step\n\n# -> New theta: [${formatNum(nextB1, 3)}, ${formatNum(nextB0, 3)}]`,
      explanation: 'Negative gradient ensures descent down the convex quadratic loss surface bowl toward the global minimum.',
    },
  }
}
