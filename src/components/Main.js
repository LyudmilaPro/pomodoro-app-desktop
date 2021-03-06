import React, { PureComponent } from 'react'
import { CSSTransition } from 'react-transition-group'

import Timer from '../containers/Timer'
import Settings from './Settings'
import GearIcon from '../icons/gear'

import { formatTimeToString, getNewSeries } from '../utils/timer'
import { getDataFromStorage, setDataToStorage } from '../utils/storage'

import { WORK_TIME, RELAX_TIME, INITIAL_TIME } from '../constants'

const { ipcRenderer } = window.require("electron")

function resetTrayTime() {
  ipcRenderer.send('reset-tray-action', INITIAL_TIME)
}

const initialState = {
  series: 0,
  total: 0,
  active: false,
  time: WORK_TIME
}

const TOTAL_GOAL = 12
const FULL_SERIES = 4

export default class MainContainer extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      ...initialState,
      screen: 'timer',
      totalGoal: TOTAL_GOAL,
      fullSeries: FULL_SERIES
    }
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

    getDataFromStorage('settings').then((data) => {
      this.setState({
        totalGoal: data.totalGoal || TOTAL_GOAL,
        fullSeries: data.fullSeries || FULL_SERIES
      })
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
          skipBreak={this.skipBreak}
          toggleTimer={this.toggleTimer}
          totalGoal={this.state.totalGoal}
          fullSeries={this.state.fullSeries}
        />
      </CSSTransition>,

      <CSSTransition
        key="settings"
        timeout={300}
        unmountOnExit
        classNames="translateOut"
        in={this.state.screen === 'settings'}
      >
        <Settings
          totalGoal={this.state.totalGoal}
          fullSeries={this.state.fullSeries}
          updateTotalGoal={this.updateTotalGoal}
          updateFullSeries={this.updateFullSeries}
        />
      </CSSTransition>,

      <button key="settingsButton" className="settingsButton" onClick={this.toggleScreen}>
        <GearIcon />
      </button>
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
        new Notification('Break!', {
          body: 'Current Pomodoro has ended'
        })
      }

      const stage = isPomodoroEnd ? 'relax' : 'work'
      const total = isPomodoroEnd ? this.state.total + 1 : this.state.total
      const time = isPomodoroEnd ? RELAX_TIME : WORK_TIME
      const series = getNewSeries(this.props.stage, this.state.series)

      const newState = { total, time, series }

      getDataFromStorage('settings')
        .then((data) => {
          this.setState({ ...newState, active: isPomodoroEnd ? true : data.autoStartAfterBreak }, () => {
            if (!isPomodoroEnd && !data.autoStartAfterBreak) {
              clearInterval(this.timer)
            }
          })
        })
        .catch(() => {
          this.setState({ ...newState, active: isPomodoroEnd }, () => {
            if (!isPomodoroEnd) {
              clearInterval(this.timer)
            }
          })
        })

      this.props.toggleStage(stage)
      ipcRenderer.send('update-stage', stage, formatTimeToString(time))

      if (!isPomodoroEnd) {
        ipcRenderer.send('update-workt-status', 'Start', INITIAL_TIME)

        new Notification('Lets work!', {
          body: 'Break time is over'
        })
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
        this.clearTimer()
      }
    )
  }

  resetTimer = () => {
    this.setState({ ...initialState }, () => {
      this.props.toggleStage('work')
      this.clearTimer()
    })
  }

  clearTimer = () => {
    clearInterval(this.timer)
    resetTrayTime()
  }

  updateTotalGoal = (data) => {
    this.setState({ totalGoal: data.totalGoal }, () => {
      setDataToStorage('settings', data)
    })
  }

  updateFullSeries = (data) => {
    this.setState({ fullSeries: data.fullSeries }, () => {
      setDataToStorage('settings', data)
    })
  }
}
