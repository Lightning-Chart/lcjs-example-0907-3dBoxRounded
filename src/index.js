/*
 * LightningChartJS example that showcases BoxSeries3D with rounded edges.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Extract required parts from LightningChartJS.
const {
    lightningChart,
    AxisScrollStrategies,
    PalettedFill,
    ColorRGBA,
    LUT,
    UILayoutBuilders,
    UIBackgrounds,
    UIOrigins,
    UIElementBuilders,
    Themes
} = lcjs


/**
 * Data generator function for the example.
 */
function WaterDropGenerator(
    sizeX,
    sizeZ,
    xPositionsNormalized,
    zPositionsNormalized,
    amplitudes,
    offsetLevel,
    volatility
) {
    function CalculateWavesAtPoint(
        x,
        z
    ) {
        let resultValue = 0
        const iOscillatorCount = oscillators.length
        for (let i = 0; i < iOscillatorCount; i++) {
            const oscillator = oscillators[i]
            const distX = x - oscillator.centerX
            const distZ = z - oscillator.centerZ
            const dist = Math.sqrt(distX * distX + distZ * distZ)
            resultValue += oscillator.gain * oscillator.amplitude * Math.cos(dist * volatility) * Math.exp(-dist * 3.0)
        }
        return resultValue
    }

    const iOscCount = amplitudes.length
    const oscillators = []

    for (let iOsc = 0; iOsc < iOscCount; iOsc++) {
        oscillators[iOsc] = {
            amplitude: amplitudes[iOsc],
            centerX: xPositionsNormalized[iOsc],
            centerZ: zPositionsNormalized[iOsc],
            gain: 1,
            offsetY: 0
        }
    }

    const result = Array.from(Array(sizeZ)).map(() => Array(sizeX))
    const dTotalX = 1
    const dTotalZ = 1
    const stepX = (dTotalX / sizeX)
    const stepZ = (dTotalZ / sizeZ)

    for (let row = 0, z = 0; row < sizeZ; row++, z += stepZ) {
        for (let col = 0, x = 0; col < sizeX; col++, x += stepX) {
            result[col][row] = CalculateWavesAtPoint(x, z) + offsetLevel
        }
    }
    return result
}


const chart3D = lightningChart().Chart3D( {
    // theme: Themes.dark
} )
    .setTitle( 'BoxSeries3D with rounded edges enabled' )

chart3D.getDefaultAxisY()
    .setScrollStrategy( AxisScrollStrategies.expansion )
    .setTitle( 'Height' )

chart3D.getDefaultAxisX()
    .setTitle( 'X' )

chart3D.getDefaultAxisZ()
    .setTitle( 'Z' )

const boxSeries = chart3D.addBoxSeries()
const resolution = 10

// Create Color Look-Up-Table and FillStyle
const lut = new LUT( {
    steps: [
        { value: 0, color: ColorRGBA( 0, 0, 0 ) },
        { value: 30, color: ColorRGBA( 255, 255, 0 ) },
        { value: 45, color: ColorRGBA( 255, 204, 0 ) },
        { value: 60, color: ColorRGBA( 255, 128, 0 ) },
        { value: 100, color: ColorRGBA( 255, 0, 0 ) }
    ],
    interpolate: true
} )

boxSeries
    .setFillStyle( new PalettedFill( { lut } ) )
    // Specify edge roundness. Note, that edge rounding is enabled by default.
    // For applications with massive amounts of small Boxes, it is wise to disable for performance benefits.
    .setRoundedEdges( 0.4 )
    // .setRoundedEdges( undefined )

// Generate height map data.
const waterdropData = WaterDropGenerator(
    resolution, // size of nodes in X
    resolution, // size of nodes in Z
    [0.2, 0.5, 0.7], // Drop X positions in scale 0...1
    [0.6, 0.5, 0.3], // Drop Z positions in scale 0...1
    [15, 50, 3], // Amplitudes, as Y axis values
    47, // Offset level (mid-Y)
    25 // Volatility, wave generating density
)

let t = 0
const step = () => {

    const result = []
    for ( let x = 0; x < resolution; x++ ) {
        for ( let y = 0; y < resolution; y++ ) {
            const s = 1
            const height = Math.max(
                waterdropData[y][x] +
                50 * Math.sin( ( t + x * .50 ) * Math.PI / resolution ) +
                20 * Math.sin( ( t + y * 1.0 ) * Math.PI / resolution ), 0 )
            const box = {
                xCenter: x,
                yCenter: height / 2,
                zCenter: y,
                xSize: s,
                ySize: height,
                zSize: s,
                // Specify an ID for each Box in order to modify it during later frames, instead of making new Boxes.
                id: String( result.length ),
                // Specify color Look-Up-Value for each Box.
                value: height
            }
            result.push( box )
        }
    }

    boxSeries
        .invalidateData( result )

    t += 0.1
    requestAnimationFrame( step )
}
step()



// Animate Camera movement from file.
;(async () => {
    const cameraAnimationData = await (
        fetch( document.head.baseURI + 'examples/assets/lcjs_example_0907_3dBoxRounded-camera.json' )
            .then( r => r.json() )
    )
    if ( ! cameraAnimationData ) {
        console.log(`No Camera animation data.`)
        return
    }
    console.log(`Loaded Camera animation data.`)
    let frame = 0
    const nextFrame = () => {
        if ( cameraAnimationEnabledCheckbox.getOn() ) {
            const { cameraLocation } = cameraAnimationData.frames[Math.floor(frame) % cameraAnimationData.frames.length]
            chart3D.setCameraLocation( cameraLocation )
            frame += 1.5
        }
        requestAnimationFrame( nextFrame )
    }
    requestAnimationFrame( nextFrame )
})()



// * UI controls *
const group = chart3D.addUIElement( UILayoutBuilders.Column
    .setBackground( UIBackgrounds.Rectangle )
)
group
    .setPosition( { x: 0, y: 100 } )
    .setOrigin( UIOrigins.LeftTop )
    .setMargin( 10 )
    .setPadding( 4 )


// Add UI control for toggling camera animation.
const handleCameraAnimationToggled = ( state ) => {
    cameraAnimationEnabledCheckbox.setText( state ? 'Disable camera animation' : 'Enable camera animation' )
    if ( cameraAnimationEnabledCheckbox.getOn() !== state ) {
        cameraAnimationEnabledCheckbox.setOn( state )
    }
}
const cameraAnimationEnabledCheckbox = group.addElement( UIElementBuilders.CheckBox )
cameraAnimationEnabledCheckbox.onSwitch((_, state) => handleCameraAnimationToggled( state ))
handleCameraAnimationToggled( true )
