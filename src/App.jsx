import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Upload, Copy, RefreshCw, Image as ImageIcon, Settings,
  Check, FileCode, Wand2, ChevronDown, ChevronRight,
  Play, Pause, AlertCircle, ImagePlus, Film, AlertTriangle, X,
  Download, Globe, Terminal, FileText, Code2, Command, Monitor, Archive,
  Search, Plus, Loader2, Scissors, Sparkles, SlidersHorizontal, Maximize2,
  Zap, Palette, Activity
} from 'lucide-react';

const ASCII_FORMATS = {
  standard: { name: 'Standard', chars: ' .:-=+*#%@' },
  dense: { name: 'Dicht', chars: ' `.-\':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@' },
  blocks: { name: 'Blöcke', chars: ' ░▒▓█' },
  braille: { name: 'Braille (Punkte)', chars: 'braille' },
  minimal: { name: 'Minimal', chars: ' .-:*' },
  detailed: { name: 'Detailliert', chars: ' .\'\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$' },
  shadow: { name: 'Schatten', chars: ' ░▒▓█▄▀▌▐' },
  geometric: { name: 'Geometrisch', chars: ' .+*oO0#@' },
  katakana: { name: 'Katakana', chars: ' ._-~:;!=+/|\\\\()[]{}#@' },
  emoji: { name: 'Emoji', chars: ' ▒▓█▄▀▌▐░' }
};

const THEMES = {
  purple: { name: 'Purple', accent: '#a855f7', rgb: '168,85,247', hover: 'rgba(168,85,247,0.3)' },
  emerald: { name: 'Emerald', accent: '#34d399', rgb: '52,211,153', hover: 'rgba(52,211,153,0.3)' },
  cyan: { name: 'Cyan', accent: '#22d3ee', rgb: '34,211,238', hover: 'rgba(34,211,238,0.3)' },
  rose: { name: 'Rose', accent: '#fb7185', rgb: '251,113,133', hover: 'rgba(251,113,133,0.3)' },
  amber: { name: 'Amber', accent: '#fbbf24', rgb: '251,191,36', hover: 'rgba(251,191,36,0.3)' },
};

// Custom Hook für Debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Micro-animation Component: Scrambles text on hover/mount ---
const ScrambleText = ({ text, className = "" }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "!<>-_\\/[]{}\u2014=+*^?#________";
  const scramble = () => {
    let iteration = 0;
    const maxIterations = text.length;
    const interval = setInterval(() => {
      setDisplayText(
        text.split("").map((letter, index) => {
          if (index < iteration) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );
      if (iteration >= maxIterations) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
  };
  useEffect(() => { scramble(); }, [text]);
  return (
    <span className={`inline-block font-mono ${className}`} onMouseEnter={scramble}>
      {displayText}
    </span>
  );
};

// --- Animated ASCII Wave Background ---
const AsciiWaveBackground = ({ paused = false, accentRgb = '168,85,247' }) => {
  const canvasRef = useRef(null);
  const pausedRef = useRef(paused);
  const accentRef = useRef(accentRgb);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { accentRef.current = accentRgb; }, [accentRgb]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    const waveChars = " .:-=+*#%@";
    const fontSize = 16;
    let cols = 0, rows = 0;
    let drawnPaused = false;
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
      cols = Math.floor(width / fontSize); rows = Math.floor(height / fontSize);
      ctx.font = `${fontSize}px monospace`;
      drawnPaused = false;
    };
    window.addEventListener('resize', resize);
    resize();
    const handleMouseMove = (e) => { if (!pausedRef.current) { targetMouseX = e.clientX; targetMouseY = e.clientY; } };
    window.addEventListener('mousemove', handleMouseMove);
    let lastRenderTime = 0;
    const frameInterval = 50;
    const render = (time) => {
      animationFrameId = requestAnimationFrame(render);
      if (pausedRef.current) {
        if (!drawnPaused) {
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, width, height);
          drawnPaused = true;
        }
        return;
      }
      drawnPaused = false;
      if (time - lastRenderTime < frameInterval) return;
      lastRenderTime = time;
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      const t = time * 0.001;
      const rgb = accentRef.current;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * fontSize, py = y * fontSize;
          const dx = px - mouseX, dy = py - mouseY;
          const distSq = dx * dx + dy * dy;
          const mouseInfluence = distSq < 32400 ? Math.max(0, 1 - Math.sqrt(distSq) / 180) : 0;
          const waveX = Math.sin(x * 0.1 + t + mouseInfluence * 2);
          const waveY = Math.cos(y * 0.1 + t);
          const depth = (waveX * waveY + 1) / 2;
          const charIndex = Math.floor(depth * (waveChars.length - 1));
          const opacity = 0.1 + (depth * 0.3) + (mouseInfluence * 0.5);
          ctx.fillStyle = mouseInfluence > 0.1
            ? `rgba(${rgb}, ${opacity + 0.2})`
            : `rgba(161, 161, 170, ${opacity})`;
          ctx.fillText(waveChars[charIndex], px, py);
        }
      }
    };
    render(0);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ willChange: 'contents' }} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

// --- ASCII Donut (empty-state animation) ---
const AsciiDonut = ({ accentColor = '#a855f7' }) => {
  const [frame, setFrame] = useState("");
  useEffect(() => {
    let A = 0, B = 0, animationId;
    const renderDonut = () => {
      const b = [], z = [];
      A += 0.04; B += 0.02;
      const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
      for (let k = 0; k < 1760; k++) { b[k] = k % 80 === 79 ? '\n' : ' '; z[k] = 0; }
      for (let j = 0; j < 6.28; j += 0.07) {
        const ct = Math.cos(j), st = Math.sin(j);
        for (let i = 0; i < 6.28; i += 0.02) {
          const sp = Math.sin(i), cp = Math.cos(i),
            h = ct + 2, D = 1 / (sp * h * sA + st * cA + 5),
            t = sp * h * cA - st * sA;
          const x = 0 | (40 + 30 * D * (cp * h * cB - t * sB));
          const y = 0 | (11 + 15 * D * (cp * h * sB + t * cB));
          const o = x + 80 * y;
          const N = 0 | (8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB));
          if (y < 22 && y >= 0 && x >= 0 && x < 79 && D > z[o]) {
            z[o] = D; b[o] = ".,-~:;=!*#$@"[N > 0 ? N : 0];
          }
        }
      }
      setFrame(b.join(''));
      animationId = setTimeout(() => requestAnimationFrame(renderDonut), 42);
    };
    renderDonut();
    return () => { clearTimeout(animationId); cancelAnimationFrame(animationId); };
  }, []);
  return (
    <pre className="text-[10px] leading-[0.85] overflow-hidden flex items-center justify-center select-none" style={{ fontFamily: '"Geist Mono", monospace', color: accentColor }}>
      {frame}
    </pre>
  );
};

