import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward } from 'lucide-react';
import Hls from 'hls.js';

const Dropdown = ({ value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value == value);
  const displayLabel = selectedOpt ? selectedOpt.shortLabel || selectedOpt.label : label;

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <button className="dropdown-btn" onClick={() => setIsOpen(!isOpen)}>
        {displayLabel}
      </button>
      <div className={`dropdown-menu ${isOpen ? 'dropdown-open' : 'dropdown-closed'}`}>
         <div className="dropdown-content">
            {options.map(opt => (
              <div 
                key={opt.value} 
                className={`dropdown-item ${opt.value == value ? 'dropdown-item-active' : ''}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const CustomPlayer = ({ 
  src, 
  poster, 
  kodikData, 
  activeTranslation, 
  activeEpisode, 
  animeId,
  animeTitle,
  showToast,
  syncCommand,
  onPlay,
  onPause,
  onSeek,
  onTranslationChange, 
  onEpisodeChange 
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [initialSeekDoneForEpisode, setInitialSeekDoneForEpisode] = useState(null);
  const [resumePromptTime, setResumePromptTime] = useState(null);
  const [skipIndicator, setSkipIndicator] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const lastTapRef = useRef({ time: 0 });

  const [internalSrc, setInternalSrc] = useState(src);

  useEffect(() => {
    setInternalSrc(src);
    if (!src) return;
    
    // Guess available qualities for Kodik urls (they end with 720.mp4:hls:manifest.m3u8)
    const match = src.match(/\/(\d+)\.mp4:hls/);
    if (match) {
      const maxQ = parseInt(match[1]);
      setQualities([360, 480, 720, 1080]); // Always allow 1080p
      setCurrentQuality(maxQ.toString());
    } else {
      setQualities([]);
    }
  }, [src]);

  useEffect(() => {
    if (!internalSrc || !videoRef.current) return;

    const video = videoRef.current;
    let timeToRestore = video.currentTime;
    
    // Handle history restore only when video is at the start
    if (video.currentTime === 0 && animeId && initialSeekDoneForEpisode !== activeEpisode) {
      const history = JSON.parse(localStorage.getItem('neoanime_history')) || {};
      if (history[animeId] && history[animeId].episode === activeEpisode) {
        if (history[animeId].time > 5) {
          setResumePromptTime(history[animeId].time);
        }
      }
      setInitialSeekDoneForEpisode(activeEpisode);
    }

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      const isCurrentlyPlaying = !video.paused;
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 60,
        startPosition: timeToRestore > 0 ? timeToRestore : -1,
      });
      hlsRef.current = hls;

      hls.loadSource(internalSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Only set qualities from HLS if it actually has multiple valid heights
        const availableQualities = hls.levels.map(l => l.height).filter(h => h > 0);
        if (availableQualities.length > 0) {
           setQualities(availableQualities);
        }
        
        // Ensure seamless playback continuation
        if (isCurrentlyPlaying || isPlaying || timeToRestore > 0) {
           video.play().catch(e => console.log('Autoplay blocked:', e));
           setIsPlaying(true);
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error encountered, try to recover');
              if (currentQuality === '1080' && internalSrc.includes('1080.mp4')) {
                console.log('1080p not available, falling back to 720p');
                setCurrentQuality('720');
                setInternalSrc(internalSrc.replace('1080.mp4', '720.mp4'));
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error encountered, try to recover');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = internalSrc;
      if (timeToRestore > 0) {
        video.currentTime = timeToRestore;
      }
      video.addEventListener('loadedmetadata', () => {
        if (timeToRestore > 0) video.currentTime = timeToRestore;
        if (isPlaying || timeToRestore > 0) {
          video.play().catch(e => console.log('Autoplay blocked:', e));
          setIsPlaying(true);
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [internalSrc]);

  useEffect(() => {
    if (!syncCommand || !videoRef.current) return;
    const video = videoRef.current;
    
    // We only apply the sync command if the time diff is significant or it's a state change
    if (syncCommand.action === 'seek') {
      video.currentTime = syncCommand.time;
    } else if (syncCommand.action === 'play') {
      if (Math.abs(video.currentTime - syncCommand.time) > 2) {
        video.currentTime = syncCommand.time;
      }
      video.play().catch(e => console.log('Autoplay blocked:', e));
      setIsPlaying(true);
    } else if (syncCommand.action === 'pause') {
      video.currentTime = syncCommand.time;
      video.pause();
      setIsPlaying(false);
    }
  }, [syncCommand]);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      if (onPlay) onPlay(videoRef.current.currentTime);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause(videoRef.current.currentTime);
    }
  };
  
  const handleVideoTap = (e) => {
    const now = Date.now();
    const lastTap = lastTapRef.current.time;
    const isMobile = window.innerWidth <= 768;

    if (now - lastTap < 300) {
      // Double tap detected
      if (containerRef.current && videoRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.changedTouches ? e.changedTouches[0].clientX : 0);
        const clickX = clientX - rect.left;
        const isRightSide = clickX > rect.width / 2;
        
        if (isRightSide) {
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
          setSkipIndicator({ type: 'forward', text: '+ 5 ???�??', key: Date.now() });
        } else {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          setSkipIndicator({ type: 'backward', text: '- 5 ???�??', key: Date.now() });
        }
        
        // Ensure video is playing after double tap
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        if (onSeek) onSeek(videoRef.current.currentTime);
        if (onPlay) onPlay(videoRef.current.currentTime);
      }
      lastTapRef.current.time = 0;
    } else {
      lastTapRef.current.time = now;
      
      if (isMobile) {
        // On mobile, single tap toggles controls visibility
        setShowControls(prev => !prev);
      } else {
        // On desktop, single tap pauses/plays video immediately
        togglePlay();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setCurrentTime(current);
    if (total) {
      setDuration(total);
      setProgress((current / total) * 100);
      
      if (total > 0 && total <= 15) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
      
      // Save history every 5 seconds
      if (Math.floor(current) % 5 === 0 && animeId && total > 15) {
        const history = JSON.parse(localStorage.getItem('neoanime_history')) || {};
        history[animeId] = {
          id: animeId,
          title: animeTitle,
          time: current,
          episode: activeEpisode,
          translation: activeTranslation,
          lastWatched: Date.now()
        };
        localStorage.setItem('neoanime_history', JSON.stringify(history));
      }
    }
  };

  const handleResume = (e) => {
    e.stopPropagation();
    if (videoRef.current && resumePromptTime) {
      videoRef.current.currentTime = resumePromptTime;
      videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      setIsPlaying(true);
      setResumePromptTime(null);
    }
  };

  const handleIgnoreResume = (e) => {
    e.stopPropagation();
    setResumePromptTime(null);
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const seekTo = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = seekTo;
    setProgress(e.target.value);
    if (onSeek) onSeek(seekTo);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
       videoRef.current.volume = 1; // Force max volume on mobile toggle
    }
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    if (videoRef.current.muted) {
       setVolume(0);
    } else {
       setVolume(videoRef.current.volume || 1);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  const handleQualityChange = (e) => {
    const q = e.target.value;
    setCurrentQuality(q);
    
    // If it's a Kodik URL with manually managed qualities
    if (internalSrc && internalSrc.includes('.mp4:hls')) {
       // Replace /720.mp4 with /480.mp4 etc
       const newSrc = internalSrc.replace(/\/\d+\.mp4:hls/, `/${q}.mp4:hls`);
       setInternalSrc(newSrc);
       return;
    }
    
    // Otherwise rely on HLS.js native levels (e.g. for Anilibria)
    if (hlsRef.current) {
      if (q === 'auto') {
        hlsRef.current.currentLevel = -1;
      } else {
        const levelIndex = hlsRef.current.levels.findIndex(l => l.height === parseInt(q));
        if (levelIndex !== -1) {
          hlsRef.current.currentLevel = levelIndex;
        }
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="custom-player-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => setShowControls(true)}
    >
      <style>{`
        .custom-player-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background-color: #000;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 30px rgba(0,0,0,0.8);
          user-select: none;
          touch-action: manipulation; /* Prevents double-tap-to-zoom on mobile */
        }
        
        .custom-player-container:fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          aspect-ratio: auto !important;
          border-radius: 0;
          margin: 0 !important;
        }
        
        .custom-player-container:-webkit-full-screen {
          width: 100vw !important;
          height: 100vh !important;
          aspect-ratio: auto !important;
          border-radius: 0;
          margin: 0 !important;
        }

        .custom-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          cursor: pointer;
          outline: none;
        }
        .play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.4);
          cursor: pointer;
          transition: opacity 0.3s;
        }
        .play-btn-circle {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 0 30px rgba(0,240,255,0.3);
          transition: all 0.3s;
        }
        .play-btn-circle:hover {
          transform: scale(1.1);
          background: #00f0ff;
          box-shadow: 0 0 50px rgba(0,240,255,0.6);
        }
        .controls-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 60px 20px 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.6) 60%, transparent);
          transition: opacity 0.5s;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .controls-visible { opacity: 1; }
        .controls-hidden { opacity: 0; pointer-events: none; }
        
        .progress-container {
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          height: 6px;
          cursor: pointer;
        }
        .progress-input {
          width: 100%;
          position: absolute;
          z-index: 10;
          opacity: 0;
          cursor: pointer;
          height: 100%;
        }
        .progress-track {
          width: 100%;
          background: rgba(255,255,255,0.2);
          height: 4px;
          border-radius: 4px;
          overflow: hidden;
          transition: height 0.2s;
        }
        .progress-container:hover .progress-track { height: 6px; }
        .progress-fill {
          height: 100%;
          background: #00f0ff;
          box-shadow: 0 0 10px rgba(0,240,255,0.8);
          transition: width 0.1s linear;
        }
        
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: rgba(255,255,255,0.9);
        }
        .controls-left, .controls-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .control-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .control-btn:hover { color: #00f0ff; }
        .time-display {
          font-size: 14px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          opacity: 0.8;
          user-select: none;
        }
        
        .volume-container {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .volume-slider-wrapper {
          width: 0;
          overflow: hidden;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
        }
        .volume-container:hover .volume-slider-wrapper {
          width: 80px;
        }
        .volume-slider {
          width: 80px;
          -webkit-appearance: none;
          background: rgba(255,255,255,0.2);
          height: 4px;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #00f0ff;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,240,255,0.8);
          cursor: pointer;
        }
        
        .dropdown-container { position: relative; }
        .dropdown-menu {
          position: absolute;
          bottom: calc(100% + 10px);
          right: 0;
          background: rgba(15, 15, 20, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 8px;
          min-width: 140px;
          max-height: 250px;
          overflow-y: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: bottom right;
          z-index: 100;
        }
        .dropdown-menu::-webkit-scrollbar { width: 4px; }
        .dropdown-menu::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        .dropdown-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .dropdown-closed {
          opacity: 0;
          transform: translateY(10px) scale(0.95);
          pointer-events: none;
        }
        .dropdown-item {
          padding: 8px 12px;
          color: rgba(255,255,255,0.8);
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .dropdown-item:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .dropdown-item-active {
          background: rgba(0,240,255,0.15);
          color: #00f0ff;
          font-weight: 600;
        }
        .dropdown-btn {
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dropdown-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: #00f0ff;
        }
        .quality-btn {
          background: transparent;
          border: none;
          padding: 6px 8px;
        }

        .resume-prompt {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(15, 15, 20, 0.9);
          backdrop-filter: blur(10px);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(0, 240, 255, 0.3);
          z-index: 50;
          color: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          animation: slideDown 0.3s ease;
        }
        
        .resume-prompt-title {
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .resume-prompt-actions {
          display: flex;
          gap: 10px;
        }
        
        .resume-btn {
          background: #00f0ff;
          color: #000;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
        }
        
        .resume-btn-sec {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        
        .skip-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          color: white;
          padding: 15px 25px;
          border-radius: 50px;
          font-weight: bold;
          font-size: 1.2rem;
          pointer-events: none;
          animation: skipFade 0.6s ease forwards;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 60;
        }
        .skip-indicator.forward {
          right: 15%;
        }
        .skip-indicator.backward {
          left: 15%;
        }
        @keyframes skipFade {
          0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
          20% { opacity: 1; transform: translateY(-50%) scale(1.1); }
          80% { opacity: 1; transform: translateY(-50%) scale(1); }
          100% { opacity: 0; transform: translateY(-50%) scale(1.2); }
        }
        
        /* === MOBILE RESPONSIVE CONTROLS === */
        @media (max-width: 600px) {
          .controls-overlay {
            padding: 40px 10px 10px;
          }
          .controls-row {
            flex-wrap: wrap;
            gap: 10px;
          }
          .controls-left {
            width: 100%;
            justify-content: space-between;
          }
          .controls-right {
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .dropdown-btn {
            font-size: 11px;
            padding: 4px 8px;
            gap: 4px;
          }
          .dropdown-menu {
            min-width: 110px;
          }
          .play-btn-circle {
            width: 60px;
            height: 60px;
          }
          .volume-slider-wrapper {
            display: none !important;
          }
        }
      `}</style>

      <video
        ref={videoRef}
        className="custom-video"
        onClick={handleVideoTap}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        poster={poster}
        playsInline
      />

      {isBlocked && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.9)', zIndex: 50, display: 'flex', flexDirection: 'column', 
          justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center', padding: '20px'
        }}>
          <h2 style={{color: '#ff4444', marginBottom: '10px'}}>??�??? ?�?????�?? ?�?�?�?�???????�?????�????</h2>
          <p style={{maxWidth: '500px', lineHeight: '1.5', color: 'var(--text-secondary)'}}>
            ?? ?????�?�?�?�??????, ???�???????� ???????�?? ?�?�?�?? ?????�?�?�?? ???? ?�?�?�?�?????�?????? ???�?�???????�?�?�???�?�?�?�?? ?? ???�???�?? ?�?�?????????� (Kodik).
            <br/><br/>
            ???????�???�?????�?� <strong>???????�?????�?? ???�?????�????</strong> (?�?�???�?? ?�?�???????�?????� ?�???�?????? ?????�?�???�?�?�?????�?� ???�?�?�???????�) ???�?? ?????????�???�?????�?� VPN ?? ?�???�?????�?????????? IP.
          </p>
        </div>
      )}

      {!isPlaying && !resumePromptTime && (
        <div className="play-overlay" onClick={handleVideoTap}>
          <div className="play-btn-circle">
             <Play style={{color: 'white', width: '40px', height: '40px', marginLeft: '6px'}} fill="currentColor" />
          </div>
        </div>
      )}
      
      {skipIndicator && (
        <div key={skipIndicator.key} className={`skip-indicator ${skipIndicator.type}`}>
          {skipIndicator.type === 'forward' ? <SkipForward size={24} /> : <SkipForward size={24} style={{transform: 'rotate(180deg)'}} />}
          {skipIndicator.text}
        </div>
      )}
      
      {resumePromptTime !== null && (
        <div className="resume-prompt">
          <div className="resume-prompt-title">???�???????�?�???�?? ???�?????????�?� ?? {formatTime(resumePromptTime)}?</div>
          <div className="resume-prompt-actions">
             <button className="resume-btn" onClick={handleResume}>???�???????�?�???�??</button>
             <button className="resume-btn-sec" onClick={handleIgnoreResume}>?????�?�?�?�?�</button>
          </div>
        </div>
      )}

      <div className={`controls-overlay ${showControls || !isPlaying ? 'controls-visible' : 'controls-hidden'}`}>
        <div className="progress-container">
          <input 
            type="range" 
            min="0" max="100" 
            value={progress} 
            onChange={handleSeek}
            className="progress-input"
          />
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="control-btn">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div className="volume-container">
              <button onClick={toggleMute} className="control-btn">
                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <div className="volume-slider-wrapper">
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={volume} 
                  onChange={handleVolumeChange} 
                  className="volume-slider" 
                />
              </div>
            </div>
            
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            {kodikData && kodikData.translations && (
               <Dropdown 
                 value={activeTranslation || kodikData.active_translation || ''}
                 onChange={(val) => onTranslationChange(val)}
                 options={kodikData.translations.map(t => ({ value: t.id, label: t.name, shortLabel: t.name }))}
                 label="???�?????�???�"
               />
            )}

            {kodikData && kodikData.episodes_total > 0 && (
               <Dropdown 
                 value={activeEpisode}
                 onChange={(val) => onEpisodeChange(parseInt(val))}
                 options={Array.from({length: kodikData.episodes_total}, (_, i) => i + 1).map(ep => ({ value: ep, label: `${ep} ???�?�????`, shortLabel: `${ep} ????.` }))}
                 label="???�?�????"
               />
            )}

            {qualities.length > 0 && (
               <Dropdown 
                 value={currentQuality}
                 onChange={(val) => handleQualityChange({target: {value: val}})}
                 options={[{value: 'auto', label: 'Auto', shortLabel: 'Auto'}, ...qualities.map(q => ({ value: q.toString(), label: `${q}p`, shortLabel: `${q}p` }))]}
                 label="Auto"
               />
            )}

            <button onClick={() => onEpisodeChange(activeEpisode + 1)} className="control-btn" title="???�?�???????�?�?? ???�?�????">
              <SkipForward size={22} fill="currentColor" />
            </button>

            <button onClick={toggleFullscreen} className="control-btn">
              {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPlayer;
