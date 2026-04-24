import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface Props {
  rows: string[];
  palette: Record<string, string>;
  scale?: number;
}

export default function PixelGrid({ rows, palette, scale = 4 }: Props) {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const rects: React.ReactNode[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x];
      if (c === '.' || c === ' ') continue;
      const fill = palette[c];
      if (!fill) continue;
      rects.push(<Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    }
  }

  return (
    <Svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`}>
      {rects}
    </Svg>
  );
}
