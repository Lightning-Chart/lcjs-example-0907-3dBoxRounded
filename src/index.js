/*
 * LightningChartJS example that showcases BoxSeries3D with rounded edges.
 */
// Import LightningChartJS
const lcjs = require('@lightningchart/lcjs')

// Import xydata
const xydata = require('@lightningchart/xydata')

// Extract required parts from LightningChartJS.
const {
    lightningChart,
    AxisScrollStrategies,
    PalettedFill,
    LUT,
    UILayoutBuilders,
    UIOrigins,
    UIElementBuilders,
    regularColorSteps,
    LegendPosition,
    Themes,
} = lcjs

const { createWaterDropDataGenerator } = xydata

const chart3D = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .Chart3D({
        legend: {
            position: LegendPosition.RightCenter,
        },
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('BoxSeries3D with rounded edges enabled')

chart3D.getDefaultAxisY().setScrollStrategy(AxisScrollStrategies.expansion).setTitle('Height')

chart3D.getDefaultAxisX().setTitle('X')

chart3D.getDefaultAxisZ().setTitle('Z')

const boxSeries = chart3D.addBoxSeries()
const resolution = 10

// Create Color Look-Up-Table and FillStyle
const theme = chart3D.getTheme()
const lut = new LUT({
    steps: regularColorSteps(0, 100, theme.examples.intensityColorPalette),
    interpolate: true,
})

boxSeries
    .setFillStyle(new PalettedFill({ lut, lookUpProperty: 'y' }))
    // Specify edge roundness.
    // For applications with massive amounts of small Boxes, it is wise to disable for performance benefits.
    .setRoundedEdges(0.4)

// Generate height map data.
createWaterDropDataGenerator()
    .setRows(resolution)
    .setColumns(resolution)
    .generate()
    .then((waterdropData) => {
        let t = 0
        const step = () => {
            const result = []
            for (let x = 0; x < resolution; x++) {
                for (let y = 0; y < resolution; y++) {
                    const s = 1
                    const height = Math.max(
                        waterdropData[y][x] +
                            50 * Math.sin(((t + x * 0.5) * Math.PI) / resolution) +
                            20 * Math.sin(((t + y * 1.0) * Math.PI) / resolution),
                        0,
                    )
                    const box = {
                        xCenter: x,
                        yCenter: height / 2,
                        zCenter: y,
                        xSize: s,
                        ySize: height,
                        zSize: s,
                        // Specify an ID for each Box in order to modify it during later frames, instead of making new Boxes.
                        id: String(result.length),
                    }
                    result.push(box)
                }
            }

            boxSeries.invalidateData(result)

            t += 0.1
            requestAnimationFrame(step)
        }
        step()
    })

// Animate Camera movement from file.
;(async () => {
    const cameraAnimationData = await fetch(
        new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'examples/assets/0907/camera.json',
    ).then((r) => r.json())
    if (!cameraAnimationData) {
        console.log(`No Camera animation data.`)
        return
    }
    console.log(`Loaded Camera animation data.`)
    let frame = 0
    const nextFrame = () => {
        if (cameraAnimationEnabledCheckbox.getOn()) {
            const { cameraLocation } = cameraAnimationData.frames[Math.floor(frame) % cameraAnimationData.frames.length]
            chart3D.setCameraLocation(cameraLocation)
            frame += 1.5
        }
        requestAnimationFrame(nextFrame)
    }
    requestAnimationFrame(nextFrame)
})()

// * UI controls *
const group = chart3D.addUIElement(UILayoutBuilders.Column)
group
    .setPosition({ x: 0, y: 100 })
    .setOrigin(UIOrigins.LeftTop)
    .setMargin(10)
    .setPadding(4)
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-height',
        maxHeight: 0.3,
    })

// Add UI control for toggling camera animation.
const handleCameraAnimationToggled = (state) => {
    cameraAnimationEnabledCheckbox.setText(state ? 'Disable camera animation' : 'Enable camera animation')
    if (cameraAnimationEnabledCheckbox.getOn() !== state) {
        cameraAnimationEnabledCheckbox.setOn(state)
    }
}
const cameraAnimationEnabledCheckbox = group.addElement(UIElementBuilders.CheckBox)
cameraAnimationEnabledCheckbox.addEventListener('switch', (event) => handleCameraAnimationToggled(event.state))
handleCameraAnimationToggled(true)
chart3D.background.addEventListener('pointerdown', () => {
    handleCameraAnimationToggled(false)
})
