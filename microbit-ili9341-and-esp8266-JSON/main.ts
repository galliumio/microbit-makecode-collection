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

 let testCnt = 0
 enum Src {
     INTERNAL
 }
 enum Timeout {
     TEST_MS = 500,
     PING_MS = 200,
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
 wifi.onConnect(()=>{
     event.send(Evt.WIFI_CONNECT)  
 })
 wifi.onError((error: string)=>{
     event.send(Evt.WIFI_ERROR, error)
 })
 wifi.onData((json: string)=>{
     let obj = JSON.parse(json)
     if (obj) {
         // In case of data drop on serial link, json parsing may fail.
         event.send(Evt.WIFI_DATA, obj)
     } else {
         
     }
 })
 
 state.onEntry(Region.MAIN, MainState.ROOT, () => {
     // Test only.
     ili9341.setRotation(0)
     ili9341.fillScreen(0x001F)
     for (let i=0; i<100; i++) {
         ili9341.writePixel(i, i*2, 0xF800)
     }
 })
 state.onExit(Region.MAIN, MainState.ROOT, () => {
 })
 event.on(Evt.WIFI_CONNECT, () => {
     wifi.send({type: 'SrvAuthReqMsg', to: 'srv', from: 'UNDEF',
         seq: 123, username: 'user', password: 'pwd', nodeId: 'Microbit'})
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
 event.on(Evt.WIFI_DATA, (obj) => {
     // Test only.
     led.toggle(0, 4)
     // Test only.
     if (obj) {
         if (obj.type == 'SrvAuthCfmMsg' || obj.type == 'SrvPingCfmMsg') {
             timer.start(Evt.TIMER_PING, Timeout.PING_MS, false)
             //timer.start(Evt.TIMER_PING, Timeout.PING_MS, true)
         }
         if (obj.type == 'DispTickerReqMsg') {
             wifi.send({type: 'DispTickerCfmMsg', to: 'Srv', from: 'Microbit',
                 seq: 456, error: 'SUCCESS', origin: 'Microbit', reason: 'UNSPEC'})    
         }
     } else {
         event.raise(Evt.A_PRESSED)
     }
 })
 event.on(Evt.A_PRESSED, () => {
     // For MAIN region.
     wifi.reset()
     wifi.config()
     wifi.join('your_ssid', 'your_password')
     wifi.connect('192.168.1.233', '60003')
     led.plot(0, 0)
     control.waitMicros(20000)
     led.unplot(0, 0)
 })
 event.on(Evt.B_PRESSED, () => {
     // For MAIN region.
     // JSON test.
     let str = '{"type": "TestReq", "seq": 123}'
     let obj = JSON.parse(str)
     //console.log(obj.type)
     //console.log(obj.seq)
     if (obj.type == 'TestReq' && obj.seq == 123) {
         led.plot(0, 1)
         control.waitMicros(20000)
         led.unplot(0, 1)
     }
     let o = {
         txt: 'this is a test\n\rGood job', 
         seq: 1234,
         param: ['hello\n\rworld', 456, 'fun']
     }
     let json = JSON.stringify(o)
     //serial.writeString(json + '\n\r')
     o = JSON.parse(json)
     //console.log(o.txt)
     //console.log(o.seq)
     //console.log(o.param[0])
     //console.log(o.param[1])
     //console.log(o.param[2])
     timer.start(Evt.TIMER_TEST, Timeout.TEST_MS, true)
     control.reset()
 })
 event.on(Evt.TIMER_TEST, () => {
     led.plot(0, 2)
     control.waitMicros(20000)
     led.unplot(0, 2)
     //control.waitMicros(2500000)
 })
 event.on(Evt.TIMER_PING, () => {
     wifi.send({type: 'SrvPingReqMsg', to: 'Srv', from: 'Microbit',
         seq: 123})    
 })
 
 wifi.init(SerialPin.P8, SerialPin.P12, DigitalPin.P0)
 ili9341.init(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13, DigitalPin.P16, DigitalPin.P2)
 state.start(Region.MAIN, MainState.ROOT)
 event.send(Evt.A_PRESSED)
 timer.run()
 