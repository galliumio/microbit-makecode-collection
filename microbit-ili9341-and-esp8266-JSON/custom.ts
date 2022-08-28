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

/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */
 namespace util {
    export function byte_0(a: number) { return (a) & 0xFF }
    export function byte_1(a: number) { return (a >> 8) & 0xFF }
    export function byte_2(a: number) { return (a >> 16) & 0xFF }
    export function byte_3(a: number) { return (a >> 24) & 0xFF }
}

namespace fw {
    export function assert(cond: boolean, str: string) {
        if (!cond) {
            while (1) {
                basic.showString('Assert: ' + str)
            }
        }
    }
}

namespace state {
    interface Action {
        entry: (() => void),
        exit: (() => void)
    }
    // First [] is for orthogonal regions. Second [] is for states within a single region.
    let actions: Action[][] = []
    function getAction(region: number, state: number): Action {
        if (!actions[region]) { actions[region] = [] }
        if (!actions[region][state]) {
            actions[region][state] = { entry: null, exit: null }
        }
        return actions[region][state]
    }
    export function onEntry(region: number, state: number, action: () => void) {
        getAction(region, state).entry = action
    }
    export function onExit(region: number, state: number, action: () => void) {
        getAction(region, state).exit = action
    }
    // Current state for all regions.
    let current: number[] = []
    export function isIn(region: number, state: number): boolean {
        return current[region] === state
    }
    export function initial(region: number, state: number) {
        current[region] = state
        let entryAction = getAction(region, state).entry
        if (entryAction) { entryAction() }
    }
    export function transit(region: number, state: number) {
        let currState = current[region]
        if (currState !== null) {
            let exitAction = getAction(region, currState).exit
            if (exitAction) { exitAction() }
        }
        initial(region, state)
    }
    export function start(region: number, state: number) {
        initial(region, state);
        event.exec()
    }
}

namespace event {
    let handlers: ((param: any) => void)[] = []
    export function on(evt: number, handler: (param: any) => void) {
        handlers[evt] = handler
    }
    interface EvtObj {
        evt: number,
        param: any
    }
    let internalQ: EvtObj[] = []
    // Raises an internal event from within a state machine handler.
    export function raise(evt: number, param: any = null) {
        internalQ.push({ evt: evt, param: param })
    }
    // Sends an event from an external soure to the state machine.
    export function send(evt: number, param: any = null) {
        raise(evt, param)
        exec()
    }
    export function exec() {
        let e: EvtObj
        while (e = internalQ.shift()) {
            let handler = handlers[e.evt]
            if (handler) {
                handler(e.param)
            }
        }
    }
    let deferQ: EvtObj[] = []
    export function defer(evt: number, param: any = null) {
        deferQ.push({ evt: evt, param: param })
    }
    export function recall() {
        let e: EvtObj
        while (e = deferQ.shift()) {
            raise(e.evt, e.param)
        }
    }
}

namespace timer {
    const TICK_MS = 25
    interface Timer {
        duration: number,
        period: number,
        ref: number,
    }
    let timers: Timer[] = []
    function nextRef(t: Timer): number {
        if (t) {
            return (t.ref + 1) & 0xFFFF
        }
        else return 0
    }
    export function isValid(evt: number, ref: number): boolean {
        let t = timers[evt]
        return t && (t.ref == ref)
    }
    export function start(evt: number, duration: number, isPeriodic = false): number {
        let ref = nextRef(timers[evt])
        timers[evt] = { duration: duration, period: isPeriodic ? duration : 0, ref: ref }
        return ref
    }
    export function stop(evt: number) {
        let ref = nextRef(timers[evt])
        timers[evt] = { duration: 0, period: 0, ref: ref }
    }
    function tickHandler() {
        //led.toggle(1, 1)
        interface Timeout {
            evt: number,
            ref: number
        }
        let timeouts: Timeout[] = []
        timers.forEach((t: Timer, index: number) => {
            if (t && t.duration > 0) {
                t.duration -= Math.min(t.duration, TICK_MS)
                if (t.duration == 0) {
                    timeouts.push({ evt: index, ref: t.ref })
                    t.duration = t.period
                }
            }
        })
        timeouts.forEach((timeout: Timeout) => {
            if (isValid(timeout.evt, timeout.ref)) {
                event.raise(timeout.evt)
                event.exec()
            }
        })
    }
    export function run() {
        let wakeTimeMs = input.runningTime()
        basic.forever(function () {
            tickHandler()
            wakeTimeMs += TICK_MS
            basic.pause(Math.max(wakeTimeMs - input.runningTime(), 1))
        })
    }
}