export default function AsciiConverter() {
  // --- STATE ---
  const [appMode, setAppMode] = useState('static');
  const [isHoveringDrop, setIsHoveringDrop] = useState(false);
  const dragCounterRef = useRef(0);
  const [showMetrics, setShowMetrics] = useState(false);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceUrl, setSourceUrl] = useState(null);
  const [isGif, setIsGif] = useState(false);
  const [gifBuffer, setGifBuffer] = useState(null);

  const [frames, setFrames] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

  // Settings
  const [format, setFormat] = useState('braille');
  const [resolution, setResolution] = useState(120);
  const [invert, setInvert] = useState(false);
  const [threshold, setThreshold] = useState(128);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [dithering, setDithering] = useState(true);
  const [colorized, setColorized] = useState(false);

  // UI Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('output.ascii');
  const [errorMsg, setErrorMsg] = useState(null);

  // Frame Trimming
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimEnabled, setTrimEnabled] = useState(false);

  // GIF Browser
  const [showGifBrowser, setShowGifBrowser] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifSearchResults, setGifSearchResults] = useState([]);
  const [gifSearchLoading, setGifSearchLoading] = useState(false);
  const [gifTrendingLoaded, setGifTrendingLoaded] = useState(false);
  const [gifSearchOffset, setGifSearchOffset] = useState(0);

  // Status für das Export-Menü
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Theme & Performance Mode
  const [currentTheme, setCurrentTheme] = useState('purple');
  const [performanceMode, setPerformanceMode] = useState(false);
  const themeConfig = THEMES[currentTheme];

  // True FPS tracking for metrics
  const [realFps, setRealFps] = useState(0);

  useEffect(() => {
    if (!showMetrics) return;
    let frames = 0;
    let lastTime = performance.now();
    let animId;
    const measure = (time) => {
      frames++;
      if (time - lastTime >= 1000) {
        setRealFps(Math.round((frames * 1000) / (time - lastTime)));
        frames = 0;
        lastTime = time;
      }
      animId = requestAnimationFrame(measure);
    };
    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, [showMetrics]);

  // Slider-drag pause
  const isAdjustingSliderRef = useRef(false);
  const wasPlayingBeforeSlider = useRef(false);

  // Frame cache
  const frameCacheRef = useRef(new Map());
  const cacheKeyRef = useRef(null);

  // Refs
  const asciiDisplayRef = useRef(null);
  const canvasDisplayRef = useRef(null);
  const outputPanelRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);
  const currentFrameRef = useRef(0);
  const currentTaskRef = useRef(null);

  const [sectionsExpanded, setSectionsExpanded] = useState({
    input: true,
    settings: true,
    advanced: true,
    animation: true,
    trimming: false
  });

  const currentSettings = useMemo(() => ({
    format, resolution, invert, threshold, contrast, brightness, dithering, colorized
  }), [format, resolution, invert, threshold, contrast, brightness, dithering, colorized]);

  const debounceDelay = isGif ? 700 : 500;
  const debouncedSettings = useDebounce(currentSettings, debounceDelay);

  // --- SLIDER PAUSE HANDLERS ---
  const handleSliderStart = useCallback(() => {
    if (isGif && frames.length > 1 && isPlaying) {
      isAdjustingSliderRef.current = true;
      wasPlayingBeforeSlider.current = true;
      setIsPlaying(false);
    }
  }, [isGif, frames.length, isPlaying]);

  useEffect(() => {
    const handleSliderEnd = () => {
      if (isAdjustingSliderRef.current && wasPlayingBeforeSlider.current) {
        isAdjustingSliderRef.current = false;
        wasPlayingBeforeSlider.current = false;
        setIsPlaying(true);
      }
    };
    window.addEventListener('mouseup', handleSliderEnd);
    window.addEventListener('touchend', handleSliderEnd);
    return () => {
      window.removeEventListener('mouseup', handleSliderEnd);
      window.removeEventListener('touchend', handleSliderEnd);
    };
  }, []);

  // --- KLICK AUSSERHALB DES EXPORT-MENÜS ABFANGEN ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- BILD VERARBEITUNG (Static & GIF) ---
  useEffect(() => {
    if (!sourceUrl && !gifBuffer) return;

    // --- CACHE CHECK ---
    const cacheKey = JSON.stringify({ sourceUrl, isGif, ...debouncedSettings });
    if (frameCacheRef.current.has(cacheKey)) {
      const cached = frameCacheRef.current.get(cacheKey);
      setFrames(cached);
      setCurrentFrameIdx(0);
      currentFrameRef.current = 0;
      if (cached.length > 0) {
        if (cached[0].canvas && canvasDisplayRef.current) {
          const ctx = canvasDisplayRef.current.getContext('2d');
          canvasDisplayRef.current.width = cached[0].canvas.width;
          canvasDisplayRef.current.height = cached[0].canvas.height;
          ctx.drawImage(cached[0].canvas, 0, 0);
        } else if (asciiDisplayRef.current) {
          asciiDisplayRef.current.innerHTML = cached[0].text;
        }
      }
      setIsProcessing(false);
      return;
    }

    const taskId = Symbol('processing_task');
    currentTaskRef.current = taskId;
    cacheKeyRef.current = cacheKey;

    const processMedia = async () => {
      // Pause animation during processing to save CPU
      if (isGif && frames.length > 1) setIsPlaying(false);
      setIsProcessing(true);
      setProcessingProgress(0);
      setErrorMsg(null);

      try {
        if (isGif && gifBuffer) {
          let usedNative = false;

          if ('ImageDecoder' in window) {
            try {
              const decoder = new window.ImageDecoder({ data: gifBuffer, type: 'image/gif' });
              await decoder.tracks.ready;
              const track = decoder.tracks.selectedTrack;

              const dimResult = await decoder.decode({ frameIndex: 0 });
              const width = dimResult.image.displayWidth;
              const height = dimResult.image.displayHeight;
              dimResult.image.close();

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });

              const targetFrames = [];

              for (let i = 0; i < track.frameCount; i++) {
                if (currentTaskRef.current !== taskId) break;

                const result = await decoder.decode({ frameIndex: i });
                const videoFrame = result.image;

                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(videoFrame, 0, 0);

                const asciiObj = await convertCanvasToAscii(canvas, debouncedSettings);
                targetFrames.push({
                  text: asciiObj.text,
                  canvas: asciiObj.canvas,
                  delay: (videoFrame.duration / 1000) || 100
                });

                videoFrame.close();

                if (i % 3 === 0 || i === track.frameCount - 1) {
                  if (currentTaskRef.current === taskId) {
                    setProcessingProgress(Math.round(((i + 1) / track.frameCount) * 100));
                  }
                  await new Promise(r => setTimeout(r, 0));
                }
              }

              if (currentTaskRef.current === taskId) {
                setFrames(targetFrames);
                setCurrentFrameIdx(0);
                currentFrameRef.current = 0;
                if (targetFrames.length > 0) {
                  if (targetFrames[0].canvas && canvasDisplayRef.current) {
                    const ctx = canvasDisplayRef.current.getContext('2d');
                    canvasDisplayRef.current.width = targetFrames[0].canvas.width;
                    canvasDisplayRef.current.height = targetFrames[0].canvas.height;
                    ctx.drawImage(targetFrames[0].canvas, 0, 0);
                  } else if (asciiDisplayRef.current) {
                    asciiDisplayRef.current.innerHTML = targetFrames[0].text;
                  }
                }
              }
              usedNative = true;
            } catch (nativeErr) {
              console.warn("Nativer Decoder fehlgeschlagen, probiere JS Fallback...", nativeErr);
            }
          }

          if (!usedNative) {
            let libLoaded = !!(window.parseGIF || window.gifuct);

            if (!libLoaded) {
              const urls = [
                'https://unpkg.com/gifuct-js@2.1.2/dist/gifuct-js.min.js',
                'https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js'
              ];

              for (const url of urls) {
                try {
                  await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;
                    script.crossOrigin = 'anonymous';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                  });
                  if (window.parseGIF || window.gifuct) { libLoaded = true; break; }
                } catch (e) { }
              }

              if (!libLoaded) {
                for (const url of urls) {
                  try {
                    const res = await fetch(url);
                    if (!res.ok) continue;
                    const text = await res.text();
                    const script = document.createElement('script');
                    script.textContent = text;
                    document.head.appendChild(script);
                    if (window.parseGIF || window.gifuct) { libLoaded = true; break; }
                  } catch (e) { }
                }
              }
            }

            if (!libLoaded) {
              throw new Error("GIF konnte nicht verarbeitet werden: Externe Bibliothek blockiert und kein nativer Browser-Decoder verfügbar.");
            }

            const parse = window.parseGIF || window.gifuct?.parseGIF;
            const decompress = window.decompressFrames || window.gifuct?.decompressFrames;

            const parsedGif = parse(gifBuffer);
            const decompressedFrames = decompress(parsedGif, true);

            const targetFrames = [];
            const width = parsedGif.lsd.width;
            const height = parsedGif.lsd.height;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            let previousImageData = null;

            for (let i = 0; i < decompressedFrames.length; i++) {
              if (currentTaskRef.current !== taskId) break;

              const frame = decompressedFrames[i];

              if (i > 0) {
                const prev = decompressedFrames[i - 1];
                if (prev.disposalType === 2) {
                  ctx.clearRect(prev.dims.left, prev.dims.top, prev.dims.width, prev.dims.height);
                } else if (prev.disposalType === 3 && previousImageData) {
                  ctx.putImageData(previousImageData, 0, 0);
                }
              }
              if (frame.disposalType === 3) {
                previousImageData = ctx.getImageData(0, 0, width, height);
              }

              if (frame.patch && frame.patch.length > 0) {
                const expectedLength = frame.dims.width * frame.dims.height * 4;
                let safePatch = new Uint8ClampedArray(frame.patch);

                if (safePatch.length !== expectedLength) {
                  const resizedPatch = new Uint8ClampedArray(expectedLength);
                  resizedPatch.set(safePatch.subarray(0, Math.min(safePatch.length, expectedLength)));
                  safePatch = resizedPatch;
                }

                const patchData = new ImageData(safePatch, frame.dims.width, frame.dims.height);
                const patchCanvas = document.createElement('canvas');
                patchCanvas.width = frame.dims.width;
                patchCanvas.height = frame.dims.height;
                patchCanvas.getContext('2d').putImageData(patchData, 0, 0);

                ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
              }

              const asciiObj = await convertCanvasToAscii(canvas, debouncedSettings);
              targetFrames.push({
                text: asciiObj.text,
                canvas: asciiObj.canvas,
                delay: Math.max(frame.delay || 100, 20)
              });

              if (i % 3 === 0 || i === decompressedFrames.length - 1) {
                if (currentTaskRef.current === taskId) {
                  setProcessingProgress(Math.round(((i + 1) / decompressedFrames.length) * 100));
                }
                await new Promise(r => setTimeout(r, 0));
              }
            }

            if (currentTaskRef.current === taskId) {
              setFrames(targetFrames);
              setCurrentFrameIdx(0);
              currentFrameRef.current = 0;
              if (targetFrames.length > 0) {
                if (targetFrames[0].canvas && canvasDisplayRef.current) {
                  const ctx = canvasDisplayRef.current.getContext('2d');
                  canvasDisplayRef.current.width = targetFrames[0].canvas.width;
                  canvasDisplayRef.current.height = targetFrames[0].canvas.height;
                  ctx.drawImage(targetFrames[0].canvas, 0, 0);
                } else if (asciiDisplayRef.current) {
                  asciiDisplayRef.current.innerHTML = targetFrames[0].text;
                }
              }
              // Cache result
              if (cacheKeyRef.current && targetFrames.length > 0) {
                if (frameCacheRef.current.size > 5) {
                  const firstKey = frameCacheRef.current.keys().next().value;
                  frameCacheRef.current.delete(firstKey);
                }
                frameCacheRef.current.set(cacheKeyRef.current, targetFrames);
              }
            }
          }

        } else if (!isGif && sourceUrl) {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = sourceUrl;

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const asciiObj = await convertCanvasToAscii(canvas, debouncedSettings);

          if (currentTaskRef.current === taskId) {
            const resultFrames = [{ text: asciiObj.text, canvas: asciiObj.canvas, delay: 0 }];
            setFrames(resultFrames);
            setCurrentFrameIdx(0);
            if (resultFrames[0].canvas && canvasDisplayRef.current) {
              const ctx = canvasDisplayRef.current.getContext('2d');
              canvasDisplayRef.current.width = resultFrames[0].canvas.width;
              canvasDisplayRef.current.height = resultFrames[0].canvas.height;
              ctx.drawImage(resultFrames[0].canvas, 0, 0);
            } else if (asciiDisplayRef.current) {
              asciiDisplayRef.current.innerHTML = resultFrames[0].text;
            }
            // Cache result
            if (cacheKeyRef.current) {
              if (frameCacheRef.current.size > 5) {
                const firstKey = frameCacheRef.current.keys().next().value;
                frameCacheRef.current.delete(firstKey);
              }
              frameCacheRef.current.set(cacheKeyRef.current, resultFrames);
            }
          }
        }
      } catch (err) {
        if (currentTaskRef.current === taskId) {
          console.error("Fehler bei der Medienverarbeitung:", err);
          setErrorMsg(err.message || "Unbekannter Fehler bei der Bildverarbeitung.");
        }
      } finally {
        if (currentTaskRef.current === taskId) {
          setIsProcessing(false);
          // Resume animation after processing
          if (isGif) setIsPlaying(true);
        }
      }
    };

    processMedia();

    return () => {
      currentTaskRef.current = null;
    };
  }, [sourceUrl, gifBuffer, isGif, debouncedSettings]);

  // --- DYNAMISCHES DOM UPDATE ---
  useEffect(() => {
    if (!isPlaying && frames.length > 0) {
      if (frames[currentFrameIdx]?.canvas && canvasDisplayRef.current) {
        const ctx = canvasDisplayRef.current.getContext('2d');
        canvasDisplayRef.current.width = frames[currentFrameIdx].canvas.width;
        canvasDisplayRef.current.height = frames[currentFrameIdx].canvas.height;
        ctx.drawImage(frames[currentFrameIdx].canvas, 0, 0);
      } else if (asciiDisplayRef.current) {
        asciiDisplayRef.current.innerHTML = frames[currentFrameIdx]?.text || '';
      }
    }
  }, [currentFrameIdx, frames, isPlaying]);

  // --- ANIMATION LOOP ---
  useEffect(() => {
    if (frames.length <= 1 || !isPlaying) return;

    let lastTime = performance.now();
    let accumulatedTime = 0;

    const animate = (time) => {
      const deltaTime = Math.min(time - lastTime, 1000);
      lastTime = time;
      accumulatedTime += deltaTime;

      const currentFrame = frames[currentFrameRef.current];

      if (accumulatedTime >= currentFrame.delay) {
        accumulatedTime -= currentFrame.delay;

        const nextFrame = (currentFrameRef.current + 1) % frames.length;
        currentFrameRef.current = nextFrame;

        if (frames[nextFrame].canvas && canvasDisplayRef.current) {
          const ctx = canvasDisplayRef.current.getContext('2d');
          if (canvasDisplayRef.current.width !== frames[nextFrame].canvas.width) {
            canvasDisplayRef.current.width = frames[nextFrame].canvas.width;
            canvasDisplayRef.current.height = frames[nextFrame].canvas.height;
          } else {
            ctx.clearRect(0, 0, canvasDisplayRef.current.width, canvasDisplayRef.current.height);
          }
          ctx.drawImage(frames[nextFrame].canvas, 0, 0);
        } else if (asciiDisplayRef.current) {
          asciiDisplayRef.current.innerHTML = frames[nextFrame].text;
        }

        setCurrentFrameIdx(nextFrame);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [frames, isPlaying]);

  // --- HANDLER ---
  const processFile = useCallback(async (file, currentMode, currentRes) => {
    if (!file) return;

    setFrames([]);
    setIsPlaying(true);
    setErrorMsg(null);
    setSourceFile(file);
    setSourceUrl(URL.createObjectURL(file));
    setActiveTab('output.ascii');

    if (asciiDisplayRef.current) asciiDisplayRef.current.innerHTML = '';

    const isGifFile = file.type === 'image/gif' || file.name?.toLowerCase().endsWith('.gif');

    if (currentMode === 'gif' && isGifFile) {
      setIsGif(true);
      if (currentRes > 150) setResolution(100);
      try {
        const buffer = await file.arrayBuffer();
        setGifBuffer(buffer);
      } catch (err) {
        setErrorMsg("GIF konnte nicht gelesen werden.");
      }
    } else {
      setIsGif(false);
      setGifBuffer(null);
    }
  }, []);

  const clearMedia = () => {
    setSourceFile(null);
    setSourceUrl(null);
    setGifBuffer(null);
    setFrames([]);
    setIsPlaying(false);
    setActiveTab('output.ascii');
    setErrorMsg(null);
    setTrimStart(0);
    setTrimEnd(0);
    setTrimEnabled(false);
    frameCacheRef.current.clear();
    if (asciiDisplayRef.current) asciiDisplayRef.current.innerHTML = '';
  };

  // --- GIF BROWSER (GIPHY API) ---
  const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'; // public beta key

  const searchGifs = useCallback(async (query, offset = 0) => {
    setGifSearchLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&offset=${offset}&rating=pg-13&lang=de`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&offset=${offset}&rating=pg-13`;

      const res = await fetch(endpoint);
      const json = await res.json();

      if (offset === 0) {
        setGifSearchResults(json.data || []);
      } else {
        setGifSearchResults(prev => [...prev, ...(json.data || [])]);
      }
      setGifSearchOffset(offset + 20);
    } catch (err) {
      console.error('GIF Suche fehlgeschlagen:', err);
      setErrorMsg('GIF-Suche fehlgeschlagen. Bitte Internetverbindung prüfen.');
    } finally {
      setGifSearchLoading(false);
    }
  }, []);

  const loadGifFromUrl = useCallback(async (gifUrl, title) => {
    setShowGifBrowser(false);
    setAppMode('gif');
    setIsGif(true);
    setFrames([]);
    setIsPlaying(true);
    setErrorMsg(null);
    setTrimStart(0);
    setTrimEnd(0);
    setTrimEnabled(false);
    setActiveTab('output.ascii');
    if (asciiDisplayRef.current) asciiDisplayRef.current.innerHTML = '';
    if (canvasDisplayRef.current) canvasDisplayRef.current.getContext('2d').clearRect(0, 0, canvasDisplayRef.current.width, canvasDisplayRef.current.height);

    try {
      const res = await fetch(gifUrl);
      const blob = await res.blob();
      const file = new File([blob], (title || 'giphy') + '.gif', { type: 'image/gif' });
      setSourceFile(file);
      setSourceUrl(URL.createObjectURL(file));

      const buffer = await blob.arrayBuffer();
      setGifBuffer(buffer);
      if (resolution > 150) setResolution(100);
    } catch (err) {
      setErrorMsg('GIF konnte nicht geladen werden: ' + err.message);
    }
  }, [resolution]);

  useEffect(() => {
    if (showGifBrowser && !gifTrendingLoaded) {
      searchGifs('', 0);
      setGifTrendingLoaded(true);
    }
  }, [showGifBrowser, gifTrendingLoaded, searchGifs]);

  // --- FRAME TRIMMING ---
  const applyTrim = useCallback(() => {
    if (frames.length <= 1) return;
    const start = Math.max(0, trimStart);
    const end = Math.min(frames.length - 1, trimEnd > 0 ? trimEnd : frames.length - 1);
    if (start >= end) return;

    const trimmedFrames = frames.slice(start, end + 1);
    setFrames(trimmedFrames);
    setCurrentFrameIdx(0);
    currentFrameRef.current = 0;
    setTrimStart(0);
    setTrimEnd(0);
    setTrimEnd(0);
    if (trimmedFrames.length > 0) {
      if (trimmedFrames[0].canvas && canvasDisplayRef.current) {
        const ctx = canvasDisplayRef.current.getContext('2d');
        canvasDisplayRef.current.width = trimmedFrames[0].canvas.width;
        canvasDisplayRef.current.height = trimmedFrames[0].canvas.height;
        ctx.drawImage(trimmedFrames[0].canvas, 0, 0);
      } else if (asciiDisplayRef.current) {
        asciiDisplayRef.current.innerHTML = trimmedFrames[0].text;
      }
    }
  }, [frames, trimStart, trimEnd]);

  // Update trim end when frames change
  useEffect(() => {
    if (frames.length > 1 && trimEnd === 0) {
      setTrimEnd(frames.length - 1);
    }
  }, [frames.length]);

  const handleFileUpload = (e) => processFile(e.target.files[0], appMode, resolution);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          e.preventDefault();
          const file = items[i].getAsFile();
          processFile(file, appMode, resolution);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [appMode, resolution, processFile]);

  const copyToClipboard = () => {
    if (frames.length === 0) return;
    const currentText = frames[currentFrameIdx]?.text || '';
    const textToCopy = debouncedSettings.colorized ? currentText.replace(/<[^>]*>?/gm, '') : currentText;

    try {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fehler beim Kopieren:", err);
    }
  };

  const toggleSection = (section) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const triggerDownload = (filename, content, mimeType) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowExportMenu(false);
  };

  const decodeEntities = (text) => (
    (text || '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
  );

  const getPlainFrameText = (text) => decodeEntities((text || '').replace(/<[^>]*>?/gm, ''));

  const getAnsiFrameText = (frame) => {
    const plainText = getPlainFrameText(frame?.text || '');
    const canvas = frame?.canvas;

    if (!canvas) {
      return plainText;
    }

    const rawLines = plainText.endsWith('\n') ? plainText.slice(0, -1).split('\n') : plainText.split('\n');
    if (rawLines.length === 0) return plainText;

    const rows = rawLines.length;
    const cols = Math.max(1, ...rawLines.map(line => line.length));
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let ansi = '';
    let lastColor = '';

    for (let y = 0; y < rows; y++) {
      const line = rawLines[y];
      for (let x = 0; x < line.length; x++) {
        const ch = line[x];
        if (ch === ' ') {
          ansi += ch;
          continue;
        }

        const sx = Math.min(canvas.width - 1, Math.max(0, Math.floor((x + 0.5) * cellWidth)));
        const sy = Math.min(canvas.height - 1, Math.max(0, Math.floor((y + 0.5) * cellHeight)));
        const idx = (sy * canvas.width + sx) * 4;
        const alpha = imageData[idx + 3];

        if (alpha === 0) {
          ansi += ch;
          continue;
        }

        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];
        const colorCode = `\x1b[38;2;${r};${g};${b}m`;

        if (colorCode !== lastColor) {
          ansi += colorCode;
          lastColor = colorCode;
        }

        ansi += ch;
      }

      if (lastColor) {
        ansi += '\x1b[0m';
        lastColor = '';
      }
      if (y < rows - 1) ansi += '\n';
    }

    return ansi;
  };

  const exportTxt = () => {
    if (frames.length === 0) return;
    const textContent = frames
      .map((f, i) => (frames.length > 1 ? `Frame ${i + 1}:\n${getPlainFrameText(f.text)}` : getPlainFrameText(f.text)))
      .join('\n\n====================\n\n');
    triggerDownload(isGif ? 'ascii_animation.txt' : 'ascii_art.txt', textContent, 'text/plain');
  };

  const exportZip = async () => {
    if (frames.length === 0) return;

    if (!window.JSZip) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (err) {
        setErrorMsg("Konnte ZIP-Bibliothek nicht laden. Bitte Internetverbindung prüfen.");
        return;
      }
    }

    try {
      const zip = new window.JSZip();
      const folderName = isGif ? "ascii_frames" : "ascii_export";
      const folder = zip.folder(folderName);
      const useColorExport = colorized && frames.some(f => !!f.canvas);
      const ext = useColorExport ? 'ansi' : 'txt';
      let delaysInfo = "Frame Delays (in Millisekunden):\n\n";

      frames.forEach((f, i) => {
        const text = useColorExport ? getAnsiFrameText(f) : getPlainFrameText(f.text);

        const padIndex = String(i + 1).padStart(3, '0');
        folder.file(`frame_${padIndex}.${ext}`, text);
        delaysInfo += `frame_${padIndex}.${ext}: ${f.delay}ms\n`;
      });

      if (isGif && frames.length > 1) {
        folder.file("delays.txt", delaysInfo);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(isGif ? 'ascii_frames.zip' : 'ascii_export.zip', zipBlob, 'application/zip');
    } catch (err) {
      console.error("Fehler beim Erstellen der ZIP:", err);
      setErrorMsg("ZIP-Datei konnte nicht erstellt werden.");
    }
  };

  const exportAnsi = () => {
    if (frames.length === 0) return;
    const useColorExport = colorized && frames.some(f => !!f.canvas);
    let ansiContent = '\x1b[2J';
    frames.forEach((f) => {
      const text = useColorExport ? getAnsiFrameText(f) : getPlainFrameText(f.text);
      ansiContent += '\x1b[H' + text;
    });
    triggerDownload(isGif ? 'ascii_animation.ansi' : 'ascii_art.ansi', ansiContent, 'text/plain');
  };

  const exportBash = () => {
    if (frames.length === 0) return;
    const useColorExport = colorized && frames.some(f => !!f.canvas);

    const bashFrames = frames.map(f => {
      let text = useColorExport ? getAnsiFrameText(f) : getPlainFrameText(f.text);
      text = text.replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/\n/g, '\\n');
      text = text.replace(/\x1b/g, '\\e');
      return `'${text}'`;
    });

    const delays = frames.map(f => Math.max(0.02, f.delay / 1000.0).toFixed(3));

    let shContent = `#!/bin/bash\n\n`;
    shContent += `# ASCII Animation\n`;
    shContent += `printf "\\e[2J"\n\n`;

    if (frames.length > 1) {
      shContent += `trap 'printf "\\e[0m\\n"; exit' INT\n\n`;
      shContent += `while true; do\n`;
      for (let i = 0; i < frames.length; i++) {
        shContent += `  printf "\\e[H%b" ${bashFrames[i]}\n`;
        shContent += `  sleep ${delays[i]}\n`;
      }
      shContent += `done\n`;
    } else {
      shContent += `printf "\\e[H%b\\n" ${bashFrames[0]}\n`;
    }

    triggerDownload(isGif ? 'play_ascii.sh' : 'print_ascii.sh', shContent, 'application/x-sh');
  };

  const exportPowerShell = () => {
    if (frames.length === 0) return;
    const useColorExport = colorized && frames.some(f => !!f.canvas);

    const psFrames = frames.map(f => {
      let text = useColorExport ? getAnsiFrameText(f) : getPlainFrameText(f.text);

      text = text.replace(/'/g, "''");
      text = text.replace(/\x1b/g, '__ESC__');
      return `'${text}'.Replace('__ESC__', $esc)`;
    });

    const delays = frames.map(f => Math.max(20, f.delay));

    let psContent = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n`;
    psContent += `$esc = [string][char]27\n`;
    psContent += `$ErrorActionPreference = "Stop"\n`;
    psContent += `Clear-Host\n`;
    psContent += `[Console]::Write("$esc[2J")\n\n`;

    psContent += `$frames = @(\n${psFrames.join(',\n')}\n)\n\n`;

    if (frames.length > 1) {
      psContent += `$delays = @(\n${delays.join(',\n')}\n)\n\n`;
      psContent += `try {\n`;
      psContent += `    try { [Console]::CursorVisible = $false } catch {}\n`;
      psContent += `    while ($true) {\n`;
      psContent += `        for ($i = 0; $i -lt $frames.Length; $i++) {\n`;
      psContent += `            [Console]::Write("$esc[H")\n`;
      psContent += `            [Console]::Write($frames[$i])\n`;
      psContent += `            Start-Sleep -Milliseconds $delays[$i]\n`;
      psContent += `        }\n`;
      psContent += `    }\n`;
      psContent += `} catch {\n`;
      psContent += `    Write-Host "\`nEin kritischer Fehler ist aufgetreten: $_" -ForegroundColor Red\n`;
      psContent += `    Read-Host "Druecke Enter zum Beenden"\n`;
      psContent += `} finally {\n`;
      psContent += `    try { [Console]::CursorVisible = $true } catch {}\n`;
      psContent += `    [Console]::Write("$esc[0m")\n`;
      psContent += `    Write-Host ""\n`;
      psContent += `}\n`;
    } else {
      psContent += `[Console]::Write("$esc[H")\n`;
      psContent += `[Console]::Write($frames[0])\n`;
      psContent += `[Console]::Write("$esc[0m")\n`;
      psContent += `Write-Host ""\n`;
    }

    triggerDownload(isGif ? 'play_ascii.ps1' : 'print_ascii.ps1', '\uFEFF' + psContent, 'text/plain;charset=utf-8');
  };

  const exportHtml = () => {
    if (frames.length === 0) return;
    const useColorExport = colorized && frames.every(f => !!f.canvas);
    const fontSize = debouncedSettings.format === 'braille' ? '10px' : '8px';
    const lineHeight = debouncedSettings.format === 'braille' ? '1em' : '1.1em';
    const htmlContent = useColorExport
      ? `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>ASCII Export</title>
<style>
  body { background: #0A0C10; color: #E5E7EB; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: auto; padding: 20px; }
  img { max-width: 100%; height: auto; image-rendering: pixelated; }
</style>
</head>
<body>
<img id="ascii-display" alt="ASCII Export" />
<script>
  const frames = ${JSON.stringify(frames.map(f => ({ delay: f.delay, src: f.canvas?.toDataURL('image/png') || '' })))};
  const display = document.getElementById('ascii-display');
  if (frames.length <= 1) {
    display.src = frames[0].src;
  } else {
    let i = 0;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    display.src = frames[0].src;
    function animate(time) {
      const dt = time - lastTime;
      lastTime = time;
      accumulatedTime += dt;
      if (accumulatedTime >= frames[i].delay) {
        accumulatedTime -= frames[i].delay;
        i = (i + 1) % frames.length;
        display.src = frames[i].src;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }
</script>
</body>
</html>`
      : `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>ASCII Export</title>
<style>
  body { background: #0A0C10; color: #E5E7EB; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: auto; padding: 20px; }
  pre { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; letter-spacing: 0; font-variant-ligatures: none; font-size: ${fontSize}; line-height: ${lineHeight}; }
</style>
</head>
<body>
<pre id="ascii-display"></pre>
<script>
  const frames = ${JSON.stringify(frames)};
  const display = document.getElementById('ascii-display');
  if (frames.length <= 1) {
    display.innerHTML = frames[0].text;
  } else {
    let i = 0;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    function animate(time) {
      const dt = time - lastTime;
      lastTime = time;
      accumulatedTime += dt;
      if (accumulatedTime >= frames[i].delay) {
        accumulatedTime -= frames[i].delay;
        i = (i + 1) % frames.length;
        display.innerHTML = frames[i].text;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }
</script>
</body>
</html>`;
    triggerDownload(isGif ? 'ascii_animation.html' : 'ascii_art.html', htmlContent, 'text/html');
  };

  const exportPython = () => {
    if (frames.length === 0) return;
    const useColorExport = colorized && frames.some(f => !!f.canvas);

    const pyFrames = frames.map(f => {
      let text = useColorExport ? getAnsiFrameText(f) : getPlainFrameText(f.text);

      text = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      text = text.replace(/\x1b/g, '\\033');
      return `"${text}"`;
    });
    const delays = frames.map(f => f.delay);

    let pyContent = `import sys\nimport time\nimport os\n\n`;
    pyContent += `if hasattr(sys.stdout, 'reconfigure'):\n    sys.stdout.reconfigure(encoding='utf-8')\n\n`;
    pyContent += `def clear():\n    os.system('cls' if os.name == 'nt' else 'clear')\n\n`;
    pyContent += `def reset_cursor():\n    sys.stdout.write("\\033[H")\n\n`;
    pyContent += `frames = [\n    ${pyFrames.join(',\n    ')}\n]\n\n`;

    if (frames.length > 1) {
      pyContent += `delays = [\n    ${delays.join(',\n    ')}\n]\n\n`;
      pyContent += `clear()\ntry:\n    while True:\n        for i in range(len(frames)):\n            reset_cursor()\n            sys.stdout.write(frames[i])\n            sys.stdout.flush()\n            time.sleep(max(0.02, delays[i] / 1000.0))\nexcept KeyboardInterrupt:\n    clear()\n    sys.exit(0)\n`;
    } else {
      pyContent += `sys.stdout.write(frames[0] + "\\n")\nsys.stdout.flush()\n`;
    }

    triggerDownload(isGif ? 'play_ascii.py' : 'print_ascii.py', '\uFEFF' + pyContent, 'text/plain;charset=utf-8');
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-zinc-200 overflow-x-hidden relative ${performanceMode ? 'perf-mode' : ''}`}
      data-theme={currentTheme}
      style={{ '--accent': themeConfig.accent, '--accent-rgb': themeConfig.rgb, fontFamily: '"Geist", system-ui, sans-serif' }}
    >
      <AsciiWaveBackground paused={performanceMode} accentRgb={themeConfig.rgb} />

      {/* Main Content Overlay */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">

        {/* Navigation */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2 text-white">
            <Terminal className="w-6 h-6" style={{ color: themeConfig.accent }} />
            <span className="font-mono font-bold text-lg tracking-tight">
              <ScrambleText text="ASCII.VERT" />
            </span>
          </div>
          <div className="flex justify-center items-center gap-5 font-mono text-xs text-zinc-400">
            <button onClick={() => setShowGifBrowser(true)} className="transition-colors flex items-center gap-1.5 font-bold hover:opacity-80" style={{ color: themeConfig.accent }}><Search className="w-4 h-4" /> GIPHY</button>
            <div className="w-[1px] h-4 bg-zinc-800"></div>
            <div className="flex bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 shadow-inner">
              <button
                onClick={() => setAppMode('static')}
                className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all duration-300 ${appMode === 'static' ? 'text-[#050505]' : 'text-zinc-500 hover:text-zinc-300'}`}
                style={appMode === 'static' ? { background: themeConfig.accent, boxShadow: `0 0 10px ${themeConfig.hover}` } : {}}
              >
                Image
              </button>
              <button
                onClick={() => setAppMode('gif')}
                className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all duration-300 ${appMode === 'gif' ? 'text-[#050505]' : 'text-zinc-500 hover:text-zinc-300'}`}
                style={appMode === 'gif' ? { background: themeConfig.accent, boxShadow: `0 0 10px ${themeConfig.hover}` } : {}}
              >
                Video / GIF
              </button>
            </div>
            <div className="w-[1px] h-4 bg-zinc-800"></div>
            {/* Theme Switcher */}
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-zinc-500" />
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setCurrentTheme(key)}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${currentTheme === key ? 'scale-125 border-white' : 'border-zinc-700 hover:border-zinc-500 hover:scale-110'}`}
                  style={{ background: t.accent }}
                  title={t.name}
                />
              ))}
            </div>
            <div className="w-[1px] h-4 bg-zinc-800"></div>
            {/* Performance Toggle */}
            <button
              onClick={() => setPerformanceMode(!performanceMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] uppercase font-bold transition-all duration-300 ${performanceMode
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <Zap className="w-3.5 h-3.5" />
              PERF
            </button>
            <div className="relative flex items-center">
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] uppercase font-bold transition-all duration-300 ${showMetrics
                  ? `bg-opacity-10 text-zinc-200`
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300'
                  }`}
                style={showMetrics ? { borderColor: `rgba(${themeConfig.rgb}, 0.5)`, background: `rgba(${themeConfig.rgb}, 0.1)`, color: themeConfig.accent } : {}}
              >
                <Activity className="w-3.5 h-3.5" />
                METRICS
              </button>
              {showMetrics && (
                <div className="absolute left-full ml-3 flex items-center gap-2 whitespace-nowrap z-30">
                  <div className="w-[1px] h-4 bg-zinc-800"></div>
                  {[
                    ['FPS', realFps || '—'],
                    ['RES', debouncedSettings.resolution],
                    ...(isGif && frames.length > 1 ? [['DELAY', `${frames[currentFrameIdx]?.delay || 100}ms`]] : [])
                  ].map(([label, val]) => (
                    <span key={label} className="flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold" style={{ borderColor: `rgba(${themeConfig.rgb}, 0.25)`, background: `rgba(${themeConfig.rgb}, 0.05)`, fontFamily: '"Geist Mono", monospace' }}>
                      <span className="text-zinc-500">{label}</span>
                      <span style={{ color: themeConfig.accent }}>{val}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-zinc-400">
            <button className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 backdrop-blur-md px-4 py-2 rounded-full text-zinc-200 transition-all duration-300 group" style={{ '--tw-border-opacity': 1 }}>
              <Code2 className="w-4 h-4 transition-colors" style={{ color: themeConfig.accent }} />
              <span>GITHUB</span>
            </button>
          </div>
        </nav>



        {/* Converter Interface */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow mb-4 items-start">

          {/* Left Panel: Inputs & Settings */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-120px)] lg:overflow-y-auto hide-scrollbar">

            {/* File Input (hidden, triggered from output panel) */}
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />

            {/* Settings Card */}
            <div className="bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4 text-white font-mono text-sm border-b border-zinc-800 pb-3">
                <SlidersHorizontal className="w-4 h-4" style={{ color: themeConfig.accent }} />
                <span>PARAMETERS</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                    <span>RESOLUTION</span>
                    <span style={{ color: themeConfig.accent }}>{resolution}</span>
                  </div>
                  <input
                    type="range"
                    min="20" max="140" step="10"
                    value={resolution}
                    onChange={(e) => setResolution(parseInt(e.target.value))}
                    onMouseDown={handleSliderStart}
                    onTouchStart={handleSliderStart}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: themeConfig.accent }}
                  />
                  {appMode === 'gif' && resolution > 120 && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400">
                      <AlertCircle className="w-3 h-3" /> Hohe Auflösung bei GIFs kann laggen.
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                    <span>CONTRAST</span>
                    <span style={{ color: themeConfig.accent }}>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50" max="200" step="5"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    onMouseDown={handleSliderStart}
                    onTouchStart={handleSliderStart}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: themeConfig.accent }}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                    <span>BRIGHTNESS</span>
                    <span style={{ color: themeConfig.accent }}>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50" max="200" step="5"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    onMouseDown={handleSliderStart}
                    onTouchStart={handleSliderStart}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: themeConfig.accent }}
                  />
                </div>

                {format === 'braille' && (
                  <div>
                    <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                      <span>THRESHOLD</span>
                      <span style={{ color: themeConfig.accent }}>{threshold}</span>
                    </div>
                    <input
                      type="range"
                      min="1" max="254"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                      onMouseDown={handleSliderStart}
                      onTouchStart={handleSliderStart}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: themeConfig.accent }}
                    />
                  </div>
                )}

                {/* More Settings */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono text-zinc-400 pt-3 border-t border-zinc-800">
                  <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white transition-colors">
                    <span className="themed-checkbox" style={{ '--cb-color': themeConfig.accent, '--cb-rgb': themeConfig.rgb }}>
                      <input type="checkbox" checked={colorized} onChange={(e) => setColorized(e.target.checked)} />
                      <span className="checkmark"></span>
                    </span>
                    Colorized
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white transition-colors">
                    <span className="themed-checkbox" style={{ '--cb-color': themeConfig.accent, '--cb-rgb': themeConfig.rgb }}>
                      <input type="checkbox" checked={dithering} onChange={(e) => setDithering(e.target.checked)} />
                      <span className="checkmark"></span>
                    </span>
                    Dithering
                  </label>
                </div>

                <div className="pt-3 flex flex-col gap-3">
                  <div className="relative group">
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 py-3 px-4 pr-10 rounded-2xl text-sm font-medium appearance-none cursor-pointer hover:border-zinc-600 outline-none transition-all duration-200"
                      style={{ fontFamily: '"Geist", system-ui, sans-serif' }}
                    >
                      {Object.entries(ASCII_FORMATS).map(([key, val]) => (
                        <option key={key} value={key}>{val.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setInvert(!invert)}
                    className={`flex-1 ${invert ? '' : 'bg-zinc-900 border-zinc-800 text-zinc-300'} hover:bg-zinc-800 border py-3 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2`}
                    style={invert ? { background: `rgba(${themeConfig.rgb}, 0.1)`, borderColor: `rgba(${themeConfig.rgb}, 0.3)`, color: themeConfig.accent } : {}}
                  >
                    <RefreshCw className="w-4 h-4" /> {invert ? 'Inverted' : 'Invert'}
                  </button>
                </div>

              </div>
            </div>

            {/* Animation Tools for GIF */}
            {isGif && frames.length > 1 && (
              <div className="bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4 text-white text-sm border-b border-zinc-800 pb-3" style={{ fontFamily: '"Geist Mono", monospace' }}>
                  <Film className="w-4 h-4" style={{ color: themeConfig.accent }} />
                  <span>ANIMATION</span>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-zinc-400" style={{ fontFamily: '"Geist Mono", monospace' }}>
                    FRAME <span style={{ color: themeConfig.accent }}>{currentFrameIdx + 1}</span>/{frames.length}
                  </div>
                  <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-xl ${isPlaying ? 'text-[#050505]' : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'} transition-all`} style={isPlaying ? { background: themeConfig.accent, boxShadow: `0 0 12px ${themeConfig.hover}` } : {}}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="range" min="0" max={frames.length - 1} value={currentFrameIdx}
                  onChange={(e) => { setIsPlaying(false); setCurrentFrameIdx(parseInt(e.target.value)); }}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: themeConfig.accent }}
                />

                {/* Trim — dual range slider */}
                <div className="mt-4 pt-4 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-400" style={{ fontFamily: '"Geist Mono", monospace' }}>
                      <Scissors className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
                      <span>TRIM</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/40" style={{ color: themeConfig.accent, fontFamily: '"Geist Mono", monospace' }}>keep {(trimEnd || frames.length - 1) - trimStart + 1} of {frames.length}</span>
                  </div>
                  <div className="dual-range-wrap" style={{ '--range-color': themeConfig.accent }}>
                    <input
                      type="range" min="0" max={frames.length - 1}
                      value={trimStart}
                      onChange={(e) => { const v = parseInt(e.target.value); if (v < (trimEnd || frames.length - 1)) setTrimStart(v); }}
                      className="dual-range"
                    />
                    <input
                      type="range" min="0" max={frames.length - 1}
                      value={trimEnd || frames.length - 1}
                      onChange={(e) => { const v = parseInt(e.target.value); if (v > trimStart) setTrimEnd(v); }}
                      className="dual-range"
                    />
                  </div>
                  <button onClick={applyTrim} disabled={trimStart === 0 && (trimEnd === 0 || trimEnd === frames.length - 1)}
                    className="w-full mt-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 text-xs font-bold transition-all flex justify-center items-center gap-2"
                  >
                    <Scissors className="w-3.5 h-3.5" /> Trim
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Live Output */}
          <div ref={outputPanelRef} data-output-panel className="lg:col-span-8 xl:col-span-9 flex flex-col h-[600px] lg:h-[calc(100vh-120px)] rounded-3xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-2xl overflow-hidden shadow-2xl relative group lg:sticky lg:top-6">

            {/* Output Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-zinc-900/50 border-b border-zinc-800/80 backdrop-blur-md z-30">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: `rgba(${themeConfig.rgb}, 0.5)` }}></div>
                </div>
                <span className="text-xs font-mono text-zinc-500 ml-2">OUTPUT_BUFFER.TXT</span>

                {sourceUrl && (
                  <button onClick={clearMedia} className="ml-2 text-zinc-500 hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity" title="Clear">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 relative">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-[11px] font-medium" title="Upload">
                  <Upload className="w-3.5 h-3.5" />
                  <span>UPLOAD</span>
                </button>
                <button onClick={copyToClipboard} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                  {copied ? <Check className="w-4 h-4" style={{ color: themeConfig.accent }} /> : <Copy className="w-4 h-4" />}
                </button>
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl z-50 flex flex-col py-1 overflow-hidden">
                      <button onClick={exportHtml} className="px-5 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex gap-2 items-center"><Globe className="w-3.5 h-3.5 text-blue-500" /> Web-Player (.html)</button>
                      <button onClick={exportPython} className="px-5 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex gap-2 items-center"><Terminal className="w-3.5 h-3.5 text-green-500" /> Python Script (.py)</button>
                      <button onClick={exportBash} className="px-5 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex gap-2 items-center"><Command className="w-3.5 h-3.5 text-yellow-500" /> Bash Script (.sh)</button>
                      <button onClick={exportPowerShell} className="px-5 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex gap-2 items-center"><Monitor className="w-3.5 h-3.5 text-violet-500" /> PowerShell (.ps1)</button>
                      <button onClick={exportAnsi} className="px-5 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex gap-2 items-center"><Code2 className="w-3.5 h-3.5 text-purple-500" /> ANSI Art (.ansi)</button>
                      <button onClick={exportZip} className="px-5 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex gap-2 items-center"><Archive className="w-3.5 h-3.5 text-orange-400" /> ZIP Archiv (.zip)</button>
                      <button onClick={exportTxt} className="px-5 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex gap-2 items-center"><FileText className="w-3.5 h-3.5 text-gray-400" /> Rohtext (.txt)</button>
                    </div>
                  )}
                </div>
                <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen();
                  else outputPanelRef.current?.requestFullscreen();
                }}>
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Output Canvas/Terminal */}
            <div className="flex-grow relative bg-[#0a0a0a] flex items-center justify-center overflow-auto hide-scrollbar z-10 w-full" style={{ minHeight: 0 }}>
              {/* Scanline overlay effect */}
              <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEElEQVQIW2NkYGD4z8DAwMgAI0AMCZ1P+wwAAAABJRU5ErkJggg==')] opacity-20 z-20"></div>

              {/* Loading / Error Overlays */}
              {isProcessing && !errorMsg && (
                <div className="absolute z-30 flex flex-col items-center justify-center bg-[#0a0a0a]/80 inset-0 backdrop-blur-sm">
                  <Wand2 className="w-8 h-8 animate-bounce mb-4" style={{ color: themeConfig.accent }} />
                  <div className="text-white font-bold text-sm mb-2">{isGif ? `Verarbeite GIF (${processingProgress}%)...` : 'Erzeuge ASCII...'}</div>
                  {isGif && <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full transition-all duration-200" style={{ width: `${processingProgress}%`, background: themeConfig.accent, boxShadow: `0 0 10px ${themeConfig.hover}` }}></div></div>}
                </div>
              )}
              {errorMsg && (
                <div className="absolute z-30 flex flex-col items-center justify-center bg-[#0a0a0a]/90 inset-0 backdrop-blur-md p-6 text-center border-2 border-red-500/20 m-6 rounded-3xl">
                  <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
                  <div className="text-white font-bold text-sm mb-2">Error</div>
                  <div className="text-red-400 text-xs">{errorMsg}</div>
                </div>
              )}

              {/* Display Area */}
              {!sourceUrl ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300"
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current++; setIsHoveringDrop(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current--; if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setIsHoveringDrop(false); } }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); dragCounterRef.current = 0; setIsHoveringDrop(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file) processFile(file, appMode, resolution);
                  }}
                >
                  <div className={`transition-opacity duration-300 ${isHoveringDrop ? 'opacity-20' : 'opacity-80'}`}>
                    <AsciiDonut accentColor={themeConfig.accent} />
                  </div>
                  {isHoveringDrop && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ background: `rgba(10,10,10,0.7)`, boxShadow: `inset 0 0 60px rgba(${themeConfig.rgb}, 0.15)` }}>
                      <div className="p-4 rounded-2xl border-2 border-dashed transition-all" style={{ borderColor: `rgba(${themeConfig.rgb}, 0.5)` }}>
                        <Upload className="w-8 h-8" style={{ color: themeConfig.accent }} />
                      </div>
                      <p className="text-zinc-300 text-sm mt-3 font-medium">Loslassen zum Laden</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {debouncedSettings.colorized ? (
                    <canvas
                      ref={canvasDisplayRef}
                      className="transition-opacity duration-200 z-10 m-auto p-4 object-contain"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        opacity: isProcessing ? 0.3 : 1
                      }}
                    />
                  ) : (
                    <pre
                      ref={asciiDisplayRef}
                      className="transition-opacity duration-200 z-10 m-auto p-4"
                      style={{
                        fontFamily: '"Geist Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                        lineHeight: debouncedSettings.format === 'braille' ? '1em' : '1.1em',
                        letterSpacing: '0',
                        fontVariantLigatures: 'none',
                        fontSize: debouncedSettings.format === 'braille' ? '10px' : '8px',
                        opacity: isProcessing ? 0.3 : 1,
                        userSelect: isPlaying && frames.length > 1 ? 'none' : 'text'
                      }}
                    />
                  )}
                </>
              )}


            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-800/50 pt-3 pb-2 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-zinc-500">
          <p>© {new Date().getFullYear()} ASCII.VERT. All systems nominal.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-zinc-300">Privacy</a>
            <a href="#" className="hover:text-zinc-300">Terms</a>
            <div className="flex items-center gap-1 cursor-default">
              <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ background: themeConfig.accent }}></span>
              System Status
            </div>
          </div>
        </footer>

      </div>

      {/* GIF Browser Modal */}
      {showGifBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl w-[90vw] max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}cc)`, boxShadow: `0 0 15px ${themeConfig.hover}` }}>
                  <Search className="w-4 h-4 text-[#050505]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm font-mono">GIF Browser</h2>
                  <p className="text-[10px] text-zinc-500">Powered by GIPHY — Anime, Memes & mehr</p>
                </div>
              </div>
              <button
                onClick={() => setShowGifBrowser(false)}
                className="p-2 hover:bg-zinc-800/60 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-5 py-3 border-b border-zinc-800 shrink-0">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={gifSearchQuery}
                    onChange={(e) => setGifSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { searchGifs(gifSearchQuery, 0); setGifSearchOffset(0); } }}
                    placeholder="GIF suchen... (z.B. anime, cat, meme)"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-200 text-xs placeholder-zinc-500 focus:outline-none transition-colors"
                    style={{ fontFamily: '"Geist Mono", monospace' }}
                  />
                </div>
                <button
                  onClick={() => { searchGifs(gifSearchQuery, 0); setGifSearchOffset(0); }}
                  className="px-4 py-2.5 text-[#050505] rounded-xl text-xs font-bold transition-colors"
                  style={{ background: themeConfig.accent, boxShadow: `0 0 10px ${themeConfig.hover}` }}
                >
                  Suchen
                </button>
              </div>
              {/* Quick filters */}
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {['anime', 'anime girl', 'naruto', 'dragon ball', 'one piece', 'cat', 'meme', 'pixel art', 'cyberpunk', 'vaporwave'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setGifSearchQuery(tag); searchGifs(tag, 0); setGifSearchOffset(0); }}
                    className="px-2.5 py-1 text-[10px] font-medium bg-zinc-800/60 border border-zinc-700/50 rounded-full text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {gifSearchLoading && gifSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: themeConfig.accent }} />
                  <p className="text-xs font-mono">Lade GIFs...</p>
                </div>
              ) : gifSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-xs">Keine GIFs gefunden. Versuche einen anderen Suchbegriff.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {gifSearchResults.map((gif) => (
                      <div
                        key={gif.id}
                        className="relative group rounded-xl overflow-hidden border border-zinc-800 transition-all duration-300 bg-zinc-950 aspect-square"
                        style={{ '--hover-border': `rgba(${themeConfig.rgb}, 0.5)` }}
                      >
                        <img
                          src={gif.images?.fixed_height_small?.url || gif.images?.fixed_height?.url}
                          alt={gif.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                          <p className="text-[9px] text-zinc-200 truncate mb-1.5">{gif.title || 'GIF'}</p>
                          <button
                            onClick={() => loadGifFromUrl(gif.images?.original?.url || gif.images?.fixed_height?.url, gif.title)}
                            className="flex items-center justify-center gap-1 w-full py-1.5 text-[#050505] rounded-lg text-[10px] font-bold transition-colors"
                            style={{ background: themeConfig.accent }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Zum Converter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Load more */}
                  <div className="flex justify-center mt-4 pb-2">
                    <button
                      onClick={() => searchGifs(gifSearchQuery, gifSearchOffset)}
                      disabled={gifSearchLoading}
                      className="px-6 py-2 bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {gifSearchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Mehr laden
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2 border-t border-zinc-800 bg-zinc-950/60 shrink-0 flex items-center justify-between">
              <span className="text-[9px] text-zinc-500 font-mono">Powered by GIPHY</span>
              <span className="text-[9px] text-zinc-500 font-mono">{gifSearchResults.length} GIFs geladen</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(39,39,42,0.8); border: 2px solid transparent; background-clip: padding-box; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(63,63,70,0.8); background-clip: padding-box; }

        /* Hidden scrollbar utility */
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }

        /* Fullscreen scaling fix */
        [data-output-panel]:fullscreen { background: #0a0a0a; display: flex; flex-direction: column; }
        [data-output-panel]:fullscreen > div:last-child { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; }
        [data-output-panel]:fullscreen pre { max-width: 100vw; max-height: 100vh; overflow: auto; margin: auto; }

        /* Performance mode */
        .perf-mode * { transition-duration: 0s !important; animation-duration: 0s !important; }
        .perf-mode .animate-pulse { animation: none !important; }
        .perf-mode .animate-bounce { animation: none !important; }
        .perf-mode .animate-spin { animation: none !important; }

        /* Themed Checkboxes */
        .themed-checkbox { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0; }
        .themed-checkbox input { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; margin: 0; z-index: 1; }
        .themed-checkbox .checkmark { width: 16px; height: 16px; border-radius: 5px; border: 1.5px solid #52525b; background: #18181b; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .themed-checkbox input:checked + .checkmark { background: var(--cb-color); border-color: var(--cb-color); box-shadow: 0 0 8px rgba(var(--cb-rgb), 0.35); }
        .themed-checkbox input:checked + .checkmark::after { content: ''; display: block; width: 4px; height: 7px; border: solid #050505; border-width: 0 2px 2px 0; transform: rotate(45deg) translateY(-1px); }
        .themed-checkbox:hover .checkmark { border-color: #71717a; }

        /* Select/Combobox glass styling */
        select { background-color: rgba(24, 24, 27, 0.8) !important; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        select option { background: rgba(24, 24, 27, 0.95); color: #d4d4d8; padding: 10px 12px; border-bottom: 1px solid rgba(63, 63, 70, 0.3); }
        select option:checked, select option:hover { background: rgba(63, 63, 70, 0.6); }
        select:focus { border-color: var(--accent, #a855f7) !important; box-shadow: 0 0 0 1px var(--accent, #a855f7), 0 4px 20px rgba(0,0,0,0.3); }

        /* Dual range slider */
        .dual-range-wrap { position: relative; height: 20px; }
        .dual-range { position: absolute; width: 100%; top: 0; left: 0; height: 20px; margin: 0; -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; outline: none; }
        .dual-range::-webkit-slider-runnable-track { height: 6px; background: transparent; border-radius: 3px; }
        .dual-range:last-child::-webkit-slider-runnable-track { background: #27272a; }
        .dual-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--range-color, #a855f7); border: 2px solid #18181b; box-shadow: 0 0 6px rgba(0,0,0,0.5); cursor: pointer; pointer-events: all; margin-top: -5px; transition: transform 0.15s ease; }
        .dual-range::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .dual-range::-moz-range-track { height: 6px; background: #27272a; border-radius: 3px; border: none; }
        .dual-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--range-color, #a855f7); border: 2px solid #18181b; box-shadow: 0 0 6px rgba(0,0,0,0.5); cursor: pointer; pointer-events: all; }
      `}} />
    </div>
  );
}

