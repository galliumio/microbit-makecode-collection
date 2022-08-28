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
 * control.onEvent(Src.INTERNAL, Evt.DONE, () => { led.toggle(0, 2) })
 */
 let testCnt = 0
 let testX = 0
 enum Src {
     INTERNAL
 }
 enum Evt {
     EVT_START,
     // TIMER events
     TIMER_500MS,
     TIMER_1S,
     TIMER_2S,
     TIMER_4S,
     TIMER_8S,
     // INTERNAL events
     A_PRESSED,
     DONE
 }
 input.onButtonPressed(Button.A, function () {
     event.raise(Evt.A_PRESSED)
 })
 event.on(Evt.A_PRESSED, () => {
     if (testCnt < 16) {
         event.defer(Evt.A_PRESSED)
     } else {
         led.plot(testX++, 3)
     }
 })
 event.on(Evt.DONE, (x: number) => {
     led.toggle(x, 2)
 })
 event.on(Evt.TIMER_500MS, function () {
     //timer.stop(Evt.TIMER_1S)
     //timer.stop(Evt.TIMER_2S)
     //timer.stop(Evt.TIMER_4S)
     //timer.stop(Evt.TIMER_8S)
     led.toggle(0, 0)
     event.raise(Evt.DONE, 2)
     //control.raiseEvent(Src.INTERNAL, Evt.DONE)
     if (++testCnt >= 16) {
         event.recall()
     }
 })
 event.on(Evt.TIMER_1S, function () {
     led.toggle(1, 0)
 })
 event.on(Evt.TIMER_2S, function () {
     led.toggle(2, 0)
 })
 event.on(Evt.TIMER_4S, function () {
     led.toggle(3, 0)
 })
 event.on(Evt.TIMER_8S, function () {
     led.toggle(4, 0)
 })
 timer.run()
 timer.start(Evt.TIMER_500MS, 500, true)
 timer.start(Evt.TIMER_1S, 1000, true)
 timer.start(Evt.TIMER_2S, 2000, true)
 timer.start(Evt.TIMER_4S, 4000, true)
 timer.start(Evt.TIMER_8S, 8000, true)
 