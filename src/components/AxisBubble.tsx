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

export function AxisLegend({
  xName,
  yName,
  title,
  hint,
  dark = false,
}: {
  xName: string
  yName: string
  title: string
  hint: string
  dark?: boolean
}) {
  const stroke = dark ? '#f04b3a' : '#111'
  const fill = dark ? '#1c1c1c' : '#fff'
  return (
    <svg className={`axis-legend${dark ? ' dark' : ''}`} viewBox="0 0 248 72" role="img" aria-label={title}>
      <rect width="248" height="72" fill={dark ? '#1c1c1c' : '#fff'} />
      <AxisBubble cx={36} cy={36} r={16} name={xName || '1'} stroke={stroke} fill={fill} strokeWidth={1.8} fontSize={15} />
      <AxisBubble cx={92} cy={36} r={16} name={yName || 'A'} stroke={stroke} fill={fill} strokeWidth={1.8} fontSize={15} />
      <text x={122} y={28} fontSize={11} fill={dark ? '#e8e4d8' : '#333'} fontWeight={600}>
        {title}
      </text>
      <text x={122} y={46} fontSize={9.5} fill={dark ? '#9aa0a8' : '#666'}>
        {hint}
      </text>
    </svg>
  )
}
