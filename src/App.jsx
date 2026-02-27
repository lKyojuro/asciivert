import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Upload, Copy, RefreshCw, Image as ImageIcon, Settings,
  Check, FileCode, Wand2, ChevronDown, ChevronRight,
  Play, Pause, AlertCircle, ImagePlus, Film, AlertTriangle, X,
  Download, Globe, Terminal, FileText, Code2, Command, Monitor, Archive,
  Search, Plus, Loader2, Scissors, Sparkles, SlidersHorizontal, Maximize2
} from 'lucide-react';

const ASCII_FORMATS = {
  standard: { name: 'Standard', chars: ' .:-=+*#%@' },
  dense: { name: 'Dicht', chars: ' `.-\':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@' },
  blocks: { name: 'Blöcke', chars: ' ░▒▓█' },
  braille: { name: 'Braille (Punkte)', chars: 'braille' },
  minimal: { name: 'Minimal', chars: ' .-:*' },
  detailed: { name: 'Detailliert', chars: ' .\'\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$' },
  shadow: { name: 'Schatten', chars: ' ░▒▓█▄▀▌▐' },
  geometric: { name: 'Geometrisch', chars: ' ·∘○◎●◐◑◒◓' },
  katakana: { name: 'Katakana', chars: ' ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾙﾚﾛﾝ' },
  emoji: { name: 'Emoji', chars: ' ·░▪◾◼⬛' }
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
const AsciiWaveBackground = () => {
  const canvasRef = useRef(null);
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
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
      cols = Math.floor(width / fontSize); rows = Math.floor(height / fontSize);
      ctx.font = `${fontSize}px monospace`;
    };
    window.addEventListener('resize', resize);
    resize();
    const handleMouseMove = (e) => { targetMouseX = e.clientX; targetMouseY = e.clientY; };
    window.addEventListener('mousemove', handleMouseMove);
    let lastRenderTime = 0;
    const frameInterval = 50; // ~20fps for background (saves CPU)
    const render = (time) => {
      animationFrameId = requestAnimationFrame(render);
      if (time - lastRenderTime < frameInterval) return;
      lastRenderTime = time;
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      const t = time * 0.001;
      // Sample every 2nd cell for performance
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * fontSize, py = y * fontSize;
          const dx = px - mouseX, dy = py - mouseY;
          const distSq = dx * dx + dy * dy; // avoid sqrt
          const mouseInfluence = distSq < 90000 ? Math.max(0, 1 - Math.sqrt(distSq) / 300) : 0;
          const waveX = Math.sin(x * 0.1 + t + mouseInfluence * 2);
          const waveY = Math.cos(y * 0.1 + t);
          const depth = (waveX * waveY + 1) / 2;
          const charIndex = Math.floor(depth * (waveChars.length - 1));
          const opacity = 0.1 + (depth * 0.3) + (mouseInfluence * 0.5);
          ctx.fillStyle = mouseInfluence > 0.1
            ? `rgba(168, 85, 247, ${opacity + 0.2})`
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
  return <canvas ref={canvasRef} style={{willChange: 'contents'}} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

// --- ASCII Donut (empty-state animation) ---
const AsciiDonut = () => {
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
      animationId = setTimeout(() => requestAnimationFrame(renderDonut), 42); // ~24fps
    };
    renderDonut();
    return () => { clearTimeout(animationId); cancelAnimationFrame(animationId); };
  }, []);
  return (
    <pre className="font-mono text-[10px] leading-[0.85] text-purple-400 overflow-hidden flex items-center justify-center select-none">
      {frame}
    </pre>
  );
};

