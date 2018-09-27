import React, { Component } from 'react'
import { CSSTransition } from 'react-transition-group'

import Timer from './Timer'
import Settings from './Settings'
import GearIcon from '../icons/gear'

import { formatTimeToString, getNewSeries } from '../utils/timer'

import { WORK_TIME, RELAX_TIME } from '../constants'

const { ipcRenderer } = window.require("electron")

const startSound = require('../assets/pomodoro-start.mp3')
const endSound = require('../assets/pomodoro-end.mp3')

const INITIAL_TIME = formatTimeToString(WORK_TIME)

const initialState = {
  series: 0,
  total: 0,
  active: false,
  time: WORK_TIME,
  screen: 'timer'
}

export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = initialState
  }

  componentDidMount() {
    ipcRenderer.on('toggle-timer', () => {
      this.toggleTimer()
    })

    ipcRenderer.on('reset-timer', () => {
      this.resetTimer()
    })

    ipcRenderer.on('skip-break', () => {
      this.skipBreak()
    })
  }

  render() {
    return [
      <CSSTransition
        key="timer"
        timeout={300}
        unmountOnExit
        classNames="translateIn"
        in={this.state.screen === 'timer'}
      >
        <Timer
          time={this.state.time}
          stage={this.props.stage}
          total={this.state.total}
          series={this.state.series}
          active={this.state.active}
          toggleTimer={this.toggleTimer}
          toggleStage={this.props.toggleStage}
        />
      </CSSTransition>,

      <CSSTransition
        key="settings"
        timeout={300}
        unmountOnExit
        classNames="translateOut"
        in={this.state.screen === 'settings'}
      >
        <Settings />
      </CSSTransition>,

      <button key="settingsButton" className="settingsButton" onClick={this.toggleScreen}>
        <GearIcon />
      </button>,

      <audio id="audio-end" src={endSound} autostart="false" />,
      <audio id="audio-start" src={startSound} autostart="false" />
    ]
  }

  toggleScreen = () => {
    const screen = this.state.screen === 'timer' ? 'settings' : 'timer'

    this.setState({ screen })
  }

  toggleTimer = () => {
    const time = formatTimeToString(this.state.time)

    this.setState({ active: !this.state.active }, () => {
      if (this.state.active) {
        ipcRenderer.send('update-workt-status', 'Stop', time)

        // if (this.state.time === WORK_TIME) {
        //   document.getElementById('audio-start').play()
        // }

        this.timer = setInterval(this.tick, 1000)
      } else {
        ipcRenderer.send('update-workt-status', 'Start', time)
        clearInterval(this.timer)
      }
    })
  }

  tick = () => {
    if (this.state.time === 0) {
      const isPomodoroEnd = this.props.stage === 'work'

      if (isPomodoroEnd) {
        document.getElementById('audio-end').play()
      }

      const stage = isPomodoroEnd ? 'relax' : 'work'
      const total = isPomodoroEnd ? this.state.total + 1 : this.state.total
      const time = isPomodoroEnd ? RELAX_TIME : WORK_TIME
      const series = getNewSeries(this.props.stage, this.state.series)

      this.setState({ total, time, active: isPomodoroEnd, series }, () => {
        this.props.toggleStage(stage)
        ipcRenderer.send('update-stage', stage, formatTimeToString(time))
      })

      if (!isPomodoroEnd) {
        ipcRenderer.send('update-workt-status', 'Start', INITIAL_TIME)
        clearInterval(this.timer)
      }
    } else {
      const newTime = this.state.time - 1
      this.setState({ time: newTime }, () => {
        ipcRenderer.send('update-tray-title', formatTimeToString(newTime))
      })
    }
  }

  skipBreak = () => {
    this.setState({ active: false, time: WORK_TIME }, () => {
        this.props.toggleStage('work')
        clearInterval(this.timer)
        ipcRenderer.send('reset-tray-action', INITIAL_TIME)
      }
    )
  }

  resetTimer = () => {
    this.setState(initialState, () => {
      clearInterval(this.timer)
      ipcRenderer.send('reset-tray-action', INITIAL_TIME)
    })
  }
}
