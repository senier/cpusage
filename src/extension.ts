import * as vscode from 'vscode';
import { CpuInfo, cpus } from 'os';

let loadIndicator: vscode.StatusBarItem;
let prevUtilzation: Utilization | undefined = undefined

export function activate({ subscriptions }: vscode.ExtensionContext) {

	loadIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
	subscriptions.push(loadIndicator);

	updateLoadIndicator();
	setInterval(updateLoadIndicator, 2000);
	loadIndicator.show();
}

export function deactivate() { }

/**
 * Object holding CPU times at time of creation
 */
export class Utilization {

	protected times: { [index: string]: number }[];

	public constructor() {
		this.times = cpus().map(function (info: CpuInfo): { [index: string]: number } {
			return info.times;
		});

	}

	/**
	 * Calculate active and total time 
	 * @returns Tuple containing active and total time
	 */
	public active_total(): [number, number] {
		return this.times.reduce(function ([prev_idle, prev_total]: [number, number], times: { [index: string]: number }): [number, number] {
			const total = times.idle + times.irq + times.nice + times.sys + times.user;
			return [prev_idle + total - times.idle, prev_total + total];
		}, [0, 0]);
	}

	/**
	 * Calculate utilization since precious measurment
	 * 
	 * @param prev Previous utilization to be used as basline
	 * @returns Total CPU utilization in percent
	 */
	public percentage(prev: Utilization) {
		// Iterate over all CPUs and sum up active time (i.e. non-idle time) and total time (sum of all times)
		const [active, total] = this.active_total();
		const [prevActive, prevTotal] = prev.active_total();
		if (total - prevTotal === 0) {
			return 0;
		}
		return 100 * (active - prevActive) / (total - prevTotal);
	}
}

/**
 * Refresh the load indicator 
 */
function updateLoadIndicator(): void {
	if (prevUtilzation === undefined) {
		prevUtilzation = new Utilization();
		return;
	}
	const currentUtilization = new Utilization();
	loadIndicator.text = `[ ${currentUtilization.percentage(prevUtilzation).toFixed(0)}% ]`;

	prevUtilzation = currentUtilization
}
