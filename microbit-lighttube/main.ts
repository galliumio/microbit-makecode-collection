/*******************************************************************************
 * Copyright (C) 2019 Gallium Studio LLC (Lawrence Lo). All rights reserved.
 *
 * This program is open source software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alternatively, this program may be distributed and modified under the
 * terms of Gallium Studio LLC commercial licenses, which expressly supersede
 * the GNU General Public License and are specifically designed for licensees
 * interested in retaining the proprietary status of their code.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * Contact information:
 * Website - https://www.galliumstudio.com
 * Source repository - https://github.com/galliumstudio
 * Email - admin@galliumstudio.com
 ******************************************************************************/

// control.onEvent(Src.INTERNAL, Evt.DONE, () => { led.toggle(0, 2) })
enum Color {
    RED = 0xff0000,
    GREEN = 0x00ff00,
    BLUE = 0x0000ff,
    ORANGE = 0xff6600,
    SEAWEED = 0x00ffcc,
    PURPLE = 0x9900ff,
    GOLD = 0xffbf00,
    MAGENTA = 0xff00ff,
    LAVENDAR = 0x6666ff,
    WHITE = 0xffffff, 
}

enum Src {
    INTERNAL = 1
}
enum Timeout {
    SWORD_UP_MS = 25,
    SWORD_DOWN_MS = 25,
    CANDY_CANE_MS = 100,
    COLOR_BAR_MS = 250,
}
enum Evt {
    // TIMER events
    //TIMER_FLASH,
    TIMER_SWORD_UP,
    TIMER_SWORD_DOWN,
    TIMER_CANDY_CANE,
    TIMER_COLOR_BAR,
    // INTERNAL events
    RED_PRESSED,
    BLUE_PRESSED, 
    SWORD_START_REQ,
    SWORD_STOP_REQ,
    HOLIDAY_START_REQ,
    HOLIDAY_STOP_REQ,
    TRAFFIC_START_REQ,
    TRAFFIC_STOP_REQ,
    DONE,
    NEXT,
    MOTION_START,
    MOTION_STOP,
}
enum Region {
    MODE,
    SWORD,
    HOLIDAY,
    TRAFFIC,
}
enum ModeState {
    SWORD,
    HOLIDAY,
    TRAFFIC,
}
enum SwordState {
    STOPPED,
    LIGHT_OFF,
    LIGHT_UP,
    LIGHT_DOWN,
    MOTION_OFF,
    MOTION_ON,
}
enum HolidayState {
    STOPPED,
    CANDY_CANE,
    COLOR_BAR,
    // @todo 
}
enum TrafficState {
    STOPPED,
    // @todo 
}

let superPixelPos = 0
let pixelCount = 43
let strip: neopixel.Strip = neopixel.create(DigitalPin.P8, pixelCount, NeoPixelMode.RGB)
let pixelOnCnt = 0
let freq = 0
let colors = [
    Color.BLUE, Color.RED, Color.GREEN, Color.ORANGE, Color.SEAWEED, Color.PURPLE, 
    Color.GOLD, Color.MAGENTA, Color.LAVENDAR,
]
let colorIdx = 0 

let candyCaneOffset = 0

function clearPixels () {
    for (let i = 0; i <= pixelCount - 1; i++) {
        strip.setPixelColor(i, 0)
    }
    strip.show()
}
function setPixels(color: number, cnt: number, intensity = 100) {
    cnt = Math.min(cnt, pixelCount)
    cnt = Math.max(cnt, 0)
    for (let j = 0; j < cnt; j++) {
       strip.setPixelColor(j, color) 
    }
    for (let j = cnt; j < pixelCount; j++) {
       strip.setPixelColor(j, 0) 
    }  
    strip.show()
}

function showCandyCane (offset: number = 0) {
    for (let j = 0; j < pixelCount; j++) {
         offset %= 10
        let pos = (j + 10 - offset) % 10
        if (pos < 4) {
            strip.setPixelColor(j, Color.WHITE)
        } else {
            strip.setPixelColor(j, Color.RED)
        }
    }
    strip.show()
}

function showColorBar() {
    let groupColor : number[] = []
    const GROUP_CNT = 11
    const COLOR_CNT = colors.length
    for (let j = 0; j < GROUP_CNT; j++) {
        let colorIdx = randint(0, COLOR_CNT-1)
        //serial.writeValue("x", colorIdx)
        groupColor[j] = colors[colorIdx]
    }
    for (let j = 0; j < pixelCount; j++) {
        let groupIdx = Math.floor(j/(pixelCount/GROUP_CNT))
        strip.setPixelColor(j, groupColor[groupIdx])
    }
    strip.show()  
}

