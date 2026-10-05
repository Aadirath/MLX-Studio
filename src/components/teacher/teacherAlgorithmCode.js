// Python Tokenizer for Educational Code Viewer
export function tokenizePythonLine(line) {
  const commentIdx = line.indexOf('#')
  let codePart = line
  let commentPart = ''
  if (commentIdx !== -1) {
    codePart = line.slice(0, commentIdx)
    commentPart = line.slice(commentIdx)
  }

  const tokens = []
  const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?(?:e-?\d+)?\b|\b(?:def|class|import|for|in|if|else|elif|return|break|while|print|as|from|and|or|not)\b|\b(?:len|sum|range|abs|max|min|mean|argmin|norm|np|zeros|array|dataset)\b|[-+*/@=<>!]+|[^\s\w]+|\s+|\w+)/g

  let match
  while ((match = regex.exec(codePart)) !== null) {
    const text = match[0]
    let type = 'plain'
    if (/^["']/.test(text)) {
      type = 'string'
    } else if (/^\d/.test(text)) {
      type = 'number'
    } else if (/^(def|class|import|for|in|if|else|elif|return|break|while|print|as|from|and|or|not)$/.test(text)) {
      type = 'keyword'
    } else if (/^(len|sum|range|abs|max|min|mean|argmin|norm|np|zeros|array|dataset)$/.test(text)) {
      type = 'builtin'
    } else if (/^[-+*/@=<>!]+$/.test(text)) {
      type = 'operator'
    }
    tokens.push({ text, type })
  }

  if (commentPart) {
    tokens.push({ text: commentPart, type: 'comment' })
  }

  return tokens
}

// ==========================================
// 1. LINEAR REGRESSION
// ==========================================
export const LR_CODE = [
  "# 1. Load Data",
  "X = dataset['feature_x']",
  "y = dataset['target_y']",
  "N = len(X)",
  "",
  "# 2. Initialise Parameters",
  "slope = 0.00",
  "intercept = 0.00",
  "learning_rate = 0.05",
  "",
  "# 3. Model Prediction",
  "prediction = X * slope + intercept",
  "",
  "# 4. Calculate Residual Error",
  "error = prediction - y",
  "",
  "# 5. Compute Loss (MSE)",
  "loss = (1 / N) * sum(error ** 2)",
  "",
  "# 6. Calculate Gradients",
  "grad_slope = (2 / N) * sum(error * X)",
  "grad_intercept = (2 / N) * sum(error)",
  "",
  "# 7. Update Parameters",
  "slope = slope - learning_rate * grad_slope",
  "intercept = intercept - learning_rate * grad_intercept",
  "",
  "# 8. Repeat & Check Convergence",
  "if abs(grad_slope) < 1e-4 and abs(grad_intercept) < 1e-4:",
  "    print('Optimal regression fit converged!')",
]

export const LR_CODE_MAPPINGS = [
  { stepIndex: 0, lines: [1, 4], label: 'Load Data', visualNotice: 'Visualising observed scatter points (X, Y)' },
  { stepIndex: 1, lines: [6, 9], label: 'Initialise Parameters', visualNotice: 'Initial baseline hypothesis line ŷ = b₁·x + b₀ drawn' },
  { stepIndex: 2, lines: [11, 12], label: 'Prediction', visualNotice: 'Projected prediction points ŷᵢ placed along the line' },
  { stepIndex: 3, lines: [14, 15], label: 'Residual Error', visualNotice: 'Residual error lines (eᵢ = yᵢ - ŷᵢ) connect points to line' },
  { stepIndex: 4, lines: [17, 18], label: 'Compute Loss (MSE)', visualNotice: 'Squared error area boxes illustrate MSE penalty' },
  { stepIndex: 5, lines: [20, 22], label: 'Calculate Gradients', visualNotice: 'Gradient vectors measure direction of steepest error increase' },
  { stepIndex: 6, lines: [24, 26], label: 'Update Parameters', visualNotice: 'Regression line rotates and translates closer to data' },
  { stepIndex: 7, lines: [28, 29], label: 'Iterative Refinement', visualNotice: 'Successive descent steps shrink residuals towards optimum' },
  { stepIndex: 8, lines: [29, 30], label: 'Convergence Check', visualNotice: 'Gradient is zero; line coincides with analytical OLS fit' },
]