namespace wifi {
    const successList = ['OK', 'SEND OK']
    const failList = ['ERROR', 'FAIL', 'SEND FAIL', 'ALREADY CONNECTED']
    const configList: AtCmd[] = [
        { line: 'ATE0', waitMs: 200, onSuccess: null },                // Turns off echo.
        { line: 'AT+CWMODE=1', waitMs: 200, onSuccess: null },           // Station mode.
        { line: 'AT+CWAUTOCONN=0', waitMs: 200, onSuccess: null },      // Disable auto connection to AP. 
        { line: 'AT+UART_CUR=38400,8,1,0,0', waitMs: 200, 
          onSuccess: ()=>{
            serial.setBaudRate(BaudRate.BaudRate38400) 
         }},
    ]
    interface AtCmd {
        line: string,
        waitMs: number,
        onSuccess: (()=>void)
    }
    // Arrays of AT commands, JSON strings to send and
    // received JSON strings to process.
    let cmdList: AtCmd[] = []
    let txList : string[] = []
    let savedLine = ''
    let rxJson = ''
    let rxError = false
    let txError = false
    let cmdError = false
    let initError = false
    let connectHandler: ()=>void = null
    let errorHandler: (error: string)=>void = null
    let dataHandler: (json: string)=>void = null
    export function init(tx: SerialPin, rx: SerialPin, reset: DigitalPin) {
        pins.digitalWritePin(reset, 0)
        control.waitMicros(5000)
        pins.digitalWritePin(reset, 1)
        // Upon reset, ESP8266 sends an initial string that will
        // cause microbit to hang. Waits for 300ms before redirecting
        // serial port. Must not call pause which blocks the current fiber.
        control.waitMicros(300000)
        cmdList = []
        txList = []
        savedLine = ''
        rxJson = ''
        rxError = false
        txError = false
        cmdError = false
        initError = false
        serial.redirect(tx, rx, 115200)
        serial.setRxBufferSize(2000)
        serial.setTxBufferSize(2000)
        control.inBackground(()=>{
            while(true) {
                let result = sendCmdList()
                if (result) {
                    result = transmitData()
                }
                if (result) {
                    result = poll()
                }
                if (!result) {
                    if (errorHandler) {
                        errorHandler(rxError ? 'receive' :
                                     txError ? 'transmit' : 
                                     initError ? 'init' : 'command')
                    }
                }
                // OK to block as it's running in a separate fiber.
                basic.pause(5)
            }
        })
    }
    export function reset() {
        cmdList = []
        txList = []
        savedLine = ''
        rxJson = ''
        rxError = false
        txError = false
        cmdError = false
        initError = false

        serial.writeString('AT\r\n')
        const startTime = input.runningTime()
        let line = ''
        while((input.runningTime() - startTime) < 100) {
            line  += serial.readString()
        }
        if (line != '') {
            //basic.showNumber(line.length)
        }  
    }
    export function onConnect(handler: ()=>void) {
        connectHandler = handler
    }
    export function onError(handler: (error: string)=>void){
        errorHandler = handler
    }
    export function onData(handler: (json: string)=>void){
        dataHandler = handler
    }
    export function config() {
        configList.forEach((curr)=>{
            cmdList.push(curr)
        })
    }
    export function join(ssid: string, pwd: string) {
        cmdList.push({ line: `AT+CWJAP="${ssid}","${pwd}"`,
                       waitMs: 15000,
                       onSuccess: null })
    }
    export function connect(ip: string, port: string) {
        cmdList.push({ line: `AT+CIPSTART="TCP","${ip}",${port}`,
                       waitMs: 5000, 
                       onSuccess: ()=>{
                           if (connectHandler) {
                               connectHandler()
                           }
                       }})
    }
    // Appends (0x0D, 0x0A) as delimiter between JSON strings.
    // Inside a JSON string, any 0x0D or 0x0A are represented literally as '\r' and '\n'.
    export function send(obj: any) {
        txList.push(JSON.stringify(obj) + '\r\n')
    }
    function sendCmdList(): boolean {
        while (cmdList.length) {
            const cmd = cmdList.shift()
            let result = sendCmd(cmd.line, cmd.waitMs)
            debugLed(result)
            if (result) {
                if (cmd.onSuccess) {
                    cmd.onSuccess()
                }
            } else {
                // Once an error has occurred, discards any outstanding commands.
                if (!rxError) {
                    if (cmd.line.includes('ATE0')) {
                        // Initialization error which is critical.
                        // This happens when it cannot communicate with the module at all.
                        initError = true
                    } else {
                        // Generic command error including join and connect.
                        cmdError = true
                    }
                }
                return false
            }
        }
        return true
    }
    function transmitData() {
        let rsp = null
        while (txList.length) {
            led.plot(3, 0)
            const json = txList.shift()
            const cmd = `AT+CIPSEND=${json.length}`
            if (sendCmd(cmd, 2000)) {
                if (readUntil('> ', 2000) != null) {
                    serial.writeString(json)
                    if (waitForRsp(2000)) {
                        led.unplot(3, 0)
                        continue
                    }
                }
            }
            // If reaches here, tx failed.
            led.unplot(3, 0)
            if (!rxError) {
                txError = true
            }
            debugLed(false)
            return false
        }
        return true
    }
    // Polls for async data ('+IPD,'). Any async AT msgs from wifi are discarded.
    function poll(): boolean {
        // '+IPD,' handled inside readUntil().
        while(readUntil('\r\n', 0) != null) {}
        return !rxError
    }
    // Receives async data from wifi.
    // Precondition is savedLine starts with "+IPD,". 
    // Postcondition is async data indicated by "+IPD," has been completely read.
    function receiveData(): boolean {
        led.plot(4, 0)
        const startTime = input.runningTime()
        while((input.runningTime() - startTime) < 100) {
            savedLine += serial.readString()
            let strs = savedLine.split(':')
            if (strs.length > 1) {
                const header = strs.shift()
                const len = parseInt(header.substr(5))
                savedLine = strs.join(':')    
                while((input.runningTime() - startTime) < 100) {
                    savedLine += serial.readString()
                    if (savedLine.length >= len) {
                        const result = handleData(savedLine.substr(0, len))
                        savedLine = savedLine.substr(len)
                        led.unplot(4, 0)
                        return result
                    }
                }
            }
        }
        // Times out, probably caused by serial data drop.
        led.unplot(4, 0)
        return false
    }
    function handleData(data: string): boolean {
        rxJson += data
        let strs = rxJson.split('\r\n')
        if (strs.length > 1) {
            // Complete json has been received.
            const json = strs.shift()
            rxJson = strs.join('\r\n')
            const obj = JSON.parse(json)
            if (!obj) {
                // Bad json may be caused by serial data drop.
                return false
            }
            if (dataHandler) {
                dataHandler(json)
            }
            return true
        }
        // Incomplete json. Continues to receive.
        return true
    }
    function debugLed(success: boolean) {
        let p = [1, 0] // Fail default.
        if (success) {
            p = [2, 0]
        }
        led.plot(p[0], p[1])
        control.waitMicros(25000)
        led.unplot(p[0], p[1])
    }
    function sendCmd(cmd: string, waitMs = 200): boolean {
        serial.writeString(cmd + '\r\n')
        return waitForRsp(waitMs)
    }
    function checkMsg(list: string[], msg: string): boolean {
        return (list.reduce((result, curr)=>{
                return result || msg.includes(curr)
            }, false))
    }
    // Own implementation of readUntil with timeout.
    function readUntil(delimit = '\r\n', waitMs = 20): string {
        const startTime = input.runningTime()
        while(true) {            
            savedLine += serial.readString()
            // First checks if async data is pending to be read.
            if (savedLine.substr(0,5) === '+IPD,') {
                if (!receiveData()) {
                    rxError = true
                    return null
                }
                continue
            }
            let strs = savedLine.split(delimit)
            if (strs.length > 1) {
                const result = strs.shift()
                savedLine = strs.join(delimit)
                return result
            }
            // Uses >= rather than > to ensure no wait if waitMs = 0.
            if ((input.runningTime() - startTime) >= waitMs) {
                return null
            }
            basic.pause(Math.min(20, waitMs))
        }
    }
    function waitForRsp(waitMs = 200): boolean {
        const startTime = input.runningTime()
        do {
            const msg = readUntil('\r\n', Math.min(20, waitMs))
            // Must explicitly check for null (no data) to distinguish from empty string.
            if (msg == null) {
                if (rxError) {
                    return false
                }
                // No data. Continues to wait until timeout.
            } else {
                if (checkMsg(successList, msg)) {
                    return true
                }
                if (checkMsg(failList, msg)) {
                    return false
                }
                // Discards message if neither success or failure.
            }
        } while((input.runningTime() - startTime) < waitMs)
        // Uses < rather than <= to ensure no wait if waitMs = 0.
        return false
    }
}

