import './DropZone.css';
import Button from "./Button";
import { createRef, useMemo, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";
import Pica from 'pica';
import * as iq from 'image-q';
import JSZip from "jszip";
import { saveAs } from 'file-saver';
import TwitchPreview from "./TwitchPreview";
import image from "../image.svg";
import ResizedImage from "./ResizedImage";

const SIZE_GROUPS = [
  {
    label: 'TWITCH EMOTES',
    items: [
      { key: 'twitch-emote-112', platform: 'twitch', type: 'emote', size: 112, preview: 'emote' },
      { key: 'twitch-emote-56', platform: 'twitch', type: 'emote', size: 56 },
      { key: 'twitch-emote-28', platform: 'twitch', type: 'emote', size: 28 },
    ],
  },
  {
    label: 'TWITCH BADGES',
    items: [
      { key: 'twitch-badge-72', platform: 'twitch', type: 'badge', size: 72, preview: 'badge' },
      { key: 'twitch-badge-36', platform: 'twitch', type: 'badge', size: 36 },
      { key: 'twitch-badge-18', platform: 'twitch', type: 'badge', size: 18 },
    ],
  },
  {
    label: 'DISCORD',
    items: [
      { key: 'discord-128', platform: 'discord', type: 'emoji', size: 128 },
    ],
  },
  {
    label: 'YOUTUBE',
    items: [
      { key: 'youtube-48', platform: 'youtube', type: 'emoji', size: 48 },
      { key: 'youtube-24', platform: 'youtube', type: 'emoji', size: 24 },
    ],
  },
  {
    label: 'FACEBOOK',
    items: [
      { key: 'facebook-240', platform: 'facebook', type: 'emoji', size: 240 },
    ],
  },
];

const ALL_SIZE_CONFIGS = SIZE_GROUPS.flatMap(group => group.items);

function DropZone() {
  const [draggingFile, setDraggingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [emotePreviewDataUrl, setEmotePreviewDataUrl] = useState('');
  const [badgePreviewDataUrl, setBadgePreviewDataUrl] = useState('');

  const fileInputRef = useRef(null);
  const sourceImageRef = useRef(null);
  const sourceImageCanvasRef = useRef(null);

  const canvasRefs = useMemo(() => {
    const refs = {};
    for (const config of ALL_SIZE_CONFIGS) {
      refs[config.key] = createRef();
    }
    return refs;
  }, []);

  const handleSetFile = file => {
    if (!file) {
      return;
    }

    setFileName(file.name.split('.').slice(0, -1).join('.') || file.name);
    setSourceImageUrl(URL.createObjectURL(file));
    setProgress(1);
    setLoadingText('Loading image...');
  };

  const handleChangeFile = e => {
    e.preventDefault();
    e.stopPropagation();
    handleSetFile(e.target.files?.[0]);
  };

  const handleClickChooseFile = () => {
    fileInputRef.current.click();
  };

  const handleDragEnter = e => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFile(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFile(false);
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFile(false);
    handleSetFile(e.dataTransfer.files?.[0]);
  };

  const updatePreviewIfNeeded = (config, canvas) => {
    if (config.preview === 'emote') {
      setEmotePreviewDataUrl(canvas.toDataURL());
    } else if (config.preview === 'badge') {
      setBadgePreviewDataUrl(canvas.toDataURL());
    }
  };

  const handleImageLoad = () => {
    const naturalWidth = sourceImageRef.current.naturalWidth;
    const naturalHeight = sourceImageRef.current.naturalHeight;
    const maxSideLength = Math.max(naturalWidth, naturalHeight);

    sourceImageCanvasRef.current.width = maxSideLength;
    sourceImageCanvasRef.current.height = maxSideLength;

    const sourceImageCanvasContext = sourceImageCanvasRef.current.getContext('2d');
    sourceImageCanvasContext.clearRect(0, 0, maxSideLength, maxSideLength);

    const widthOffset = Math.round((maxSideLength - naturalWidth) / 2);
    const heightOffset = Math.round((maxSideLength - naturalHeight) / 2);

    sourceImageCanvasContext.drawImage(
      sourceImageRef.current,
      widthOffset,
      heightOffset
    );

    let resized = 0;
    let withinSize = 0;

    setProgress(10);
    setLoadingText(`Resizing image... (${resized}/${ALL_SIZE_CONFIGS.length})`);

    const pica = new Pica();

    for (const config of ALL_SIZE_CONFIGS) {
      const canvasRef = canvasRefs[config.key];
      const canvas = canvasRef.current;

      pica.resize(sourceImageCanvasRef.current, canvas, {
        quality: 3,
        alpha: true,
      }).then(() => {
        resized += 1;
        setProgress(
          10 +
          ((resized / ALL_SIZE_CONFIGS.length) * 70) +
          ((withinSize / ALL_SIZE_CONFIGS.length) * 20)
        );
        setLoadingText(`Resizing image... (${resized}/${ALL_SIZE_CONFIGS.length})`);

        let compressionPass = 0;
        const initialColorsPower = 15;

        function tryCompressionPass(currentCanvas, colorsPower) {
          setLoadingText(`Compressing image... (Pass ${++compressionPass})`);

          const ctx = currentCanvas.getContext('2d');
          const resizedPointContainer = iq.utils.PointContainer.fromHTMLCanvasElement(currentCanvas);

          iq.buildPalette([resizedPointContainer], {
            colors: Math.pow(2, colorsPower)
          }).then(palette => {
            const imageData = ctx.createImageData(currentCanvas.width, currentCanvas.height);
            imageData.data.set(
              iq.applyPaletteSync(resizedPointContainer, palette).toUint8Array()
            );
            ctx.putImageData(imageData, 0, 0);
          }).then(() => {
            if (estimateCanvasFileSize(currentCanvas) > 25000 && colorsPower > 0) {
              tryCompressionPass(currentCanvas, colorsPower - 1);
            } else {
              withinSize += 1;
              setProgress(
                10 +
                ((resized / ALL_SIZE_CONFIGS.length) * 70) +
                ((withinSize / ALL_SIZE_CONFIGS.length) * 20)
              );
              updatePreviewIfNeeded(config, currentCanvas);
            }
          });
        }

        if (estimateCanvasFileSize(canvas) > 25000) {
          tryCompressionPass(canvas, initialColorsPower);
        } else {
          withinSize += 1;
          setProgress(
            10 +
            ((resized / ALL_SIZE_CONFIGS.length) * 70) +
            ((withinSize / ALL_SIZE_CONFIGS.length) * 20)
          );
          updatePreviewIfNeeded(config, canvas);
        }
      });
    }
  };

  const getOutputFileName = config => {
    return `${fileName}@${config.size}.png`;
  };

  const handleSaveAll = () => {
    const zip = new JSZip();

    for (const config of ALL_SIZE_CONFIGS) {
      const canvas = canvasRefs[config.key].current;

      canvas.toBlob(blob => {
        zip.file(getOutputFileName(config), blob);

        if (Object.keys(zip.files).length === ALL_SIZE_CONFIGS.length) {
          zip.generateAsync({ type: 'blob' }).then(zipData => {
            saveAs(zipData, `${fileName}.zip`);
          });
        }
      });
    }
  };

  const handleSaveImage = config => {
    const canvas = canvasRefs[config.key].current;
    canvas.toBlob(blob => {
      saveAs(blob, getOutputFileName(config));
    });
  };

  const handleClear = () => {
    window.location.reload();
  };

  return (
    <div
      className={
        'DropZone' +
        (draggingFile ? ' Dragging' : '') +
        (progress > 0 && progress < 100 ? ' Loading' : '') +
        (progress === 100 ? ' Done' : '')
      }
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      <img
        className="SourceImage"
        src={sourceImageUrl}
        ref={sourceImageRef}
        onLoad={handleImageLoad}
        alt="Source"
      />

      <canvas className="SourceImage" ref={sourceImageCanvasRef} />

      <input
        id="ImageInput"
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleChangeFile}
      />

      <div className="DropCallToAction">
        <img src={image} className="ImageIcon" alt="image icon" />
        <h2>Drop your image here</h2>
        <span className="Label">OR</span>
        <Button clickHandler={handleClickChooseFile}>Browse files</Button>
      </div>

      <div className="LoadingContainer">
        <h4>{loadingText}</h4>
        <ProgressBar progress={progress} />
      </div>

      <div className="ResizedContainer">
        <TwitchPreview
          emoteDataUrl={emotePreviewDataUrl}
          badgeDataUrl={badgePreviewDataUrl}
        />

        {SIZE_GROUPS.map(group => (
          <div key={group.label} style={{ width: '100%' }}>
            <div className="Label">{group.label}</div>
            <div className="ResizedRow">
              {group.items.map(config => (
                <div
                  key={config.key}
                  onClick={() => handleSaveImage(config)}
                  style={{ cursor: 'pointer' }}
                >
                  <ResizedImage
                    size={config.size}
                    fileSize={bytesToKilobytes(
                      estimateCanvasFileSize(canvasRefs[config.key].current)
                    )}
                  >
                    <canvas
                      className={`ResizedCanvas By${config.size}`}
                      width={config.size}
                      height={config.size}
                      ref={canvasRefs[config.key]}
                    />
                  </ResizedImage>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="BottomBar">
          <p>You can click any of the images above to save it to your computer.</p>
          <div className="ButtonContainer">
            <Button clickHandler={handleClear}>Clear</Button>
            <Button clickHandler={handleSaveAll}>Save all (.zip)</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function estimateCanvasFileSize(canvas) {
  if (canvas === null) {
    return 0;
  }

  const imageDataHeader = 'data:image/png;base64,';
  return Math.round((canvas.toDataURL('image/png').length - imageDataHeader.length) * (3 / 4));
}

function bytesToKilobytes(bytes) {
  return (bytes / 1024).toFixed(2);
}

export default DropZone;