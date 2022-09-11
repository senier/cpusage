import * as vscode from 'vscode';
import { CpuInfo, cpus } from 'os';

let loadIndicator: vscode.StatusBarItem;
let history: Utilization[];

export function activate({ subscriptions }: vscode.ExtensionContext) {

	loadIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	subscriptions.push(loadIndicator);

	// FIXME: Make indicator length configurable
	history = new Array(15)

	updateLoadIndicator();

	// FIXME: Make interval configurable
	setInterval(updateLoadIndicator, 2000);

	loadIndicator.show();
}

export function deactivate() {
	loadIndicator.dispose();
}

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
	public percentage(prev?: Utilization): number {
		if (prev === undefined) {
			return 0;
		}

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
 * Convert a list of percentages into a horizontal meter representation
 * 
 * Numbers are clamped to [0..100], values are converted into icon IDs of the form
 * of meter-000 .. meter-100 in steps of 10.
 * 
 * @param values List of CPU utilization percentage values
 * @returns String containing icon IDs
 */
export function createMeter(values: number[]): string {
	const meters: string[] = values.map(function (value: number): string {
		if (value < 0) {
			value = 0;
		}
		if (value > 100) {
			value = 100;
		}
		if (value < 10) return `$(meter-000)`;
		if (value < 20) return `$(meter-010)`;
		if (value < 30) return `$(meter-020)`;
		if (value < 40) return `$(meter-030)`;
		if (value < 50) return `$(meter-040)`;
		if (value < 60) return `$(meter-050)`;
		if (value < 70) return `$(meter-060)`;
		if (value < 80) return `$(meter-070)`;
		if (value < 90) return `$(meter-080)`;
		if (value < 100) return `$(meter-090)`;
		if (value === 100) return `$(meter-100)`;
		return `$(meter-000)`;
	})
	return `$(meter-100)${meters.join('')}$(meter-100)`;
}

/**
 * Refresh the load indicator 
 */
function updateLoadIndicator(): void {
	history.shift();
	history.push(new Utilization());

	let meter: number[] = []
	for (let i = 1; i < history.length; i++) {
		if (history[i] === undefined) {
			meter.push(0);
		} else {
			meter.push(history[i].percentage(history[i - 1]));
		}
	}

	// FIXME: Make visibility of meter/percentage configurable
	const percentage = meter[meter.length - 1].toFixed(0);
	loadIndicator.text = `${createMeter(meter)} ${percentage}%`;
}