namespace ili9341 {
    /*
    export const COLOR565_BLACK       = 0x0000      ///<   0,   0,   0
    export const COLOR565_NAVY        = 0x000F      ///<   0,   0, 128
    export const COLOR565_DARKGREEN   = 0x03E0      ///<   0, 128,   0
    const COLOR565_DARKCYAN    = 0x03EF      ///<   0, 128, 128
    const COLOR565_MAROON      = 0x7800      ///< 128,   0,   0
    const COLOR565_PURPLE      = 0x780F      ///< 128,   0, 128
    const COLOR565_OLIVE       = 0x7BE0      ///< 128, 128,   0
    const COLOR565_LIGHTGREY   = 0xC618      ///< 192, 192, 192
    const COLOR565_DARKGREY    = 0x7BEF      ///< 128, 128, 128
    const COLOR565_BLUE        = 0x001F      ///<   0,   0, 255
    const COLOR565_GREEN       = 0x07E0      ///<   0, 255,   0
    const COLOR565_CYAN        = 0x07FF      ///<   0, 255, 255
    export const COLOR565_RED         = 0xF800      ///< 255,   0,   0
    const COLOR565_MAGENTA     = 0xF81F      ///< 255,   0, 255
    const COLOR565_YELLOW      = 0xFFE0      ///< 255, 255,   0
    const COLOR565_WHITE       = 0xFFFF      ///< 255, 255, 255
    const COLOR565_ORANGE      = 0xFD20      ///< 255, 165,   0
    const COLOR565_GREENYELLOW = 0xAFE5      ///< 173, 255,  47
    const COLOR565_PINK        = 0xFC18      ///< 255, 128, 192
    */
    const configWidth = 240        // Before screen rotation.
    const configHeight = 320       // Before screen rotation.
    let csPin: DigitalPin
    let dcPin: DigitalPin
    let width = configWidth     // Effective after screen rotation.
    let height = configHeight   // Effective after screen rotation.

