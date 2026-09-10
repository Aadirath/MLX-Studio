export const TOPICS = {
  'linear-regression': {
    name: 'Linear regression',
    ico: '📈',
    blurb: 'Fit a line, tune parameters, see the error change.',
    objectives: [
      'Explain what the line is trying to minimise',
      'Predict the effect of changing the slope',
      'Read a residual plot',
    ],
    prereqs: ['Basic coordinate geometry'],
    time: '~15 min',
  },
  'k-means': {
    name: 'K-means clustering',
    ico: '✳︎',
    blurb: 'Group points, watch centroids move each iteration.',
    objectives: [
      'Explain how a point is assigned to a cluster',
      'Predict how a centroid will move',
      'Recognise convergence',
    ],
    prereqs: ['Basic coordinate geometry'],
    time: '~15 min',
  },
}

export const QUIZ = {
  'linear-regression': [
    {
      prompt:
        'If the fitted line sits below most points on the right side of the chart, what will gradient descent do to the slope next?',
      opts: ['Increase it', 'Decrease it', 'Leave it unchanged'],
      correct: 0,
      explain: 'Points above the line on the right pull it upward, so the slope grows to close that gap.',
    },
    {
      prompt: 'What does a lower MSE mean?',
      opts: ['The line fits the data better', 'The learning rate is too high', 'The dataset has more points'],
      correct: 0,
      explain: 'MSE measures average squared prediction error, so a smaller value means a closer fit.',
    },
  ],
  'k-means': [
    {
      prompt: 'After points are reassigned to their nearest centroid, what happens next?',
      opts: [
        'Centroids are recomputed as the mean of their assigned points',
        'The algorithm stops immediately',
        'A new cluster is added',
      ],
      correct: 0,
      explain: 'K-means alternates between assigning points and recomputing centroids as the mean of each group.',
    },
    {
      prompt: 'K-means has converged when...',
      opts: ['Centroids stop moving between iterations', 'The dataset gets sorted', 'All points belong to one cluster'],
      correct: 0,
      explain: 'Convergence means another iteration would not change the assignments or centroid positions.',
    },
  ],
}

export const TOPIC_PLAYGROUND_PATHS = {
  'linear-regression': '/linear-regression',
  'k-means': '/k-means',
}
