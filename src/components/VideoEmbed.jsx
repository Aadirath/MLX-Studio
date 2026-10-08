import './VideoEmbed.css'

function VideoEmbed({ video }) {
  if (!video || !video.youtubeId) return null

  const { youtubeId, title, channel, note } = video

  return (
    <figure className="videoEmbed">
      <div className="videoFrame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title={`Video: ${title} by ${channel}`}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption>
        <div className="videoTitle">{title}</div>
        <div className="videoChannel">Video by {channel}</div>
        <a
          className="videoLink"
          href={`https://www.youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on YouTube
        </a>
        {note && (
          <>
            <h3 className="videoNoteHeading">What to look for</h3>
            <p className="videoNote">{note}</p>
          </>
        )}
      </figcaption>
    </figure>
  )
}

export default VideoEmbed