// === ASCII ENGINE ===

const convertCanvasToAscii = async (sourceCanvas, options) => {
  return new Promise((resolve) => {
    const { format, resolution, invert, threshold, contrast, brightness, dithering, colorized } = options;

    let width, height;

    if (format === 'braille') {
      width = resolution * 2;
      const aspect = sourceCanvas.width / sourceCanvas.height;
      height = Math.ceil((width / aspect) / 4) * 4;
    } else {
      width = resolution;
      const aspect = sourceCanvas.width / sourceCanvas.height;
      height = Math.round((width / aspect) * 0.5);
    }

    const processCanvas = document.createElement('canvas');
    processCanvas.width = width;
    processCanvas.height = height;
    const ctx = processCanvas.getContext('2d', { willReadFrequently: true });

    ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const originalData = new Uint8ClampedArray(data);

    if (dithering) {
      let numLevels = format !== 'braille' ? ASCII_FORMATS[format].chars.length : 2;
      applyDithering(data, width, height, numLevels);
    }

    let offCanvas = null;
    let offCtx = null;
    let charWidth = 0;
    let charHeight = 0;

    if (colorized) {
      offCanvas = document.createElement('canvas');
      offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      const fontSize = format === 'braille' ? 10 : 8;
      const lineHeight = format === 'braille' ? 1 : 1.1;
      const fontString = `${fontSize}px "Geist Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`;

      offCtx.font = fontString;
      offCtx.textBaseline = "top";
      charWidth = offCtx.measureText('W').width;
      charHeight = fontSize * lineHeight;

      const cols = format === 'braille' ? width / 2 : width;
      const rows = format === 'braille' ? height / 4 : height;

      offCanvas.width = Math.ceil(cols * charWidth);
      offCanvas.height = Math.ceil(rows * charHeight);

      offCtx.font = fontString;
      offCtx.textBaseline = "top";
    }

    let resultText = '';

    if (format === 'braille') {
      resultText = processBraille(data, originalData, width, height, invert, threshold, colorized, offCtx, charWidth, charHeight);
    } else {
      const chars = ASCII_FORMATS[format].chars;
      resultText = processStandardAscii(data, originalData, width, height, chars, invert, colorized, offCtx, charWidth, charHeight);
    }

    resolve({ text: resultText, canvas: colorized ? offCanvas : null });
  });
};