export default function AsciiConverter() {
  // --- STATE ---
  const [appMode, setAppMode] = useState('static');
  const [isHoveringDrop, setIsHoveringDrop] = useState(false);
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

  // Refs
  const asciiDisplayRef = useRef(null);
  const outputPanelRef = useRef(null);
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

  const debouncedSettings = useDebounce(currentSettings, 500);

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

    const taskId = Symbol('processing_task');
    currentTaskRef.current = taskId;

    const processMedia = async () => {
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

                const asciiText = await convertCanvasToAscii(canvas, debouncedSettings);
                targetFrames.push({
                  text: asciiText,
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
                if (asciiDisplayRef.current && targetFrames.length > 0) {
                  asciiDisplayRef.current.innerHTML = targetFrames[0].text;
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

              const asciiText = await convertCanvasToAscii(canvas, debouncedSettings);
              targetFrames.push({
                text: asciiText,
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
              if (asciiDisplayRef.current && targetFrames.length > 0) {
                asciiDisplayRef.current.innerHTML = targetFrames[0].text;
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

          const asciiText = await convertCanvasToAscii(canvas, debouncedSettings);

          if (currentTaskRef.current === taskId) {
            setFrames([{ text: asciiText, delay: 0 }]);
            setCurrentFrameIdx(0);
            if (asciiDisplayRef.current) {
              asciiDisplayRef.current.innerHTML = asciiText;
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
    if (!isPlaying && frames.length > 0 && asciiDisplayRef.current) {
      asciiDisplayRef.current.innerHTML = frames[currentFrameIdx]?.text || '';
    }
  }, [currentFrameIdx, frames, isPlaying]);

  // --- ANIMATION LOOP ---
  useEffect(() => {
    if (frames.length <= 1 || !isPlaying) return;

    let lastTime = performance.now();
    let accumulatedTime = 0;

    const animate = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      accumulatedTime += deltaTime;

      const currentFrame = frames[currentFrameRef.current];

      if (accumulatedTime >= currentFrame.delay) {
        accumulatedTime -= currentFrame.delay;

        const nextFrame = (currentFrameRef.current + 1) % frames.length;
        currentFrameRef.current = nextFrame;

        if (asciiDisplayRef.current) {
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
    if (asciiDisplayRef.current && trimmedFrames.length > 0) {
      asciiDisplayRef.current.innerHTML = trimmedFrames[0].text;
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

  const exportTxt = () => {
    if (frames.length === 0) return;
    const textContent = frames.map((f, i) => frames.length > 1 ? `Frame ${i + 1}:\n${f.text.replace(/<[^>]*>?/gm, '')}` : f.text.replace(/<[^>]*>?/gm, '')).join('\n\n====================\n\n');
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
      const ext = debouncedSettings.colorized ? 'ansi' : 'txt';
      let delaysInfo = "Frame Delays (in Millisekunden):\n\n";

      frames.forEach((f, i) => {
        let text = f.text;
        if (!debouncedSettings.colorized) {
          text = text.replace(/<[^>]*>?/gm, '');
        } else {
          text = text.replace(/<span style="color:rgb\((\d+),(\d+),(\d+)\)">(.*?)<\/span>/g, '\x1b[38;2;$1;$2;$3m$4\x1b[0m');
        }
        text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

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
    let ansiContent = '\x1b[2J';
    frames.forEach((f) => {
      let text = f.text;
      if (!debouncedSettings.colorized) {
        text = text.replace(/<[^>]*>?/gm, '');
      } else {
        text = text.replace(/<span style="color:rgb\((\d+),(\d+),(\d+)\)">(.*?)<\/span>/g, '\x1b[38;2;$1;$2;$3m$4\x1b[0m');
      }
      text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      ansiContent += '\x1b[H' + text;
    });
    triggerDownload(isGif ? 'ascii_animation.ansi' : 'ascii_art.ansi', ansiContent, 'text/plain');
  };

  const exportBash = () => {
    if (frames.length === 0) return;

    const bashFrames = frames.map(f => {
      let text = f.text;
      if (!debouncedSettings.colorized) {
        text = text.replace(/<[^>]*>?/gm, '');
      } else {
        text = text.replace(/<span style="color:rgb\((\d+),(\d+),(\d+)\)">(.*?)<\/span>/g, '__ESC__[38;2;$1;$2;$3m$4__ESC__[0m');
      }
      text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      text = text.replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/\n/g, '\\n');
      text = text.replace(/__ESC__/g, '\\e');
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

    const psFrames = frames.map(f => {
      let text = f.text;
      if (!debouncedSettings.colorized) {
        text = text.replace(/<[^>]*>?/gm, '');
      } else {
        text = text.replace(/<span style="color:rgb\((\d+),(\d+),(\d+)\)">(.*?)<\/span>/g, '__ESC__[38;2;$1;$2;$3m$4__ESC__[0m');
      }
      text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

      text = text.replace(/'/g, "''");
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
    const fontSize = debouncedSettings.format === 'braille' ? '10px' : '8px';
    const lineHeight = debouncedSettings.format === 'braille' ? '1em' : '1.1em';

    const htmlContent = `<!DOCTYPE html>
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

    const pyFrames = frames.map(f => {
      let text = f.text;
      if (!debouncedSettings.colorized) {
        text = text.replace(/<[^>]*>?/gm, '');
      } else {
        text = text.replace(/<span style="color:rgb\((\d+),(\d+),(\d+)\)">(.*?)<\/span>/g, '__ESC__[38;2;$1;$2;$3m$4__ESC__[0m');
      }
      text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

      text = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      text = text.replace(/__ESC__/g, '\\033');
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
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      <AsciiWaveBackground />

      {/* Main Content Overlay */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">

        {/* Navigation */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2 text-white">
            <Terminal className="w-6 h-6 text-purple-400" />
            <span className="font-mono font-bold text-lg tracking-tight">
              <ScrambleText text="ASCII.VERT" />
            </span>
          </div>
          <div className="flex justify-center items-center gap-5 font-mono text-xs text-zinc-400">
            <button onClick={() => setShowGifBrowser(true)} className="hover:text-purple-400 transition-colors flex items-center gap-1.5 font-bold"><Search className="w-4 h-4" /> GIPHY</button>
            <div className="w-[1px] h-4 bg-zinc-800"></div>
            <div className="flex bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 shadow-inner">
              <button
                onClick={() => setAppMode('static')}
                className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all duration-300 ${appMode === 'static' ? 'bg-purple-500 text-[#050505] shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Image
              </button>
              <button
                onClick={() => setAppMode('gif')}
                className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all duration-300 ${appMode === 'gif' ? 'bg-purple-500 text-[#050505] shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Video / GIF
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-zinc-400">
            <button className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 backdrop-blur-md px-4 py-2 rounded-full text-zinc-200 transition-all duration-300 hover:border-purple-500/30 group">
              <Code2 className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
              <span>GITHUB</span>
            </button>
          </div>
        </nav>



        {/* Converter Interface */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow mb-12">

          {/* Left Panel: Inputs & Settings */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">

            {/* Dropzone */}
            <label
              className={`relative flex-grow min-h-[250px] flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all duration-300 backdrop-blur-xl bg-zinc-950/40 cursor-pointer ${isHoveringDrop ? 'border-purple-500/50 bg-purple-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}
              onMouseEnter={() => setIsHoveringDrop(true)}
              onMouseLeave={() => setIsHoveringDrop(false)}
            >
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-transparent rounded-3xl -z-10 pointer-events-none" />

              <div className={`p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4 transition-transform duration-500 ${isHoveringDrop ? 'scale-110' : 'scale-100'}`}>
                <Upload className={`w-8 h-8 ${isHoveringDrop ? 'text-purple-400' : 'text-zinc-400'}`} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2 text-center truncate w-full max-w-[200px]" title={sourceFile ? sourceFile.name : ""}>
                {sourceFile ? sourceFile.name : "Initialize Conversion"}
              </h3>
              <p className="text-zinc-500 text-xs text-center max-w-[200px] mb-6">
                Drag and drop your image file here, or click to browse your system.
              </p>

              <div className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                Select File
              </div>
            </label>

            {/* Settings Card */}
            <div className="bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-6 text-white font-mono text-sm border-b border-zinc-800 pb-4">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <span>PARAMETERS</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                    <span>RESOLUTION</span>
                    <span className="text-purple-400">{resolution}</span>
                  </div>
                  <input
                    type="range"
                    min="20" max={appMode === 'gif' ? "200" : "400"} step="10"
                    value={resolution}
                    onChange={(e) => setResolution(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
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
                    <span className="text-purple-400">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50" max="200" step="5"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                    <span>BRIGHTNESS</span>
                    <span className="text-purple-400">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50" max="200" step="5"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {format === 'braille' && (
                  <div>
                    <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                      <span>THRESHOLD</span>
                      <span className="text-purple-400">{threshold}</span>
                    </div>
                    <input
                      type="range"
                      min="1" max="254"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                )}

                {/* More Settings */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                  <label className="flex items-center gap-2 cursor-pointer group hover:text-white">
                    <input type="checkbox" className="accent-violet-500 outline-none w-3.5 h-3.5 border border-zinc-600 bg-zinc-900 checked:bg-violet-500 appearance-none rounded-sm" checked={colorized} onChange={(e) => setColorized(e.target.checked)} />
                    Colorized
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group hover:text-white">
                    <input type="checkbox" className="accent-violet-500 outline-none w-3.5 h-3.5 border border-zinc-600 bg-zinc-900 checked:bg-violet-500 appearance-none rounded-sm" checked={dithering} onChange={(e) => setDithering(e.target.checked)} />
                    Dithering
                  </label>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <div className="relative group">
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 px-4 rounded-xl text-sm font-medium appearance-none cursor-pointer hover:border-zinc-700 outline-none focus:border-purple-500/50 transition-colors"
                    >
                      {Object.entries(ASCII_FORMATS).map(([key, val]) => (
                        <option key={key} value={key}>{val.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setInvert(!invert)}
                    className={`flex-1 ${invert ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300'} hover:bg-zinc-800 border py-3 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2`}
                  >
                    <RefreshCw className="w-4 h-4" /> {invert ? 'Inverted' : 'Invert'}
                  </button>
                </div>

              </div>
            </div>

            {/* Trimming & Animation Tools for GIF */}
            {isGif && frames.length > 1 && (
              <div className="bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-3xl">
                <div className="flex items-center gap-2 mb-6 text-white font-mono text-sm border-b border-zinc-800 pb-4">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>ANIMATION</span>
                </div>

                <div className="space-y-4">
                  {/* Playback */}
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>FRAME {currentFrameIdx + 1}/{frames.length}</span>
                    <button onClick={() => setIsPlaying(!isPlaying)} className={`p-1.5 rounded-full ${isPlaying ? 'bg-purple-500 text-[#050505] shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'} transition-all`}>
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type="range" min="0" max={frames.length - 1} value={currentFrameIdx}
                    onChange={(e) => { setIsPlaying(false); setCurrentFrameIdx(parseInt(e.target.value)); }}
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-violet-500 mb-4"
                  />

                  {/* Trimming */}
                  <div className="space-y-2 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between text-xs font-mono text-zinc-400">
                      <span>TRIM</span>
                      <span className="text-violet-400">{trimStart + 1} - {(trimEnd || frames.length - 1) + 1}</span>
                    </div>
                    <input
                      type="range" min="0" max={Math.max(0, (trimEnd || frames.length - 1) - 1)}
                      value={trimStart} onChange={(e) => setTrimStart(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500 mb-2 block"
                    />
                    <input
                      type="range" min={trimStart + 1} max={frames.length - 1}
                      value={trimEnd || frames.length - 1} onChange={(e) => setTrimEnd(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500 block"
                    />
                    <button onClick={applyTrim} disabled={trimStart === 0 && (trimEnd === 0 || trimEnd === frames.length - 1)} className="w-full mt-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5" /> Apply Trim
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Live Output */}
          <div ref={outputPanelRef} className="lg:col-span-8 xl:col-span-9 flex flex-col h-[600px] lg:h-auto rounded-3xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-2xl overflow-hidden shadow-2xl relative group">

            {/* Output Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-zinc-900/50 border-b border-zinc-800/80 backdrop-blur-md z-30">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-purple-500/50 animate-pulse"></div>
                </div>
                <span className="text-xs font-mono text-zinc-500 ml-2">OUTPUT_BUFFER.TXT</span>

                {sourceUrl && (
                  <button onClick={clearMedia} className="ml-2 text-zinc-500 hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity" title="Clear">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 relative">
                <button onClick={copyToClipboard} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors relative group/btn">
                  {copied ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4" />}
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs px-2.5 py-1 rounded whitespace-nowrap z-50 opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity shadow-lg">{copied ? 'Copied!' : 'Copy'}</span>
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
            <div className="flex-grow relative bg-[#0a0a0a] flex items-center justify-center overflow-auto custom-scrollbar z-10 w-full">
              {/* Scanline overlay effect */}
              <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEElEQVQIW2NkYGD4z8DAwMgAI0AMCZ1P+wwAAAABJRU5ErkJggg==')] opacity-20 z-20"></div>

              {/* Loading / Error Overlays */}
              {isProcessing && !errorMsg && (
                <div className="absolute z-30 flex flex-col items-center justify-center bg-[#0a0a0a]/80 inset-0 backdrop-blur-sm">
                  <Wand2 className="w-8 h-8 text-purple-400 animate-bounce mb-4" />
                  <div className="text-white font-bold text-sm mb-2">{isGif ? `Verarbeite GIF (${processingProgress}%)...` : 'Erzeuge ASCII...'}</div>
                  {isGif && <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-purple-500 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${processingProgress}%` }}></div></div>}
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
                <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                  <AsciiDonut />
                </div>
              ) : (
                <pre
                  ref={asciiDisplayRef}
                  className="transition-opacity duration-200 z-10 m-auto p-4"
                  style={{
                    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                    lineHeight: debouncedSettings.format === 'braille' ? '1em' : '1.1em',
                    letterSpacing: '0',
                    fontVariantLigatures: 'none',
                    fontSize: debouncedSettings.format === 'braille' ? '10px' : '8px',
                    opacity: isProcessing ? 0.3 : 1,
                    userSelect: isPlaying && frames.length > 1 ? 'none' : 'text'
                  }}
                />
              )}

              {/* Overlay stats */}
              {frames.length > 0 && !isProcessing && !errorMsg && (
                <div className="fixed bottom-6 right-8 text-[10px] font-mono text-zinc-600 z-30 flex flex-col items-end pointer-events-none drop-shadow-md bg-[#0a0a0a]/60 px-3 py-2 rounded-lg backdrop-blur-md">
                  <span>FPS: {isGif && frames.length > 1 ? (1000 / (frames[currentFrameIdx]?.delay || 100)).toFixed(1) : '—'}</span>
                  <span>RES: {debouncedSettings.resolution}</span>
                  <span>ALGO: {debouncedSettings.format.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-800/50 pt-6 pb-2 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-zinc-500">
          <p>© {new Date().getFullYear()} ASCII.VERT. All systems nominal.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-zinc-300">Privacy</a>
            <a href="#" className="hover:text-zinc-300">Terms</a>
            <div className="flex items-center gap-1 cursor-default">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block animate-pulse"></span>
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-200 text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                  />
                </div>
                <button
                  onClick={() => { searchGifs(gifSearchQuery, 0); setGifSearchOffset(0); }}
                  className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-[#050505] rounded-xl text-xs font-bold transition-colors shadow-[0_0_10px_rgba(52,211,153,0.2)]"
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
                    className="px-2.5 py-1 text-[10px] font-medium bg-zinc-800/60 border border-zinc-700/50 rounded-full text-zinc-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
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
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
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
                        className="relative group rounded-xl overflow-hidden border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 bg-zinc-950 aspect-square"
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
                            className="flex items-center justify-center gap-1 w-full py-1.5 bg-purple-500 hover:bg-purple-400 text-[#050505] rounded-lg text-[10px] font-bold transition-colors"
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
                      className="px-6 py-2 bg-zinc-800/60 border border-zinc-700/50 hover:border-purple-500/30 hover:bg-purple-500/5 text-zinc-400 hover:text-purple-400 rounded-xl text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-2"
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

    let result = '';

    if (format === 'braille') {
      result = processBraille(data, originalData, width, height, invert, threshold, colorized);
    } else {
      const chars = ASCII_FORMATS[format].chars;
      result = processStandardAscii(data, originalData, width, height, chars, invert, colorized);
    }

    resolve(result);
  });
};

const getBrightness = (r, g, b) => (r * 0.299 + g * 0.587 + b * 0.114);

const processStandardAscii = (data, originalData, width, height, chars, invert, colorized) => {
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
        resultStr += `<span style="color:rgb(${originalData[offset]},${originalData[offset + 1]},${originalData[offset + 2]})">${char}</span>`;
      } else {
        resultStr += char;
      }
    }
    resultStr += '\n';
  }
  return resultStr;
};

const processBraille = (data, originalData, width, height, invert, threshold, colorized) => {
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
        resultStr += `<span style="color:rgb(${Math.round(sumR / activeCount)},${Math.round(sumG / activeCount)},${Math.round(sumB / activeCount)})">${char}</span>`;
      } else {
        resultStr += char;
      }
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