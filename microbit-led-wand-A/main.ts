//basic.start(() => {
//    basic.showIcon(IconNames.Pitchfork)
    //neopixel.create(DigitalPin.P0, 128, NeoPixelMode.RGB).showColor(neopixel.rgb(14, 5, 3))
//})
const PANEL_COL = 8
const PANEL_ROW = 8

const RED0 = 0xFF0000
const RED1 = 0x800000
const ORA0 = 0xFF6600
const YEL0 = 0xFFFF00
const GRE0 = 0x00FF00
const GRE1 = 0x00c000
const GRE2 = 0x008000 
const GRE3 = 0x004000     
const BLU0 = 0x0000FF
const IND0 = 0x4b0082
const VIO0 = 0x9900ff
const PUR0 = 0xFF00FF
const WHI0 = 0x404040
const BLA0 = 0x000000
const BRO0 = 0x993300
const PIN0 = 0xFF99FF
const TUR0 = 0x00FFCC

const WHI1 = 0xffffff

enum Pattern {
    A_STRIPE,
    A_TREE,
    A_SANTA,
    A_TREE2,
}

let magicPattern = [
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0, 
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0,
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0, 
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0,
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0, 
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0,
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0, 
    RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0,
]

let offPattern = [
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
]

let patterns = [ 
    // Button A patterns:   
    // Santa Hat 
    [
        GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
        GRE0, GRE0, GRE0, GRE0, RED0, RED0, WHI0, GRE0,
        GRE0, GRE0, GRE0, RED0, RED0, GRE0, GRE0, GRE0,
        GRE0, GRE0, GRE0, RED0, RED0, GRE0, GRE0, GRE0,
        GRE0, GRE0, RED0, RED0, RED0, RED0, GRE0, GRE0,
        GRE0, GRE0, RED0, RED0, RED0, RED0, GRE0, GRE0,
        GRE0, WHI0, WHI0, WHI0, WHI0, WHI0, WHI0, GRE0,
        GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0, GRE0,
    ],
    // Candy Cane
    [
        BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0,
        BLU0, BLU0, RED0, WHI0, RED0, BLU0, BLU0, BLU0,
        BLU0, BLU0, WHI0, BLU0, WHI0, BLU0, BLU0, BLU0,
        BLU0, BLU0, BLU0, BLU0, RED0, BLU0, BLU0, BLU0,
        BLU0, BLU0, BLU0, BLU0, WHI0, BLU0, BLU0, BLU0,
        BLU0, BLU0, BLU0, BLU0, RED0, BLU0, BLU0, BLU0,
        BLU0, BLU0, BLU0, BLU0, WHI0, BLU0, BLU0, BLU0,
        BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0,
    ],
    // Tree
    [
        RED0, WHI0, RED0, WHI0, RED0, WHI0, RED0, WHI0,
        WHI0, BLU0, BLU0, YEL0, YEL0, BLU0, BLU0, RED0,
        RED0, BLU0, BLU0, GRE0, GRE0, BLU0, BLU0, WHI0,
        WHI0, BLU0, PUR0, GRE0, GRE0, GRE0, BLU0, RED0,
        RED0, BLU0, GRE0, GRE0, GRE2, GRE0, BLU0, WHI0,
        WHI0, ORA0, GRE0, GRE0, GRE0, GRE0, GRE0, RED0,
        RED0, BLU0, BLU0, BRO0, BRO0, BLU0, BLU0, WHI0,
        WHI0, RED0, WHI0, RED0, WHI0, RED0, WHI0, RED0,
    ],
    // Snow Flake 1
    [
        RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0, 
        RED0, WHI0, RED0, RED0, RED0, WHI0, RED0, RED0,
        RED0, RED0, WHI0, RED0, WHI0, RED0, RED0, RED0,
        RED0, RED0, RED0, WHI0, WHI0, WHI0, WHI0, RED0,
        RED0, WHI0, WHI0, WHI0, WHI0, RED0, RED0, RED0,
        RED0, RED0, RED0, WHI0, RED0, WHI0, RED0, RED0,
        RED0, RED0, WHI0, RED0, RED0, RED0, WHI0, RED0,
        RED0, RED0, RED0, RED0, RED0, RED0, RED0, RED0,
    ],
    // Snow Flake 2
    [  
        GRE3, GRE3, GRE3, GRE3, GRE3, GRE3, GRE3, GRE3, 
        GRE3, WHI0, GRE3, GRE3, GRE3, WHI0, GRE3, GRE3, 
        GRE3, GRE3, WHI0, GRE3, WHI0, GRE3, GRE3, GRE3, 
        GRE3, GRE3, GRE3, WHI0, WHI0, WHI0, WHI0, GRE3, 
        GRE3, WHI0, WHI0, WHI0, WHI0, GRE3, GRE3, GRE3, 
        GRE3, GRE3, GRE3, WHI0, GRE3, WHI0, GRE3, GRE3, 
        GRE3, GRE3, WHI0, GRE3, GRE3, GRE3, WHI0, GRE3, 
        GRE3, GRE3, GRE3, GRE3, GRE3, GRE3, GRE3, GRE3, 
    ],
     // Gift
     [
        PIN0, PIN0, PIN0, PIN0, PIN0, PIN0, PIN0, PIN0, 
        PIN0, PIN0, PIN0, PUR0, PIN0, PIN0, PIN0, PIN0,
        PIN0, PIN0, BLU0, PUR0, BLU0, PIN0, PIN0, PIN0,
        PIN0, YEL0, BLU0, PUR0, BLU0, PIN0, PIN0, PIN0,
        ORA0, ORA0, PUR0, PUR0, PUR0, PIN0, GRE0, PIN0, 
        ORA0, ORA0, BLU0, PUR0, BLU0, RED0, GRE0, RED0,
        ORA0, ORA0, BLU0, PUR0, BLU0, RED0, GRE0, RED0,
        ORA0, ORA0, BLU0, PUR0, BLU0, RED0, GRE0, RED0,
    ],
 
    // B button patterns:
    //  Sled 1
    [   
        BLU0, BLU0, WHI0, BLU0, BLU0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, BLU0, GRE0, WHI0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, RED0, GRE0, RED0, BLA0, BLA0, BLU0, 
        BLU0, BLU0, RED0, GRE0, RED0, BLU0, BLA0, BLU0, 
        BLU0, BLA0, BLA0, BLA0, BLA0, BLA0, BLA0, BLU0, 
        BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, 
        BLU0, BLU0, BLU0, BLU0, GRE0, BLU0, BLU0, BLU0, 
        BLU0, GRE0, BLU0, GRE0, GRE0, GRE0, BLU0, BLU0, 
    ], 
    // Sled 2
    [
        BLU0, BLU0, WHI0, BLU0, BLU0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, BLU0, BLU0, WHI0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, BLU0, GRE0, BLU0, BLA0, BLA0, BLU0, 
        BLU0, WHI0, RED0, GRE0, RED0, BLA0, BLA0, BLU0, 
        BLU0, BLU0, RED0, GRE0, RED0, BLU0, BLA0, BLU0, 
        BLU0, BLA0, BLA0, BLA0, BLA0, BLA0, BLA0, BLU0, 
        BLU0, BLU0, BLU0, BLU0, GRE0, BLU0, BLU0, BLU0, 
        BLU0, GRE0, BLU0, GRE0, GRE0, GRE0, BLU0, BLU0, 
    ],   
    // Sled 3
    [
        BLU0, BLU0, WHI0, BLU0, BLU0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, BLU0, BLU0, WHI0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, BLU0, 
        BLU0, WHI0, BLU0, GRE0, BLU0, BLU0, BLU0, BLU0, 
        BLU0, BLU0, RED0, GRE0, RED0, BLA0, BLA0, BLU0, 
        BLU0, BLA0, RED0, GRE0, RED0, BLU0, BLA0, BLU0, 
        BLU0, BLA0, BLA0, BLA0, BLA0, BLA0, BLA0, BLU0, 
        BLU0, GRE0, BLU0, GRE0, GRE0, GRE0, BLU0, BLU0, 
    ],  
    // Sled 4 
    [
        BLU0, BLU0, WHI0, BLU0, BLU0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, BLU0, BLU0, WHI0, BLU0, YEL0, YEL0, 
        BLU0, BLU0, BLU0, GRE0, BLU0, BLA0, BLA0, BLU0, 
        BLU0, WHI0, RED0, GRE0, RED0, BLA0, BLA0, BLU0, 
        BLU0, BLU0, RED0, GRE0, RED0, BLU0, BLA0, BLU0, 
        BLU0, BLA0, BLA0, BLA0, BLA0, BLA0, BLA0, BLU0, 
        BLU0, BLU0, BLU0, BLU0, GRE0, BLU0, BLU0, BLU0, 
        BLU0, GRE0, BLU0, GRE0, GRE0, GRE0, BLU0, BLU0, 
    ],          
]

