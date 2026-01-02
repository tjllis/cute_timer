import { useState, useEffect, useRef } from 'react';
import { VscChromeMinimize, VscChromeClose } from 'react-icons/vsc';
import alarmSound from './assets/alarm.wav';

function App(): React.JSX.Element {
	const [time, setTime] = useState(25 * 60);
	const [isActive, setIsActive] = useState(false);
	const [showNotification, setShowNotification] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;
		if (isActive) {
			interval = setInterval(() => {
				setTime((prev) => {
					if (prev <= 1) {
						setIsActive(false);
						setShowNotification(true);
						// Play notification sound
						if (audioRef.current) {
							audioRef.current.currentTime = 0; // reset the playback to the beginning
							audioRef.current.play().catch((err) => console.error('Audio playback failed:', err));
						}
						// Auto-hide after 5 seconds
						// setTimeout(() => setShowNotification(false), 5000);
						return 0;
					}
					return prev - 1;
				});
			}, 1000); // 1 second
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isActive]); // run when these dependencies change

	const toggleTimer = (): void => setIsActive(!isActive);
	const resetTimer = (): void => {
		setTime(25 * 60);
		setIsActive(false);
	};

	const closeNotification = (): void => {
		console.log('Closing notification, audio ref:', audioRef.current);
		setShowNotification(false);
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	};

	const formatTime = (
		seconds: number
	): {
		min: string;
		sec: string;
	} => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;

		const minutesStr = minutes.toString().padStart(2, '0');
		const secsStr = secs.toString().padStart(2, '0');

		return {
			min: minutesStr,
			sec: secsStr
		};
	};

	const handleMinimize = (): void => {
		window.electron.ipcRenderer.send('minimize-app');
	};

	const handleClose = (): void => {
		window.electron.ipcRenderer.send('close-app');
	};

	const { min, sec } = formatTime(time);

	// Calculate progress for the circle animation
	const totalTime = 25 * 60;
	const radius = 115;
	const circumference = 2 * Math.PI * radius;
	const progress = time / totalTime;
	// const strokeDashoffset = progress * circumference; // Reversed: fills up as time decreases
	const strokeDashoffset = circumference - progress * circumference; // Original: drains as time decreases

	// console.log({ time, progress, strokeDashoffset, circumference });

	return (
		<div className="app-container">
			<audio ref={audioRef} src={alarmSound} preload="auto" />
			{showNotification && (
				<div className="flex-center custom-notification">
					<h1>Time&apos;s Up! 🎉</h1>
					<p>Great job!</p>
					<p>Take a break.</p>
					<button onClick={closeNotification}>Close</button>
				</div>
			)}
			<div className="flex-center title-bar">
				<div className="win-controls">
					<button className="flex-center control-btn close-btn" onClick={handleClose}>
						<VscChromeClose />
					</button>
					<button className="flex-center control-btn min-btn" onClick={handleMinimize}>
						<VscChromeMinimize />
					</button>
				</div>
				<span>🍅 Timer 🍅</span>
			</div>

			<div className="flex-center timer">
				<div className="flex-center timer-circle">
					<svg className="timer-svg" viewBox="0 0 260 260">
						<circle className="back-circle" cx="130" cy="130" r="115"></circle>
						<circle
							className="progress-circle"
							cx="130"
							cy="130"
							r="115"
							style={{
								strokeDasharray: circumference,
								strokeDashoffset: strokeDashoffset
							}}
						></circle>
					</svg>
					<div className="flex-center timer-display">
						<h1>{min}</h1>
						<h1>:</h1>
						<h1>{sec}</h1>
					</div>
				</div>

				<div className="flex-center buttons-container">
					<button onClick={toggleTimer}>{isActive ? 'Pause' : 'Start'}</button>
					<button onClick={resetTimer}>Stop</button>
				</div>
			</div>
		</div>
	);
}

export default App;
