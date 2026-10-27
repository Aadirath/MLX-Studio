// Maps every pretest question to the idea it tests and to something the learner can do in the simulation.
// Keys are question positions in QUIZ[topicId], the same numbers PRETEST_ITEMS uses.
//
// The pretest shows right or wrong plus this pointer, but never the correct answer, so the posttest
// stays a fair before-and-after comparison.
export const PRETEST_MAP = {
  'linear-regression': {
    0: {
      concept: 'Using a trend to predict',
      tryThis: 'In the stage "Make a prediction", pick a price for the new flat before any line is drawn, then compare it with the trend.',
    },
    2: {
      concept: 'What a falling error (MSE) means',
      tryThis: 'In "Fit a line by hand", drag the sliders and watch the error number. It falls as the line follows the points.',
    },
    3: {
      concept: 'What the slope means',
      tryThis: 'In "Name the parts", change the steepness and read how much the price changes for every extra 100 sq ft.',
    },
    5: {
      concept: 'Why errors are squared',
      tryThis: 'In "Measure the error", compare a line with one huge gap against a line with several medium gaps, and see which scores worse.',
    },
    6: {
      concept: 'Outliers pull the line',
      tryThis: 'Open "Try your own data (sandbox)", add one point far above the line, and watch the best-fit line tilt towards it.',
    },
  },
  'k-means': {
    0: {
      concept: 'Nearest-centre assignment',
      tryThis: 'Press Step and watch which centre each point joins. Look closely at a point that sits between two centres.',
    },
    1: {
      concept: 'Centres move to the mean',
      tryThis: 'Press Step twice. The first step assigns points, the second moves each centre to the middle of its points.',
    },
    2: {
      concept: 'Convergence',
      tryThis: 'Run to the end and find the iteration where no point changes group and the centres stop moving.',
    },
    4: {
      concept: 'Choosing K too large',
      tryThis: 'Set K to 4 on the two-group data and compare the cost J with K = 2.',
    },
    7: {
      concept: 'K is a hyperparameter',
      tryThis: 'Change K before you press Run. The algorithm never chooses K for you.',
    },
  },
  'gradient-descent': {
    0: {
      concept: 'Each step goes downhill',
      tryThis: 'Press "Step forward" once and watch the point move across the error surface towards lower cost.',
    },
    2: {
      concept: 'Convergence',
      tryThis: 'Press "Run to convergence" and check that the cost stops changing as the path settles at the star.',
    },
    3: {
      concept: 'Learning rate is a hyperparameter',
      tryThis: 'Move the learning-rate slider. You set it before the run. The data does not teach it.',
    },
    4: {
      concept: 'Learning rate too high',
      tryThis: 'Set the learning rate to 1.10 and watch the path jump around and leave the chart.',
    },
    5: {
      concept: 'Learning rate too small',
      tryThis: 'Set the learning rate to 0.05 and count how many steps it takes to get anywhere.',
    },
  },
}

export function conceptFor(topicId, index) {
  return PRETEST_MAP[topicId]?.[index] ?? { concept: 'This question', tryThis: 'Revisit the theory and run the simulation.' }
}

// Concept names for the questions the learner got wrong.
export function conceptsMissed(topicId, correctByItem = {}) {
  return Object.entries(correctByItem)
    .filter(([, ok]) => !ok)
    .map(([i]) => conceptFor(topicId, Number(i)).concept)
}