const getBrightness = (r, g, b) => (r * 0.299 + g * 0.587 + b * 0.114);

const processStandardAscii = (data, originalData, width, height, chars, invert, colorized, offCtx, cw, ch) => {
  let resultStr = '';
  const charLen = chars.length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];

      if (a === 0) { resultStr += ' '; continue; }

      let brightness = getBrightness(r, g, b);
      if (invert) brightness = 255 - brightness;

      const charIndex = Math.floor((brightness / 255) * (charLen - 1));
      const char = chars[charIndex];

      if (colorized && char !== ' ') {
        offCtx.fillStyle = `rgb(${originalData[offset]},${originalData[offset + 1]},${originalData[offset + 2]})`;
        offCtx.fillText(char, x * cw, y * ch);
      }
      resultStr += char;
    }
    resultStr += '\n';
  }
  return resultStr;
};

const processBraille = (data, originalData, width, height, invert, threshold, colorized, offCtx, cw, ch) => {
  let resultStr = '';

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 2) {
      let brailleValue = 0, sumR = 0, sumG = 0, sumB = 0, activeCount = 0;

      const checkPixel = (dx, dy, bitValue) => {
        if (x + dx >= width || y + dy >= height) return;
        const offset = ((y + dy) * width + (x + dx)) * 4;
        if (data[offset + 3] < 128) return;

        const brightness = getBrightness(data[offset], data[offset + 1], data[offset + 2]);
        if (invert ? brightness >= threshold : brightness < threshold) {
          brailleValue += bitValue;
          if (colorized) {
            sumR += originalData[offset];
            sumG += originalData[offset + 1];
            sumB += originalData[offset + 2];
            activeCount++;
          }
        }
      };

      checkPixel(0, 0, 1); checkPixel(0, 1, 2); checkPixel(0, 2, 4); checkPixel(1, 0, 8);
      checkPixel(1, 1, 16); checkPixel(1, 2, 32); checkPixel(0, 3, 64); checkPixel(1, 3, 128);

      const char = String.fromCharCode(0x2800 + brailleValue);

      if (colorized && activeCount > 0 && brailleValue > 0) {
        offCtx.fillStyle = `rgb(${Math.round(sumR / activeCount)},${Math.round(sumG / activeCount)},${Math.round(sumB / activeCount)})`;
        offCtx.fillText(char, (x / 2) * cw, (y / 4) * ch);
      }
      resultStr += char;
    }
    resultStr += '\n';
  }
  return resultStr;
};

const applyDithering = (data, width, height, numLevels) => {
  const factor = (numLevels - 1) / 255;
  const floatData = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    floatData[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = floatData[idx];
      const clamped = Math.max(0, Math.min(255, oldPixel));
      const newPixel = Math.round(clamped * factor) / factor;
      floatData[idx] = newPixel;
      const err = oldPixel - newPixel;

      if (x + 1 < width) floatData[idx + 1] += err * (7 / 16);
      if (y + 1 < height) {
        if (x - 1 >= 0) floatData[idx + width - 1] += err * (3 / 16);
        floatData[idx + width] += err * (5 / 16);
        if (x + 1 < width) floatData[idx + width + 1] += err * (1 / 16);
      }
    }
  }

  for (let i = 0; i < width * height; i++) {
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = floatData[i];
  }
};
