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

 namespace event {
    let handlers: ((param: any) => void)[] = []
    export function on(evt: number, handler: (param: any) => void) {
        handlers[evt] = handler
    }
    export function raise(evt: number, param: any = 0) {
        let handler = handlers[evt]
        if (handler) {
            handler(param)
        }
    }
    interface EvtObj {
        evt: number,
        param: any
    }
    let deferQ: EvtObj[] = []
    export function defer(evt: number, param: any = 0) {
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
    const TICK_MS = 50
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
        led.toggle(1, 1)
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
