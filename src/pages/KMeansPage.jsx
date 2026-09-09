import KMeans from '../components/KMeans.jsx'

function KMeansPage() {
  return (
    <section>
      <h1>K-means clustering</h1>
      <p>Group points, watch centroids move each iteration.</p>
      <KMeans />
    </section>
  )
}

export default KMeansPage
