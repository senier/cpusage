import * as assert from 'assert';
import { CpuInfo } from 'os';
import { setFlagsFromString } from 'v8';

import * as vscode from 'vscode';
import { Utilization, createMeter } from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	class TestUtilzation extends Utilization {
		public constructor(times: { [index: string]: number }[]) {
			super();
			this.times = times;
		}
	};

	test('CPU time calculation (single core)', () => {

		const u1 = new TestUtilzation([{ "user": 0, "idle": 0, "sys": 0, "irq": 0, "nice": 0 }]);
		const u2 = new TestUtilzation([{ "user": 5, "idle": 10, "sys": 20, "irq": 30, "nice": 35 }]);

		assert.deepStrictEqual(u1.active_total(), [0, 0])
		assert.deepStrictEqual(u2.active_total(), [90, 100])
		assert.strictEqual(u1.percentage(u2), 90);
	});

	test('CPU zero time calculation (single core)', () => {

		const u1 = new TestUtilzation([{ "user": 5, "idle": 10, "sys": 20, "irq": 30, "nice": 35 }]);

		assert.deepStrictEqual(u1.active_total(), [90, 100])
		assert.strictEqual(u1.percentage(u1), 0);
	});


	test('CPU time calculation (multi core)', () => {

		const u1 = new TestUtilzation([
			{ "user": 0, "idle": 0, "sys": 0, "irq": 0, "nice": 0 },
			{ "user": 0, "idle": 0, "sys": 0, "irq": 0, "nice": 0 }
		]);
		const u2 = new TestUtilzation([
			{ "user": 5, "idle": 10, "sys": 20, "irq": 30, "nice": 35 },
			{ "user": 15, "idle": 20, "sys": 30, "irq": 40, "nice": 45 }
		]);

		assert.deepStrictEqual(u1.active_total(), [0, 0])
		assert.deepStrictEqual(u2.active_total(), [220, 250])
		assert.strictEqual(u1.percentage(u2), 22000 / 250);
	});

	test('Meter', () => {
		const input =
			[NaN, -1, 0, 1, 9, 10, 11, 19, 20, 21, 29, 30, 31, 39, 40, 41, 49, 50,
				51, 59, 60, 61, 69, 70, 71, 79, 80, 81, 89, 90, 91, 99, 100, 101];
		const expected: string =
			"$(meter-100)$(meter-000)$(meter-000)"
			+ "$(meter-000)$(meter-000)$(meter-000)"
			+ "$(meter-010)$(meter-010)$(meter-010)"
			+ "$(meter-020)$(meter-020)$(meter-020)"
			+ "$(meter-030)$(meter-030)$(meter-030)"
			+ "$(meter-040)$(meter-040)$(meter-040)"
			+ "$(meter-050)$(meter-050)$(meter-050)"
			+ "$(meter-060)$(meter-060)$(meter-060)"
			+ "$(meter-070)$(meter-070)$(meter-070)"
			+ "$(meter-080)$(meter-080)$(meter-080)"
			+ "$(meter-090)$(meter-090)$(meter-090)"
			+ "$(meter-100)$(meter-100)$(meter-100)"
		assert.deepStrictEqual(createMeter(input), expected);
	});
});