basic.showIcon(IconNames.Pitchfork)
let panel = neopixel.create(DigitalPin.P0, 128, NeoPixelMode.RGB)
panel.setBrightness(0x80)
panel.setMatrixWidth(8)

/*
input.onButtonPressed(Button.A, ()=>{
    showPattern(Pattern.A_STRIPE)
})

input.onButtonPressed(Button.B, ()=>{
    showPattern(Pattern.A_TREE)
})
*/

function showPattern(n:number) {
    let pattern = patterns[n]
    for (let row = 0; row < PANEL_ROW; row++) {
        for (let col = 0; col < PANEL_COL; col++) {
            let i = row * PANEL_COL + col;
            panel.setPixelColor(i, pattern[i])
        }
    }
    panel.show()
}

function showMagic() {
    let pattern = magicPattern
    for (let row = 0; row < PANEL_ROW; row++) {
        for (let col = 0; col < PANEL_COL; col++) {
            let i = row * PANEL_COL + col;
            panel.setPixelColor(i, pattern[i])
        }
    }
    panel.show()
}

function showOff() {
    let pattern = offPattern
    for (let row = 0; row < PANEL_ROW; row++) {
        for (let col = 0; col < PANEL_COL; col++) {
            let i = row * PANEL_COL + col;
            panel.setPixelColor(i, pattern[i])
        }
    }
    panel.show()
}

