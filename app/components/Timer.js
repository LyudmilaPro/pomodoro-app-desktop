import React from 'react';

import styles from './Timer.css';

import { WORK_TIME, RELAX_TIME } from '../constants';

const playIcon = require('../assets/play.png');
const pauseIcon = require('../assets/pause.png');

function getTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${minutes}:${formattedSeconds}`;
}

const VIEW_SIDE = 260;
const CENTER = VIEW_SIDE / 2;
const RADIUS = 121;
const CIRCLE_LENGHT = 2 * Math.PI * RADIUS;

export default function Timer({ active, time, stage, toggleTimer }) {
  const src = active ? pauseIcon : playIcon;
  const formattedTime = getTime(time);

  // ipcRenderer.send('change-timer', formattedTime)

  const fullTime = stage === 'work' ? WORK_TIME : RELAX_TIME;
  const progress = time / fullTime;

  const strokeColor = stage === 'work' ? '#EF5350' : '#00BFA5';

  return [
    <svg
      height={VIEW_SIDE}
      width={VIEW_SIDE}
      className={styles.rotate90}
      key="timer-wrapper"
    >
      <circle
        r={RADIUS}
        cx={CENTER}
        cy={CENTER}
        fill="none"
        strokeWidth={15}
        strokeDasharray={[5, 5]}
        stroke="rgba(255, 255, 255, 0.75)"
      />
      <circle
        r={RADIUS}
        cx={CENTER}
        cy={CENTER}
        fill="none"
        strokeWidth={15}
        stroke={strokeColor}
        strokeDasharray={CIRCLE_LENGHT}
        strokeDashoffset={-CIRCLE_LENGHT * (1 - progress)}
      />
      <circle
        r={RADIUS}
        cx={CENTER}
        cy={CENTER}
        fill="none"
        strokeWidth={15}
        strokeDasharray={[5, 5]}
        stroke="rgba(255, 255, 255, 0.3)"
      />
    </svg>,

    <div className={styles.timer} key="timer">
      <p>{formattedTime}</p>
    </div>,

    <button className={styles.startButton} onClick={toggleTimer} key="button">
      <img src={src} alt="play" className={active ? '' : styles.playOffset} />
    </button>
  ];
}