function showPixels () {
    for (let k = 0; k <= pixelCount - 1; k++) {
        if (k % 20 == superPixelPos % 20) {
            strip.setPixelColor(k, 16777215)
        } else {
            let pixelOffset = 0
            let c = pixelOffset + k
            c = c % (2 * pixelCount)
            if (c >= pixelCount) {
                c = pixelCount - 1 - (c - pixelCount)
            }
            strip.setPixelColor(k, ((c * 4) << 16) | (((pixelCount - 1 - c) * 4) << 8))
        }
    }
    strip.show()
}
function display (count: number) {
    basic.clearScreen()
    for (let q = 0; q <= count - 1; q++) {
        led.plot(q % 5, q / 5)
    }
}

// State functions
function inModeSword () {
    return state.isIn(Region.MODE, ModeState.SWORD)
}
function inModeHoliday () {
    return state.isIn(Region.MODE, ModeState.HOLIDAY)
}
function inModeTraffic () {
    return state.isIn(Region.MODE, ModeState.TRAFFIC)
}

function inSwordStopped () {
    return state.isIn(Region.SWORD, SwordState.STOPPED)
}
function inSwordLightOff () {
    return state.isIn(Region.SWORD, SwordState.LIGHT_OFF)
}
function inSwordLightUp () {
    return state.isIn(Region.SWORD, SwordState.LIGHT_UP)
}
function inSwordLightDown () {
    return state.isIn(Region.SWORD, SwordState.LIGHT_DOWN)
}
function inSwordMotionOff () {
    return state.isIn(Region.SWORD, SwordState.MOTION_OFF)
}
function inSwordMotionOn () {
    return state.isIn(Region.SWORD, SwordState.MOTION_ON)
}
function inSwordLightOn () {
    return inSwordMotionOff() || inSwordMotionOn()
}
function inSwordStarted () {
    return inSwordLightOff() || inSwordLightUp() || inSwordLightDown() || inSwordLightOn()
}
function inHolidayStopped () {
    return state.isIn(Region.HOLIDAY, HolidayState.STOPPED)
}
function inHolidayCandyCane () {
    return state.isIn(Region.HOLIDAY, HolidayState.CANDY_CANE)
}
function inHolidayColorBar () {
    return state.isIn(Region.HOLIDAY, HolidayState.COLOR_BAR)
}
function inHolidayStarted () {
    return inHolidayCandyCane() || inHolidayColorBar();
}

// Enables external buttons.
input.onPinPressed(TouchPin.P1, function () {
    //serial.writeLine("RED pressed")
    event.raise(Evt.RED_PRESSED)
    event.exec()
})
input.onPinPressed(TouchPin.P2, function () {
    //serial.writeLine("BLUE pressed")
    event.raise(Evt.BLUE_PRESSED)
    event.exec()
})

input.onButtonPressed(Button.A, function () {
    //serial.writeLine("RED pressed")
    event.raise(Evt.RED_PRESSED)
    event.exec()
})
input.onButtonPressed(Button.B, function () {
    //serial.writeLine("RED pressed")
    event.raise(Evt.BLUE_PRESSED)
    event.exec()
})

state.onEntry(Region.MODE, ModeState.SWORD, () => {
    serial.writeLine("Enter MODE.SWORD")
    event.raise(Evt.SWORD_START_REQ)
})
state.onExit(Region.MODE, ModeState.SWORD, () => {
    //serial.writeLine("Exit MODE.SWORD")
    event.raise(Evt.SWORD_STOP_REQ)
})
state.onEntry(Region.MODE, ModeState.HOLIDAY, () => {
    serial.writeLine("Enter MODE.HOLIDAY")
    event.raise(Evt.HOLIDAY_START_REQ)
})
state.onExit(Region.MODE, ModeState.HOLIDAY, () => {
    //serial.writeLine("Exit MODE.HOLIDAY")
    event.raise(Evt.HOLIDAY_STOP_REQ)
})
state.onEntry(Region.MODE, ModeState.TRAFFIC, () => {
    serial.writeLine("Enter MODE.TRAFFIC")
    event.raise(Evt.TRAFFIC_START_REQ)
})
state.onExit(Region.MODE, ModeState.TRAFFIC, () => {
    //serial.writeLine("Exit MODE.TRAFFIC")
    event.raise(Evt.TRAFFIC_STOP_REQ)
})