enum Evt {
    TIMER0 = 1000,
    TIMER1,
    TIMER2,
    TIMER3,
    TIMER4
}

let timer: number[] = [0,0,0,0,0]
const periodMs = 20
basic.forever(()=> {
    basic.pause(periodMs)
    led.toggle(1, 2)
    for (let idx = 0; idx < timer.length; idx++) {
        if (timer[idx] > 0) {
            timer[idx] -= Math.clamp(0, timer[idx], periodMs)
            if (timer[idx] == 0) {
                control.raiseEvent(Evt.TIMER0 + idx, 1)
            }
        }
    }
})

enum State {
    SLIDE_STOP,
    SLIDE_RUN,
    FLAG
}

let state = State.SLIDE_STOP
let currPattern = 0
let flagPattern = 0
showPattern(currPattern)

input.onButtonPressed(Button.A, ()=>{

    led.toggle(0, 1)

    if (state == State.SLIDE_STOP) {
        state = State.SLIDE_RUN
        timer[0] = 1000
    } else if (state == State.SLIDE_RUN){
        state = State.SLIDE_STOP
        timer[0] = 0  
    }
})

input.onButtonPressed(Button.B, ()=>{
    if (state != State.FLAG) {
        timer[0] = 0
        state = State.FLAG
        flagPattern = 6
        showPattern(flagPattern)
        timer[1] = 300
    } else {
        timer[1] = 0
        state = State.SLIDE_STOP
        timer[0] = 0
    }
})

input.onGesture(Gesture.SixG, ()=>{
    panel.setBrightness(0xff)
    for (let i=0; i<10; i++) {
        showMagic()
        basic.pause(20)
        showOff()
        basic.pause(20)
    }
    panel.setBrightness(0x80)
    showPattern(0)
})

control.onEvent(Evt.TIMER0, 1, function () {
    currPattern = currPattern + 1
    if (currPattern == 6) {
       currPattern = 0
    }
    showPattern(currPattern)
    timer[0] = 1000  
})

control.onEvent(Evt.TIMER1, 1, function () {
    flagPattern = flagPattern + 1
    if (flagPattern == 10) {
        flagPattern = 6
    }
    showPattern(flagPattern)
    timer[1] = 300  
})