    export function init(mosi: DigitalPin, miso: DigitalPin, sck: DigitalPin, cs: DigitalPin, dc: DigitalPin) {
        pins.spiPins(mosi, miso, sck)
        pins.spiFormat(8, 3)
        pins.spiFrequency(1000000)
        csPin = cs
        dcPin = dc
        writeCmd(0x01)
        control.waitMicros(10000)
        writeCmd(0xC0)          // ILI9341_PWCTR1
        writeData([0x23])
        writeCmd(0xC1)          // ILI9341_PWCTR2
        writeData([0x10])
        writeCmd(0xC5)          // ILI9341_VMCTR1
        writeData([0x3e, 0x28])
        writeCmd(0xC7)          // ILI9341_VMCTR2
        writeData([0x86])
        writeCmd(0x36)          // ILI9341_MADCTL
        writeData([0x48])
        writeCmd(0x37)          // ILI9341_VSCRSADD
        writeData([0x00])
        writeCmd(0x3A)          // ILI9341_PIXFMT
        writeData([0x55])
        writeCmd(0xB1)          // ILI9341_FRMCTR1
        writeData([0x00, 0x18])
        writeCmd(0xB6)          // ILI9341_DFUNCTR
        writeData([0x08, 0x82, 0x27])
        writeCmd(0xF2)          // 3Gamma Function Disable
        writeData([0x00])
        writeCmd(0x26)          // ILI9341_GAMMASET
        writeData([0x01])
        writeCmd(0xE0)          // ILI9341_GMCTRP1
        writeData([0x0F, 0x31, 0x2B, 0x0C, 0x0E, 0x08, 0x4E, 0xF1, 0x37, 0x07, 0x10, 0x03, 0x0E, 0x09, 0x00])
        writeCmd(0xE1)          // ILI9341_GMCTRN1
        writeData([0x00, 0x0E, 0x14, 0x03, 0x11, 0x07, 0x31, 0xC1, 0x48, 0x08, 0x0F, 0x0C, 0x31, 0x36, 0x0F])
        writeCmd(0x11)         // ILI9341_SLPOUT
        control.waitMicros(120000)
        writeCmd(0x29)         // ILI9341_DISPON
    }
    export function writeCmd(cmd: number) {
        pins.digitalWritePin(dcPin, 0);
        pins.digitalWritePin(csPin, 0);
        pins.spiWrite(cmd)
        pins.digitalWritePin(csPin, 1);
    }
    export function writeData(data: number[]) {
        pins.digitalWritePin(dcPin, 1)
        pins.digitalWritePin(csPin, 0)
        let buf = pins.createBuffer(data.length)
        for (let i=0; i<data.length; i++) {
            buf.setNumber(NumberFormat.UInt8LE, i, data[i])
        }
        pins.spiTransfer(buf, null)
        pins.digitalWritePin(csPin, 1)
    }