state.onEntry(Region.SWORD, SwordState.STOPPED, () => {
    serial.writeLine("Enter SWORD.STOPPED")
})
state.onExit(Region.SWORD, SwordState.STOPPED, () => {
    //serial.writeLine("Exit SWORD.STOPPED")
})
state.onEntry(Region.SWORD, SwordState.LIGHT_OFF, () => {
    serial.writeLine("Enter SWORD.LIGHT_OFF")
})
state.onExit(Region.SWORD, SwordState.LIGHT_OFF, () => {
    //serial.writeLine("Exit SWORD.LIGHT_OFF")
})
state.onEntry(Region.SWORD, SwordState.LIGHT_UP, () => {
    serial.writeLine("Enter SWORD.LIGHT_UP")
    timer.start(Evt.TIMER_SWORD_UP, Timeout.SWORD_UP_MS, true)
    pixelOnCnt = 0
    freq = 250 //100
})
state.onExit(Region.SWORD, SwordState.LIGHT_UP, () => {
    //serial.writeLine("Exit SWORD.LIGHT_UP")
    timer.stop(Evt.TIMER_SWORD_UP)
    freq = 0
    //music.ringTone(freq)
    pins.analogSetPeriod(AnalogPin.P0, 0)    
})
state.onEntry(Region.SWORD, SwordState.LIGHT_DOWN, () => {
    serial.writeLine("Enter SWORD.LIGHT_DOWN")
    timer.start(Evt.TIMER_SWORD_DOWN, Timeout.SWORD_DOWN_MS, true)
})
state.onExit(Region.SWORD, SwordState.LIGHT_DOWN, () => {
    serial.writeLine("Exit SWORD.LIGHT_DOWN")
    timer.stop(Evt.TIMER_SWORD_DOWN)
})
state.onEntry(Region.SWORD, SwordState.MOTION_OFF, () => {
    //serial.writeLine("Enter SWORD.MOTION_OFF")
})
state.onExit(Region.SWORD, SwordState.MOTION_OFF, () => {
    //serial.writeLine("Exit SWORD.MOTION_OFF")
})
state.onEntry(Region.SWORD, SwordState.MOTION_ON, () => {
    //serial.writeLine("Enter SWORD.MOTION_ON")
})
state.onExit(Region.SWORD, SwordState.MOTION_ON, () => {
    //serial.writeLine("Exit SWORD.MOTION_ON")
})

state.onEntry(Region.HOLIDAY, HolidayState.STOPPED, () => {
    //serial.writeLine("Enter HOLIDAY.STOPPED")
})
state.onExit(Region.HOLIDAY, HolidayState.STOPPED, () => {
    //serial.writeLine("Exit HOLIDAY.STOPPED")
})
state.onEntry(Region.HOLIDAY, HolidayState.CANDY_CANE, () => {
    //serial.writeLine("Enter HOLIDAY.STARTED")
    showCandyCane()
    candyCaneOffset = 0
    timer.start(Evt.TIMER_CANDY_CANE, Timeout.CANDY_CANE_MS, true)
})
state.onExit(Region.HOLIDAY, HolidayState.CANDY_CANE, () => {
    //serial.writeLine("Exit HOLIDAY.STARTED")
    timer.stop(Evt.TIMER_CANDY_CANE)
})
state.onEntry(Region.HOLIDAY, HolidayState.COLOR_BAR, () => {
    //serial.writeLine("Enter HOLIDAY.STARTED")
    showColorBar()
    timer.start(Evt.TIMER_COLOR_BAR, Timeout.COLOR_BAR_MS, true)
})
state.onExit(Region.HOLIDAY, HolidayState.COLOR_BAR, () => {
    //serial.writeLine("Exit HOLIDAY.STARTED")
    timer.stop(Evt.TIMER_COLOR_BAR)
})

state.onEntry(Region.TRAFFIC, TrafficState.STOPPED, () => {
    //serial.writeLine("Enter TRAFFIC.STOPPED")
})
state.onExit(Region.TRAFFIC, TrafficState.STOPPED, () => {
    //serial.writeLine("Exit TRAFFIC.STOPPED")
})

