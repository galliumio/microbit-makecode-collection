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

// State functions
function inMainRoot () {
    return state.isIn(Region.MAIN, MainState.ROOT)
}
// Enables external buttons.
input.onButtonPressed(Button.A, function () {
    event.send(Evt.A_PRESSED)
})
input.onButtonPressed(Button.B, function () {
    event.send(Evt.B_PRESSED)
})
let testCnt = 0
enum Src {
    INTERNAL
}
enum Timeout {
    TEST_MS = 500,
    PING_MS = 500,
}
enum Evt {
    // TIMER events
    TIMER_TEST,
    TIMER_PING,
    // INTERNAL events
    A_PRESSED,
    B_PRESSED,
    WIFI_CONNECT,
    WIFI_DATA,
    WIFI_ERROR,
    DONE,
    NEXT,
}
enum Region {
    MAIN,
}
enum MainState {
    ROOT
}
wifi.onConnect(()=>{
    event.send(Evt.WIFI_CONNECT)  
})
wifi.onError((error: string)=>{
    event.send(Evt.WIFI_ERROR, error)
})
wifi.onData((args: string[])=>{
    //basic.showString(args[0])
    event.send(Evt.WIFI_DATA, args)
})
state.onEntry(Region.MAIN, MainState.ROOT, () => {
    // Test only.
    ili9341.fillRect(0, 0, 320, 240, color.COLOR565_CYAN)
    ili9341.print(0, 0, 'MARY', color.COLOR565_RED,   color.COLOR565_CYAN, 4)
    ili9341.print(0, 32, 'JOHN', color.COLOR565_RED, color.COLOR565_CYAN, 4)
    ili9341.print(0, 64, 'This is a test', color.COLOR565_GREEN, color.COLOR565_NAVY, 3)
})
state.onExit(Region.MAIN, MainState.ROOT, () => {
})
event.on(Evt.WIFI_CONNECT, () => {
    wifi.send(['SrvAuthReqMsg', 'srv', 'UNDEF', '123', 'user', 'pwd', 'Microbit'])
})
event.on(Evt.WIFI_ERROR, (error) => {
    // Stops ping timer.
    timer.stop(Evt.TIMER_PING)
    // Test only.
    // Default to init error
    let p = [1, 4]
    if (error == 'command') {
        p = [2, 4]
    } else if (error == 'transmit') {
        p = [3, 4]
    } else if (error == 'receive') {
        p = [4, 4]
    }
    led.plot(p[0], p[1])
    control.waitMicros(25000)
    led.unplot(p[0],p[1]) 
    if (error == 'receive' || error == 'init') {
        // Receive error may be caused by serial buffer overflow which is unrecoverable.
        // Init error may be caused by previous buffer overflow resulting in failure
        // to communicate with the module.
        // Test only - Commented to avoid constant resetting in simulation.
        //control.reset()
    } else {
        // Reconnect.
        event.raise(Evt.A_PRESSED)
    }
})
event.on(Evt.WIFI_DATA, (args) => {
    // Test only.
    led.toggle(0, 4)
    let a: string[] = args
    if (a.length >= 1) {
        const type = a[0]
        if (type == 'SrvAuthCfmMsg' || type == 'SrvPingCfmMsg') {
                timer.start(Evt.TIMER_PING, Timeout.PING_MS, false)
                //timer.start(Evt.TIMER_PING, Timeout.PING_MS, true)
        }
        if (type == 'DispTickerReqMsg') {
            wifi.send(['DispTickerCfmMsg', 'Srv', 'Microbit', a[3],
                'SUCCESS', 'Microbit', 'UNSPEC'])  
            if (a[7] == '0') {
                ili9341.print(0, 96, a[4], color.COLOR565_WHITE, color.COLOR565_NAVY, 4) 
            }
        }
    }
})
event.on(Evt.A_PRESSED, () => {
    // For MAIN region.
    wifi.reset()
    wifi.config()
    wifi.join('your_ssid', 'your_password')
    wifi.connect('192.168.1.233', '60004')
    led.plot(0, 0)
    control.waitMicros(20000)
    led.unplot(0, 0)
})
event.on(Evt.B_PRESSED, () => {
    // For MAIN region.
    timer.start(Evt.TIMER_TEST, Timeout.TEST_MS, true)
})
event.on(Evt.TIMER_TEST, () => {
    led.plot(0, 2)
    control.waitMicros(20000)
    led.unplot(0, 2)
    //control.waitMicros(2500000)
})
event.on(Evt.TIMER_PING, () => {
    wifi.send(['SrvPingReqMsg', 'Srv', 'Microbit', '123'])
})
wifi.init(SerialPin.P8, SerialPin.P12, DigitalPin.P0)
ili9341.init(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13, DigitalPin.P16, DigitalPin.P2)
state.start(Region.MAIN, MainState.ROOT)
event.send(Evt.A_PRESSED)
timer.run()