// ==========================================
// 2. K-MEANS CLUSTERING
// ==========================================
export const KM_CODE = [
  "# 1. Load Unlabelled Dataset",
  "X = dataset[['feature_1', 'feature_2']].values",
  "N = len(X)",
  "K = 3",
  "",
  "# 2. Initialise Centroids (K-Means++)",
  "centroids = init_centroids(X, K, strategy='spread')",
  "",
  "# 3. Calculate Distances to All Centroids",
  "distances = np.linalg.norm(X[:, None] - centroids, axis=2)",
  "",
  "# 4. Assign Points to Nearest Centroid",
  "labels = np.argmin(distances, axis=1)",
  "",
  "# 5. Recompute Centroids (Cluster Means)",
  "new_centroids = np.zeros((K, 2))",
  "for k in range(K):",
  "    new_centroids[k] = np.mean(X[labels == k], axis=0)",
  "",
  "# 6. Reassignment & Iteration Loop",
  "shift = np.max(np.linalg.norm(new_centroids - centroids, axis=1))",
  "centroids = new_centroids",
  "",
  "# 7. Check Convergence",
  "if shift < 0.02:",
  "    print('Centroids stabilized and converged!')",
]

export const KM_CODE_MAPPINGS = [
  { stepIndex: 0, lines: [1, 3], label: 'Load Dataset', visualNotice: 'Displaying raw unlabelled 2D data points' },
  { stepIndex: 1, lines: [4, 4], label: 'Select K', visualNotice: 'Setting number of cluster prototype centroids (K)' },
  { stepIndex: 2, lines: [6, 7], label: 'Initialise Centroids', visualNotice: 'Initial centroid prototype markers placed in feature space' },
  { stepIndex: 3, lines: [9, 13], label: 'Compute Distances & Assign', visualNotice: 'Points join nearest centroid; cluster colors assigned' },
  { stepIndex: 4, lines: [15, 18], label: 'Update Centroids', visualNotice: 'Centroids glide to cluster means (dashed movement trails)' },
  { stepIndex: 5, lines: [20, 21], label: 'Reassignment & Shift', visualNotice: 'Border points re-evaluated; maximum centroid shift measured' },
  { stepIndex: 6, lines: [21, 22], label: 'Iterative Loop', visualNotice: 'Alternating assignment and centroid updates minimize inertia' },
  { stepIndex: 7, lines: [24, 26], label: 'Convergence Check', visualNotice: 'Centroids stabilized (shift < threshold); final clusters fixed' },
]

// ==========================================
// 3. GRADIENT DESCENT
// ==========================================
export const GD_CODE = [
  "# 1. Initialise Model Parameters",
  "theta = np.array([initial_slope, initial_intercept])",
  "learning_rate = 0.30",
  "iteration = 0",
  "",
  "# 2. Calculate Loss at Current Position",
  "predictions = X * theta[0] + theta[1]",
  "error = predictions - y",
  "loss = (1 / (2 * N)) * np.sum(error ** 2)",
  "",
  "# 3. Calculate Gradient Vector (Steepest Ascent)",
  "grad_slope = (1 / N) * np.sum(error * X)",
  "grad_intercept = (1 / N) * np.sum(error)",
  "gradient = np.array([grad_slope, grad_intercept])",
  "",
  "# 4. Parameter Update (Take Downhill Step)",
  "step = learning_rate * gradient",
  "theta = theta - step",
  "iteration += 1",
  "",
  "# 5. Measure Error Drop",
  "new_loss = compute_loss(theta, X, y)",
  "delta_loss = loss - new_loss",
  "",
  "# 6. Repeat Iterations Along Trajectory",
  "# Successive steps descend the loss surface",
  "",
  "# 7. Check Convergence",
  "if np.linalg.norm(gradient) < 1e-4:",
  "    print('Reached bowl minimum (OLS optimal)!')",
]

