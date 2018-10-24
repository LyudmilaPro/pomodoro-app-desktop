import React, { PureComponent } from 'react'

import Switcher from '../UI/Switcher'
import Counter from '../UI/Counter'

import { getDataFromStorage, setDataToStorage } from '../../utils/storage'

export default class SettingsContainer extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      autoStartAfterBreak: false
    }
  }

  componentDidMount() {
    getDataFromStorage('settings').then((data) => {
      this.setState({ autoStartAfterBreak: data.autoStartAfterBreak })
    })
  }

  render() {
    return (
      <div className="settingsContainer">
        <h1>Settings</h1>

        <div className="setingsItem">
          <p>Total goal</p>
          <Counter max={48} defaultValue={12} />
        </div>

        <div className="setingsItem">
          <p>Pomodoro per series</p>
          <Counter max={6} defaultValue={4} />
        </div>

        <div className="delimeter" />

        <div className="setingsItem">
          <p>Auto start after break</p>
          <Switcher
            active={this.state.autoStartAfterBreak}
            onPress={this.toggleAutoStartAfterBreak}
          />
        </div>
      </div>
    )
  }

  toggleAutoStartAfterBreak = (active) => {
    this.setState({ autoStartAfterBreak: active }, () => {
      setDataToStorage('settings', { autoStartAfterBreak: active })
    })
  }
}
