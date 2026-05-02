import { useRef, type ReactNode } from 'react';
import { downloadText, exportSvgAsPng } from '../utils/export';

interface ChartFrameProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  svgMarkup?: string;
  svgFilename: string;
  pngFilename: string;
}

export default function ChartFrame({
  title,
  subtitle,
  children,
  svgMarkup,
  svgFilename,
  pngFilename,
}: ChartFrameProps) {
  const frameRef = useRef<HTMLElement | null>(null);

  const handleExportSvg = () => {
    if (!svgMarkup) {
      const svg = frameRef.current?.querySelector('svg');
      if (svg) {
        downloadText(svgFilename, svg.outerHTML, 'image/svg+xml;charset=utf-8');
      }
      return;
    }
    downloadText(svgFilename, svgMarkup, 'image/svg+xml;charset=utf-8');
  };

  const handleExportPng = async () => {
    const markup = svgMarkup ?? frameRef.current?.querySelector('svg')?.outerHTML;
    if (!markup) {
      return;
    }
    await exportSvgAsPng(pngFilename, markup, 1200, 700);
  };

  return (
    <section className="chart-frame" ref={frameRef}>
      <header className="chart-frame__header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="chart-frame__actions">
          <button type="button" onClick={handleExportSvg}>
            Export SVG
          </button>
          <button type="button" onClick={handleExportPng}>
            Export PNG
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}