event.on(Evt.RED_PRESSED, () => {
    // For MODE region.
    //serial.writeString("RED_PRESSED")
    if (inModeSword()) {
        //serial.writeLine("...in MODE.SWORD")
        state.transit(Region.MODE, ModeState.HOLIDAY)
    } else if (inModeHoliday()) {
        //serial.writeLine("...in MODE.HOLIDAY")
        state.transit(Region.MODE, ModeState.TRAFFIC)
    } else if (inModeTraffic()) {
        //serial.writeLine("...in MODE.TRAFFIC")
        state.transit(Region.MODE, ModeState.SWORD)
    }
})
event.on(Evt.BLUE_PRESSED, () => {
    // For SWORD region.
    if (inSwordLightOff()) {
        colorIdx = 0
        state.transit(Region.SWORD, SwordState.LIGHT_UP)
    } else if (inSwordStarted()) {
        state.transit(Region.SWORD, SwordState.LIGHT_DOWN)
    }
    // For HOLIDAY region.
    else if (inHolidayCandyCane()) {
        state.transit(Region.HOLIDAY, HolidayState.COLOR_BAR)
    } else if (inHolidayColorBar()) {
        state.transit(Region.HOLIDAY, HolidayState.CANDY_CANE)
    }
})
event.on(Evt.SWORD_START_REQ, () => {
    // For SWORD region.
    if (inSwordStopped()) {
        colorIdx = 0
        state.transit(Region.SWORD, SwordState.LIGHT_UP)
    }
})
event.on(Evt.SWORD_STOP_REQ, () => {
    // For SWORD region.
    if (inSwordStarted()) {
        clearPixels()
        state.transit(Region.SWORD, SwordState.STOPPED)
    }
})
event.on(Evt.HOLIDAY_START_REQ, () => {
    // For HOLIDAY region.
    if (inHolidayStopped()) {
        colorIdx = 0
        state.transit(Region.HOLIDAY, HolidayState.CANDY_CANE)
    }
})
event.on(Evt.HOLIDAY_STOP_REQ, () => {
    // For HOLIDAY region.
    if (inHolidayStarted()) {
        clearPixels()
        state.transit(Region.HOLIDAY, HolidayState.STOPPED)
    }
})
event.on(Evt.DONE, ()=> {
    if (inSwordLightUp()) {
        state.transit(Region.SWORD, SwordState.MOTION_OFF)
    } else if (inSwordLightDown()) {
        state.transit(Region.SWORD, SwordState.LIGHT_OFF)
    }
})
event.on(Evt.NEXT, ()=> {
    if (inSwordLightDown()) {
        state.transit(Region.SWORD, SwordState.LIGHT_UP)
    }
})
event.on(Evt.TIMER_SWORD_UP, ()=> {
    if (inSwordLightUp()) {
        if (pixelOnCnt < pixelCount/6) {
            pixelOnCnt+=1
            freq += 25 //5
        } else if (pixelOnCnt < pixelCount/2) {
            pixelOnCnt+=3
            freq += 50 //10
        } else {
            pixelOnCnt+=4
            freq += 100 //20
        }
        setPixels(colors[colorIdx], pixelOnCnt)
        //music.ringTone(freq)
        pins.analogSetPeriod(AnalogPin.P0, (1/freq)*1000000)
        if (pixelOnCnt >= pixelCount) {
            event.raise(Evt.DONE)
        }
    }
})
event.on(Evt.TIMER_SWORD_DOWN, ()=> {
    if (inSwordLightDown()) {
        if (pixelOnCnt > pixelCount/2) {
            pixelOnCnt-=4
        } else if (pixelOnCnt > pixelCount/4) {
            pixelOnCnt-=2
        } else {
            pixelOnCnt-=1
        }
        setPixels(colors[colorIdx], pixelOnCnt)
        if (pixelOnCnt <= 0) {
            if (++colorIdx < colors.length) {
                event.raise(Evt.NEXT)
            } else {
                event.raise(Evt.DONE)
            }
        }
    }
})

event.on(Evt.TIMER_CANDY_CANE, ()=> {
    if (inHolidayCandyCane()) {
        showCandyCane(++candyCaneOffset)
    }
})

event.on(Evt.TIMER_COLOR_BAR, ()=> {
    if (inHolidayColorBar()) {
        showColorBar()
    }
})

strip.clear()
clearPixels()
// P1 is the RED external button. P2 is the BLUE external button.
pins.setPull(DigitalPin.P1, PinPullMode.PullUp)
pins.setPull(DigitalPin.P2, PinPullMode.PullUp)
// P0 is for external speaker.
pins.analogWritePin(AnalogPin.P0, 512)
pins.analogSetPeriod(AnalogPin.P0, 0)
state.start(Region.SWORD, SwordState.STOPPED)
state.start(Region.HOLIDAY, HolidayState.STOPPED)
state.start(Region.TRAFFIC, TrafficState.STOPPED)
state.start(Region.MODE, ModeState.SWORD)
timer.run()
//strip.showRainbow(1, 360)