export const GD_CODE_MAPPINGS = [
  { stepIndex: 0, lines: [1, 4], label: 'Initial Parameters', visualNotice: 'Starting parameter marker positioned on error surface' },
  { stepIndex: 1, lines: [6, 9], label: 'Compute Loss', visualNotice: 'Current MSE loss calculated and highlighted on landscape' },
  { stepIndex: 2, lines: [11, 14], label: 'Calculate Gradient', visualNotice: 'Rust arrow indicates direction of steepest uphill ascent (∇J)' },
  { stepIndex: 3, lines: [16, 19], label: 'Parameter Step', visualNotice: 'Green arrow shows downhill step (-α·∇J); parameter marker shifts' },
  { stepIndex: 4, lines: [21, 23], label: 'Error Drop', visualNotice: 'Verified loss decrease; model fit line on right updates' },
  { stepIndex: 5, lines: [25, 26], label: 'Iterative Trajectory', visualNotice: 'Descent path trail maps iterations rolling down the bowl' },
  { stepIndex: 6, lines: [28, 30], label: 'Convergence Check', visualNotice: 'Settled at gold star global minimum (gradient ≈ 0)' },
]

// ==========================================
// 4. SAFE TEACHER CODE EXECUTION ENGINE
// ==========================================
export function executeTeacherPythonCode(algorithmType, codeString) {
  try {
    if (!codeString || typeof codeString !== 'string' || !codeString.trim()) {
      return { success: false, error: 'Code cannot be empty.' }
    }

    // Bracket/Parenthesis Matching Check
    let parens = 0
    let brackets = 0
    for (const char of codeString) {
      if (char === '(') parens++
      if (char === ')') parens--
      if (char === '[') brackets++
      if (char === ']') brackets--
      if (parens < 0) return { success: false, error: 'Syntax Error: Unexpected closing parenthesis ")"' }
      if (brackets < 0) return { success: false, error: 'Syntax Error: Unexpected closing bracket "]"' }
    }
    if (parens !== 0) return { success: false, error: 'Syntax Error: Unclosed parenthesis "("' }
    if (brackets !== 0) return { success: false, error: 'Syntax Error: Unclosed bracket "["' }

    const extracted = {}
    const lines = codeString.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].split('#')[0].trim()
      if (!line) continue

      // Match assignments: variable = expression
      const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/)
      if (assignMatch) {
        const varName = assignMatch[1].trim()
        const rawExpr = assignMatch[2].trim()

        // Pure numbers
        if (/^-?\d+(?:\.\d+)?(?:e-?\d+)?$/.test(rawExpr)) {
          extracted[varName] = Number(rawExpr)
        }
        // Strings
        else if (/^["'](.+)["']$/.test(rawExpr)) {
          extracted[varName] = rawExpr.slice(1, -1)
        }
        // [num1, num2] arrays
        else if (/^\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]$/.test(rawExpr)) {
          const m = rawExpr.match(/^\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]$/)
          extracted[varName] = [Number(m[1]), Number(m[2])]
        }
        // np.array([num1, num2])
        else if (/^np\.array\(\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]\)$/.test(rawExpr)) {
          const m = rawExpr.match(/^np\.array\(\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]\)$/)
          extracted[varName] = [Number(m[1]), Number(m[2])]
        }
      }
    }

    return {
      success: true,
      extracted,
      message: 'Code executed successfully. Algorithmic parameters applied.',
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Error evaluating modified code.',
    }
  }
}

