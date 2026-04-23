'use client';

interface FileViewerProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
}

export default function FileViewer({ fileUrl, fileType, fileName }: FileViewerProps) {
  
  // Видео
  if (fileType.startsWith('video/')) {
    return (
      <div className="video-preview">
        <video 
          controls 
          className="video-player"
          preload="metadata"
        >
          <source src={fileUrl} type={fileType} />
          Ваш браузер не поддерживает видео
        </video>
        <div className="video-actions">
          <a href={fileUrl} download={fileName} className="download-link">
            📥 Скачать {fileName}
          </a>
        </div>
      </div>
    );
  }
  
  // Аудио
  if (fileType.startsWith('audio/')) {
    return (
      <div className="audio-preview">
        <audio controls className="audio-player">
          <source src={fileUrl} type={fileType} />
        </audio>
        <a href={fileUrl} download={fileName} className="download-link">
          📥 Скачать {fileName}
        </a>
      </div>
    );
  }
  
  // Изображения
  if (fileType.startsWith('image/')) {
    return (
      <div className="image-preview">
        <img src={fileUrl} alt={fileName} className="preview-image" />
        <a href={fileUrl} download={fileName} className="download-link">
          📥 Скачать {fileName}
        </a>
      </div>
    );
  }
  
  // PDF
  if (fileType === 'application/pdf') {
    return (
      <div className="pdf-preview">
        <a href={fileUrl} download={fileName} className="download-link">
          📥 Скачать {fileName}
        </a>
      </div>
    );
  }
  
  // Другие файлы
  return (
    <div className="file-download-only">
      <a href={fileUrl} download={fileName} className="download-link">
        📥 Скачать {fileName}
      </a>
    </div>
  );
}