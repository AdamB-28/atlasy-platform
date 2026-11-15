import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { parseWidths, getFirstStreetSimulationInput } = await server.ssrLoadModule('/src/utils/streetGeometry.ts')
const { default: UrbanSectionDiagram } = await server.ssrLoadModule('/src/components/UrbanSectionDiagram.tsx')
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

test('all workbook blocks render illustrative sections without unsupported shadows', () => {
  for (const city of atlas.cities) {
    for (const unit of city.analysisUnits) {
      const { streetWidth, buildingHeight, heightToWidthRatio } = unit.indicators
      const widths = parseWidths(streetWidth)
      const html = renderToStaticMarkup(React.createElement(UrbanSectionDiagram, {
        streetWidth, buildingHeight, heightToWidthRatio, sunAngle: 35,
      }))
      assert.equal((html.match(/cross-section\. Source facade-to-facade/g) || []).length, widths.length, `${city.id} ${unit.id}`)
      assert.match(html, /The source does not identify which heights face each street/)
      assert.doesNotMatch(html, /unobstructed projection continues/)
      assert.equal(getFirstStreetSimulationInput(heightToWidthRatio, streetWidth), null)
    }
  }
})
