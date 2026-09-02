type Props = {
  cx: number
  cy: number
  name: string
  r?: number
  stroke?: string
  fill?: string
  strokeWidth?: number
  fontSize?: number
}

/** Typical CAD grid-axis bubble: circle with four ticks at 12/3/6/9. */
export function AxisBubble({
  cx,
  cy,
  name,
  r = 11,
  stroke = '#111',
  fill = '#fff',
  strokeWidth = 1.35,
  fontSize,
}: Props) {
  const tick = Math.max(3.2, r * 0.42)
  const inset = r * 0.18
  return (
    <g className="axis-bubble">
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={cx} y1={cy - r - tick} x2={cx} y2={cy - r + inset} stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={cx} y1={cy + r - inset} x2={cx} y2={cy + r + tick} stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={cx - r - tick} y1={cy} x2={cx - r + inset} y2={cy} stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={cx + r - inset} y1={cy} x2={cx + r + tick} y2={cy} stroke={stroke} strokeWidth={strokeWidth} />
      <text
        x={cx}
        y={cy + (fontSize ?? r * 0.85) * 0.35}
        textAnchor="middle"
        fontSize={fontSize ?? r * 0.95}
        fontWeight={700}
        fill={stroke}
      >
        {name}
      </text>
    </g>
  )
}