    export function setRotation(rotation: number) {
        const MADCTL_MY =  0x80     ///< Bottom to top
        const MADCTL_MX = 0x40     ///< Right to left
        const MADCTL_MV =  0x20     ///< Reverse Mode
        const MADCTL_ML = 0x10     ///< LCD refresh Bottom to top
        const MADCTL_RGB = 0x00     ///< Red-Green-Blue pixel order
        const MADCTL_BGR = 0x08     ///< Blue-Green-Red pixel order
        const MADCTL_MH  = 0x04     ///< LCD refresh right to left
        let m = 0
        switch (rotation) {
            case 0:
                m = (MADCTL_MX | MADCTL_BGR)
                width  = configWidth
                height = configHeight
                break
            case 1:
                m = (MADCTL_MV | MADCTL_BGR)
                width  = configHeight
                height = configWidth
                break
            case 2:
                m = (MADCTL_MY | MADCTL_BGR)
                width  = configWidth
                height = configHeight
                break
            case 3:
                m = (MADCTL_MX | MADCTL_MY | MADCTL_MV | MADCTL_BGR)
                width  = configHeight
                height = configWidth
                break
            default: fw.assert(false, 'setRotation')
        }
        writeCmd(0x36)
        writeData([m])
    }
    export function setAddrWindow(x: number, y: number, w: number, h: number) {
        let x2 = x + w - 1
        let y2 = y + h - 1
        writeCmd(0x2A)          // ILI9341_CASET
        writeData([util.byte_1(x), util.byte_0(x), util.byte_1(x2), util.byte_0(x2)])
        writeCmd(0x2B)          // ILI9341_PASET
        writeData([util.byte_1(y), util.byte_0(y), util.byte_1(y2), util.byte_0(y2)])
        writeCmd(0x2C)          // ILI9341_RAMWR
    }
    export function pushColor(color: number, pixelCnt: number = 1) {
        const color1 = util.byte_1(color)
        const color0 = util.byte_0(color)
        let data: number[] = []
        let i = 0
        while (pixelCnt--) {
            data[i++] = color1
            data[i++] = color0
        }
        writeData(data)
    }
    export function writePixel(x: number, y: number, color: number) {
        if ((x < 0) || (x >= width) || (y < 0) || (y >= height)) {
            return;
        }
        setAddrWindow(x, y, 1, 1);
        pushColor(color);
    }
    export function fillScreen(color: number) { 
        fillRect(0, 0, width, height, color)
    }
    export function fillRect(x: number, y: number, w: number, h: number, color: number) {
        /*
        if ((x >= width) || (y >= height)) {
            return
        }
        */
        let x2 = x + w - 1
        let y2 = y + h - 1
        /*
        if ((x2 < 0) || (y2 < 0)) {
            return
        }
        */
        /*
        if (x < 0) {
            x = 0
            w = x2 + 1
        }
        */
        /*
        if (y < 0) {
            y = 0
            h = y2 + 1
        }
        if (x2 >= width) {
            w = width - x
        }
        if (y2 >= height) {
            h = height - y
        }
        setAddrWindow(x, y, w, h)
        pushColor(color, w * h)
        */
    }
    /*
    export function fillRect(x: number, y: number, w: number, h: number, color: number) {
        if ((x >= width) || (y >= height)) {
            return
        }
        let x2 = x + w - 1
        let y2 = y + h - 1
        if ((x2 < 0) || (y2 < 0)) {
            return
        }
        if (x < 0) {
            x = 0
            w = x2 + 1
        }
        if (y < 0) {
            y = 0
            h = y2 + 1
        }
        if (x2 >= width) {
            w = width - x
        }
        if (y2 >= height) {
            h = height - y
        }
        setAddrWindow(x, y, w, h)
        pushColor(color, w * h)
    }
    */
}
