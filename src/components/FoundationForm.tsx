import type { ReactNode } from 'react'
import type { FoundationType, Inputs, LayoutType } from '../types'
import type { Lang } from '../i18n'
import { t } from '../i18n'
import { DIAMETERS, liveColumnSteel } from '../lib/calc'

type Props = {
  inp: Inputs
  lang: Lang
  onChange: (patch: Partial<Inputs>, edited?: keyof Inputs) => void
}

function Num({
  value,
  onChange,
  step = 1,
  wide,
}: {
  value: number
  onChange: (n: number) => void
  step?: number
  wide?: boolean
}) {
  return (
    <input
      className={wide ? 'num num-wide' : 'num'}
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

function Row({
  label,
  children,
  unit = 'mm',
}: {
  label: string
  children: ReactNode
  unit?: string
}) {
  return (
    <label className="field">
      <span className="field-label">- {label}</span>
      <span className="field-controls">
        {children}
        {unit ? <span className="unit">{unit}</span> : null}
      </span>
    </label>
  )
}

function Dia({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="dia">
      <span className="phi">φ</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {DIAMETERS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </span>
  )
}

export function FoundationForm({ inp, lang, onChange }: Props) {
  const L = t[lang]
  const live = liveColumnSteel(inp)
  const elev = (key: 'cdn' | 'cdtn' | 'cdg') => Math.abs(inp[key])

  return (
    <>
      <div className="form-col">
      <fieldset className="panel footing-id-panel">
        <legend>{L.nameQty}</legend>
        <div className="footing-id">
          <label className="footing-id-name">
            <span className="footing-id-k">{L.nameMark}</span>
            <input
              className="footing-id-input"
              value={inp.name}
              onChange={(e) => onChange({ name: e.target.value })}
              aria-label={L.nameMark}
            />
          </label>
          <label className="footing-id-qty">
            <span className="footing-id-k">{L.qtyShort}</span>
            <input
              className="footing-id-input footing-id-qty-input"
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(inp.qty) ? inp.qty : 1}
              onChange={(e) => onChange({ qty: Number(e.target.value) })}
              aria-label={L.qtyShort}
            />
          </label>
        </div>
      </fieldset>
      <fieldset className="panel">
        <legend>{L.quick}</legend>
        <div className="radios">
          {(
            [
              ['ecc-x', L.eccX],
              ['ecc-y', L.eccY],
              ['ecc-xy', L.eccXY],
              ['center', L.center],
            ] as const
          ).map(([v, label]) => (
            <label key={v}>
              <input
                type="radio"
                name="layout"
                checked={inp.layout === v}
                onChange={() => onChange({ layout: v as LayoutType }, 'layout')}
              />
              {label}
            </label>
          ))}
        </div>
        <Row label={L.xMong}>
          <Num value={inp.xMong} onChange={(xMong) => onChange({ xMong })} />
        </Row>
        <Row label={L.yMong}>
          <Num value={inp.yMong} onChange={(yMong) => onChange({ yMong })} />
        </Row>
        <Row label={L.wNeckCol} unit="">
          <Num value={inp.xCo} onChange={(xCo) => onChange({ xCo })} />
          <Num value={inp.xCol} onChange={(xCol) => onChange({ xCol })} />
          <span className="unit">mm</span>
        </Row>
        <Row label={L.hNeckCol} unit="">
          <Num value={inp.yCo} onChange={(yCo) => onChange({ yCo })} />
          <Num value={inp.yCol} onChange={(yCol) => onChange({ yCol })} />
          <span className="unit">mm</span>
        </Row>
      </fieldset>

      <fieldset className="panel">
        <legend>{L.other}</legend>
        <Row label={L.hCom}>
          <Num value={inp.hCom} onChange={(hCom) => onChange({ hCom })} />
        </Row>
        <Row label={L.hCm}>
          <Num value={inp.hCm} onChange={(hCm) => onChange({ hCm })} />
        </Row>
        <Row label={L.hDm}>
          <Num value={inp.hDm} onChange={(hDm) => onChange({ hDm })} />
        </Row>
        <Row label={L.xCc}>
          <input
            className="axis-name"
            value={inp.axisXName}
            maxLength={4}
            aria-label={L.axisName}
            onChange={(e) => onChange({ axisXName: e.target.value }, 'axisXName')}
          />
          <Num
            value={inp.xCc}
            onChange={(xCc) => onChange({ xCc }, 'xCc')}
          />
        </Row>
        <Row label={L.yCc}>
          <input
            className="axis-name"
            value={inp.axisYName}
            maxLength={4}
            aria-label={L.axisName}
            onChange={(e) => onChange({ axisYName: e.target.value }, 'axisYName')}
          />
          <Num
            value={inp.yCc}
            onChange={(yCc) => onChange({ yCc }, 'yCc')}
          />
        </Row>
        <Row label={L.x1}>
          <Num value={inp.x1} onChange={(x1) => onChange({ x1 }, 'x1')} />
        </Row>
        <Row label={L.y1}>
          <Num value={inp.y1} onChange={(y1) => onChange({ y1 }, 'y1')} />
        </Row>
        <Row label={L.cdn}>
          <span className="minus">−</span>
          <Num value={elev('cdn')} onChange={(v) => onChange({ cdn: -Math.abs(v) })} />
        </Row>
        <Row label={L.cdtn}>
          <span className="minus">−</span>
          <Num value={elev('cdtn')} onChange={(v) => onChange({ cdtn: -Math.abs(v) })} />
        </Row>
        <Row label={L.cdg}>
          <span className="minus">−</span>
          <Num value={elev('cdg')} onChange={(v) => onChange({ cdg: -Math.abs(v) })} />
        </Row>
      </fieldset>
      </div>

      <div className="form-col">
      <fieldset className="panel">
        <legend>{L.rebarNeck}</legend>
        <Row label={L.cx} unit="">
          <Num value={inp.cx} onChange={(cx) => onChange({ cx })} />
        </Row>
        <Row label={L.cy} unit="">
          <Num value={inp.cy} onChange={(cy) => onChange({ cy })} />
        </Row>
        <Row label={L.dMain} unit="">
          <Dia value={inp.dMain} onChange={(dMain) => onChange({ dMain })} />
        </Row>
        <Row label={L.dStirrup} unit="mm">
          <Dia value={inp.dStirrup} onChange={(dStirrup) => onChange({ dStirrup })} />
          <span className="a-lab">a</span>
          <Num value={inp.aStirrup} onChange={(aStirrup) => onChange({ aStirrup })} />
        </Row>
        <p className="live">{L.using(live.n, inp.dMain)}</p>
        <p className="live">{L.as(live.asCm2.toFixed(2))}</p>
        <p className="live">{L.rho(live.rho.toFixed(3))}</p>
      </fieldset>

      <fieldset className="panel">
        <legend>{L.rebarBase}</legend>
        <Row label={L.faX} unit="mm">
          <Dia value={inp.dFaX} onChange={(dFaX) => onChange({ dFaX })} />
          <span className="a-lab">a</span>
          <Num value={inp.aFaX} onChange={(aFaX) => onChange({ aFaX })} />
        </Row>
        <Row label={L.faY} unit="mm">
          <Dia value={inp.dFaY} onChange={(dFaY) => onChange({ dFaY })} />
          <span className="a-lab">a</span>
          <Num value={inp.aFaY} onChange={(aFaY) => onChange({ aFaY })} />
        </Row>
        <label className="check">
          <input
            type="checkbox"
            checked={inp.bottomLayerX}
            onChange={(e) => onChange({ bottomLayerX: e.target.checked })}
          />
          {L.bottomX}
        </label>
      </fieldset>

      <fieldset className="panel">
        <legend>{L.settings}</legend>
        <div className="radios wrap">
          {(
            [
              ['normal', L.normal],
              ['sand', L.sand],
              ['tram', L.tram],
            ] as const
          ).map(([v, label]) => (
            <label key={v}>
              <input
                type="radio"
                name="ftype"
                checked={inp.fType === v}
                onChange={() => onChange({ fType: v as FoundationType })}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={inp.hasBeam}
            onChange={(e) => onChange({ hasBeam: e.target.checked })}
          />
          {L.beam}
          <Num value={inp.hBeam} onChange={(hBeam) => onChange({ hBeam })} />
          <span className="unit">mm</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={inp.stagger}
            onChange={(e) => onChange({ stagger: e.target.checked })}
          />
          {L.stagger}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={inp.doubleLayer}
            onChange={(e) => onChange({ doubleLayer: e.target.checked })}
          />
          {L.double}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={inp.hooked}
            onChange={(e) => onChange({ hooked: e.target.checked })}
          />
          {L.hook}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={inp.industrial}
            onChange={(e) => onChange({ industrial: e.target.checked })}
          />
          {L.industrial}
        </label>
        <Row label={L.lining}>
          <Num value={inp.lining} onChange={(lining) => onChange({ lining })} />
        </Row>
        <Row label={L.coverBase}>
          <Num value={inp.coverBase} onChange={(coverBase) => onChange({ coverBase })} />
        </Row>
        <Row label={L.coverCol}>
          <Num value={inp.coverCol} onChange={(coverCol) => onChange({ coverCol })} />
        </Row>
      </fieldset>
      </div>
    </>
  )
}
