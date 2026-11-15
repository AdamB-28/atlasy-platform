import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { parseWidths, getFirstStreetSimulationInput } = await server.ssrLoadModule('/src/utils/streetGeometry.ts')
const { default: UrbanSectionDiagram } = await server.ssrLoadModule('/src/components/UrbanSectionDiagram.tsx')
const { default: StreetSunSimulator } = await server.ssrLoadModule('/src/components/StreetSunSimulator.tsx')
const atlas = JSON.parse(readFileSync('public/data/atlas.json', 'utf8'))

test.after(async () => { await server.close() })

test('street dimensions retain all semicolon-separated bands and decimal commas', () => {
  assert.deepEqual(parseWidths('15 - 18m; 20 - 21 m; 27 - 29 m; 59 m').map(({ min, max }) => [min, max]), [
    [15, 18], [20, 21], [27, 29], [59, 59],
  ])
  assert.deepEqual(parseWidths('19m ,22m ,41m').map(({ min }) => min), [19, 22, 41])
  assert.deepEqual(parseWidths('15m-26m; 55m').map(({ min, max }) => [min, max]), [[15, 26], [55, 55]])
  assert.deepEqual(parseWidths('7 m; 11,5 m').map(({ min }) => min), [7, 11.5])
})

test('all workbook blocks render illustrative sections and sun overlays', () => {
  for (const city of atlas.cities) {
    for (const unit of city.analysisUnits) {
      const { streetWidth, buildingHeight, heightToWidthRatio } = unit.indicators
      const widths = parseWidths(streetWidth)
      const html = renderToStaticMarkup(React.createElement(UrbanSectionDiagram, {
        streetWidth, buildingHeight, heightToWidthRatio, sunAngle: 35,
      }))
      assert.equal((html.match(/cross-section\. Source facade-to-facade/g) || []).length, widths.length, `${city.id} ${unit.id}`)
      assert.match(html, /The source does not identify which heights face each street/)
      assert.equal((html.match(/data-testid="section-shadow"/g) || []).length, widths.length)
      assert.equal((html.match(/data-testid="plan-shadow"/g) || []).length, widths.length)
      assert.equal((html.match(/data-testid="section-sun"/g) || []).length, widths.length)
      assert.equal((html.match(/data-testid="plan-sun"/g) || []).length, widths.length)
      assert.equal(getFirstStreetSimulationInput(heightToWidthRatio, streetWidth, buildingHeight).illustrative, true)
    }
  }
})

test('readings use the same illustrative street geometry and angle', () => {
  const input = getFirstStreetSimulationInput('0,53 - 2,81', '15 - 18m; 59m', '25m; 31 - 33m')
  assert.deepEqual(input, { widthLabel: '15–18m', widthM: 16.5, estimatedHeightM: 25, illustrative: true })
  const props = { enabled: true, angle: 45, sunFrom: 'left', dataA: input, labelA: 'UB_1' }
  const html = renderToStaticMarkup(React.createElement(StreetSunSimulator, props))
  assert.match(html, /Street 1 \(illustrative\): ≈25\.0 m unobstructed shadow/)
  assert.match(html, /spans W 15–18m/)
  const paired = getFirstStreetSimulationInput('1:1', '10m; 20m', '25m')
  assert.deepEqual(paired, { widthLabel: '10m', widthM: 10, estimatedHeightM: 10, illustrative: false })
  assert.equal(getFirstStreetSimulationInput(null, '10m', null), null)
})

test('sun toggle and direction affect both diagram views', () => {
  const props = { streetWidth: '15 - 18m', heightToWidthRatio: '0,53 - 2,81', buildingHeight: '25m' }
  const hidden = renderToStaticMarkup(React.createElement(UrbanSectionDiagram, props))
  const left = renderToStaticMarkup(React.createElement(UrbanSectionDiagram, { ...props, sunAngle: 35, sunFrom: 'left' }))
  const high = renderToStaticMarkup(React.createElement(UrbanSectionDiagram, { ...props, sunAngle: 80, sunFrom: 'left' }))
  const highRight = renderToStaticMarkup(React.createElement(UrbanSectionDiagram, { ...props, sunAngle: 80, sunFrom: 'right' }))
  assert.doesNotMatch(hidden, /data-testid="(?:plan|section)-(?:sun|shadow)"/)
  const shadow = (html, name) => html.match(new RegExp(`data-testid="${name}"[^>]+`))[0]
  for (const name of ['plan-shadow', 'section-shadow']) {
    assert.notEqual(shadow(high, name), shadow(highRight, name))
    assert.notEqual(shadow(left, name), shadow(high, name))
  }
})
