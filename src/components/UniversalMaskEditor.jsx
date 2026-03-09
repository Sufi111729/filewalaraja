import { useEffect, useMemo, useRef, useState } from "react";
import {
  clientToImagePoint,
  getDisplayMetrics,
  paintMask
} from "../lib/universalBgEditor";

function drawCheckerboard(ctx, width, height, size = 18) {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? "#e2e8f0" : "#f8fafc";
      ctx.fillRect(x, y, size, size);
    }
  }
}

function buildMaskedCanvas(sourceCanvas, mask, showOverlay) {
  const offscreen = document.createElement("canvas");
  offscreen.width = sourceCanvas.width;
  offscreen.height = sourceCanvas.height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);

  for (let i = 0; i < mask.length; i += 1) {
    const alpha = mask[i];
    const p = i * 4;
    imageData.data[p + 3] = alpha;
    if (showOverlay && alpha < 250) {
      const overlayStrength = (255 - alpha) / 255;
      imageData.data[p] = Math.round(imageData.data[p] * (1 - overlayStrength * 0.55) + 255 * overlayStrength * 0.55);
      imageData.data[p + 1] = Math.round(imageData.data[p + 1] * (1 - overlayStrength * 0.8));
      imageData.data[p + 2] = Math.round(imageData.data[p + 2] * (1 - overlayStrength * 0.8));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return offscreen;
}

export default function UniversalMaskEditor({
  sourceCanvas,
  mask,
  activeTool,
  brushSize,
  softness,
  zoom,
  pan,
  previewMode,
  showOverlay,
  onMaskDraft,
  onMaskCommit,
  onPanChange
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const pointerStateRef = useRef({ drawing: false, panning: false, changed: false, lastClient: null });
  const latestMaskRef = useRef(mask);
  const [viewportTick, setViewportTick] = useState(0);
  const maskedCanvas = useMemo(() => buildMaskedCanvas(sourceCanvas, mask, showOverlay), [sourceCanvas, mask, showOverlay]);

  useEffect(() => {
    latestMaskRef.current = mask;
  }, [mask]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || !sourceCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCheckerboard(ctx, width, height);

    const metrics = getDisplayMetrics(width, height, sourceCanvas.width, sourceCanvas.height, zoom, pan);
    const renderCanvas = previewMode === "before" ? sourceCanvas : maskedCanvas;
    ctx.drawImage(renderCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, metrics.offsetX, metrics.offsetY, metrics.drawWidth, metrics.drawHeight);
  }, [maskedCanvas, pan, previewMode, sourceCanvas, viewportTick, zoom]);

  useEffect(() => {
    function handleResize() {
      setViewportTick((value) => value + 1);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    pointerStateRef.current.lastClient = { x: event.clientX, y: event.clientY };

    if (activeTool === "pan") {
      pointerStateRef.current.panning = true;
      return;
    }

    if (previewMode === "before") return;
    pointerStateRef.current.drawing = true;
    pointerStateRef.current.changed = false;
    handlePointerMove(event);
  }

  function handlePointerMove(event) {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || !sourceCanvas) return;

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    const metrics = getDisplayMetrics(width, height, sourceCanvas.width, sourceCanvas.height, zoom, pan);

    if (pointerStateRef.current.panning) {
      const last = pointerStateRef.current.lastClient;
      if (last) {
        onPanChange({
          x: pan.x + (event.clientX - last.x),
          y: pan.y + (event.clientY - last.y)
        });
      }
      pointerStateRef.current.lastClient = { x: event.clientX, y: event.clientY };
      return;
    }

    if (!pointerStateRef.current.drawing) return;
    const point = clientToImagePoint(event.clientX, event.clientY, canvas.getBoundingClientRect(), metrics, sourceCanvas.width, sourceCanvas.height);
    if (!point) return;

    const nextMask = new Uint8ClampedArray(mask);
    paintMask(nextMask, sourceCanvas.width, sourceCanvas.height, point.x, point.y, {
      radius: brushSize,
      softness,
      mode: activeTool === "restore" ? "restore" : "remove"
    });
    pointerStateRef.current.changed = true;
    latestMaskRef.current = nextMask;
    onMaskDraft(nextMask);
  }

  function handlePointerUp(event) {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (pointerStateRef.current.changed) {
      onMaskCommit(latestMaskRef.current);
    }
    pointerStateRef.current = { drawing: false, panning: false, changed: false, lastClient: null };
  }

  return (
    <div ref={wrapperRef} className="universal-editor-stage">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
